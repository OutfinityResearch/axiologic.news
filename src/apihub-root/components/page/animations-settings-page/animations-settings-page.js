export class AnimationsSettingsPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        // Logic for animations settings will go here
    }

    async navigateToMainPage() {
        await window.webSkel.changeToDynamicPage('news-feed-page', 'app');
    }
}
