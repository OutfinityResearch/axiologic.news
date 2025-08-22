export class HamburgerMenu {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.isOpen = false;
        this.invalidate();
    }

    beforeRender() {
        // The class needs to be applied after render
    }

    afterRender() {
        if (this.isOpen) {
            this.element.classList.add('open');
        } else {
            this.element.classList.remove('open');
        }
        
        // Set up click handlers for menu items
        const links = this.element.querySelectorAll('[data-local-action]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const action = link.getAttribute('data-local-action');
                if (this[action]) {
                    this[action]();
                }
            });
        });
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.invalidate();
    }

    async navigateToCreatePost() {
        await window.webSkel.changeToDynamicPage("create-post-page", "app");
        this.toggle();
    }

    async navigateToHome() {
        await window.webSkel.changeToDynamicPage("news-feed-page", "app");
        this.toggle();
    }

    async navigateToCreatePostFromRSS() {
        await window.webSkel.changeToDynamicPage("create-from-rss-page", "app");
        this.toggle();
    }

    async navigateToAnimationsSettings() {
        await window.webSkel.changeToDynamicPage("animations-settings-page", "app");
        this.toggle();
    }

    async navigateToVoiceSettings() {
        await window.webSkel.changeToDynamicPage("voice-settings-page", "app");
        this.toggle();
    }

    async navigateToMusicSettings() {
        await window.webSkel.changeToDynamicPage("music-settings-page", "app");
        this.toggle();
    }

    async navigateToApiKeysSettings() {
        await window.webSkel.changeToDynamicPage("api-keys-settings-page", "app");
        this.toggle();
    }
}
