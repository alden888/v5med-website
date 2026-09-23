/**
 * V5 Medical public lead forms.
 *
 * Keep submission behaviour out of HTML attributes so it can be protected by
 * a progressively stricter CSP. A success message is rendered only after the
 * Worker returns an accepted reference number.
 */
(function () {
    'use strict';

    const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

    const originalButtonContent = new WeakMap();

    function setButtonLoading(button, loading, label) {
        if (!button) return;
        // Keep the original markup (icon + label) so it can be restored after loading.
        if (!originalButtonContent.has(button)) {
            originalButtonContent.set(button, [...button.childNodes].map((node) => node.cloneNode(true)));
        }
        button.disabled = loading;
        if (loading) button.textContent = label;
        else button.replaceChildren(...originalButtonContent.get(button).map((node) => node.cloneNode(true)));
    }

    async function requestJson(url, options) {
        const response = await fetch(url, options);
        let payload = {};
        try { payload = await response.json(); } catch (_) { /* handled below */ }
        if (!response.ok || !payload.ok) {
            throw new Error(payload.error || 'We could not submit your inquiry. Please try again.');
        }
        return payload;
    }

    function appendStatus(container, message, type, fallback) {
        if (!container) return;
        container.replaceChildren();
        const text = document.createElement('span');
        text.textContent = message;
        container.append(text);
        container.className = type === 'success'
            ? 'mt-3 text-sm text-green-700'
            : 'mt-3 text-sm text-red-700';
        if (fallback) {
            container.append(document.createTextNode(' '));
            const link = document.createElement('a');
            link.href = fallback;
            link.textContent = 'Email sales instead';
            link.className = 'underline font-semibold';
            container.append(link);
        }
    }

    function mailtoFallback(form) {
        const company = form.elements.company?.value?.trim() || 'New inquiry';
        const email = form.elements.email?.value?.trim() || '';
        const phone = form.elements.phone?.value?.trim() || '';
        const message = form.elements.message?.value?.trim() || form.elements.description?.value?.trim() || '';
        const subject = encodeURIComponent(`Website inquiry: ${company}`);
        const body = encodeURIComponent(`Company: ${company}\nEmail: ${email}\nPhone: ${phone}\n\nMessage: ${message}`);
        return `mailto:sales@v5med.net?subject=${subject}&body=${body}`;
    }

    function quoteMessages() {
        return window.V5QuoteContext?.getMessages?.() || {
            'err-required': 'Please complete all required fields.',
            'err-email': 'Please enter a valid email address.',
            'err-submit': 'Submission failed. Please try again or contact us by email.',
            loading: 'Submitting...',
            'success-ref': 'Reference ID',
        };
    }

    function showQuoteError(field, message) {
        field.style.borderColor = '#c41e3a';
        const previous = field.parentNode.querySelector('.field-error');
        if (previous) previous.remove();
        const error = document.createElement('p');
        error.className = 'field-error text-xs text-v5red mt-1';
        error.textContent = message;
        field.parentNode.append(error);
        field.addEventListener('input', () => {
            field.style.borderColor = '#e5e7eb';
            error.remove();
        }, { once: true });
    }

    function initQuoteForm() {
        const form = document.getElementById('quoteForm');
        if (!form) return;
        const button = document.getElementById('submitBtn');
        const resetButton = document.getElementById('quote-reset-button');
        const reference = document.getElementById('quote-reference');

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const messages = quoteMessages();
            document.querySelectorAll('.field-error').forEach((element) => element.remove());
            const fields = ['company', 'contact', 'email', 'category'].map((id) => document.getElementById(id));
            fields.forEach((field) => { field.style.borderColor = '#e5e7eb'; });

            let invalid = false;
            fields.forEach((field) => {
                if (!field.value.trim()) {
                    showQuoteError(field, messages['err-required']);
                    invalid = true;
                }
            });
            const email = document.getElementById('email');
            const emailIsValid = window.SecurityUtils
                ? window.SecurityUtils.isValidEmail(email.value.trim())
                : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
            if (email.value && !emailIsValid) {
                showQuoteError(email, messages['err-email']);
                invalid = true;
            }
            if (invalid) return;

            setButtonLoading(button, true, messages.loading || 'Submitting...');
            const payload = Object.fromEntries(new FormData(form).entries());
            payload.source = 'v5med.net/quote';
            payload.page = window.location.pathname + window.location.search;
            const productParam = new URLSearchParams(window.location.search).get('product');
            if (productParam) payload.product = productParam.slice(0, 120);
            try {
                const result = await requestJson('/api/submit-quote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (reference) reference.textContent = `${messages['success-ref'] || 'Reference ID'}: ${result.ref}`;
                document.getElementById('formContainer').classList.add('hidden');
                document.getElementById('successMessage').classList.remove('hidden');
                if (typeof window.gtag === 'function') {
                    window.gtag('event', 'generate_lead', { event_category: 'quote_form', event_label: payload.category });
                }
            } catch (error) {
                appendStatus(document.getElementById('quote-form-status'), error.message, 'error', mailtoFallback(form));
                setButtonLoading(button, false);
            }
        });

        resetButton?.addEventListener('click', () => {
            form.reset();
            document.getElementById('formContainer').classList.remove('hidden');
            document.getElementById('successMessage').classList.add('hidden');
            document.getElementById('quote-form-status')?.replaceChildren();
            setButtonLoading(button, false);
            document.getElementById('quote-form').scrollIntoView({ behavior: 'smooth' });
        });
    }

    function syncContactSections() {
        const quote = document.getElementById('check-quote')?.checked;
        const qa = document.getElementById('check-qa')?.checked;
        document.getElementById('fields-quote')?.classList.toggle('hidden', !quote);
        document.getElementById('fields-qa')?.classList.toggle('hidden', !qa);
    }

    function initContactForm() {
        const form = document.getElementById('secure-form');
        if (!form) return;
        const button = document.getElementById('submit-btn');
        const attachment = document.getElementById('file-upload');
        ['check-quote', 'check-qa', 'check-oem'].forEach((id) => document.getElementById(id)?.addEventListener('change', syncContactSections));
        const params = new URLSearchParams(window.location.search);
        const productParam = (params.get('product') || '').slice(0, 120);
        if (params.get('type') === 'quote' || productParam) {
            const quoteBox = document.getElementById('check-quote');
            if (quoteBox) quoteBox.checked = true;
        }
        // Carry the product the visitor came from (e.g. /products/pdo-suture.html → ?product=pdo-suture).
        const productsField = form.elements.quote_products;
        if (productParam && productsField && !productsField.value) {
            productsField.value = `${productParam.replace(/[-_]+/g, ' ')} — quantity: `;
        }
        syncContactSections();

        attachment?.addEventListener('change', () => {
            const file = attachment.files?.[0];
            if (file && file.size > MAX_ATTACHMENT_BYTES) {
                attachment.value = '';
                appendStatus(document.getElementById('contact-form-status'), 'Attachment must be 10 MB or smaller.', 'error');
            }
        });

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!form.reportValidity()) return;
            const file = attachment?.files?.[0];
            if (file && file.size > MAX_ATTACHMENT_BYTES) {
                appendStatus(document.getElementById('contact-form-status'), 'Attachment must be 10 MB or smaller.', 'error');
                return;
            }

            setButtonLoading(button, true, 'Submitting inquiry...');
            const formData = new FormData(form);
            formData.set('source', 'v5med.net/contact');
            formData.set('page', window.location.pathname + window.location.search);
            if (productParam) formData.set('product', productParam);
            try {
                const result = await requestJson('/api/contact', { method: 'POST', body: formData, headers: { Accept: 'application/json' } });
                appendStatus(document.getElementById('contact-form-status'), `Thank you. Your inquiry reference is ${result.ref}.`, 'success');
                form.reset();
                syncContactSections();
            } catch (error) {
                appendStatus(document.getElementById('contact-form-status'), error.message, 'error', mailtoFallback(form));
            } finally {
                setButtonLoading(button, false);
            }
        });
    }

    function init() {
        initQuoteForm();
        initContactForm();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
}());
