export class ExternalSourcesSettingsPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.urls = [];
        this.invalidate();
    }

    async beforeRender() {
        this.urls = await window.LocalStorage.get('externalPostsUrls') || [];
    }

    afterRender() {
        this.renderUrlList();
        this.setupEventListeners();
    }

    renderUrlList() {
        const urlList = this.element.querySelector('#url-list');
        if (!urlList) return;

        urlList.innerHTML = '';

        if (this.urls.length === 0) {
            urlList.innerHTML = '<div class="empty-state">No external sources configured yet</div>';
            return;
        }

        this.urls.forEach((url, index) => {
            const urlItem = document.createElement('div');
            urlItem.className = 'url-item';
            urlItem.innerHTML = `
                <span class="url-text">${url}</span>
                <button class="remove-button" data-index="${index}">Remove</button>
            `;
            urlList.appendChild(urlItem);
        });

        // Add remove button listeners
        urlList.querySelectorAll('.remove-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeUrl(index);
            });
        });
    }

    setupEventListeners() {
        const backButton = this.element.querySelector('#back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                window.webSkel.changeToDynamicPage('news-feed-page', 'app');
            });
        }

        const addButton = this.element.querySelector('#add-url-button');
        const urlInput = this.element.querySelector('#new-url-input');

        if (addButton && urlInput) {
            addButton.addEventListener('click', () => {
                this.addUrl(urlInput.value);
            });

            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addUrl(urlInput.value);
                }
            });
        }
    }

    async addUrl(url) {
        url = url.trim();
        
        if (!url) {
            alert('Please enter a valid URL');
            return;
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch (e) {
            alert('Please enter a valid URL');
            return;
        }

        // Check if URL already exists
        if (this.urls.includes(url)) {
            alert('This URL is already in the list');
            return;
        }

        this.urls.push(url);
        await window.LocalStorage.set('externalPostsUrls', this.urls);
        
        // Clear input and re-render
        const urlInput = this.element.querySelector('#new-url-input');
        if (urlInput) urlInput.value = '';
        
        this.renderUrlList();
    }

    async removeUrl(index) {
        this.urls.splice(index, 1);
        await window.LocalStorage.set('externalPostsUrls', this.urls);
        this.renderUrlList();
    }
}