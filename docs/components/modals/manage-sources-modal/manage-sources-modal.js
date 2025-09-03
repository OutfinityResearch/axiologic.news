export class ManageSourcesModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.sources = [];
        this.defaultSources = [];
        this.hasChanges = false;
        this.invalidate();
    }

    async beforeRender() {
        // Load sources from centralized service
        this.sources = await window.SourcesManager.getAllSources();
    }

    afterRender() {
        this.renderSourcesTable();
        this.setupEventListeners();
    }

    renderSourcesTable() {
        const listContainer = this.element.querySelector('#sources-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        // Apply filters
        const filterText = (this.element.querySelector('#filter-text')?.value || '').trim().toLowerCase();
        const onlyVisible = !!this.element.querySelector('#only-visible')?.checked;

        const matches = (s) => {
            if (!filterText) return true;
            const tag = (s.tag || '').toLowerCase();
            const url = (s.url || '').toLowerCase();
            return tag.includes(filterText) || url.includes(filterText);
        };

        this.sources.forEach((source, index) => {
            if (onlyVisible && !source.visible) return;
            if (!matches(source)) return;
            const item = document.createElement('div');
            item.className = 'source-item';
            item.innerHTML = `
                <input type="checkbox" class="visibility-checkbox" 
                       data-index="${index}" 
                       ${source.visible ? 'checked' : ''}>
                <div class="source-info">
                    <div class="source-hashtag">${this.escapeHtml(source.tag || 'unnamed')}</div>
                    <div class="source-url">${this.escapeHtml(source.url || '')}</div>
                </div>
                <button class="delete-button" 
                        data-index="${index}" 
                        ${!source.removable ? 'disabled' : ''}>
                    Delete
                </button>
            `;
            listContainer.appendChild(item);
        });

        // Add event listeners for checkboxes only (no inline editing)
        listContainer.querySelectorAll('.visibility-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.sources[index].visible = e.target.checked;
                this.hasChanges = true;
            });
        });

        // Add event listeners for delete buttons
        listContainer.querySelectorAll('.delete-button').forEach(button => {
            if (!button.disabled) {
                button.addEventListener('click', async (e) => {
                    const index = parseInt(e.target.dataset.index);
                    const src = this.sources[index];
                    if (!src) return;
                    if (confirm(`Delete source "${src.tag}"?`)) {
                        try {
                            await window.SourcesManager.removeSource(src.id || src.url);
                            this.sources = await window.SourcesManager.getAllSources();
                            this.renderSourcesTable();
                        } catch (_) {
                            alert('Could not delete source.');
                        }
                    }
                });
            }
        });
    }

    setupEventListeners() {
        const closeButton = this.element.querySelector('.close-button');
        const cancelButton = this.element.querySelector('#cancel-button');
        const saveButton = this.element.querySelector('#save-button');
        const addButton = this.element.querySelector('#add-source-button');
        const addToolbarButton = this.element.querySelector('#add-modal-source-button');
        const filterInput = this.element.querySelector('#filter-text');
        const onlyVisibleToggle = this.element.querySelector('#only-visible');
        const toggleAllButton = this.element.querySelector('#toggle-all-button');
        // Keep embedded add form hidden; use toolbar button to trigger add modal
        const addSection = this.element.querySelector('.add-source-section');
        if (addSection) addSection.style.display = 'none';

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.close(false);
            });
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                this.close(false);
            });
        }

        if (saveButton) {
            saveButton.addEventListener('click', async () => {
                await this.saveChanges();
                this.close(true);
            });
        }

        // Wire toolbar Add Source (uses existing add-external-source-modal)
        const bindAddHandler = (btn) => {
            if (!btn) return;
            btn.addEventListener('click', async () => {
                try {
                    const res = await window.webSkel.showModal('add-external-source-modal', {}, true);
                    const data = res && (res.data || res.detail || res);
                    if (!data) return;
                    const { url, tag } = data;
                    if (!url) return;
                    // Validate URL returns JSON array before adding
                    const statusEl = this.element.querySelector('#list-status');
                    if (statusEl) { statusEl.textContent = 'Testing URL…'; }
                    const okFetch = await this.testPostsUrl(url);
                    if (!okFetch) {
                        if (statusEl) { statusEl.textContent = 'Invalid posts.json (not reachable or not an array)'; }
                        return;
                    }
                    const ok = await window.SourcesManager.addSource({ type: 'external', url, tag, visible: true, removable: true });
                    if (ok) {
                        this.sources = await window.SourcesManager.getAllSources();
                        this.renderSourcesTable();
                        this.hasChanges = true;
                        if (statusEl) { statusEl.textContent = 'Added ✓'; setTimeout(() => { statusEl.textContent = ''; }, 2000); }
                    }
                } catch (e) { console.error('Add source failed', e); }
            });
        };
        bindAddHandler(addToolbarButton);
        // Legacy embedded add button (kept disabled visually)
        if (addButton) addButton.style.display = 'none';
        // Auto-fill tag on URL blur if tag empty
        const urlInput = this.element.querySelector('#new-source-url');
        const tagInput = this.element.querySelector('#new-source-tag');
        if (urlInput && tagInput) {
            urlInput.addEventListener('blur', () => {
                if (!tagInput.value.trim() && urlInput.value.trim()) {
                    const auto = this.deriveTag(urlInput.value.trim());
                    tagInput.value = this.normalizeTag(auto || 'external');
                }
            });
        }
        if (filterInput) {
            filterInput.addEventListener('input', () => this.renderSourcesTable());
        }
        if (onlyVisibleToggle) {
            onlyVisibleToggle.addEventListener('change', () => this.renderSourcesTable());
        }
        
        if (toggleAllButton) {
            const applyToggleAllLabel = () => {
                const boxes = Array.from(this.element.querySelectorAll('.visibility-checkbox'));
                const allChecked = boxes.length > 0 && boxes.every(cb => cb.checked);
                toggleAllButton.textContent = allChecked ? 'Deselect All' : 'Select All';
            };
            // Initial label
            applyToggleAllLabel();
            // Update label on any checkbox change
            this.element.addEventListener('change', (e) => {
                if (e.target && e.target.classList && e.target.classList.contains('visibility-checkbox')) {
                    applyToggleAllLabel();
                }
            });
            toggleAllButton.addEventListener('click', () => {
                const checkboxes = this.element.querySelectorAll('.visibility-checkbox');
                const allChecked = Array.from(checkboxes).length > 0 && Array.from(checkboxes).every(cb => cb.checked);
                const next = !allChecked;
                checkboxes.forEach(cb => {
                    cb.checked = next;
                    const index = parseInt(cb.dataset.index);
                    if (this.sources[index]) {
                        this.sources[index].visible = next;
                    }
                });
                this.hasChanges = true;
                applyToggleAllLabel();
            });
        }
    }

    async testPostsUrl(url) {
        try {
            const ac = new AbortController();
            const t = setTimeout(() => ac.abort(), 8000);
            const resp = await fetch(url, { cache: 'no-store', signal: ac.signal });
            clearTimeout(t);
            if (!resp.ok) return false;
            const data = await resp.json();
            return Array.isArray(data);
        } catch (_) { return false; }
    }

    async addNewSource() {
        const tagInput = this.element.querySelector('#new-source-tag');
        const urlInput = this.element.querySelector('#new-source-url');

        let tag = this.normalizeTag(tagInput.value);
        const url = urlInput.value.trim();

        if (!url) {
            alert('Please provide a URL for the source');
            return;
        }

        // Auto-derive tag if empty
        if (!tag) {
            tag = this.deriveTag(url) || 'external';
        }

        // Check if URL already exists
        if (this.sources.find(s => s.url === url)) {
            alert('A source with this URL already exists');
            return;
        }

        // Validate URL format
        if (!this.isValidUrl(url)) {
            alert('Please enter a valid URL (absolute or relative path)');
            return;
        }

        // Add through service for consistency
        const newSource = {
            url: url,
            tag: tag,
            type: 'external',
            removable: true,
            visible: true
        };
        
        // Persist immediately via service and refresh list
        try {
            await window.SourcesManager.addSource(newSource);
            this.sources = await window.SourcesManager.getAllSources();
        } catch (_) {
            alert('Could not add source.');
            return;
        }

        // Clear inputs
        tagInput.value = '';
        urlInput.value = '';

        this.hasChanges = true;
        this.renderSourcesTable();
    }

    async saveChanges() {
        // Update visibility in sources
        this.sources.forEach(source => {
            // Ensure visibility is boolean
            source.visible = !!source.visible;
        });
        
        // Save through centralized service
        await window.SourcesManager.updateAllSources(this.sources);
    }

    close(saved) {
        const modal = this.element.closest("dialog");
        if (modal) {
            // Set data for the close event
            modal.savedData = {
                saved: saved,
                sources: saved ? this.sources : null
            };
            
            // Dispatch close event with data
            const event = new CustomEvent('close', {
                bubbles: true,
                detail: modal.savedData
            });
            event.data = modal.savedData;
            
            modal.dispatchEvent(event);
            modal.close();
            modal.remove();
        }
    }

    isValidUrl(url) {
        // Check if it's a relative path
        if (url.startsWith('/')) {
            return true;
        }
        
        // Check if it's an absolute URL
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    deriveTag(url) {
        try {
            if (url.startsWith('/')) {
                // Relative path
                const parts = url.split('/').filter(Boolean);
                const sourcesIndex = parts.indexOf('sources');
                if (sourcesIndex !== -1 && parts[sourcesIndex + 1]) {
                    return this.normalizeTag(parts[sourcesIndex + 1]);
                }
                return 'external';
            } else {
                // Absolute URL
                const u = new URL(url);
                const parts = u.pathname.split('/').filter(Boolean);
                const sourcesIndex = parts.indexOf('sources');
                if (sourcesIndex !== -1 && parts[sourcesIndex + 1]) {
                    return this.normalizeTag(parts[sourcesIndex + 1]);
                }
                const host = u.hostname.replace(/^www\./, '');
                return this.normalizeTag(host.split('.')[0]);
            }
        } catch {
            return 'external';
        }
    }


    normalizeTag(s) {
        return window.SourcesManager.normalizeTag(s);
    }

    escapeHtml(str) {
        return String(str || '').replace(/[&<>"]/g, c => ({ 
            '&': '&amp;', 
            '<': '&lt;', 
            '>': '&gt;', 
            '"': '&quot;' 
        }[c]));
    }
}
