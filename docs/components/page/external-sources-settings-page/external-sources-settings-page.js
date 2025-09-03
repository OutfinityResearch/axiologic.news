export class ExternalSourcesSettingsPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.sources = [];
        this.invalidate();
    }

    async beforeRender() {
        // Load sources (categories + externals) from SourcesManager
        this.sources = await window.SourcesManager.getAllSources();
    }

    afterRender() {
        this.renderList();
        this.setupEventListeners();
    }

    renderList() {
        const list = this.element.querySelector('#url-list');
        if (!list) return;

        list.innerHTML = '';

        if (!Array.isArray(this.sources) || this.sources.length === 0) {
            list.innerHTML = '<div class="empty-state">No sources found</div>';
            return;
        }

        this.sources.forEach((src, index) => {
            const item = document.createElement('div');
            item.className = 'url-item';
            const isExternal = src.type === 'external';
            const label = isExternal ? `${this.escapeHtml(src.tag || 'external')} — ${this.escapeHtml(src.url)}` : this.escapeHtml(src.id);
            item.innerHTML = `
                <label>
                  <input type=\"checkbox\" class=\"visible-toggle\" data-index=\"${index}\" ${src.visible ? 'checked' : ''}>
                  <span class=\"url-text\">${label}</span>
                </label>
                ${isExternal ? '<button class="remove-button" data-index="'+index+'">Remove</button>' : ''}
            `;
            list.appendChild(item);
        });

        // Bind toggles
        list.querySelectorAll('.visible-toggle').forEach(cb => {
            cb.addEventListener('change', async (e) => {
                const idx = parseInt(e.target.dataset.index);
                const src = this.sources[idx];
                if (!src) return;
                src.visible = !!e.target.checked;
                await window.SourcesManager.updateAllSources(this.sources);
            });
        });

        // Bind remove for external
        list.querySelectorAll('.remove-button').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idx = parseInt(e.target.dataset.index);
                const src = this.sources[idx];
                if (src && src.type === 'external') {
                    await window.SourcesManager.removeSource(src.id || src.url);
                    this.sources = await window.SourcesManager.getAllSources();
                    this.renderList();
                }
            });
        });

        // Update toggle-all button label
        const allVisible = this.sources.length > 0 && this.sources.every(s => s.visible);
        const toggleBtn = this.element.querySelector('#toggle-all-button');
        if (toggleBtn) toggleBtn.textContent = allVisible ? 'Deselect All' : 'Select All';
    }

    setupEventListeners() {
        const backButton = this.element.querySelector('#back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                window.webSkel.changeToDynamicPage('news-feed-page', 'app');
            });
        }

        const addBtn = this.element.querySelector('#add-url-button');
        if (addBtn) {
            addBtn.addEventListener('click', async () => {
                try {
                    const res = await window.webSkel.showModal('add-external-source-modal', {}, true);
                    const data = res && (res.data || res.detail || res);
                    if (!data) return;
                    const { url, tag } = data;
                    if (!url) return;
                    const statusEl = this.element.querySelector('#settings-status');
                    if (statusEl) { statusEl.textContent = 'Testing URL…'; }
                    const okFetch = await this.testPostsUrl(url);
                    if (!okFetch) {
                        if (statusEl) { statusEl.textContent = 'Invalid posts.json (not reachable or not an array)'; }
                        return;
                    }
                    await window.SourcesManager.addSource({ type: 'external', url, tag, visible: true, removable: true });
                    this.sources = await window.SourcesManager.getAllSources();
                    this.renderList();
                    if (statusEl) { statusEl.textContent = 'Added ✓'; setTimeout(() => { statusEl.textContent = ''; }, 2000); }
                } catch (e) { console.error('Add source failed', e); }
            });
        }

        const toggleAllBtn = this.element.querySelector('#toggle-all-button');
        if (toggleAllBtn) {
            toggleAllBtn.addEventListener('click', async () => {
                const allVisible = this.sources.length > 0 && this.sources.every(s => s.visible);
                this.sources.forEach(s => { s.visible = !allVisible; });
                await window.SourcesManager.updateAllSources(this.sources);
                this.renderList();
            });
        }
    }

    escapeHtml(str) {
        return String(str || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[c]));
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
}
