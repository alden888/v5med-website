/**
 * V5 Medical cookie consent + GA4 loader (Consent Mode v2).
 * @version 1.0.0 (2026-09-23)
 *
 * One implementation for every page type:
 *   - pages rendered by js/layout.js call V5Consent.init(gaId)
 *   - static pages (products/, categories/, blog posts, events, quote, 404, blog/)
 *     include in <head> (no defer): <script src="/js/consent.js?v=…" data-ga-id="G-…"></script>
 *
 * Rules:
 *   - Nothing is sent to Google until the visitor clicks "Accept".
 *   - Only analytics_storage is granted; advertising signals always stay denied
 *     (the banner only asks for analytics).
 *   - Any element with [data-v5-cookie-settings] re-opens the banner, so consent
 *     can be withdrawn as easily as it was given (GDPR Art. 7(3)).
 *   - Pages may set window.V5_GA_CONFIG = {...} before this script for extra
 *     gtag('config') parameters (e.g. page_path on the Docsify blog).
 */
(function () {
    'use strict';
    if (window.V5Consent) return;

    var STORAGE_KEY = 'v5_cookie_consent';
    var BANNER_ID = 'v5-cookie-banner';
    var gaId = null;
    var gtagLoaded = false;

    function readChoice() {
        try { return window.localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
    }

    function saveChoice(value) {
        try { window.localStorage.setItem(STORAGE_KEY, value); } catch (_) { /* private mode: ask again next visit */ }
    }

    function ensureGtagStub() {
        window.dataLayer = window.dataLayer || [];
        if (typeof window.gtag !== 'function') {
            window.gtag = function () { window.dataLayer.push(arguments); };
        }
    }

    function setDefaultConsent() {
        window.gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            functionality_storage: 'granted',
            personalization_storage: 'denied',
            security_storage: 'granted',
            wait_for_update: 500
        });
    }

    function loadGtag() {
        if (gtagLoaded || !gaId) return;
        gtagLoaded = true;
        window.gtag('consent', 'update', { analytics_storage: 'granted' });
        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
        document.head.appendChild(script);
        window.gtag('js', new Date());
        window.gtag('config', gaId, window.V5_GA_CONFIG || {});
    }

    function deleteAnalyticsCookies() {
        var host = window.location.hostname;
        var domains = ['', host, '.' + host.replace(/^www\./, '')];
        document.cookie.split(';').forEach(function (cookie) {
            var name = cookie.split('=')[0].trim();
            if (name.indexOf('_ga') !== 0) return;
            domains.forEach(function (domain) {
                document.cookie = name + '=; Max-Age=0; path=/' + (domain ? '; domain=' + domain : '');
            });
        });
    }

    function removeBanner() {
        var banner = document.getElementById(BANNER_ID);
        if (banner) banner.remove();
    }

    function accept() {
        saveChoice('accepted');
        removeBanner();
        loadGtag();
    }

    function decline() {
        var wasAccepted = readChoice() === 'accepted' || gtagLoaded;
        saveChoice('declined');
        removeBanner();
        window.gtag('consent', 'update', { analytics_storage: 'denied' });
        deleteAnalyticsCookies();
        // A loaded gtag.js cannot be fully unloaded; reload once so no further hits are sent.
        if (wasAccepted && gtagLoaded) window.location.reload();
    }

    function button(label, primary, onClick) {
        var el = document.createElement('button');
        el.type = 'button';
        el.textContent = label;
        el.style.cssText = primary
            ? 'background:#3b82f6;color:#fff;border:1px solid #3b82f6;border-radius:6px;padding:7px 16px;cursor:pointer;font-size:13px;font-weight:600'
            : 'background:transparent;color:#cbd5e1;border:1px solid #475569;border-radius:6px;padding:7px 16px;cursor:pointer;font-size:13px';
        el.addEventListener('click', onClick);
        return el;
    }

    function showBanner() {
        if (!document.body || document.getElementById(BANNER_ID)) return;
        var banner = document.createElement('div');
        banner.id = BANNER_ID;
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-live', 'polite');
        banner.setAttribute('aria-label', 'Cookie consent');
        banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#0f172a;color:#e2e8f0;padding:14px 20px;font-family:system-ui,-apple-system,sans-serif;font-size:13px;line-height:1.5;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;box-shadow:0 -2px 12px rgba(0,0,0,.35);border-top:2px solid #3b82f6';

        var text = document.createElement('span');
        text.style.cssText = 'flex:1;min-width:250px;padding-right:8px';
        text.appendChild(document.createTextNode('With your permission we use Google Analytics cookies to understand how visitors use this site. No advertising cookies are used, and declining does not affect the site. '));
        var link = document.createElement('a');
        link.href = '/privacy.html';
        link.textContent = 'Privacy Policy';
        link.style.cssText = 'color:#60a5fa;text-decoration:underline';
        text.appendChild(link);

        var actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:8px;flex-shrink:0';
        actions.appendChild(button('Decline', false, decline));
        actions.appendChild(button('Accept', true, accept));

        banner.appendChild(text);
        banner.appendChild(actions);
        document.body.appendChild(banner);
    }

    function openSettings() {
        removeBanner();
        showBanner();
    }

    function init(id) {
        if (gaId) return; // idempotent
        gaId = id || 'G-HVN50TM5EK';
        ensureGtagStub();
        setDefaultConsent();
        var choice = readChoice();
        if (choice === 'accepted') loadGtag();
        else if (choice !== 'declined') whenReady(showBanner);
    }

    function whenReady(fn) {
        if (document.body) fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    // "Cookie settings" links anywhere on the page (footer, privacy policy).
    document.addEventListener('click', function (event) {
        var trigger = event.target.closest && event.target.closest('[data-v5-cookie-settings]');
        if (!trigger) return;
        event.preventDefault();
        openSettings();
    });

    window.V5Consent = {
        init: init,
        open: openSettings,
        status: function () { return readChoice() || 'unset'; }
    };

    // Static pages: auto-initialise from the script tag's data-ga-id.
    var current = document.currentScript;
    var autoId = current && current.getAttribute('data-ga-id');
    // Initialising immediately (not on DOMContentLoaded) defines gtag() and the
    // denied defaults before any inline page script can call gtag().
    if (autoId) init(autoId);
}());
