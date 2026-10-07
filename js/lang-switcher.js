/**
 * V5 Medical language switcher
 *
 * Own dropdown UI on top of Google Translate. Google's widget is mounted
 * off-screen and only used as the translation engine; its pop-up menu is
 * never opened, so changes to Google's internal menu markup cannot break
 * the switcher.
 */
(function () {
    if (window.V5LangSwitcher) return;
    window.V5LangSwitcher = true;

    var PAGE_LANG = 'en';
    var LANGS = [
        ['en', 'English'], ['ar', 'العربية'], ['es', 'Español'], ['fr', 'Français'],
        ['ru', 'Русский'], ['de', 'Deutsch'], ['pt', 'Português'], ['it', 'Italiano'],
        ['nl', 'Nederlands'], ['tr', 'Türkçe'], ['pl', 'Polski'], ['sv', 'Svenska'],
        ['id', 'Bahasa Indonesia'], ['tl', 'Filipino'], ['vi', 'Tiếng Việt'], ['th', 'ไทย'],
        ['hi', 'हिन्दी'], ['ja', '日本語'], ['ko', '한국어'], ['zh-CN', '简体中文'], ['zh-TW', '繁體中文']
    ];
    var HOST_ID = 'v5-gt-host';

    function currentLang() {
        var m = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]*\/([^;]+)/);
        return m ? decodeURIComponent(m[1]) : PAGE_LANG;
    }

    function clearCookie() {
        var expired = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        var parts = location.hostname.split('.');
        document.cookie = expired;
        document.cookie = expired + '; domain=' + location.hostname;
        if (parts.length > 1) document.cookie = expired + '; domain=.' + parts.slice(-2).join('.');
    }

    function setLang(lang) {
        if (lang === currentLang()) return;
        if (lang === PAGE_LANG) {
            clearCookie();
            location.reload();
            return;
        }
        var combo = document.querySelector('#' + HOST_ID + ' select.goog-te-combo');
        var hasOption = combo && Array.prototype.some.call(combo.options, function (o) { return o.value === lang; });
        if (hasOption) {
            combo.value = lang;
            combo.dispatchEvent(new Event('change'));
            updateLabel(lang);
        } else {
            // Engine not ready (slow network or blocked): set the cookie Google reads on load.
            document.cookie = 'googtrans=/' + PAGE_LANG + '/' + lang + '; path=/';
            location.reload();
        }
    }

    function updateLabel(lang) {
        var label = document.getElementById('v5-lang-label');
        if (label) label.textContent = lang.toUpperCase();
        Array.prototype.forEach.call(document.querySelectorAll('#v5-lang-menu button'), function (b) {
            b.setAttribute('aria-current', b.dataset.lang === lang ? 'true' : 'false');
        });
    }

    function injectStyle() {
        var style = document.createElement('style');
        style.textContent = [
            '#v5-lang{position:fixed;top:22px;right:20px;z-index:70;font-family:inherit}',
            '#v5-lang-btn{display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;cursor:pointer;',
            'background:rgba(15,23,42,.55);border:1px solid rgba(255,255,255,.35);color:#fff;font-size:12px;font-weight:700;line-height:1;backdrop-filter:blur(6px)}',
            '#v5-lang-btn:hover{background:rgba(15,23,42,.75)}',
            '#v5-lang-btn:focus-visible{outline:2px solid #93c5fd;outline-offset:2px}',
            '#v5-lang-menu{position:absolute;top:calc(100% + 8px);right:0;width:190px;max-height:min(70vh,420px);overflow-y:auto;',
            'background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 12px 32px rgba(15,23,42,.18);padding:6px;display:none}',
            '#v5-lang.open #v5-lang-menu{display:block}',
            '#v5-lang-menu button{display:block;width:100%;text-align:left;padding:8px 10px;border:0;background:none;border-radius:8px;',
            'font-size:13px;color:#1f2937;cursor:pointer}',
            '#v5-lang-menu button:hover,#v5-lang-menu button:focus-visible{background:#eff6ff;outline:none}',
            '#v5-lang-menu button[aria-current="true"]{background:#dbeafe;color:#1e40af;font-weight:700}',
            '@media (max-width:768px){#v5-lang{top:18px;right:60px}#v5-lang-btn{padding:6px 9px;font-size:11px}}',
            /* Google engine stays mounted but invisible; its banner and tooltips are suppressed. */
            '#' + HOST_ID + '{position:absolute!important;left:-9999px!important;top:0!important;width:1px;height:1px;overflow:hidden}',
            'iframe.skiptranslate,.goog-te-banner-frame,#goog-gt-tt,.goog-te-balloon-frame{display:none!important}',
            'body{top:0!important}',
            '.goog-text-highlight{background:none!important;box-shadow:none!important}'
        ].join('');
        document.head.appendChild(style);
    }

    function buildUi() {
        // Retire any legacy mount point so the old Google pill is not rendered.
        Array.prototype.forEach.call(document.querySelectorAll('#google_translate_element'), function (el) { el.remove(); });

        var host = document.createElement('div');
        host.id = HOST_ID;
        host.setAttribute('aria-hidden', 'true');
        document.body.appendChild(host);

        var wrap = document.createElement('div');
        wrap.id = 'v5-lang';
        wrap.className = 'notranslate';
        wrap.setAttribute('translate', 'no');
        wrap.innerHTML =
            '<button type="button" id="v5-lang-btn" aria-haspopup="true" aria-expanded="false" aria-controls="v5-lang-menu" aria-label="Select language">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
            '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>' +
            '<span id="v5-lang-label"></span></button>' +
            '<div id="v5-lang-menu" role="menu"></div>';
        document.body.appendChild(wrap);

        var menu = wrap.querySelector('#v5-lang-menu');
        LANGS.forEach(function (pair) {
            var b = document.createElement('button');
            b.type = 'button';
            b.setAttribute('role', 'menuitem');
            b.dataset.lang = pair[0];
            b.lang = pair[0];
            b.textContent = pair[1];
            menu.appendChild(b);
        });

        var btn = wrap.querySelector('#v5-lang-btn');
        function toggle(open) {
            wrap.classList.toggle('open', open);
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            toggle(!wrap.classList.contains('open'));
        });
        menu.addEventListener('click', function (e) {
            var target = e.target.closest('button[data-lang]');
            if (!target) return;
            toggle(false);
            setLang(target.dataset.lang);
        });
        document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) toggle(false); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { toggle(false); } });

        updateLabel(currentLang());
    }

    function loadEngine() {
        window.googleTranslateElementInit = function () {
            new google.translate.TranslateElement({
                pageLanguage: PAGE_LANG,
                includedLanguages: LANGS.map(function (p) { return p[0]; }).join(','),
                autoDisplay: false
            }, HOST_ID);
        };
        if (document.querySelector('script[src*="translate_a/element.js"]')) return;
        var script = document.createElement('script');
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        script.onerror = function () { console.warn('[Lang] Google Translate failed to load.'); };
        document.body.appendChild(script);
    }

    function init() {
        injectStyle();
        buildUi();
        loadEngine();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
