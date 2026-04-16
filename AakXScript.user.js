// ==UserScript==
// @name         Anti-AdblockElite X
// @version      4.3.1.0
// @namespace    https://github.com/M0ofex/Anti-Adblock-KillerX
// @description  bypass for Adblock detectors and soft paywalls.
// @author       Mofex_
// @license      MIT
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/M0ofex/anti-adblock-killerx/main/AakXScript.user.js
// @downloadURL  https://raw.githubusercontent.com/M0ofex/anti-adblock-killerx/main/AakXScript.user.js
// ==/UserScript==

(function() {
    'use strict';

    // 1. CONFIGURATION & STATE
    const config = {
        enabled: GM_getValue('aak_enabled', true),
        spoof: GM_getValue('aak_spoof', true)
    };

    if (!config.enabled) return;

    // 2. CLOAKING & BAIT
    if (config.spoof) {
        Object.defineProperty(document, 'referrer', { get: () => "https://t.co/" });
    }
    Object.assign(window, { canRunAds: true, isAdblockerActive: false, adsAllowed: true });

    const DB = {
        selectors: [
            '.adblock', '.paywall', '#paywall', '.modal-open', 
            '.fc-ab-root', '.tp-modal',
            '.ignielAdBlock', '.adblock-outer', '.adblock-inner' // إضافات جديدة لهذا المانع
        ],
        keys: ['adblock', 'whitelist', 'supporting ads', 'subscribe to read', 'disable your ad', 'حظر الإعلانات'] // أضفنا الكلمة بالعربية
    };

    const tech = {
        fixUI: () => {
            const s = 'overflow:auto!important;position:static!important;filter:none!important;';
            [document.documentElement, document.body].forEach(el => el && (el.style.cssText += s));
            document.body?.classList.remove('no-scroll', 'paywall-active', 'modal-open', 'p-blocked');
        },
        isEvil: (el) => {
            if (!el || el.nodeType !== 1) return false;
            const style = window.getComputedStyle(el);
            const text = (el.innerText || '').toLowerCase();
            return (parseInt(style.zIndex) > 999 && style.position === 'fixed' && DB.keys.some(k => text.includes(k)));
        },
        nuke: (el) => {
            if (!el) return;
            el.style.display = 'none';
            el.setAttribute('aria-hidden', 'true');
            requestAnimationFrame(() => el.remove());
        }
    };

    // 3. SETTINGS DASHBOARD INJECTION
    const injectDashboard = () => {
        const dash = document.createElement('div');
        dash.innerHTML = `
            <div id="aak-dash" style="display:none; position:fixed; top:50px; right:50px; width:300px; background:#1e293b; color:white; border:1px solid #4361ee; border-radius:12px; z-index:999999; padding:20px; font-family:sans-serif; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
                <h3 style="color:#4cc9f0; margin-bottom:15px;">Elite X Settings</h3>
                <label style="display:block; margin-bottom:10px;"><input type="checkbox" id="c-en" ${config.enabled?'checked':''}> Enable Protection</label>
                <label style="display:block; margin-bottom:15px;"><input type="checkbox" id="c-sp" ${config.spoof?'checked':''}> Referrer Spoof</label>
                <button id="s-sav" style="width:100%; background:#4361ee; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">Save & Reload</button>
            </div>
            <button id="s-tog" style="position:fixed; bottom:20px; right:20px; z-index:999999; background:#4361ee; color:white; border:none; border-radius:50%; width:40px; height:40px; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.3);">⚙️</button>
        `;
        document.body.appendChild(dash);

        document.getElementById('s-tog').onclick = () => {
            const d = document.getElementById('aak-dash');
            d.style.display = d.style.display === 'none' ? 'block' : 'none';
        };
        document.getElementById('s-sav').onclick = () => {
            GM_setValue('aak_enabled', document.getElementById('c-en').checked);
            GM_setValue('aak_spoof', document.getElementById('c-sp').checked);
            location.reload();
        };
    };

    // 2. THE IMPROVED ENGINE
    const scan = (root) => {
        // A. Static Selectors
        root.querySelectorAll?.(DB.selectors.join(',')).forEach(tech.nuke);

        // B. Text Heuristics (Targeting Arabic & English Keywords)
        // يبحث عن الكلمات داخل أي عنصر حتى لو الكلاس مجهول
        const allElements = root.querySelectorAll?.('*') || [];
        allElements.forEach(el => {
            if (el.children.length === 0) { // استهداف العناصر التي تحتوي نص فقط لسرعة الأداء
                const text = el.innerText || '';
                if (text.includes('حظر الإعلانات') || text.includes('تعطيل برنامج')) {
                    // نصعد للأعلى لإيجاد الحاوية الرئيسية (Container) وحذفها
                    let container = el.closest('div[class*="adblock"], div[class*="AdBlock"], [id*="adblock"]');
                    if (container) tech.nuke(container);
                    else tech.nuke(el.parentElement); // حذف الأب كخطة بديلة
                }
            }
        });

        if (tech.isEvil(root)) tech.nuke(root);
    };

    const observer = new MutationObserver(mutations => {
        tech.fixUI();
        mutations.forEach(m => m.addedNodes.forEach(node => {
            scan(node);
            if (node.querySelectorAll) node.querySelectorAll('*').forEach(scan);
        }));
    });

    const init = () => {
        tech.fixUI();
        scan(document.body);
        observer.observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['class','style'] });
        injectDashboard();
    };

    GM_addStyle(`

        [class*="igniel"], [class*="AdBlock"], [id*="AdBlock"] { 
            display:none!important; 
            visibility:hidden!important; 
            pointer-events:none!important; 
            opacity:0!important; 
        }
        
        html, body { 
            overflow: auto !important; 
            height: auto !important; 
            position: relative !important;
            pointer-events: auto !important;
            user-select: auto !important;
            [class*="overlay"], [class*="mask"], [class*="backdrop"] {
            pointer-events: none !important;
            display: none !important;
        }
    `);

    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
