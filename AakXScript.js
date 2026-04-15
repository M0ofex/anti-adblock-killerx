// ==UserScript==
// @name         Anti-Adblock & Paywall Elite X
// @version      4.0.0
// @description  bypass Adblock detectors and soft paywalls.
// @author       Mofex_
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 1. ENVIRONMENT SPOOFING (Tricks the Server)
    // Make the site think we came from a "Safe" referral source
    Object.defineProperty(document, 'referrer', { get: () => "https://t.co/" });

    // Bait variables to fool detection scripts
    window.canRunAds = true;
    window.isAdblockerActive = false;
    window.adsAllowed = true;

    const eliteDB = {
        selectors: [
            '.adblock-notice', '.paywall', '#paywall-banner', '.css-blur-layer',
            '[class*="Paywall"]', '[id*="paywall"]', '.ad-modal', '.tp-modal',
            '.fc-ab-root', '.sp-messaging-glass' // Common 2026 frameworks
        ],
        keywords: ['adblock', 'whitelist', 'supporting ads', 'subscribe to read']
    };

    const tech = {
        // Remove paywall restrictions and restore scrolling
        restoreUI: () => {
            const body = document.body;
            const html = document.documentElement;
            
            // Force scrollability
            const restoreStyles = 'overflow: auto !important; position: static !important; filter: none !important;';
            if (body) body.style.cssText += restoreStyles;
            if (html) html.style.cssText += restoreStyles;

            // Remove common "lock" classes
            if (body) {
                body.classList.remove('no-scroll', 'paywall-active', 'modal-open', 'p-blocked');
            }
        },

        // Deep-clean elements based on complex logic
        isEvil: (el) => {
            if (!el || el.nodeType !== 1) return false;
            const style = window.getComputedStyle(el);
            const text = (el.innerText || '').toLowerCase();
            
            const isHighZ = parseInt(style.zIndex) > 1000;
            const isFixed = style.position === 'fixed';
            const matchesKey = eliteDB.keywords.some(k => text.includes(k));
            
            // If it's a fixed high-layer element with ad-talk, it's GONE.
            return (isHighZ && isFixed && matchesKey);
        },

        kill: (el) => {
            if (!el) return;
            el.style.display = 'none';
            el.setAttribute('aria-hidden', 'true');
            setTimeout(() => el.remove(), 50);
        }
    };

    // 2. DOM OBSERVATION (The Active Guard)
    const observer = new MutationObserver(mutations => {
        tech.restoreUI();
        mutations.forEach(m => {
            m.addedNodes.forEach(node => {
                if (tech.isEvil(node)) tech.kill(node);
                
                // Check inside added nodes for specific selectors
                if (node.querySelectorAll) {
                    eliteDB.selectors.forEach(sel => {
                        node.querySelectorAll(sel).forEach(found => tech.kill(found));
                    });
                }
            });
        });
    });

    // 3. EXECUTION STEPS
    const init = () => {
        tech.restoreUI();
        // Initial Scan
        document.querySelectorAll(eliteDB.selectors.join(',')).forEach(el => tech.kill(el));
        
        // Start live monitoring
        observer.observe(document.documentElement, { 
            childList: true, 
            subtree: true, 
            attributes: true, 
            attributeFilter: ['class', 'style'] 
        });
    };

    // CSS NUKE: Immediate visual removal even before JS runs fully
    GM_addStyle(`
        ${eliteDB.selectors.join(', ')} { display: none !important; }
        html, body { overflow: auto !important; }
        [class*="blur"], [style*="filter: blur"] { filter: none !important; }
    `);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
