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
        if (window.location.pathname.startsWith('/d/') || window.location.pathname.startsWith('/dl/')) return;

        const checkInterval = setInterval(() => {
            // Check for the new layout (p containing the link)
            const pElements = document.querySelectorAll('p');
            for (const p of pElements) {
                const text = p.textContent.trim();
                if (text.includes('swisstransfer.com/dl/') || text.includes('swisstransfer.com/d/')) {
                    clearInterval(checkInterval);
                    console.log(t.uploadDoneLog);
                    window.location.href = text;
                    return;
                }
            }

            // Check for the old layout (input)
            const linkInput = document.querySelector('input.card__linkInput');
            if (linkInput && linkInput.value && (linkInput.value.includes('swisstransfer.com/d/') || linkInput.value.includes('swisstransfer.com/dl/'))) {
                clearInterval(checkInterval);
                console.log(t.uploadDoneLog);
                window.location.href = linkInput.value;
                return;
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
            } else if (Array.isArray(obj) && obj.length > 0 && obj[0].fileName) {
                 // In case files array is returned directly
                 extractedFiles = obj;
            }
            Object.values(obj).forEach(searchForFiles);
        }
        searchForFiles(payload);

        if (extractedFiles.length > 0) {
            injectFloatingGUI(linkUUID, extractedFiles);
        }
    }

    // ==========================================
    // 3. MODERN FLOATING GUI
    // ==========================================
    function injectFloatingGUI(linkUUID, files) {
        // Prevent injecting multiple times
        if (document.getElementById('st-modern-helper')) return;

        // Wait for body to be available
        if (!document.body) {
            setTimeout(() => injectFloatingGUI(linkUUID, files), 100);
            return;
        }

        const container = document.createElement('div');
        container.id = 'st-modern-helper';
        container.className = 'st-modern-panel';

        // Generate HTML for each file
        const filesHTML = files.map((file, index) => {
            const fileId = file.UUID || file.uuid || file.fileUUID || file.id || file.fileId;
            const apiLink = `https://www.swisstransfer.com/api/1/links/${linkUUID}/files/${fileId}`;
            const safeName = file.fileName || file.name || file.originalName || file.path || `${t.defaultFileName} ${index + 1}`;
            
            return `
                <div class="st-modern-row">
                    <div class="st-modern-filename" title="${safeName}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                        <span>${safeName}</span>
                    </div>
                    <div class="st-modern-actions">
                        <input type="text" readonly value="${apiLink}" class="st-modern-input st-api-link" data-api="${apiLink}" />
                        <button class="st-modern-btn st-btn-copy" data-api="${apiLink}">${t.btnCopy}</button>
                        <button class="st-modern-btn st-btn-download" data-api="${apiLink}">${t.btnDirect}</button>
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
            btn.addEventListener('click', async (e) => {
                const apiLink = e.target.getAttribute('data-api');
                const input = e.target.previousElementSibling;
                const originalText = e.target.textContent;
                e.target.textContent = '...';
                
                try {
                    const res = await fetch(apiLink);
                    const json = await res.json();
                    if (json && json.data && json.data.url) {
                        const directUrl = json.data.url;
                        input.value = directUrl; // Update input visually
                        
                        await navigator.clipboard.writeText(directUrl).catch(() => {
                            // Fallback if clipboard API fails
                            input.select();
                            document.execCommand('copy');
                        });
                        
                        e.target.textContent = t.btnCopied;
                        e.target.classList.add('success');
                        setTimeout(() => {
                            e.target.textContent = t.btnCopy;
                            e.target.classList.remove('success');
                        }, 2000);
                        return;
                    }
                } catch (err) {
                    console.error('Error fetching direct link', err);
                }
                
                // Fallback / Error state
                e.target.textContent = 'Error';
                setTimeout(() => e.target.textContent = originalText, 2000);
            });
        });

        // Download logic
        container.querySelectorAll('.st-btn-download').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const apiLink = e.target.getAttribute('data-api');
                const originalText = e.target.textContent;
                e.target.textContent = '...';
                
                try {
                    const res = await fetch(apiLink);
                    const json = await res.json();
                    if (json && json.data && json.data.url) {
                        const a = document.createElement('a');
                        a.href = json.data.url;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    } else {
                        throw new Error("No URL in response");
                    }
                } catch (err) {
                    console.error('Error fetching download link', err);
                    e.target.textContent = 'Error';
                }
                
                setTimeout(() => e.target.textContent = originalText, 2000);
            });
        });
    }

    // ==========================================
    // 4. SSR DATA EXTRACTION (New layout)
    // ==========================================
    function extractFromSSR() {
        const scriptTag = document.querySelector('script[data-page="app"][type="application/json"]');
        if (scriptTag) {
            try {
                const payload = JSON.parse(scriptTag.textContent);
                extractLinksAndInjectGUI(payload);
            } catch (err) {
                console.error("Failed to parse SSR payload", err);
            }
        }
    }
    
    // Run SSR extraction immediately and wait for DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', extractFromSSR);
    } else {
        extractFromSSR();
    }
})();