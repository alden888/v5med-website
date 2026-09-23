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

            // [FIX 2026-09-23] 菜单可见性兜底：Google 有时把菜单 iframe 定位在屏幕外或被裁剪。
            // 轮询校正一次：菜单弹出时强制 z-index 100000、限制最大宽度、允许滚动。
            const fixMenu = () => {
                const f = document.querySelector('iframe.goog-te-menu-frame');
                if (f) {
                    f.style.zIndex = '100000';
                    f.style.maxWidth = '95vw';
                    f.style.position = 'fixed';
                    const inner = f.contentDocument && f.contentDocument.querySelector('.goog-te-menu2');
                    if (inner) { inner.style.maxHeight = '70vh'; inner.style.overflowY = 'auto'; }
                }
            };
            const gadget = document.querySelector('.goog-te-gadget-simple');
            if (gadget) {
                gadget.addEventListener('click', () => setTimeout(fixMenu, 350), { once: true });
                setTimeout(fixMenu, 800);
            }

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

                /* [FIX 2026-09-23] 菜单点击后不弹出的根因修复：
                   Google 官方 widget 的菜单 iframe (.goog-te-menu-frame) 默认 z-index 极低，
                   被导航栏(z-50)/本组件(z-60)遮挡且 absolute 定位可能越界，
                   此处强制置顶 + 修正定位，确保点击语言按钮后菜单可见。 */
                iframe.goog-te-menu-frame {
                    z-index: 100000 !important;
                    position: fixed !important;
                    top: auto !important;
                    max-width: 95vw !important;
                }
                .goog-te-menu2 {
                    max-height: 70vh !important;
                    overflow-y: auto !important;
                }
                .goog-te-gadget-simple { cursor: pointer !important; }
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

    // 3. Forms: handled by js/lead-forms.js (legacy #inquiry-form handler removed 2026-09-23)

    const init = () => {
        safeExecute(initTranslate, 'Google Translate');
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
