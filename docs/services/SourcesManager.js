/**
 * Centralized service for managing news sources
 * Ensures consistency between all components
 */
class SourcesManager {
    constructor() {
        this.sources = [];
        this.initialized = false;
    }

    /**
     * Initialize sources from default configuration and localStorage
     */
    async initialize() {
        if (this.initialized) return this.sources;

        // Always load categories from sources/sources.json (no hardcoded fallbacks)
        let defaultSources = [];
        try {
            const cachedCfg = await window.LocalStorage.get('sourcesJsonConfig');
            if (cachedCfg && Array.isArray(cachedCfg)) {
                defaultSources = cachedCfg;
            }
            if (!Array.isArray(defaultSources) || defaultSources.length === 0) {
                const resp = await fetch('./sources/sources.json', { cache: 'force-cache' });
                if (resp.ok) {
                    const cfg = await resp.json();
                    defaultSources = Array.isArray(cfg) ? cfg : [];
                    await window.LocalStorage.set('sourcesJsonConfig', defaultSources);
                }
            }
        } catch (error) {
            console.warn('Sources config unavailable:', error);
            defaultSources = [];
        }

        // Build category list from sources.json entries
        // sources.json format: [{ name: "categoryName" }, ...]
        const categories = (defaultSources || [])
            .map(entry => (entry && (entry.name || entry.id || '').toString().trim()))
            .filter(Boolean);

        this.sources = categories.map(name => ({
            id: name,
            name: name,
            type: 'category',
            url: `/sources/${name}/posts.json`,
            tag: name,
            removable: false,
            visible: true
        }));

        // Apply saved visibility to categories if present
        const visibleSourcesInCard = await window.LocalStorage.get('visibleSourcesInCard');
        if (Array.isArray(visibleSourcesInCard)) {
            this.sources.forEach(src => {
                const key = src.id || src.url;
                src.visible = visibleSourcesInCard.includes(key);
            });
        }

        // Merge external sources managed by users
        await this.syncExternalSources();

        // Persist visibility and sources
        await this.saveVisibility();
        await this.saveSources();

        this.initialized = true;
        return this.sources;
    }

    /**
     * Merge saved sources with defaults, ensuring all defaults are present
     */
    mergeSourcesWithDefaults(saved, defaults) {
        const merged = [...saved];
        const existingIds = new Set(saved.map(s => s.id).filter(Boolean));
        
        // Add any missing default sources
        defaults.forEach(defSource => {
            if (defSource.id && !existingIds.has(defSource.id)) {
                merged.push(defSource);
            }
        });
        
        return merged;
    }

    /**
     * Sync external sources from legacy storage
     */
    async syncExternalSources() {
        const externalSources = await window.LocalStorage.get('externalPostSources') || [];
        const existingUrls = new Set(this.sources.map(s => s.url).filter(Boolean));
        
        externalSources.forEach(ext => {
            if (ext && ext.url && !existingUrls.has(ext.url)) {
                this.sources.push({
                    id: `external-${Date.now()}-${Math.random()}`,
                    url: ext.url,
                    tag: ext.tag || this.deriveTag(ext.url),
                    type: 'external',
                    removable: true,
                    visible: false
                });
            }
        });
    }

    /**
     * Get all sources
     */
    async getAllSources() {
        if (!this.initialized) {
            await this.initialize();
        }
        return [...this.sources];
    }

    /**
     * Get only visible sources for the selection card
     */
    async getVisibleSources() {
        if (!this.initialized) {
            await this.initialize();
        }
        // Return all sources (categories + externals) marked visible
        return this.sources.filter(s => s.visible === true);
    }

    /**
     * Get selected sources (checked in the selection card)
     */
    async getSelectedSources() {
        // Check if this is first time initialization
        const hasSelectedBefore = await window.LocalStorage.get('hasSelectedSourcesBefore');
        
        let selectedCategories = await window.LocalStorage.get('selectedSourceCategories');
        let selectedExternal = await window.LocalStorage.get('selectedExternalPostsUrls');
        
        // First time - only select 'default'
        if (!hasSelectedBefore && !selectedCategories && !selectedExternal) {
            selectedCategories = ['default'];
            selectedExternal = [];
            
            // Save the initial selection
            await window.LocalStorage.set('selectedSourceCategories', selectedCategories);
            await window.LocalStorage.set('selectedExternalPostsUrls', selectedExternal);
            await window.LocalStorage.set('hasSelectedSourcesBefore', true);
        }
        
        // Normalize and migrate to single selection (radio semantics)
        selectedCategories = Array.isArray(selectedCategories) ? selectedCategories : [];
        selectedExternal = Array.isArray(selectedExternal) ? selectedExternal : [];

        // If both are set, prefer category selection and clear externals
        if (selectedCategories.length > 0 && selectedExternal.length > 0) {
            selectedExternal = [];
        }
        // Keep only first in each list (radio semantics)
        if (selectedCategories.length > 1) selectedCategories = [selectedCategories[0]];
        if (selectedExternal.length > 1) selectedExternal = [selectedExternal[0]];

        // If neither set, default to first category from /sources (fallback to 'default')
        if (selectedCategories.length === 0 && selectedExternal.length === 0) {
            try {
                const all = await this.getAllSources();
                const firstCat = (all || []).find(s => s.type === 'category');
                selectedCategories = firstCat ? [firstCat.id] : ['default'];
            } catch (_) {
                selectedCategories = ['default'];
            }
        }

        // Persist normalized selection
        await window.LocalStorage.set('selectedSourceCategories', selectedCategories);
        await window.LocalStorage.set('selectedExternalPostsUrls', selectedExternal);
        await window.LocalStorage.set('hasSelectedSourcesBefore', true);
        
        return {
            categories: selectedCategories,
            external: selectedExternal,
            all: [...selectedCategories, ...selectedExternal]
        };
    }

    /**
     * Update source visibility
     */
    async updateVisibility(sourceId, visible) {
        const source = this.sources.find(s => (s.id === sourceId) || (s.url === sourceId));
        if (source) {
            source.visible = !!visible;
            await this.saveVisibility();
            await this.saveSources();
        }
    }

    /**
     * Update all sources (used by manage modal)
     */
    async updateAllSources(updatedSources) {
        // Update visibility for known sources (categories or externals); do not add or remove here
        if (!Array.isArray(updatedSources)) return;
        const byKey = (s) => s.id || s.url;
        const incoming = new Map(updatedSources.map(s => [byKey(s), s]));
        this.sources.forEach(s => {
            const inc = incoming.get(byKey(s));
            if (inc && typeof inc.visible === 'boolean') s.visible = !!inc.visible;
        });
        await this.saveVisibility();
        await this.saveSources();
        await this.syncExternalToLegacy();
    }

    /**
     * Add a new source
     */
    async addSource(source) {
        // Allow adding external sources only
        if (!source || source.type !== 'external' || !source.url) return false;
        if (this.sources.find(s => s.url === source.url)) return false;
        const entry = {
            id: source.id || `external-${Date.now()}-${Math.random()}`,
            url: source.url,
            tag: this.normalizeTag(source.tag) || this.deriveTag(source.url),
            type: 'external',
            removable: true,
            visible: source.visible !== false
        };
        this.sources.push(entry);
        await this.saveSources();
        await this.saveVisibility();
        await this.syncExternalToLegacy();
        return true;
    }

    /**
     * Remove a source
     */
    async removeSource(sourceId) {
        const idx = this.sources.findIndex(s => (s.id === sourceId) || (s.url === sourceId));
        if (idx === -1) return false;
        const src = this.sources[idx];
        if (src.type !== 'external' || src.removable === false) return false;
        this.sources.splice(idx, 1);
        await this.saveSources();
        await this.saveVisibility();
        await this.syncExternalToLegacy();
        return true;
    }

    /**
     * Save sources to localStorage
     */
    async saveSources() {
        await window.LocalStorage.set('allNewsSources', this.sources);
    }

    /**
     * Save visibility list
     */
    async saveVisibility() {
        const visibleSources = this.sources
            .filter(s => s.visible === true)
            .map(s => s.id || s.url);
        await window.LocalStorage.set('visibleSourcesInCard', visibleSources);
    }

    /**
     * Sync external sources to legacy storage format
     */
    async syncExternalToLegacy() {
        const externalSources = this.sources
            .filter(s => s.type === 'external')
            .map(s => ({ url: s.url, tag: s.tag }));
        await window.LocalStorage.set('externalPostSources', externalSources);
    }

    /**
     * Save selected sources
     */
    async saveSelectedSources(categories, external) {
        await window.LocalStorage.set('selectedSourceCategories', categories);
        await window.LocalStorage.set('selectedExternalPostsUrls', external);
        // Mark that user has made a selection
        await window.LocalStorage.set('hasSelectedSourcesBefore', true);
    }

    /**
     * Derive tag from URL
     */
    deriveTag(url) {
        if (!url) return 'external';
        
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

    /**
     * Normalize tag string
     */
    normalizeTag(s) {
        if (!s) return '';
        return String(s).trim().replace(/^#/, '').replace(/[^a-zA-Z0-9_-]+/g, '').slice(0, 24);
    }

    /**
     * Force reload sources from storage
     */
    async reload() {
        this.initialized = false;
        this.sources = [];
        return await this.initialize();
    }
}

// Export singleton instance
window.SourcesManager = new SourcesManager();
export default window.SourcesManager;
