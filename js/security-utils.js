/**
 * V5 Medical Security Utilities
 * 用于防止 XSS 攻击和验证输入
 * @version 1.0.0
 */

const SecurityUtils = {
    /**
     * Safely render a deliberately limited HTML fragment. Prefer textContent
     * whenever HTML is not required.
     */
    safeSetHTML(element, html) {
        if (!element) return;
        if (!html) {
            element.innerHTML = '';
            return;
        }
        element.innerHTML = this.sanitizeHTML(html);
    },

    sanitizeHTML(html) {
        const template = document.createElement('template');
        template.innerHTML = String(html);
        const blocked = 'script,style,iframe,object,embed,link,meta,base,svg,math,foreignObject';
        template.content.querySelectorAll(blocked).forEach((node) => node.remove());
        template.content.querySelectorAll('*').forEach((node) => {
            [...node.attributes].forEach((attribute) => {
                const name = attribute.name.toLowerCase();
                if (name.startsWith('on') || name === 'srcdoc' || name === 'style') {
                    node.removeAttribute(attribute.name);
                    return;
                }
                if (['href', 'src', 'xlink:href'].includes(name) && !this.isSafeUrl(attribute.value, name === 'src')) {
                    node.removeAttribute(attribute.name);
                }
            });
        });
        return template.innerHTML;
    },

    isSafeUrl(value, allowImageData = false) {
        const url = String(value || '').trim();
        if (!url || url.startsWith('#') || url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) return true;
        if (allowImageData && /^data:image\/(?:png|jpeg|gif|webp);base64,/i.test(url)) return true;
        try {
            const parsed = new URL(url, window.location.origin);
            return parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'mailto:' || parsed.protocol === 'tel:';
        } catch (_) {
            return false;
        }
    },

    /**
     * 邮箱格式验证
     */
    isValidEmail(email) {
        return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    /**
     * 电话号码验证
     */
    isValidPhone(phone) {
        // 允许数字、空格、加号、减号、括号
        return /^[0-9+\-\s()]{7,20}$/.test(phone);
    }
};

// 挂载到全局对象，确保其他文件能用
window.SecurityUtils = SecurityUtils;
