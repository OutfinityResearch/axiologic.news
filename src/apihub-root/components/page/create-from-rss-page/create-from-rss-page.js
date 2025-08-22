import { LLMAdapter } from "../../../services/LLMAdapter.js";

export class CreateFromRssPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {}

    async loadRssFeed(eventOrElement) {
        // Handle both event and element cases
        let formElement;
        if (eventOrElement instanceof Event) {
            if (eventOrElement.preventDefault) {
                eventOrElement.preventDefault();
            }
            formElement = eventOrElement.target;
        } else if (eventOrElement instanceof HTMLElement) {
            // Find the closest form element
            formElement = eventOrElement.closest('form');
        } else {
            console.error('Invalid input to loadRssFeed');
            return;
        }
        
        if (!formElement || !(formElement instanceof HTMLFormElement)) {
            console.error('Form element not found');
            return;
        }
        
        const formData = new FormData(formElement);
        const rssUrl = formData.get('rss-url');
        
        // Try different CORS proxies as fallback
        const corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://cors.bridged.cc/',
            'https://proxy.cors.sh/'
        ];
        
        let url = rssUrl;
        let response;
        let proxyWorked = false;

        try {
            // First try without proxy
            try {
                response = await fetch(rssUrl);
                proxyWorked = true;
            } catch (directError) {
                // Try with proxies
                for (const proxy of corsProxies) {
                    try {
                        url = proxy + encodeURIComponent(rssUrl);
                        response = await fetch(url);
                        proxyWorked = true;
                        break;
                    } catch (proxyError) {
                        console.warn(`Proxy ${proxy} failed:`, proxyError);
                    }
                }
            }
            
            if (!proxyWorked || !response) {
                throw new Error('All CORS proxies failed. Please try a different RSS feed or check if the URL is correct.');
            }
            
            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, "application/xml");
            const items = Array.from(xml.querySelectorAll("item")).slice(0, 5); // Get first 5 items

            const suggestionsContainer = this.element.querySelector('.article-suggestions');
            suggestionsContainer.innerHTML = '<p>Generating suggestions...</p>';

            const llm = new LLMAdapter();
            const suggestions = await Promise.all(items.map(async (item) => {
                const title = item.querySelector("title").textContent;
                const description = item.querySelector("description").textContent;
                const link = item.querySelector("link").textContent;

                const prompt = `Based on the following article title and description, create a concise summary (essence) and three potential reactions for a news platform.\n\nTitle: ${title}\n\nDescription: ${description}`;
                const generatedContent = await llm.generateText(prompt);
                
                // TODO: Parse the generatedContent to extract essence and reactions
                // For now, we'll just use placeholders
                return {
                    title,
                    essence: "AI Generated Essence...",
                    reactions: ["Reaction 1", "Reaction 2", "Reaction 3"],
                    source: link
                };
            }));

            this.renderSuggestions(suggestions);

        } catch (error) {
            console.error("Failed to load or parse RSS feed:", error);
            const suggestionsContainer = this.element.querySelector('.article-suggestions');
            suggestionsContainer.innerHTML = '<p>Failed to load RSS feed. Please check the URL and try again.</p>';
        }
    }

    renderSuggestions(suggestions) {
        const suggestionsContainer = this.element.querySelector('.article-suggestions');
        suggestionsContainer.innerHTML = '';
        suggestions.forEach(suggestion => {
            const suggestionElement = document.createElement('div');
            suggestionElement.classList.add('suggestion');
            suggestionElement.innerHTML = `
                <h4 class="title">${suggestion.title}</h4>
                <p>${suggestion.essence}</p>
                <button data-local-action="selectSuggestion" data-suggestion='${JSON.stringify(suggestion)}'>Create Post</button>
            `;
            suggestionsContainer.appendChild(suggestionElement);
            const titleElement = suggestionElement.querySelector('.title');
            const essenceElement = suggestionElement.querySelector('p');
            webSkel.textService.adjustFontSize(titleElement);
            webSkel.textService.adjustFontSize(essenceElement);
        });
    }

    async selectSuggestion(event) {
        if (event && event.preventDefault) {
            event.preventDefault();
        }
        const suggestion = JSON.parse(event.target.dataset.suggestion);
        // TODO: Navigate to create-post-page and pass the suggestion data
        console.log("Selected suggestion:", suggestion);
        await webSkel.changeToDynamicPage('create-post-page', 'app', { suggestion });
    }
}
