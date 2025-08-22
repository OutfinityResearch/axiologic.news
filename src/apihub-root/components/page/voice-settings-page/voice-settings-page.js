export class VoiceSettingsPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        // Logic for voice settings will go here
    }

    async navigateToMainPage() {
        await window.webSkel.changeToDynamicPage('news-feed-page', 'app');
    }
}
