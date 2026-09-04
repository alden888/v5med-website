/**
 * V5 Medical Main Logic
 * Handles UI interactions, Google Translate, and Forms
 * @version 2.2.0 (Translate Styles Centralized)
 */
const V5Medical = (() => {
    const config = {
        loader: { timeout: 1500, fadeDuration: 300 },
        scroll: { navbarThreshold: 50, backToTopThreshold: 300 },
        analytics: { trackingId: 'GA4_ID_PLACEHOLDER' },
        translate: {
            pageLanguage: 'en',
            includedLanguages: 'en,ar,es,fr,ru,nl,de,it,pt,ja,ko,tr,pl,vi,hi,id,th,sv,zh-CN,zh-TW',
            layout: 'SIMPLE',
            autoDisplay: false
        }
    };

    const safeExecute = (func, name) => { try { func(); } catch (e) { console.warn(`[Main] ${name} error:`, e); } };

    // 1. Google Translate (集中管理)
    const initTranslate = () => {
        if (window.googleTranslateInitialized) return;
        
        window.googleTranslateElementInit = () => {
            new google.translate.TranslateElement({
                pageLanguage: config.translate.pageLanguage,
                includedLanguages: config.translate.includedLanguages,
                layout: google.translate.TranslateElement.InlineLayout[config.translate.layout],
                autoDisplay: config.translate.autoDisplay
            }, 'google_translate_element');
            
            // 样式注入：包含外观和定位
            const style = document.createElement('style');
            style.innerHTML = `
                /* 组件外观 */
                .goog-te-gadget { font-family: inherit !important; color: white !important; }
                .goog-te-gadget-simple {
                    background-color: rgba(255,255,255,0.15) !important;
                    border: 1px solid rgba(255,255,255,0.3) !important;
                    padding: 6px 12px !important;
                    border-radius: 99px !important;
                }
                .goog-te-gadget-simple span { color: white !important; font-weight: 600 !important; }
                .goog-te-gadget-icon { display: none !important; }
                .goog-te-banner-frame { display: none !important; }
                body { top: 0 !important; }

                /* 强制固定定位 & 层级 (Z-60 高于导航栏 Z-50) */
                #google_translate_element {
                    position: fixed !important;
                    z-index: 60 !important;
                }

                /* 桌面端定位 */
                @media (min-width: 769px) {
                    #google_translate_element { top: 22px !important; right: 20px !important; }
                }

                /* 移动端定位：避开右侧汉堡菜单 */
                @media (max-width: 768px) {
                    #google_translate_element {
                        top: 20px !important;
                        right: 60px !important; /* 向左移，给汉堡菜单留空间 */
                    }
                    .goog-te-gadget-simple {
                        max-width: 130px !important;
                        padding: 4px 8px !important;
                        font-size: 11px !important;
                        overflow: hidden !important;
                        text-overflow: ellipsis !important;
                        white-space: nowrap !important;
                    }
                }
            `;
            document.head.appendChild(style);
        };

        if (!document.querySelector('script[src*="translate.google.com"]')) {
            const script = document.createElement('script');
            script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
            script.async = true;
            document.body.appendChild(script);
        }
        window.googleTranslateInitialized = true;
    };

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

    // 3. Forms
    const initForms = () => {
        const form = document.getElementById('inquiry-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalHTML = btn.innerHTML;
            
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: { 'Accept': 'application/json' }
                });
                if (response.ok) {
                    form.reset();
                    alert('Inquiry sent successfully! We will contact you shortly.');
                } else {
                    throw new Error('Submission failed');
                }
            } catch (err) {
                alert('Connection error. Please try WhatsApp instead.');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        });
    };

    const init = () => {
        safeExecute(initTranslate, 'Google Translate');
        safeExecute(initUI, 'UI Interactions');
        safeExecute(initForms, 'Forms');
        
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
