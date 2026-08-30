/**
 * SwissTransfer Direct Link Extractor
 * Automatically redirects upon upload completion and extracts direct download links.
 */
(function () {
    'use strict';

    // Automatically detect language (French or English fallback)
    const userLang = navigator.language.startsWith('fr') ? 'fr' : 'en';
    
    // Translations dictionary
    const i18n = {
        fr: {
            initLog: "🟢 [ST Helper] Auto-Redirect & Extractor activés !",
            uploadDoneLog: "🚀 [ST Helper] Upload terminé ! Redirection automatique...",
            defaultFileName: "Fichier",
            btnCopy: "Copier",
            btnCopied: "✔ Copié",
            btnDirect: "Direct",
            panelTitle: "⚡ Liens Extraits",
            panelCloseTitle: "Fermer le panneau"
        },
        en: {
            initLog: "🟢 [ST Helper] Auto-Redirect & Extractor activated!",
            uploadDoneLog: "🚀 [ST Helper] Upload complete! Redirecting automatically...",
            defaultFileName: "File",
            btnCopy: "Copy",
            btnCopied: "✔ Copied",
            btnDirect: "Direct",
            panelTitle: "⚡ Extracted Links",
            panelCloseTitle: "Close panel"
        }
    };
    
    const t = i18n[userLang];
    console.log(t.initLog);

    // ==========================================
    // 1. AUTO-REDIRECT AFTER UPLOAD
    // ==========================================
    function autoRedirectIfUploadComplete() {
        // Do not run if we are already on a download page
        if (window.location.pathname.startsWith('/d/')) return;

        const checkInterval = setInterval(() => {
            const linkInput = document.querySelector('input.card__linkInput');
            if (linkInput && linkInput.value && linkInput.value.includes('swisstransfer.com/d/')) {
                clearInterval(checkInterval);
                console.log(t.uploadDoneLog);
                window.location.href = linkInput.value;
            }
        }, 500);
    }
    autoRedirectIfUploadComplete();

    // ==========================================
    // 2. NETWORK INTERCEPTION FOR LINK EXTRACTION
    // ==========================================
    
    // Intercept XMLHttpRequest
    const originalXHR = XMLHttpRequest.prototype;
    const originalSend = originalXHR.send;
    const originalOpen = originalXHR.open;

    originalXHR.open = function (method, url) {
        this._interceptedUrl = url;
        return originalOpen.apply(this, arguments);
    };

    originalXHR.send = function () {
        this.addEventListener('load', function () {
            if (this._interceptedUrl && this._interceptedUrl.includes('/api/')) {
                try {
                    const responseData = JSON.parse(this.responseText);
                    extractLinksAndInjectGUI(responseData);
                } catch (err) {
                    // Ignore parsing errors for non-JSON responses
                }
            }
        });
        return originalSend.apply(this, arguments);
    };

    // Intercept Fetch API
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        const clone = response.clone();
        
        const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
        
        if (url.includes('/api/')) {
            clone.json()
                .then(data => extractLinksAndInjectGUI(data))
                .catch(() => { /* Ignore errors */ });
        }
        return response;
    };

    // Process intercepted data to find download links
    function extractLinksAndInjectGUI(payload) {
        const jsonStr = JSON.stringify(payload);
        
        // Find the download host (fallback if not found)
        let host = "dl-xxx.swisstransfer.com"; 
        const hostMatches = jsonStr.match(/(dl-[a-zA-Z0-9-]+\.swisstransfer\.com)/g);
        if (hostMatches) {
            host = hostMatches[0];
        }

        // Get the link UUID from the URL or the response payload
        let linkUUID = window.location.pathname.split('/').pop();
        const linkMatch = jsonStr.match(/"linkUUID":"([a-f0-9\-]{36})"/);
        if (linkMatch) {
            linkUUID = linkMatch[1];
        }

        // Recursively search for files in the response payload
        let extractedFiles = [];
        function searchForFiles(obj) {
            if (!obj || typeof obj !== 'object') return;
            if (Array.isArray(obj.files) && obj.files.length > 0) {
                extractedFiles = obj.files;
            }
            Object.values(obj).forEach(searchForFiles);
        }
        searchForFiles(payload);

        if (extractedFiles.length > 0) {
            injectFloatingGUI(host, linkUUID, extractedFiles);
        }
    }

    // ==========================================
    // 3. MODERN FLOATING GUI
    // ==========================================
    function injectFloatingGUI(host, linkUUID, files) {
        // Prevent injecting multiple times
        if (document.getElementById('st-modern-helper')) return;

        // Wait for body to be available
        if (!document.body) {
            setTimeout(() => injectFloatingGUI(host, linkUUID, files), 100);
            return;
        }

        const container = document.createElement('div');
        container.id = 'st-modern-helper';
        container.className = 'st-modern-panel';

        // Generate HTML for each file
        const filesHTML = files.map((file, index) => {
            const fileId = file.UUID || file.uuid || file.fileUUID || file.id || file.fileId;
            const fileLink = `https://${host}/api/download/${linkUUID}/${fileId}`;
            const safeName = file.fileName || file.name || `${t.defaultFileName} ${index + 1}`;
            
            return `
                <div class="st-modern-row">
                    <div class="st-modern-filename" title="${safeName}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                        <span>${safeName}</span>
                    </div>
                    <div class="st-modern-actions">
                        <input type="text" readonly value="${fileLink}" class="st-modern-input" />
                        <button class="st-modern-btn st-btn-copy" data-link="${fileLink}">${t.btnCopy}</button>
                        <a href="${fileLink}" class="st-modern-btn st-btn-download" download>${t.btnDirect}</a>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
          <div class="st-modern-header">
            <div class="st-modern-title">${t.panelTitle}</div>
            <button id="st-modern-close" class="st-modern-close" title="${t.panelCloseTitle}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="st-modern-body">${filesHTML}</div>
        `;

        document.body.appendChild(container);

        // Close panel logic
        document.getElementById('st-modern-close').addEventListener('click', () => {
            container.style.opacity = '0';
            container.style.transform = 'translateY(-20px)';
            container.style.transition = 'all 0.3s ease';
            setTimeout(() => container.remove(), 300);
        });

        // Copy link logic
        container.querySelectorAll('.st-btn-copy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const link = e.target.getAttribute('data-link');
                const input = e.target.previousElementSibling;
                
                navigator.clipboard.writeText(link).catch(() => {
                    // Fallback if clipboard API fails
                    input.select();
                    document.execCommand('copy');
                }).then(() => {
                    e.target.textContent = t.btnCopied;
                    e.target.classList.add('success');
                    setTimeout(() => {
                        e.target.textContent = t.btnCopy;
                        e.target.classList.remove('success');
                    }, 2000);
                });
            });
        });
    }
})();