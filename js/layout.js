/**
 * V5 Medical Layout Engine
 * (Unified Layout Manager)
 * Dynamically renders Header, Footer, and Floating elements.
 * @version 4.9.5 (Update: Footer Quick Links entry)
 * @updated 2026-08-22
 *
 * [CHANGELOG 4.9.5]
 * - Footer Resources 栏目新增 "Quick Links & Price Lists" 入口（links.html），
 *   方便访客和销售一键到达链接汇总页。
 *
 * [CHANGELOG 4.9.3]
 * - [SEO] 新增 _loadAnalytics()：所有使用 layout.js 的页面自动加载
 *   GA4 (GA4_ID_PLACEHOLDER)。原主站页面（index/about/catalog/contact 等）
 *   完全没有 GA 统计，仅博客有（且被旧 CSP 拦截）。
 */

const V5Layout = (() => {
    class LayoutManager {
        constructor() {
            // 延迟获取配置，避免在模块加载时 config.js 尚未执行
            this.config = window.V5Config;
            if (!this.config) {
                console.error('[Layout] V5Config not found. Ensure config.js is loaded before layout.js.');
                // 使用默认配置作为回退
                this.config = {
                    IMAGES: { LOGO: 'images/v5logo.png', LOGO_LOCAL: 'images/v5logo.png' },
                    CONTACT: { WHATSAPP: { API_URL: 'https://wa.me/8615133008348' } }
                };
            }
            this.currentPage = this._detectPage();
        }

        init() {
            this.injectStyles();
            this.renderHeader();
            this.renderFooter();
            this.renderFloatingElements();
            this.highlightCurrentPage();
            this._loadAnalytics();
            window.dispatchEvent(new Event('v5-layout-ready'));
            console.log('[Layout] Initialized v4.9.3 (GA4 Auto-Injection)');
        }

        /**
         * [SEO] 全站 GA4 统计注入（幂等）
         * 解决主站无统计、转化事件（WhatsApp 点击/表单提交）无法归因的问题。
         */
        _loadAnalytics() {
            const GA_ID = (window.V5Config && window.V5Config.ANALYTICS && window.V5Config.ANALYTICS.GA4_ID) || 'G-HVN50TM5EK';
            if (window.gtag || document.querySelector(`script[src*="${GA_ID}"]`)) return;

            const s = document.createElement('script');
            s.async = true;
            s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
            document.head.appendChild(s);

            window.dataLayer = window.dataLayer || [];
            window.gtag = function () { window.dataLayer.push(arguments); };
            window.gtag('js', new Date());
            window.gtag('config', GA_ID, { anonymize_ip: true });
        }

        injectStyles() {
            const style = document.createElement('style');
            style.innerHTML = `
                #google_translate_element { position: fixed !important; z-index: 60 !important; }
                @media (min-width: 769px) { #google_translate_element { top: 22px !important; right: 20px !important; } }
                @media (max-width: 768px) { 
                    #google_translate_element { top: 20px !important; right: 60px !important; }
                    .goog-te-gadget-simple { max-width: 120px !important; padding: 4px !important; font-size: 11px !important; }
                }
                @keyframes menuSlide { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .mobile-menu-enter { animation: menuSlide 0.2s ease-out forwards; }
                
                /* Footer Hover Effects */
                .footer-link:hover { color: #60a5fa; padding-left: 5px; transition: all 0.2s ease; }
            `;
            document.head.appendChild(style);
        }

        // --- 1. Header Rendering ---
        renderHeader() {
            const container = document.getElementById('v5-header');
            if (!container) return;

            const logoSrc = this.config.IMAGES.LOGO;
            const logoFallback = this.config.IMAGES.LOGO_LOCAL;

            const navItems = [
                { id: 'home', href: 'index.html', txt: 'Home' },
                { id: 'about', href: 'about.html', txt: 'About Us' },
                { id: 'catalog', href: 'catalog.html', txt: 'Products' },
                { id: 'blog', href: 'blog/', txt: 'Blog' }, 
                { id: 'contact', href: 'contact.html', txt: 'Contact' }
            ];

            const desktopNav = `
                <ul class="flex gap-6 items-center">
                    ${navItems.map(item => `
                        <li>
                            <a href="${item.href}" class="nav-link font-medium transition duration-200 text-sm lg:text-base text-blue-100 hover:text-white" data-id="${item.id}">
                                ${item.txt}
                            </a>
                        </li>
                    `).join('')}
                </ul>
            `;

            const mobileNav = navItems.map(item => `
                <a href="${item.href}" class="block px-6 py-4 border-b border-gray-100 text-base font-medium transition active:bg-blue-50 text-gray-700">
                    <div class="flex justify-between items-center">
                        <span>${item.txt}</span>
                        <i class="fas fa-chevron-right text-xs text-gray-300"></i>
                    </div>
                </a>
            `).join('');

            container.innerHTML = `
                <nav id="navbar" class="fixed w-full z-50 shadow-lg transition-all duration-300 h-20" aria-label="Main Navigation">
                    <div class="absolute inset-0 bg-gradient-to-r from-blue-50 via-blue-600 to-blue-900"></div>
                    
                    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                        <div class="flex justify-between items-center h-full">
                            
                            <a href="index.html" class="flex items-center gap-2 sm:gap-3 group relative z-10 pr-2">
                                <img src="${logoSrc}" onerror="this.onerror=null; this.src='${logoFallback}';" class="h-8 sm:h-10 md:h-12 w-auto" alt="V5 Medical Logo">
                                <div class="flex flex-col">
                                    <div class="font-bold text-lg sm:text-xl text-blue-900 leading-none tracking-tight">V5 Medical</div>
                                    <div class="text-[9px] sm:text-[10px] text-blue-700 font-bold tracking-wider uppercase mt-0.5 whitespace-nowrap">Global Supply Chain</div>
                                </div>
                            </a>

                            <div class="hidden md:flex gap-6 items-center pl-8">
                                ${desktopNav}
                                <a href="${this.config.CONTACT.WHATSAPP.API_URL}" target="_blank" rel="noopener noreferrer" class="bg-green-500 hover:bg-green-400 text-white px-5 py-2 rounded-full font-bold shadow-md flex items-center gap-2 transition transform hover:-translate-y-0.5 text-sm border border-green-400/30">
                                    <i class="fab fa-whatsapp text-lg"></i><span>Contact</span>
                                </a>
                                <div class="w-20"></div> 
                            </div>

                            <button id="mobile-menu-btn" class="md:hidden text-white p-3 -mr-2 hover:bg-white/10 rounded-full transition z-50 relative focus:outline-none touch-manipulation" aria-label="Toggle menu">
                                <i class="fas fa-bars text-2xl"></i>
                            </button>
                        </div>
                    </div>

                    <div id="mobile-menu" class="hidden md:hidden bg-white absolute w-full shadow-2xl top-20 left-0 z-40 rounded-b-2xl overflow-hidden border-t border-blue-100">
                        <div class="py-2">
                            ${mobileNav}
                            <div class="p-5 bg-gray-50 mt-1">
                                <a href="${this.config.CONTACT.WHATSAPP.API_URL}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 w-full bg-green-600 text-white px-4 py-4 rounded-xl font-bold shadow-sm active:scale-95 transition-transform">
                                    <i class="fab fa-whatsapp text-xl"></i> Contact via WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>
                </nav>
            `;
            
            this.bindMobileMenu();
        }

        bindMobileMenu() {
            const btn = document.getElementById('mobile-menu-btn');
            const menu = document.getElementById('mobile-menu');
            if (!btn || !menu) return;

            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            const icon = newBtn.querySelector('i');

            newBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isHidden = menu.classList.contains('hidden');
                if (isHidden) {
                    menu.classList.remove('hidden');
                    menu.classList.add('mobile-menu-enter');
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    menu.classList.add('hidden');
                    menu.classList.remove('mobile-menu-enter');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });

            document.addEventListener('click', (e) => {
                if (!menu.classList.contains('hidden') && !newBtn.contains(e.target) && !menu.contains(e.target)) {
                    menu.classList.add('hidden');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        }

        // --- 2. Footer Rendering ---
        renderFooter() {
            const container = document.getElementById('v5-footer');
            if (!container) return;

            const year = new Date().getFullYear();
            const { CONTACT, IMAGES } = this.config;
            const logoSrc = IMAGES.LOGO;
            const logoFallback = IMAGES.LOGO_LOCAL;

            container.innerHTML = `
                <footer class="bg-gray-900 text-white pt-16 pb-8 px-4 border-t border-gray-800 font-sans">
                    <div class="max-w-7xl mx-auto">
                        
                        <div class="grid md:grid-cols-4 gap-10 mb-12">
                            
                            <div class="space-y-4">
                                <div class="flex items-center gap-2">
                                    <img src="${logoSrc}" onerror="this.onerror=null; this.src='${logoFallback}';" class="h-8 w-auto bg-white p-0.5 rounded" alt="V5 Logo">
                                    <span class="text-lg font-bold tracking-tight">V5 Medical</span>
                                </div>
                                <p class="text-gray-400 text-xs leading-relaxed">
                                    Strategic Supply Chain Integrator.<br>Bridging Chinese Manufacturing with Global Compliance.
                                </p>
                                <div class="border-l-2 border-blue-600 pl-3 py-1">
                                    <p class="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Legal Manufacturer</p>
                                    <p class="text-xs text-white font-medium">Suzhou V5 Medical Technology Co., Ltd.</p>
                                    <p class="text-[10px] text-blue-400">ISO 13485:2016 Certified</p>
                                </div>
                            </div>

                            <div>
                                <h4 class="text-blue-400 font-bold uppercase tracking-wider text-xs mb-4">Manufacturing & Logistics</h4>
                                <ul class="space-y-3 text-sm text-gray-400">
                                    <li class="flex items-start gap-3">
                                        <i class="fas fa-industry mt-1 text-gray-600"></i>
                                        <span>
                                            <strong class="text-gray-300 block">Factory / Warehouse</strong>
                                            No. 168 Luying Rd, Kunshan,<br>Jiangsu, China 215300
                                        </span>
                                    </li>
                                    <li class="flex items-center gap-3">
                                        <i class="fas fa-ship text-gray-600"></i>
                                        <span>Port: Shanghai / Ningbo</span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 class="text-green-400 font-bold uppercase tracking-wider text-xs mb-4">Global Sales Support</h4>
                                <ul class="space-y-3 text-sm text-gray-400">
                                    <li class="flex items-start gap-3">
                                        <i class="fab fa-whatsapp mt-1 text-green-500"></i>
                                        <div class="flex flex-col gap-1">
                                            <a href="${CONTACT.WHATSAPP.API_URL}" class="hover:text-white transition decoration-dotted underline">${CONTACT.WHATSAPP.DISPLAY}</a>
                                        </div>
                                    </li>
                                    <li class="flex items-start gap-3">
                                        <i class="fas fa-envelope mt-1 text-blue-500"></i>
                                        <div class="flex flex-col">
                                            <a href="mailto:sales@v5med.net" class="hover:text-white transition">sales@v5med.net</a>
                                            <a href="mailto:v5med.net@gmail.com" class="text-xs text-gray-500 hover:text-gray-300 transition">v5med.net@gmail.com (Backup)</a>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 class="text-white font-bold uppercase tracking-wider text-xs mb-4">Resources</h4>
                                <ul class="space-y-2 text-sm text-gray-400 mb-6">
                                    <li><a href="links.html" class="footer-link block text-blue-400 font-bold"><i class="fas fa-link mr-1"></i> Quick Links &amp; Price Lists</a></li>
                                    <li><a href="catalog.html" class="footer-link block">Product Catalog</a></li>
                                    <li><a href="blog/" class="footer-link block">Compliance Knowledge Hub</a></li>
                                    <li><a href="payment.html" class="footer-link block text-green-400 font-bold"><i class="fas fa-credit-card mr-1"></i> Pay Invoice / Online</a></li>
                                    <li><a href="pdf/V5_Medical_Capability_Statement.pdf" target="_blank" class="footer-link block flex items-center gap-2"><i class="fas fa-file-pdf"></i> Capability Statement</a></li>
                                </ul>
                                
                                <div class="flex gap-3 flex-wrap">
                                    <a href="https://linkedin.com/company/v5med" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="w-8 h-8 rounded bg-gray-800 flex items-center justify-center hover:bg-blue-700 text-white transition"><i class="fab fa-linkedin-in"></i></a>
                                    <a href="https://www.facebook.com/v5med" target="_blank" rel="noopener noreferrer" aria-label="Facebook" class="w-8 h-8 rounded bg-gray-800 flex items-center justify-center hover:bg-blue-600 text-white transition"><i class="fab fa-facebook-f"></i></a>
                                    <a href="https://www.instagram.com/v5med" target="_blank" rel="noopener noreferrer" aria-label="Instagram" class="w-8 h-8 rounded bg-gray-800 flex items-center justify-center hover:bg-pink-600 text-white transition"><i class="fab fa-instagram"></i></a>
                                    <a href="https://x.com/v5med" target="_blank" rel="noopener noreferrer" aria-label="Twitter/X" class="w-8 h-8 rounded bg-gray-800 flex items-center justify-center hover:bg-black text-white transition"><i class="fab fa-twitter"></i></a>
                                </div>
                            </div>
                        </div>
                        
                        <div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
                            <div class="mb-4 md:mb-0 text-center md:text-left">
                                <p>&copy; ${year} V5 Medical. All rights reserved.</p>
                                <p class="mt-1">V5 Medical is a trading brand operated by Suzhou V5 Medical Technology Co., Ltd.</p>
                            </div>
                            <div class="flex gap-6">
                                <a href="contact.html" class="hover:text-gray-400">Contact Us</a>
                                <a href="privacy.html" class="hover:text-gray-400">Privacy Policy</a>
                            </div>
                        </div>
                    </div>
                </footer>
            `;
        }

        // --- 3. Floating Elements ---
        renderFloatingElements() {
            if (!document.getElementById('whatsapp-float')) {
                const div = document.createElement('div');
                div.innerHTML = `<a href="${this.config.CONTACT.WHATSAPP.API_URL}" target="_blank" rel="noopener noreferrer" data-source="float" class="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 group" aria-label="Chat on WhatsApp"><i class="fab fa-whatsapp text-2xl group-hover:scale-110 transition-transform"></i></a>`;
                document.body.appendChild(div.firstElementChild);
            }
            if (!document.getElementById('back-to-top')) {
                const topBtn = document.createElement('button');
                topBtn.id = 'back-to-top';
                topBtn.className = 'fixed bottom-24 right-6 bg-blue-900 hover:bg-blue-800 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-40 opacity-0 invisible translate-y-10 border border-blue-700';
                topBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
                topBtn.setAttribute('aria-label', 'Back to top');
                document.body.appendChild(topBtn);
            }
        }

        _detectPage() {
            const path = window.location.pathname;
            if (path.includes('catalog')) return 'catalog';
            if (path.includes('about')) return 'about';
            if (path.includes('contact')) return 'contact';
            if (path.includes('blog')) return 'blog';
            return 'home';
        }

        // --- 4. Page Highlighter ---
        highlightCurrentPage() {
            const links = document.querySelectorAll('.nav-link');
            links.forEach(link => {
                const id = link.getAttribute('data-id');
                if (id === this.currentPage) {
                    link.classList.remove('text-blue-100');
                    link.classList.add('text-white', 'font-bold', 'border-b-2', 'border-blue-300', 'pb-1');
                }
            });
        }
    }
    return new LayoutManager();
})();

// 关键：将 V5Layout 挂载到全局，供 index.html 检查
window.V5Layout = V5Layout;

// 延迟初始化，确保所有依赖已就绪
function initLayout() {
    if (window.V5Layout && typeof window.V5Layout.init === 'function') {
        try {
            window.V5Layout.init();
        } catch (e) {
            console.error('[Layout] Initialization failed:', e);
        }
    }
}

// 等待 DOM 和 config.js 都就绪
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // 给 config.js 额外一点时间设置全局变量
        setTimeout(initLayout, 10);
    });
} else {
    setTimeout(initLayout, 10);
}
