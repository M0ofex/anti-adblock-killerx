// ==UserScript==
// @name         Anti-Adblock & Paywall Elite X
// @version      4.2.0
// @namespace    https://github.com/[YOUR_USER]/[YOUR_REPO]
// @description  Adblock detectors and soft paywalls.
// @author       Mofex_
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/[YOUR_USER]/[YOUR_REPO]/main/script.user.js
// @downloadURL  https://raw.githubusercontent.com/[YOUR_USER]/[YOUR_REPO]/main/script.user.js
// ==/UserScript==

(function() {
    'use strict';

    // 1. CLOAKING & BAIT
    Object.defineProperty(document, 'referrer', { get: () => "https://t.co/" });
    Object.assign(window, { canRunAds: true, isAdblockerActive: false, adsAllowed: true });

    const DB = {
        selectors: ['.adblock', '.paywall', '#paywall', '.modal-open', '.sp-messaging-glass', '.fc-ab-root', '.ad-modal', '.tp-modal'],
        keys: ['adblock', 'whitelist', 'supporting ads', 'subscribe to read', 'disable your ad']
    };

    const tech = {
        // Restore Scrolling and Remove Blurs
        fixUI: () => {
            const s = 'overflow:auto!important;position:static!important;filter:none!important;';
            [document.documentElement, document.body].forEach(el => el && (el.style.cssText += s));
            document.body?.classList.remove('no-scroll', 'paywall-active', 'modal-open', 'p-blocked');
        },

        // Heuristic detection: High Z-index + Fixed + Keywords
        isEvil: (el) => {
            if (!el || el.nodeType !== 1) return false;
            const style = window.getComputedStyle(el);
            const text = (el.innerText || '').toLowerCase();
            return (parseInt(style.zIndex) > 999 && style.position === 'fixed' && DB.keys.some(k => text.includes(k)));
        },

        // Immediate removal with an aria-hidden tag for stealth
        nuke: (el) => {
            if (!el) return;
            el.style.display = 'none';
            el.setAttribute('aria-hidden', 'true');
            requestAnimationFrame(() => el.remove());
        }
    };

    // 2. THE ENGINE
    const scan = (root) => {
        root.querySelectorAll?.(DB.selectors.join(',')).forEach(tech.nuke);
        if (tech.isEvil(root)) tech.nuke(root);
    };

    const observer = new MutationObserver(mutations => {
        tech.fixUI();
        mutations.forEach(m => m.addedNodes.forEach(node => {
            scan(node);
            if (node.querySelectorAll) node.querySelectorAll('*').forEach(scan);
        }));
    });

    // 3. STARTUP
    const init = () => {
        tech.fixUI();
        scan(document.body);
        observer.observe(document.documentElement, { 
            childList: true, 
            subtree: true, 
            attributes: true, 
            attributeFilter: ['class', 'style'] 
        });
    };

    // Global CSS Injection: Visual nuke before script even fires
    GM_addStyle(`
        ${DB.selectors.join(',')} { display:none!important; visibility:hidden!important; opacity:0!important; pointer-events:none!important; }
        [class*="blur"], [style*="filter: blur"] { filter: none !important; }
        body, html { overflow: auto !important; }
    `);

    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
