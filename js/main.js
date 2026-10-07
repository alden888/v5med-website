/**
 * V5 Medical Main Logic
 * Handles UI interactions, Google Translate, and Forms
 * @version 2.2.1 (GA4 Placeholder Unified)
 */
const V5Medical = (() => {
    const config = {
        loader: { timeout: 1500, fadeDuration: 300 },
        scroll: { navbarThreshold: 50, backToTopThreshold: 300 },
        // 当前未使用（站点 GA4 由 layout.js / build-static.py 注入），保留字段避免占位符误导
        analytics: { trackingId: 'G-HVN50TM5EK' },
    };

    const safeExecute = (func, name) => { try { func(); } catch (e) { console.warn(`[Main] ${name} error:`, e); } };

    // 1. Language switching lives in js/lang-switcher.js (loaded by js/layout.js).

    // 2. UI Interactions
    const initUI = () => {
        const backToTop = document.getElementById('back-to-top');
        if (backToTop) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > config.scroll.backToTopThreshold) {
                    backToTop.classList.remove('opacity-0', 'invisible', 'translate-y-10');
                } else {
                    backToTop.classList.add('opacity-0', 'invisible', 'translate-y-10');
                }
            });
            backToTop.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // 3. Forms: handled by js/lead-forms.js (legacy #inquiry-form handler removed 2026-09-23)

    const init = () => {
        safeExecute(initUI, 'UI Interactions');

        // Loader removal fallback
        const loader = document.getElementById('loader');
        if (loader) {
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 500);
            }, config.loader.timeout);
        }
    };

    return { init };
})();

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', V5Medical.init);
else V5Medical.init();
