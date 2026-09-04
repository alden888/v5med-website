#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V5 Medical 静态 SEO 页面生成器 (build-static.py)
================================================

解决的核心问题：
1. 博客文章只在 Docsify hash 路由下可见（/blog/#/posts/xxx），
   Google 无法索引 → 为每篇 Markdown 生成独立静态 HTML。
2. 51 个产品仅有 product-detail.html?id=xxx 动态页，
   爬虫看不到内容 → 为每个 SKU 生成独立静态页。
3. 7 个产品分类没有独立落地页 → 生成关键词导向的分类页。
4. sitemap.xml 手工维护、过期、自相矛盾 → 全自动重新生成。

用法（在仓库根目录执行）：
    pip install markdown
    python build-static.py

输入：
    blog/posts/*.md          博客 Markdown（支持 YAML frontmatter / Docsify !> ?> 提示块）
    js/complete-products.js  产品数据库（单一数据源，正则提取 productData）

输出：
    blog/posts/<slug>.html   静态文章页（Article schema / canonical / OG）
    products/<id>.html       静态产品页（Product schema，无违规 price 字段）
    categories/<cat>.html    分类落地页（ItemList schema）
    sitemap.xml              主站点地图（自动更新 lastmod）
    blog/sitemap.xml         博客站点地图

@version 1.1.0
@updated 2026-08-22

[v1.1.0 变更]
- load_products() 增加 fail-fast 校验：产品数量比对 metadata.totalProducts、
  主图必须存在且 >1KB（防坏图/正则失配静默上线）
- 认证/规格/产品描述按分类差异化（CATEGORIES[].certs/specs/desc），
  pharmaceutical-packaging 不再标注 Sterile/FDA
- og:type 按页型输出（article/product/website），补 og:site_name
- 修复分类页 CTA 文案被隐式字符串拼接吞掉的 bug
- sitemap：移除 noindex 的 payment.html；lastmod 改用 git 最后提交日期
- WhatsApp 询盘链接改用 urllib.parse.quote 编码
"""

import re
import json
import html as html_lib
import datetime
import subprocess
from pathlib import Path
from urllib.parse import quote

import markdown

# ---------------- 配置 ----------------
BASE = "https://v5med.net"
TODAY = datetime.date.today().isoformat()
ROOT = Path(__file__).resolve().parent
OG_IMAGE = "https://pub-224e4e74685e409e833e89d4ab5143fb.r2.dev/v5medlogo.png"
GA_ID = "G-JE15YSMC2W"

# ---------------- 工具函数 ----------------
_lastmod_cache = {}

def git_lastmod(relpath):
    """文件最后的 git 提交日期（ISO），作为真实的 lastmod 信号；失败回退到今天。"""
    relpath = str(relpath)
    if relpath not in _lastmod_cache:
        try:
            out = subprocess.run(
                ["git", "log", "-1", "--format=%cs", "--", relpath],
                cwd=ROOT, capture_output=True, text=True, timeout=10,
            ).stdout.strip()
            _lastmod_cache[relpath] = out or TODAY
        except Exception:
            _lastmod_cache[relpath] = TODAY
    return _lastmod_cache[relpath]

_firstmod_cache = {}

def git_firstmod(relpath):
    """文件首次提交的日期（ISO），作为 datePublished 回退值；失败回退到今天。"""
    relpath = str(relpath)
    if relpath not in _firstmod_cache:
        try:
            out = subprocess.run(
                ["git", "log", "--diff-filter=A", "--format=%cs", "--", relpath],
                cwd=ROOT, capture_output=True, text=True, timeout=10,
            ).stdout.strip().splitlines()
            _firstmod_cache[relpath] = (out[-1].strip() if out else "") or TODAY
        except Exception:
            _firstmod_cache[relpath] = TODAY
    return _firstmod_cache[relpath]

def trunc(s, limit=155):
    """截断到 limit 字符以内，尽量在词边界断开。"""
    if len(s) <= limit:
        return s
    cut = s[:limit].rsplit(" ", 1)[0]
    return cut.rstrip(" ,;—-") + "..."

CATEGORIES = {
    "surgical-sutures": {
        "name": "Surgical Sutures",
        "title": "Surgical Sutures Manufacturer & Supplier (PGA, PDO, Silk, Nylon) | V5 Medical",
        "blurb": "V5 Medical supplies a full range of absorbable and non-absorbable surgical sutures — PGA, PGLA, PDO, Chromic & Plain Catgut, Silk, Nylon, Polypropylene and Polyester — manufactured under ISO 13485 with CE documentation. OEM needle-thread combinations and private labeling available for global distributors.",
        "keywords": "surgical sutures manufacturer, absorbable suture supplier, PGA suture factory, PDO suture OEM, surgical suture wholesale China",
        "certs": ["ISO 13485", "CE"],
        "desc": "{name} for general and specialty surgery, produced under ISO 13485 with CE technical documentation. Consistent tensile strength and reliable needle attachment. OEM needle-thread combinations and private labeling available for global distributors.",
        "specs": {
            "Material": "PGA / PGLA / PDO / Catgut / Silk / Nylon / PP / PE",
            "Sterility": "Sterile (EO Gas)",
            "Quality Standard": "ISO 13485 / CE",
            "Packaging": "Individual sterile pack, boxed",
            "Origin": "China",
        },
    },
    "surgical-instruments": {
        "name": "Surgical Instruments",
        "title": "Disposable Surgical Instruments Supplier (Blades, Scalpels, Forceps) | V5 Medical",
        "blurb": "Sterile disposable surgical instruments — blades, scalpels, lancets, scissors, forceps and needle holders — produced under ISO 13485 quality management with full traceability. Bulk supply and OEM packaging for hospitals and distributors.",
        "keywords": "disposable surgical instruments supplier, surgical blades manufacturer, sterile scalpel wholesale, medical instruments China",
        "certs": ["ISO 13485", "CE"],
        "desc": "{name} for single-use clinical procedures, manufactured under ISO 13485 with full batch traceability. Sharpness and finish controlled to surgical standards. Bulk supply and OEM packaging for hospitals and distributors.",
        "specs": {
            "Material": "Medical-grade stainless steel / polymer",
            "Sterility": "Sterile (EO Gas)",
            "Quality Standard": "ISO 13485 / CE",
            "Packaging": "Individual sterile peel pack",
            "Origin": "China",
        },
    },
    "gauze-dressings": {
        "name": "Gauze & Dressings",
        "title": "Medical Gauze & Wound Dressings Manufacturer | V5 Medical",
        "blurb": "Sterile and non-sterile gauze swabs, rolls, balls, abdominal pads, cotton rolls and non-woven sponges. High-absorbency medical cotton products with EO sterilization and batch traceability, ready for OEM branding.",
        "keywords": "medical gauze manufacturer, sterile gauze swabs supplier, wound dressing wholesale, abdominal pads factory China",
        "certs": ["ISO 13485", "CE"],
        "desc": "{name} made from high-absorbency medical-grade materials, available sterile or non-sterile with EO sterilization and batch traceability. OEM branding and custom sizes supported.",
        "specs": {
            "Material": "100% medical-grade cotton / non-woven",
            "Sterility": "Sterile or non-sterile options",
            "Quality Standard": "ISO 13485 / CE",
            "Packaging": "Sterile pouch or bulk pack",
            "Origin": "China",
        },
    },
    "protective-equipment": {
        "name": "Protective Equipment",
        "title": "Medical Protective Equipment Supplier (Masks, Gowns, Coveralls) | V5 Medical",
        "blurb": "Surgical face masks, N95/FFP2 respirators, isolation gowns, protective coveralls, caps and shoe covers. CE-compliant PPE with test reports and export documentation for tenders and hospital procurement.",
        "keywords": "medical PPE supplier, surgical mask manufacturer, FFP2 mask wholesale, isolation gown factory China",
        "certs": ["ISO 13485", "CE"],
        "desc": "{name} for hospital and clinical protection, CE-compliant with test reports and export documentation. Suitable for tenders and high-volume procurement.",
        "specs": {
            "Material": "Non-woven PP / SMS",
            "Sterility": "Non-sterile (sterile on request)",
            "Quality Standard": "ISO 13485 / CE",
            "Packaging": "Bulk pack, OEM printing available",
            "Origin": "China",
        },
    },
    "surgical-packs": {
        "name": "Surgical Packs",
        "title": "Sterile Surgical Packs & Procedure Kits Manufacturer | V5 Medical",
        "blurb": "Custom-configured sterile surgical packs and procedure kits — universal, C-section, orthopedic, dialysis care, wound dressing and examination kits. AAMI-level barrier materials, EO sterilization and full validation documentation.",
        "keywords": "sterile surgical packs manufacturer, custom procedure kits supplier, surgical pack OEM, disposable medical kits China",
        "certs": ["ISO 13485", "CE"],
        "desc": "{name} custom-configured to your procedure list, assembled with AAMI-level barrier materials and EO sterilization. Full validation documentation and private labeling available.",
        "specs": {
            "Material": "AAMI-level SMS barrier materials",
            "Sterility": "Sterile (EO Gas)",
            "Quality Standard": "ISO 13485 / CE",
            "Packaging": "Custom-configured sterile pack",
            "Origin": "China",
        },
    },
    "injection-infusion": {
        "name": "Injection & Infusion",
        "title": "Disposable Syringes & Infusion Sets Manufacturer | V5 Medical",
        "blurb": "Disposable syringes, insulin syringes, hypodermic needles, IV cannulas, infusion and blood transfusion sets. CE-certified sterile injection devices manufactured under ISO 13485, with OEM and tender support.",
        "keywords": "disposable syringe manufacturer, infusion set supplier, insulin syringe wholesale, IV cannula factory China",
        "certs": ["ISO 13485", "CE"],
        "desc": "{name} manufactured under ISO 13485 with CE certification, EO-sterilized and individually packed. OEM and tender support for global distributors.",
        "specs": {
            "Material": "Medical-grade PP / PVC / stainless needle",
            "Sterility": "Sterile (EO Gas)",
            "Quality Standard": "ISO 13485 / CE",
            "Packaging": "Individual sterile blister / peel pack",
            "Origin": "China",
        },
    },
    "dental-products": {
        "name": "Dental Products",
        "title": "Dental Consumables & Examination Kits Supplier | V5 Medical",
        "blurb": "Dental examination kits, oral care kits, saliva ejectors, dental bibs and impression trays. Cost-effective sterile dental consumables for clinics and distributors, with private-label packaging options.",
        "keywords": "dental consumables supplier, dental examination kit manufacturer, saliva ejector wholesale, dental products China",
        "certs": ["ISO 13485", "CE"],
        "desc": "{name} for dental clinics and distributors — cost-effective, sterile-packed consumables with private-label packaging options.",
        "specs": {
            "Material": "Medical-grade polymer / paper",
            "Sterility": "Sterile (EO Gas)",
            "Quality Standard": "ISO 13485 / CE",
            "Packaging": "Individual sterile pack, boxed",
            "Origin": "China",
        },
    },
    "pharmaceutical-packaging": {
        "name": "Pharmaceutical Packaging",
        "title": "Pharmaceutical Packaging Supplier: Cartons, Labels & Blister Trays | V5 Medical",
        "blurb": "Complete secondary packaging sets for pharmaceutical companies — folding cartons, package inserts (IFU), self-adhesive labels, holographic anti-counterfeit labels and blister trays. One supplier, one quality standard, one consolidated shipment. Climate-engineered materials for Southeast Asia, with tamper-evident and serialization options.",
        "keywords": "pharmaceutical packaging supplier, medicine box manufacturer, pharma folding cartons, anti-counterfeit hologram labels, blister tray packaging, pharmaceutical secondary packaging China",
        # 包装类产品不是无菌医疗器械：不标 Sterile，不打 FDA 徽章（合规宣称）
        "certs": ["ISO 13485", "OEM Available"],
        "desc": "{name} as part of a complete pharmaceutical secondary packaging set — one supplier, one quality standard, one consolidated shipment. Custom printing, tamper-evident and serialization options available.",
        "specs": {
            "Material": "Pharmaceutical-grade paperboard / PVC / PP",
            "Sterility": "Non-sterile (secondary packaging)",
            "Quality Standard": "ISO 13485 QMS",
            "Packaging": "Export cartons, custom printing",
            "Origin": "China",
        },
    },
}

# ---------------- 通用模板 ----------------
PAGE_CSS = """
:root{--blue:#1e40af;--blue2:#3b82f6;--ink:#1f2937;--muted:#6b7280;--line:#e5e7eb;--bg:#f8fafc}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--ink);background:var(--bg);line-height:1.7}
a{color:var(--blue);text-decoration:none}
a:hover{text-decoration:underline}
.topbar{background:linear-gradient(90deg,#dbeafe,#2563eb,#1e3a8a);padding:14px 0;position:sticky;top:0;z-index:50;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.topbar-inner{max-width:1080px;margin:0 auto;padding:0 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
.brand{font-weight:800;font-size:1.15rem;color:#172554}
.brand span{display:block;font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;color:#dbeafe;font-weight:600}
.nav{display:flex;gap:18px;flex-wrap:wrap}
.nav a{color:#fff;font-weight:500;font-size:.92rem}
.btn{display:inline-block;background:var(--blue);color:#fff!important;padding:12px 28px;border-radius:999px;font-weight:600;transition:.2s;border:none}
.btn:hover{background:#1d4ed8;text-decoration:none;transform:translateY(-1px)}
.btn-green{background:#16a34a}
.btn-green:hover{background:#15803d}
.btn-outline{background:#fff;color:var(--blue)!important;border:1px solid var(--blue2)}
.wrap{max-width:860px;margin:0 auto;padding:40px 20px}
.crumbs{font-size:.82rem;color:var(--muted);margin-bottom:18px}
.crumbs a{color:var(--blue)}
.card{background:#fff;border-radius:14px;box-shadow:0 2px 10px rgba(0,0,0,.06);padding:40px}
h1{font-size:2rem;line-height:1.25;color:#172554;margin-bottom:14px}
.meta{display:flex;gap:14px;flex-wrap:wrap;font-size:.85rem;color:var(--muted);margin-bottom:28px}
.meta .tag{background:#eff6ff;color:var(--blue);padding:2px 12px;border-radius:999px;font-weight:600}
.article h2{font-size:1.4rem;color:#1e3a8a;margin:32px 0 12px}
.article h3{font-size:1.15rem;color:#1e3a8a;margin:24px 0 10px}
.article p{margin:12px 0}
.article ul,.article ol{margin:12px 0 12px 24px}
.article li{margin:6px 0}
.article table{width:100%;border-collapse:collapse;margin:18px 0;font-size:.92rem}
.article th,.article td{border:1px solid var(--line);padding:9px 12px;text-align:left}
.article th{background:#eff6ff}
.article blockquote{border-left:4px solid var(--blue2);background:#eff6ff;padding:12px 18px;margin:16px 0;border-radius:0 8px 8px 0;color:#374151}
.article img{max-width:100%;border-radius:10px;margin:14px 0}
.article hr{border:none;border-top:1px solid var(--line);margin:26px 0}
.alert{border-radius:10px;padding:16px 20px;margin:20px 0;font-size:.95rem}
.alert-warning{background:#fffbeb;border:1px solid #fcd34d}
.alert-info{background:#eff6ff;border:1px solid #93c5fd}
.cta{margin-top:44px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:14px;padding:32px;text-align:center}
.cta h2{font-size:1.4rem;color:#172554;margin-bottom:10px}
.cta p{color:#475569;margin-bottom:20px}
.cta .btn{margin:6px}
.spec-table{width:100%;border-collapse:collapse;margin:20px 0}
.spec-table th,.spec-table td{border:1px solid var(--line);padding:10px 14px;text-align:left;font-size:.93rem}
.spec-table th{background:#eff6ff;width:34%}
.prod-hero{display:flex;gap:32px;flex-wrap:wrap;align-items:flex-start}
.prod-hero img{width:320px;max-width:100%;border-radius:12px;border:1px solid var(--line);background:#fff}
.badges{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}
.badge{background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;font-size:.78rem;font-weight:700;padding:3px 12px;border-radius:999px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;margin-top:22px}
.pcard{background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px;transition:.2s;display:block}
.pcard:hover{box-shadow:0 6px 18px rgba(30,64,175,.12);text-decoration:none;transform:translateY(-2px)}
.pcard h3{color:var(--ink);font-size:1rem;margin-bottom:6px}
.pcard p{color:var(--muted);font-size:.82rem}
footer.site{margin-top:60px;background:#111827;color:#9ca3af;text-align:center;padding:26px 16px;font-size:.85rem}
@media(max-width:640px){.card{padding:26px 20px}h1{font-size:1.55rem}}
"""

def site_header():
    return f"""
<header class="topbar">
  <div class="topbar-inner">
    <a class="brand" href="/">V5 Medical<span>Global Supply Chain</span></a>
    <nav class="nav" aria-label="Main">
      <a href="/">Home</a>
      <a href="/about.html">About</a>
      <a href="/catalog.html">Products</a>
      <a href="/blog/">Blog</a>
      <a href="/contact.html">Contact</a>
    </nav>
  </div>
</header>"""

def site_footer():
    year = datetime.date.today().year
    return f"""
<footer class="site">
  <p>&copy; {year} V5 Medical LTD &middot; ISO 13485 Certified Supply Chain &middot;
  <a href="/contact.html" style="color:#93c5fd">Contact</a> &middot;
  <a href="/privacy.html" style="color:#93c5fd">Privacy</a></p>
</footer>"""

def ga_snippet():
    return f"""<script async src="https://www.googletagmanager.com/gtag/js?id={GA_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','{GA_ID}',{{anonymize_ip:true}});</script>"""

def esc(s):
    return html_lib.escape(str(s), quote=True)

def jsonld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False) + '</script>'

def cta_box(title="Stop Gambling with Compliance", text="Get a comprehensive ISO 13485 audit report sample and a quotation for your target SKUs."):
    return f"""
<div class="cta">
  <h2>{esc(title)}</h2>
  <p>{esc(text)}</p>
  <a class="btn btn-green" href="https://wa.me/447895047944" rel="noopener">WhatsApp Us &rarr;</a>
  <a class="btn" href="/contact.html?type=quote">Request a Quote &rarr;</a>
</div>"""

def render_page(*, title, description, canonical, body, schemas=(), extra_head="", og_type="website"):
    schema_html = "\n".join(jsonld(s) for s in schemas)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{esc(canonical)}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:type" content="{esc(og_type)}">
<meta property="og:site_name" content="V5 Medical LTD">
<meta property="og:url" content="{esc(canonical)}">
<meta property="og:image" content="{OG_IMAGE}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>{PAGE_CSS}</style>
{schema_html}
{ga_snippet()}
{extra_head}
</head>
<body>
{site_header()}
<main class="wrap">
{body}
</main>
{site_footer()}
</body>
</html>
"""

# ---------------- 博客处理 ----------------
FRONT_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.S)

def parse_frontmatter(text):
    meta = {}
    m = FRONT_RE.match(text)
    if m:
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip().strip('"').strip("'")
        text = text[m.end():]
    return meta, text

def convert_docsify_alerts(text):
    """把 Docsify 的 !> / ?> 提示块转换为带样式的 div（其余交给 markdown 渲染）。"""
    out = []
    lines = text.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        m = re.match(r"^(!>|\?>)\s*(.*)$", line)
        if m:
            kind = "alert-warning" if m.group(1) == "!>" else "alert-info"
            block = [m.group(2)]
            i += 1
            while i < len(lines) and (lines[i].startswith(">") or lines[i].strip() == ""):
                if lines[i].strip() == "" and i + 1 < len(lines) and not lines[i + 1].startswith(">"):
                    break
                block.append(re.sub(r"^>\s?", "", lines[i]))
                i += 1
            inner = markdown.markdown("\n".join(block).strip(), extensions=["tables", "sane_lists"])
            out.append(f'<div class="alert {kind}">{inner}</div>')
            continue
        out.append(line)
        i += 1
    return "\n".join(out)

def plain_text(md_text, limit=160):
    t = re.sub(r"[#>*`\[\]!|:-]", " ", md_text)
    t = re.sub(r"\s+", " ", t).strip()
    return (t[:157] + "...") if len(t) > limit else t

def strip_md(text):
    """去 Markdown 标记，留纯文本（用于 schema / description）"""
    t = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)  # 链接保留锚文本
    t = re.sub(r"[*_`>#|]", "", t)
    return re.sub(r"\s+", " ", t).strip()

def extract_faq(md_text):
    """从正文中提取 FAQ 板块（## Frequently Asked Questions + ### N. 问题），生成 FAQPage schema 数据。
    页面保留可见 FAQ（Google 要求 schema 与可见内容一致），此处仅用于结构化数据。"""
    m = re.search(r"^##\s+Frequently Asked Questions\s*\n(.*?)(?=^---\s*$|^##\s|\Z)", md_text, re.S | re.M)
    if not m:
        return []
    items = re.findall(r"###\s*\d*\.?\s*(.+?)\n\n(.+?)(?=\n###|\Z)", m.group(1), re.S)
    return [(strip_md(q), strip_md(a)) for q, a in items]

def first_paragraph(text):
    for para in re.split(r"\n\s*\n", text):
        p = para.strip()
        if p and not p.startswith(("#", ">", "---", "!", "?", "|", "*", "-")):
            return p
    return ""

def process_blog_posts():
    posts_dir = ROOT / "blog" / "posts"
    articles = []
    for md_file in sorted(posts_dir.glob("*.md")):
        if md_file.stem.lower() in ("template", "readme"):
            print(f"  [skip] {md_file.name} (模板/说明文件，不发布)")
            continue
        slug = md_file.stem
        raw = md_file.read_text(encoding="utf-8")
        meta, body_md = parse_frontmatter(raw)

        # 标题：frontmatter 优先，否则第一个 # 标题
        title = meta.get("title")
        h1 = re.search(r"^#\s+(.+)$", body_md, re.M)
        if not title and h1:
            title = h1.group(1).strip()
        title = title or slug.replace("-", " ").title()

        # 去掉正文中第一个 H1（模板会渲染标题）
        if h1:
            body_md = body_md.replace(h1.group(0), "", 1)

        author = meta.get("author", "V5 Medical Team")
        am = re.search(r"\*\*Author:\*\*\s*(.+)", raw)
        if "author" not in meta and am:
            author = am.group(1).strip()
        category = meta.get("category", "")
        cm = re.search(r"\*\*Category:\*\*\s*(.+)", raw)
        if "category" not in meta and cm:
            category = cm.group(1).strip()
        date = meta.get("date") or git_firstmod(md_file.relative_to(ROOT))
        modified = git_lastmod(md_file.relative_to(ROOT))
        description = meta.get("description") or meta.get("summary") or ""
        if not description:
            sm = re.search(r"\*\*Summary:\*\*\s*(.+)", raw)
            description = sm.group(1).strip() if sm else plain_text(first_paragraph(body_md))
        description = plain_text(description) if len(description) > 160 else description

        body_html = markdown.markdown(
            convert_docsify_alerts(body_md),
            extensions=["tables", "fenced_code", "sane_lists"],
        )
        # 文章内 .md 互链改为静态 .html 绝对路径（Docsify 相对链接在静态页会 404）
        body_html = re.sub(r'href="(?:posts/)?([\w-]+)\.md"', r'href="/blog/posts/\1.html"', body_html)

        canonical = f"{BASE}/blog/posts/{slug}.html"
        # 支持 frontmatter 自定义 meta_title（控制在 ~60 字符以内最佳）
        page_title = meta.get("meta_title") or f"{title} | V5 Medical Blog"
        if len(page_title) > 65:
            page_title = title if len(title) <= 65 else title[:62] + "..."

        crumbs = f"""
<nav class="crumbs" aria-label="Breadcrumb">
  <a href="/">Home</a> &rsaquo; <a href="/blog/">Blog</a> &rsaquo; <span>{esc(title)}</span>
</nav>"""

        meta_html = f"""<div class="meta">
  <span class="tag">{esc(category or 'Insights')}</span>
  <span>&#128100; {esc(author)}</span>
  <span>&#128197; {esc(date)}</span>
</div>"""

        body = f"""
{crumbs}
<article class="card article">
  <h1>{esc(title)}</h1>
  {meta_html}
  {body_html}
</article>
{cta_box()}"""

        schemas = [
            {
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": title,
                "description": description,
                "author": {"@type": "Organization", "name": author},
                "publisher": {
                    "@type": "Organization",
                    "name": "V5 Medical LTD",
                    "logo": {"@type": "ImageObject", "url": OG_IMAGE},
                },
                "datePublished": date,
                "dateModified": modified,
                "mainEntityOfPage": canonical,
                "image": OG_IMAGE,
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{BASE}/"},
                    {"@type": "ListItem", "position": 2, "name": "Blog", "item": f"{BASE}/blog/"},
                    {"@type": "ListItem", "position": 3, "name": title, "item": canonical},
                ],
            },
        ]

        # 可见 FAQ → FAQPage 结构化数据（与页面内容一一对应，合规）
        faq_items = extract_faq(body_md)
        if faq_items:
            schemas.append({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": q,
                        "acceptedAnswer": {"@type": "Answer", "text": a},
                    }
                    for q, a in faq_items
                ],
            })

        out = render_page(title=page_title, description=description,
                          canonical=canonical, body=body, schemas=schemas,
                          og_type="article")
        (posts_dir / f"{slug}.html").write_text(out, encoding="utf-8")
        articles.append({"slug": slug, "title": title, "date": date,
                         "modified": modified, "canonical": canonical})
        print(f"  [blog] {slug}.html  ({title[:50]})")
    return articles

# ---------------- 产品 / 分类页 ----------------
PRODUCT_RE = re.compile(
    r'\{\s*name:\s*"([^"]+)",\s*id:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*img:\s*"([^"]+)"\s*\}'
)

def load_products():
    """从 js/complete-products.js 提取产品数据，并做 fail-fast 校验：
    1. 提取数量必须与 metadata.totalProducts 一致（防正则静默丢产品）；
    2. 每个产品主图必须存在且 >1KB（防坏图/占位文本静默上线）。"""
    js = (ROOT / "js" / "complete-products.js").read_text(encoding="utf-8")
    products = [
        {"name": m[0], "id": m[1], "category": m[2], "img": m[3]}
        for m in PRODUCT_RE.findall(js)
    ]
    if not products:
        raise RuntimeError("未能从 js/complete-products.js 提取产品数据")

    m = re.search(r"totalProducts:\s*(\d+)", js)
    if m and int(m.group(1)) != len(products):
        raise RuntimeError(
            f"产品数量不匹配：metadata.totalProducts={m.group(1)}，"
            f"正则提取到 {len(products)} 个。请检查 productData 条目格式是否与 PRODUCT_RE 一致。"
        )

    bad = []
    for p in products:
        if p["category"] not in CATEGORIES:
            bad.append(f"  {p['id']}: 未知分类 {p['category']}")
            continue
        img = ROOT / p["img"]
        if not img.is_file():
            bad.append(f"  {p['id']}: 图片不存在 {p['img']}")
        elif img.stat().st_size < 1024:
            bad.append(f"  {p['id']}: 图片损坏/占位 ({img.stat().st_size}B) {p['img']}")
    if bad:
        raise RuntimeError("产品数据校验失败：\n" + "\n".join(bad))
    return products

def product_description(p, cat):
    return f"V5 Medical supplies {p['name']}. " + cat["desc"].replace("{name}", p["name"])

def render_product_page(p, cat):
    cat_name = cat["name"]
    desc = product_description(p, cat)
    canonical = f"{BASE}/products/{p['id']}.html"
    img_abs = f"{BASE}/{p['img']}"
    title = f"{p['name']} | ISO 13485 Certified | V5 Medical"

    crumbs = f"""
<nav class="crumbs" aria-label="Breadcrumb">
  <a href="/">Home</a> &rsaquo; <a href="/catalog.html">Products</a> &rsaquo;
  <a href="/categories/{p['category']}.html">{esc(cat_name)}</a> &rsaquo; <span>{esc(p['name'])}</span>
</nav>"""

    spec_rows = "\n".join(
        f'<tr><th>{esc(k)}</th><td>{esc(v)}</td></tr>' for k, v in cat["specs"].items()
    )
    badges = "\n".join(f'<span class="badge">{esc(c)}</span>' for c in cat["certs"])

    body = f"""
{crumbs}
<div class="card">
  <div class="prod-hero">
    <img src="/{esc(p['img'])}" alt="{esc(p['name'])} - {esc(cat_name)} by V5 Medical"
         width="320" height="320" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.src='/images/products/default-product.jpg'">
    <div style="flex:1;min-width:260px">
      <h1 style="font-size:1.7rem">{esc(p['name'])}</h1>
      <div class="badges">{badges}</div>
      <p>{esc(desc)}</p>
      <p style="margin-top:14px"><strong>Price:</strong> Contact for a quotation (flexible MOQ for trial orders)</p>
      <p style="margin-top:18px">
        <a class="btn" href="/contact.html?type=quote&amp;product={esc(p['id'])}">Request Quote &rarr;</a>
        <a class="btn btn-green" href="https://wa.me/447895047944?text={quote('Hi V5 Medical, I am interested in ' + p['name'] + '.')}" rel="noopener">WhatsApp</a>
      </p>
    </div>
  </div>
  <h2 style="margin-top:34px;font-size:1.25rem;color:#1e3a8a">Specifications</h2>
  <table class="spec-table">{spec_rows}</table>
  <p style="margin-top:22px;font-size:.9rem;color:var(--muted)">
    Looking for other items? Browse all
    <a href="/categories/{p['category']}.html">{esc(cat_name)}</a> or the full
    <a href="/catalog.html">product catalog</a>.
  </p>
</div>
{cta_box(f"Need {p['name']} in bulk?", "Send us your target specifications and annual volume — we reply with a quotation and free ISO 13485 audit report sample.")}"""

    schemas = [
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": p["name"],
            "description": desc,
            "sku": p["id"],
            "mpn": p["id"].upper(),
            "image": [img_abs],
            "category": cat_name,
            "brand": {"@type": "Brand", "name": "V5 Medical"},
            "manufacturer": {"@type": "Organization", "name": "V5 Medical LTD", "url": BASE},
            "additionalProperty": [
                {"@type": "PropertyValue", "name": "Certification", "value": c} for c in cat["certs"]
            ],
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{BASE}/"},
                {"@type": "ListItem", "position": 2, "name": "Products", "item": f"{BASE}/catalog.html"},
                {"@type": "ListItem", "position": 3, "name": cat_name, "item": f"{BASE}/categories/{p['category']}.html"},
                {"@type": "ListItem", "position": 4, "name": p["name"], "item": canonical},
            ],
        },
    ]

    out = render_page(title=title, description=desc, canonical=canonical,
                      body=body, schemas=schemas, og_type="product")
    (ROOT / "products" / f"{p['id']}.html").write_text(out, encoding="utf-8")

def render_category_page(slug, products):
    cat = CATEGORIES[slug]
    items = [p for p in products if p["category"] == slug]
    canonical = f"{BASE}/categories/{slug}.html"
    description = trunc(cat["blurb"], 155)

    crumbs = f"""
<nav class="crumbs" aria-label="Breadcrumb">
  <a href="/">Home</a> &rsaquo; <a href="/catalog.html">Products</a> &rsaquo; <span>{esc(cat['name'])}</span>
</nav>"""

    cards = "\n".join(
        f"""<a class="pcard" href="/products/{p['id']}.html">
  <h3>{esc(p['name'])}</h3>
  <p>ISO 13485 &middot; CE &middot; OEM available</p>
</a>""" for p in items
    )

    body = f"""
{crumbs}
<div class="card">
  <h1>{esc(cat['name'])}</h1>
  <p style="color:#475569">{esc(cat['blurb'])}</p>
  <div class="grid">{cards}</div>
</div>
{cta_box(f"Sourcing {cat['name']} in bulk?", "Get tiered pricing, free samples and a full technical documentation package for your market.")}"""

    schemas = [
        {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": cat["name"],
            "numberOfItems": len(items),
            "itemListElement": [
                {"@type": "ListItem", "position": i + 1,
                 "name": p["name"], "url": f"{BASE}/products/{p['id']}.html"}
                for i, p in enumerate(items)
            ],
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{BASE}/"},
                {"@type": "ListItem", "position": 2, "name": "Products", "item": f"{BASE}/catalog.html"},
                {"@type": "ListItem", "position": 3, "name": cat["name"], "item": canonical},
            ],
        },
    ]

    out = render_page(title=cat["title"], description=description,
                      canonical=canonical, body=body, schemas=schemas,
                      extra_head=f'<meta name="keywords" content="{esc(cat["keywords"])}">')
    (ROOT / "categories" / f"{slug}.html").write_text(out, encoding="utf-8")

# ---------------- Sitemaps ----------------
def url_entry(loc, priority, changefreq, image=None, lastmod=TODAY):
    img_xml = ""
    if image:
        img_xml = f"""
        <image:image>
            <image:loc>{esc(image)}</image:loc>
        </image:image>"""
    return f"""    <url>
        <loc>{esc(loc)}</loc>
        <lastmod>{lastmod}</lastmod>
        <changefreq>{changefreq}</changefreq>
        <priority>{priority}</priority>{img_xml}
    </url>"""

def write_sitemaps(products, articles):
    # lastmod 取数据源/页面文件的最后提交日期，避免全站统一刷成构建日期
    products_lastmod = git_lastmod("js/complete-products.js")
    # 主 sitemap（payment.html 有 noindex，不收录）
    entries = [
        url_entry(f"{BASE}/", "1.0", "weekly", lastmod=git_lastmod("index.html")),
        url_entry(f"{BASE}/about.html", "0.8", "monthly", lastmod=git_lastmod("about.html")),
        url_entry(f"{BASE}/catalog.html", "0.9", "weekly", lastmod=git_lastmod("catalog.html")),
        url_entry(f"{BASE}/contact.html", "0.8", "monthly", lastmod=git_lastmod("contact.html")),
        url_entry(f"{BASE}/links.html", "0.6", "monthly", lastmod=git_lastmod("links.html")),
        url_entry(f"{BASE}/privacy.html", "0.3", "yearly", lastmod=git_lastmod("privacy.html")),
        url_entry(f"{BASE}/blog/", "0.9", "weekly", lastmod=git_lastmod("blog/index.html")),
    ]
    for slug in CATEGORIES:
        entries.append(url_entry(f"{BASE}/categories/{slug}.html", "0.9", "weekly",
                                 lastmod=products_lastmod))
    for p in products:
        entries.append(url_entry(f"{BASE}/products/{p['id']}.html", "0.8", "monthly",
                                 image=f"{BASE}/{p['img']}", lastmod=products_lastmod))

    main = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
{chr(10).join(entries)}
</urlset>
"""
    (ROOT / "sitemap.xml").write_text(main, encoding="utf-8")

    # 博客 sitemap
    blog_entries = [
        url_entry(a["canonical"], "0.7", "monthly", lastmod=a["modified"]) for a in articles
    ]
    blog = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(blog_entries)}
</urlset>
"""
    (ROOT / "blog" / "sitemap.xml").write_text(blog, encoding="utf-8")

# ---------------- 主流程 ----------------
def main():
    (ROOT / "products").mkdir(exist_ok=True)
    (ROOT / "categories").mkdir(exist_ok=True)

    print("== 1/3 生成博客静态文章页 ==")
    articles = process_blog_posts()

    print("== 2/3 生成产品页 & 分类页 ==")
    products = load_products()
    for p in products:
        render_product_page(p, CATEGORIES[p["category"]])
    print(f"  [products] {len(products)} 个产品页")
    for slug in CATEGORIES:
        render_category_page(slug, products)
    print(f"  [categories] {len(CATEGORIES)} 个分类页")

    print("== 3/3 生成 sitemap ==")
    write_sitemaps(products, articles)
    print(f"  sitemap.xml: {7 + len(CATEGORIES) + len(products)} 个 URL")
    print(f"  blog/sitemap.xml: {len(articles)} 个 URL")
    print("\n[OK] 构建完成")

if __name__ == "__main__":
    main()
