/**
 * V5 Medical lead intake Worker.
 *
 * Routes (v5med.net/api/*):
 *   POST /api/submit-quote   JSON body from /quote/
 *   POST /api/contact        multipart/form-data from /contact.html (optional attachment)
 *   GET  /api/attachment     signed, time-limited download link for sales (private R2)
 *
 * Bindings / vars / secrets (see wrangler.toml and README.md):
 *   ERP_URL, ERP_LEAD_PATH                      vars
 *   ERP_API_KEY + ERP_API_SECRET                secrets (preferred: dedicated low-privilege ERP user)
 *   ERP_USER + ERP_PWD                          fallback session login (ERP_PWD as secret)
 *   CONTACT_ATTACHMENTS                         R2 bucket (keep it PRIVATE)
 *   ATTACHMENT_SIGNING_KEY                      secret; enables signed download links
 *   R2_PUBLIC_BASE                              legacy public bucket domain; leave unset once links are signed
 *   SEND_EMAIL, EMAIL_FROM, SALES_EMAIL         Email binding
 *   LEAD_RATE_LIMITER                           optional Workers Rate Limiting binding
 *   TURNSTILE_SECRET                            optional secret; when set, a Turnstile token is required
 *   ALLOWED_ORIGINS                             optional comma-separated list
 */
import { EmailMessage } from "cloudflare:email";

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_ATTACHMENT_BYTES + 256 * 1024;
const MAX_JSON_BYTES = 64 * 1024;
const SIGNED_LINK_TTL_SECONDS = 30 * 24 * 60 * 60;
const DEFAULT_ORIGINS = ["https://v5med.net", "https://www.v5med.net"];
const PUBLIC_BASE_URL = "https://v5med.net";

// MIME type → leading "magic" bytes. The browser-declared type alone is not trusted.
const ATTACHMENT_SIGNATURES = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "application/vnd.ms-excel": [[0xd0, 0xcf, 0x11, 0xe0]],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [[0x50, 0x4b, 0x03, 0x04]],
};

const REQUIRED_QUOTE_FIELDS = ["company", "contact", "email", "category"];
const REQUIRED_CONTACT_FIELDS = ["company", "email", "name", "message"];

// Only these fields are accepted; anything else a client sends is dropped.
const QUOTE_FIELDS = ["company", "contact", "email", "phone", "category", "description", "source", "page", "product"];
const CONTACT_FIELDS = [
  "company", "name", "email", "phone", "subject", "message", "description", "quote_products",
  "annual_volume", "incoterms", "reg_country", "certificate_needed", "source", "page", "product",
];
const HONEYPOT_FIELDS = ["_gotcha", "website"];

// Labels used for the ERP note and the sales e-mail.
const FIELD_LABELS = {
  company: "Company", contact: "Contact", name: "Contact", email: "Email", phone: "Phone",
  category: "Category", subject: "Subject", message: "Message", description: "Requirements",
  quote_products: "Products", needs: "Inquiry type", annual_volume: "Annual volume",
  incoterms: "Incoterms", reg_country: "Registration country", certificate_needed: "Certificates needed",
  product: "Product page", page: "Page", source: "Form", attachmentName: "Attachment",
};

class ClientError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extraHeaders },
  });
}

function makeReference() {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().padStart(6, "0").slice(-6);
  return `RFQ-${day}-${suffix}`;
}

function asCleanString(value, maxLength = 4000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function singleLine(value) {
  return String(value ?? "").replace(/[\r\n]+/g, " ").trim();
}

// ---------------------------------------------------------------- request guards

function allowedOrigins(env) {
  return env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
    : DEFAULT_ORIGINS;
}

function checkOrigin(request, env) {
  // Browsers always send Origin on cross-document POST/fetch. Scripts that omit it,
  // or forms hosted elsewhere, are rejected. (Test with: curl -H "Origin: https://v5med.net" ...)
  const origin = request.headers.get("Origin");
  if (!origin || !allowedOrigins(env).includes(origin)) {
    throw new ClientError("Forbidden", 403);
  }
}

async function checkRateLimit(request, env) {
  if (!env.LEAD_RATE_LIMITER) return;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const { success } = await env.LEAD_RATE_LIMITER.limit({ key: ip });
  if (!success) throw new ClientError("Too many submissions. Please wait a minute and try again.", 429);
}

async function checkTurnstile(request, env, token) {
  if (!env.TURNSTILE_SECRET) return;
  if (!token) throw new ClientError("Please complete the verification challenge.", 400);
  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET);
  body.append("response", token);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) body.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const outcome = await res.json().catch(() => ({}));
  if (!outcome.success) throw new ClientError("Verification failed. Please reload the page and try again.", 400);
}

function checkDeclaredSize(request, limit) {
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > limit) throw new ClientError("Submission is too large", 413);
}

function isHoneypotFilled(source) {
  return HONEYPOT_FIELDS.some((field) => asCleanString(source[field]).length > 0);
}

// ---------------------------------------------------------------- field handling

function pickFields(source, allowed) {
  const data = {};
  for (const field of allowed) {
    const value = asCleanString(source[field]);
    if (value) data[field] = value;
  }
  return data;
}

function validateFields(data, required) {
  const missing = required.filter((field) => !data[field]);
  if (missing.length) return `Missing required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`;
  if (!isValidEmail(data.email)) return "A valid email address is required";
  return null;
}

function sourcePageUrl(data, request) {
  // Only v5med.net URLs are recorded as the lead's source page.
  const candidates = [data.page, request.headers.get("Referer")];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate, PUBLIC_BASE_URL);
      if (url.hostname === "v5med.net" || url.hostname === "www.v5med.net") {
        return `${PUBLIC_BASE_URL}${url.pathname}${url.search}`.slice(0, 1000);
      }
    } catch {
      /* ignore malformed */
    }
  }
  return `${PUBLIC_BASE_URL}/`;
}

function describeLead(payload) {
  return Object.keys(FIELD_LABELS)
    .filter((key) => !["company", "email", "source", "page"].includes(key))
    .map((key) => {
      const value = payload[key];
      if (value == null || value === "" || (Array.isArray(value) && !value.length)) return null;
      return [FIELD_LABELS[key], Array.isArray(value) ? value.join(", ") : String(value)];
    })
    .filter(Boolean);
}

// ---------------------------------------------------------------- ERP

async function erpAuthHeaders(env) {
  // Preferred: API key/secret of a dedicated ERP user that may only create Leads.
  if (env.ERP_API_KEY && env.ERP_API_SECRET) {
    return { headers: { Authorization: `token ${env.ERP_API_KEY}:${env.ERP_API_SECRET}` }, logout: null };
  }
  if (!env.ERP_USER || !env.ERP_PWD) throw new Error("ERP credentials are not configured");

  const loginRes = await fetch(`${env.ERP_URL}/api/method/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `usr=${encodeURIComponent(env.ERP_USER)}&pwd=${encodeURIComponent(env.ERP_PWD)}`,
  });
  if (!loginRes.ok) throw new Error(`ERP login failed (${loginRes.status})`);
  const sessionId = ((loginRes.headers.get("Set-Cookie") || "").match(/sid=([^;]+)/) || [])[1];
  if (!sessionId || sessionId === "Guest") throw new Error("ERP login returned no session");

  const headers = { Cookie: `sid=${sessionId}` };
  const logout = () =>
    fetch(`${env.ERP_URL}/api/method/logout`, { method: "POST", headers }).catch(() => {});
  return { headers, logout };
}

function mapLeadPayload(payload) {
  // Frappe Lead field notes (verified against erp.12888.de):
  //  - v5_source_detail is a Data field (max 140 chars) → only a short summary goes there.
  //  - notes is a Table (CRM Note). It must be a list of rows, never a string.
  //    CRM Note.note is a Text Editor (HTML) field, so user text is HTML-escaped.
  const products = [
    ...(Array.isArray(payload.needs) ? payload.needs : []),
    payload.category, payload.quote_products, payload.product,
  ].filter(Boolean).join(", ").slice(0, 1000);

  const noteHtml = [
    `<p><strong>Website inquiry ${escapeHtml(payload.ref)}</strong> (${escapeHtml(payload.source)})</p>`,
    ...describeLead(payload).map(([label, value]) =>
      `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value).replace(/\r?\n/g, "<br>")}</p>`),
    payload.attachmentKey ? `<p><strong>Attachment key (R2):</strong> ${escapeHtml(payload.attachmentKey)}</p>` : "",
  ].join("");

  const summary = [payload.ref, payload.subject || payload.category].filter(Boolean).join(" | ");

  return {
    lead_name: asCleanString(payload.contact || payload.name || payload.company, 140),
    company_name: asCleanString(payload.company, 140),
    email_id: asCleanString(payload.email, 254),
    source: "Website", // ERP Select option
    status: "Open",
    v5_source_url: payload.pageUrl,
    v5_source_detail: summary.slice(0, 140),
    v5_target_products: products,
    notes: [{ note: noteHtml }],
  };
}

async function createErpLead(env, payload) {
  if (!env.ERP_URL) throw new Error("ERP_URL is not configured");
  const { headers: auth, logout } = await erpAuthHeaders(env);
  const endpoint = new URL(env.ERP_LEAD_PATH || "/api/resource/Lead", env.ERP_URL).toString();
  const post = (body) =>
    fetch(endpoint, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });

  try {
    const lead = mapLeadPayload(payload);
    let response = await post(lead);
    if (!response.ok && response.status < 500) {
      // Safety net: if this ERP rejects the notes child table, keep the lead without it.
      console.warn("ERP rejected lead with notes, retrying without", response.status, (await response.text()).slice(0, 300));
      const { notes, ...withoutNotes } = lead;
      response = await post(withoutNotes);
    }
    if (!response.ok) {
      throw new Error(`ERP lead creation failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
    }
    const created = await response.json().catch(() => ({}));
    return created?.data?.name || null;
  } finally {
    if (logout) await logout();
  }
}

// ---------------------------------------------------------------- e-mail

function encodeHeader(value) {
  const text = singleLine(value);
  // RFC 2047 encoded-word so company names in any language survive the mail header.
  if (/^[\x20-\x7e]*$/.test(text)) return text;
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

async function notifySales(env, payload, { erpLeadName, erpError }) {
  if (!env.SALES_EMAIL || !env.EMAIL_FROM || !env.SEND_EMAIL) throw new Error("Sales email binding is not configured");

  const lines = [
    erpError
      ? "⚠ The ERP did NOT accept this inquiry. Please enter it manually. Error: " + singleLine(erpError)
      : `Stored in ERP as ${erpLeadName || "a new Lead"}.`,
    "",
    `Reference: ${payload.ref}`,
    `Company: ${singleLine(payload.company)}`,
    `Email: ${singleLine(payload.email)}`,
    ...describeLead(payload).map(([label, value]) => `${label}: ${value}`),
    `Source page: ${payload.pageUrl}`,
    payload.attachmentLink ? `Attachment download (expires in 30 days): ${payload.attachmentLink}` : "",
    `Received: ${payload.receivedAt}`,
  ].filter((line) => line !== null);

  const rawMessage = [
    `From: V5 Medical Website <${env.EMAIL_FROM}>`,
    `To: ${env.SALES_EMAIL}`,
    `Reply-To: ${singleLine(payload.email)}`,
    `Subject: ${encodeHeader(`${erpError ? "[ERP FAILED] " : ""}New website inquiry ${payload.ref} — ${payload.company}`)}`,
    `Message-ID: <${payload.ref}.${crypto.randomUUID()}@${env.EMAIL_FROM.split("@")[1]}>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    lines.join("\r\n"),
  ].join("\r\n");

  await env.SEND_EMAIL.send(new EmailMessage(env.EMAIL_FROM, env.SALES_EMAIL, rawMessage));
}

// ---------------------------------------------------------------- attachments

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function attachmentLink(env, key) {
  if (env.ATTACHMENT_SIGNING_KEY) {
    const expires = Math.floor(Date.now() / 1000) + SIGNED_LINK_TTL_SECONDS;
    const signature = await hmacHex(env.ATTACHMENT_SIGNING_KEY, `${key}:${expires}`);
    const params = new URLSearchParams({ k: key, e: String(expires), s: signature });
    return `${PUBLIC_BASE_URL}/api/attachment?${params}`;
  }
  if (env.R2_PUBLIC_BASE) return `${env.R2_PUBLIC_BASE.replace(/\/$/, "")}/${key}`; // legacy public bucket
  return null;
}

async function storeAttachment(env, attachment, ref) {
  if (!attachment || attachment.size === 0) return null;
  if (attachment.size > MAX_ATTACHMENT_BYTES) throw new ClientError("Attachment must be 10 MB or smaller", 413);
  const signatures = ATTACHMENT_SIGNATURES[attachment.type];
  if (!signatures) throw new ClientError("Attachment must be a PDF, JPG, PNG, XLS, or XLSX file", 415);
  if (!env.CONTACT_ATTACHMENTS) throw new Error("Attachment storage is not configured");

  const buffer = await attachment.arrayBuffer();
  const head = new Uint8Array(buffer.slice(0, 8));
  if (!signatures.some((sig) => sig.every((byte, i) => head[i] === byte))) {
    throw new ClientError("The attachment content does not match its file type", 415);
  }

  const safeName = attachment.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "attachment";
  // Random, unguessable path segment — the key never contains only the (short) reference.
  const key = `contact/${new Date().toISOString().slice(0, 10)}/${ref}-${crypto.randomUUID()}/${safeName}`;
  await env.CONTACT_ATTACHMENTS.put(key, buffer, {
    httpMetadata: { contentType: attachment.type, contentDisposition: `attachment; filename="${safeName}"` },
    customMetadata: { reference: ref, originalName: safeName },
  });
  return { key, name: safeName, link: await attachmentLink(env, key) };
}

async function handleAttachmentDownload(url, env) {
  if (!env.ATTACHMENT_SIGNING_KEY || !env.CONTACT_ATTACHMENTS) return json({ ok: false, error: "Not found" }, 404);
  const key = url.searchParams.get("k") || "";
  const expires = Number(url.searchParams.get("e") || 0);
  const signature = url.searchParams.get("s") || "";
  if (!key.startsWith("contact/") || !expires || expires < Date.now() / 1000) {
    return json({ ok: false, error: "Link expired or invalid" }, 403);
  }
  const expected = await hmacHex(env.ATTACHMENT_SIGNING_KEY, `${key}:${expires}`);
  if (!timingSafeEqual(expected, signature)) return json({ ok: false, error: "Link expired or invalid" }, 403);

  const object = await env.CONTACT_ATTACHMENTS.get(key);
  if (!object) return json({ ok: false, error: "Not found" }, 404);
  const safeName = key.split("/").pop();
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

// ---------------------------------------------------------------- submission

async function submitLead(env, request, data, attachment) {
  const ref = makeReference();
  const storedAttachment = await storeAttachment(env, attachment, ref);
  const payload = {
    ...data,
    ref,
    source: data.source || "v5med.net",
    pageUrl: sourcePageUrl(data, request),
    receivedAt: new Date().toISOString(),
    ...(storedAttachment
      ? { attachmentKey: storedAttachment.key, attachmentName: storedAttachment.name, attachmentLink: storedAttachment.link }
      : {}),
  };

  let erpLeadName = null;
  let erpError = null;
  try {
    erpLeadName = await createErpLead(env, payload);
  } catch (error) {
    erpError = error.message || String(error);
    console.error("ERP lead creation failed", ref, erpError);
  }

  let emailError = null;
  try {
    await notifySales(env, payload, { erpLeadName, erpError });
  } catch (error) {
    emailError = error;
    console.error("Sales notification failed", ref, error);
  }

  // The inquiry is safe as long as at least one channel captured it. Failing the
  // request after the ERP accepted it would only make the visitor submit a duplicate.
  if (erpError && emailError) {
    if (storedAttachment) await env.CONTACT_ATTACHMENTS.delete(storedAttachment.key).catch(() => {});
    throw new Error("Neither ERP nor e-mail accepted the inquiry");
  }
  return ref;
}

async function handleQuote(request, env) {
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.includes("application/json")) throw new ClientError("Expected application/json", 415);
  checkDeclaredSize(request, MAX_JSON_BYTES);
  const text = await request.text();
  if (text.length > MAX_JSON_BYTES) throw new ClientError("Submission is too large", 413);

  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ClientError("Invalid JSON payload");
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new ClientError("Invalid JSON payload");
  if (isHoneypotFilled(raw)) return json({ ok: true, ref: makeReference() }); // silently drop bots

  await checkTurnstile(request, env, asCleanString(raw["cf-turnstile-response"], 4096));
  const data = pickFields(raw, QUOTE_FIELDS);
  const validationError = validateFields(data, REQUIRED_QUOTE_FIELDS);
  if (validationError) throw new ClientError(validationError);

  return json({ ok: true, ref: await submitLead(env, request, data, null) });
}

async function handleContact(request, env) {
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.includes("multipart/form-data")) throw new ClientError("Expected multipart/form-data", 415);
  checkDeclaredSize(request, MAX_MULTIPART_BYTES);

  let formData;
  try {
    formData = await request.formData();
  } catch {
    throw new ClientError("Invalid form submission");
  }

  const raw = {};
  const needs = [];
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    if (key === "needs[]") needs.push(asCleanString(value, 80));
    else raw[key] = value;
  }
  if (isHoneypotFilled(raw)) return json({ ok: true, ref: makeReference() });

  await checkTurnstile(request, env, asCleanString(raw["cf-turnstile-response"], 4096));
  const data = pickFields(raw, CONTACT_FIELDS);
  if (needs.length) data.needs = needs.filter(Boolean).slice(0, 10);
  const validationError = validateFields(data, REQUIRED_CONTACT_FIELDS);
  if (validationError) throw new ClientError(validationError);

  const attachment = formData.get("attachment");
  return json({ ok: true, ref: await submitLead(env, request, data, typeof attachment === "string" ? null : attachment) });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/api/attachment") return await handleAttachmentDownload(url, env);
      if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405, { Allow: "POST" });
      if (url.pathname !== "/api/submit-quote" && url.pathname !== "/api/contact") {
        return json({ ok: false, error: "Not found" }, 404);
      }

      checkOrigin(request, env);
      await checkRateLimit(request, env);
      if (url.pathname === "/api/submit-quote") return await handleQuote(request, env);
      return await handleContact(request, env);
    } catch (error) {
      if (error instanceof ClientError) return json({ ok: false, error: error.message }, error.status);
      console.error("Unhandled lead intake error", error);
      // Internal details stay in the logs; visitors get a neutral message.
      return json({ ok: false, error: "We could not submit your inquiry right now. Please email sales@v5med.net." }, 502);
    }
  },
};
