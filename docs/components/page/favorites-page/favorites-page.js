export class FavoritesPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.posts = [];
        this.invalidate();
    }

    async beforeRender() {
        try {
            const ids = await window.LocalStorage.get('favoritePostIds') || [];
            const map = await window.LocalStorage.get('favoritePostsById') || {};
            // Build list preserving ids order
            const posts = [];
            ids.forEach(id => { if (map[id]) posts.push(map[id]); });
            this.posts = posts;
        } catch (e) {
            console.error('Failed to load favorites', e);
            this.posts = [];
        }
    }

    async afterRender() {
        const list = this.element.querySelector('.favorites-list');
        const empty = this.element.querySelector('.favorites-empty');
        if (!list) return;
        list.innerHTML = '';
        if (!this.posts || this.posts.length === 0) {
            if (empty) empty.hidden = false;
            return;
        }
        if (empty) empty.hidden = true;

        await customElements.whenDefined('story-card');
        this.posts.forEach((post, idx) => {
            const el = document.createElement('story-card');
            el.setAttribute('data-presenter', 'story-card');
            el.post = post;
            el.storyIndex = idx; // local index within favorites
            el.totalStories = this.posts.length;
            list.appendChild(el);
        });
    }
}
