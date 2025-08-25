export default class LoadingIndicator {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.loadingText = "Loading...";
    }

    beforeRender() {
        // Get loading text from data attribute or use default
        this.loadingText = this.element.getAttribute('data-loading-text') || this.loadingText;
    }

    afterRender() {
        // Component is rendered
    }

    /**
     * Static method to create a loading indicator HTML string
     * @param {string} text - The loading message to display
     * @param {string} additionalClass - Optional additional CSS class
     * @returns {string} HTML string for the loading indicator
     */
    static getHTML(text = "Loading...", additionalClass = "") {
        return `
            <div class="loading-indicator-container ${additionalClass}">
                <div class="loading-spinner"></div>
                <p class="loading-text">${text}</p>
            </div>
        `;
    }

    /**
     * Static method to show loading indicator in a container
     * @param {HTMLElement} container - The container element
     * @param {string} text - The loading message
     */
    static show(container, text = "Loading...") {
        if (container) {
            container.innerHTML = LoadingIndicator.getHTML(text);
        }
    }

    /**
     * Static method to hide loading indicator
     * @param {HTMLElement} container - The container element
     */
    static hide(container) {
        if (container) {
            container.innerHTML = '';
        }
    }
}