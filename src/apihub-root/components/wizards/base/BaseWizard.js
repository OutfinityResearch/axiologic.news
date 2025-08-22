export class BaseWizard {
    constructor(element, invalidate, stateKey) {
        this.element = element;
        this.invalidate = invalidate;
        this.stateKey = stateKey;
        this.abortController = null;
        this.state = {};

        this.invalidate(async () => {
            this.state = (await window.LocalStorage.get(this.stateKey)) || this.getInitialState();
            this.afterStateLoad();
        });
    }

    getInitialState() {
        // To be implemented by subclasses
        return {};
    }

    afterStateLoad() {
        // To be implemented by subclasses
    }

    async beforeRender() {
        // Can be used by subclasses
    }

    async afterRender() {
        // To be implemented by subclasses
    }

    async saveState() {
        await window.LocalStorage.set(this.stateKey, this.state);
    }

    stopGenerating() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    async _handleLLMGeneration(prompt, schema, stateProperty) {
        this.state[stateProperty] = true;
        this.invalidate();
        this.abortController = new AbortController();

        try {
            // Ensure LLM adapter is available and initialized
            if (!window.llmAdapter) {
                throw new Error("LLM adapter is not available. Please check if the service is properly loaded.");
            }
            
            await window.llmAdapter.init();
            
            const result = await window.llmAdapter.generate(prompt, schema);
            if (this.abortController?.signal.aborted) {
                return null;
            }
            return result;
        } catch (error) {
            if (!this.abortController?.signal.aborted) {
                console.error(`Failed to generate ${stateProperty}:`, error);
                await window.webSkel.showModal("show-error-modal", { title: "Error", message: `Failed to generate content: ${error.message}` });
            }
            return null;
        } finally {
            this.state[stateProperty] = false;
            this.abortController = null;
            this.invalidate();
        }
    }

    async nextStep() {
        if (!this.state.generatedScript) {
            await window.webSkel.showModal("show-error-modal", { title: "Error", message: "Please generate a script before proceeding." });
            return;
        }
        await window.LocalStorage.set("current-script", this.state.generatedScript);
        await window.webSkel.changeToDynamicPage("meme-editor", "app");
    }

    async prevStep() {
        await window.webSkel.changeToDynamicPage("main-page", "app");
    }
}
