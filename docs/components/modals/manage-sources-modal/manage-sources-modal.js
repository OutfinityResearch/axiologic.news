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
        const tbody = this.element.querySelector('#sources-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.sources.forEach((source, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="visibility-checkbox" 
                           data-index="${index}" 
                           ${source.visible ? 'checked' : ''}>
                </td>
                <td>
                    <input type="text" class="source-tag-input" 
                           data-index="${index}" 
                           value="${this.escapeHtml(source.tag || '')}" 
                           placeholder="tag">
                </td>
                <td>
                    <input type="text" class="source-url-input" 
                           data-index="${index}" 
                           value="${this.escapeHtml(source.url || '')}" 
                           ${!source.removable ? 'readonly' : ''}>
                </td>
                <td>
                    <button class="delete-button" 
                            data-index="${index}" 
                            ${!source.removable ? 'disabled' : ''}>
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add event listeners for inputs
        tbody.querySelectorAll('.visibility-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.sources[index].visible = e.target.checked;
                this.hasChanges = true;
            });
        });

        tbody.querySelectorAll('.source-tag-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.sources[index].tag = this.normalizeTag(e.target.value);
                this.hasChanges = true;
            });
        });

        tbody.querySelectorAll('.source-url-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.sources[index].url = e.target.value.trim();
                this.hasChanges = true;
            });
        });

        tbody.querySelectorAll('.delete-button').forEach(button => {
            if (!button.disabled) {
                button.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    this.sources.splice(index, 1);
                    this.hasChanges = true;
                    this.renderSourcesTable();
                });
            }
        });
    }

    setupEventListeners() {
        const closeButton = this.element.querySelector('.close-button');
        const cancelButton = this.element.querySelector('#cancel-button');
        const saveButton = this.element.querySelector('#save-button');
        const addButton = this.element.querySelector('#add-source-button');

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

        if (addButton) {
            addButton.addEventListener('click', () => {
                this.addNewSource();
            });
        }
    }

    addNewSource() {
        const tagInput = this.element.querySelector('#new-source-tag');
        const urlInput = this.element.querySelector('#new-source-url');

        const tag = this.normalizeTag(tagInput.value);
        const url = urlInput.value.trim();

        if (!tag || !url) {
            alert('Please provide both a hashtag and URL for the source');
            return;
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
        
        // Add to local array for immediate display
        newSource.id = `external-${Date.now()}-${Math.random()}`;
        this.sources.push(newSource);

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