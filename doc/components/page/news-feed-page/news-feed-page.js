export class NewsFeedPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.storyCards = [];
        this.currentStoryIndex = 0;
        this.posts = [];
        this.boundNextStory = this.nextStory.bind(this);
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.isLoadingMore = false;
        this.invalidate();
    }

    async beforeRender() {
        const hasVisited = await window.LocalStorage.get('hasVisitedBefore');
        if (!hasVisited) {
            const tutorialPost = this.createTutorialPost();
            const localPosts = await window.LocalStorage.get('posts') || [];
            localPosts.unshift(tutorialPost);
            await window.LocalStorage.set('posts', localPosts);
            await window.LocalStorage.set('hasVisitedBefore', true);
        }

        const localPosts = await window.LocalStorage.get('posts') || [];
        
        let jsonPosts = [];
        try {
            // Try to load from configured external URLs first
            const externalUrls = await window.LocalStorage.get('externalPostsUrls') || [];
            for (const url of externalUrls) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        const posts = await response.json();
                        jsonPosts = jsonPosts.concat(posts);
                    }
                } catch (error) {
                    console.error(`Could not fetch posts from ${url}:`, error);
                }
            }
            
            // Load from local posts.json
            const response = await fetch('./posts.json');
            if (response.ok) {
                const localJsonPosts = await response.json();
                jsonPosts = jsonPosts.concat(localJsonPosts);
            }
        } catch (error) {
            console.error("Could not fetch posts.json:", error);
        }

        const allPosts = [...jsonPosts, ...localPosts];
        
        const uniquePosts = allPosts.filter((post, index, self) =>
            index === self.findIndex((p) => p.id === post.id)
        );

        this.posts = uniquePosts;

        if (this.posts.length === 0) {
            // This should now only happen if both local storage and JSON are empty
            this.posts = [this.createFallbackPost()];
        }
    }

    afterRender() {
        const container = this.element.querySelector('.news-feed-container');
        if (!container) {
            console.error("Fatal error: .news-feed-container not found.");
            return;
        }

        // Clear placeholder
        const placeholder = container.querySelector('.story-card-placeholder');
        if (placeholder) placeholder.remove();

        container.innerHTML = '';
        this.storyCards = [];

        // Create story card elements
        this.posts.forEach((post, index) => {
            const storyCardElement = document.createElement('story-card');
            storyCardElement.setAttribute('data-presenter', 'story-card');
            storyCardElement.post = post;
            storyCardElement.storyIndex = index;
            storyCardElement.totalStories = this.posts.length;
            container.appendChild(storyCardElement);
        });

        // Wait for WebSkel to initialize the presenters
        customElements.whenDefined('story-card').then(async () => {
            const storyCardElements = container.querySelectorAll('story-card');
            for (const element of storyCardElements) {
                await element.presenterReadyPromise;
                if (element.webSkelPresenter) {
                    this.storyCards.push(element.webSkelPresenter);
                }
            }

            this.element.removeEventListener('story-finished', this.boundNextStory);
            this.element.addEventListener('story-finished', this.boundNextStory);
            
            this.setupScrollDetection();
            this.setupInfiniteScroll();
        });
    }
    
    setupScrollDetection() {
        const container = this.element.querySelector('.news-feed-container');
        if (!container) return;

        let isScrolling = false;
        let scrollTimeout;

        container.addEventListener('scroll', () => {
            if (!isScrolling) {
                isScrolling = true;
            }

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
                this.checkActiveStory();
            }, 150);
        });
    }

    checkActiveStory() {
        const container = this.element.querySelector('.news-feed-container');
        const cards = container.querySelectorAll('story-card');
        const containerRect = container.getBoundingClientRect();

        cards.forEach((card, index) => {
            const rect = card.getBoundingClientRect();
            const cardCenter = rect.top + rect.height / 2;
            const containerCenter = containerRect.top + containerRect.height / 2;
            const isInView = Math.abs(cardCenter - containerCenter) < rect.height / 3;
            
            if (isInView && this.currentStoryIndex !== index) {
                // Stop previous story's carousel
                if (this.storyCards[this.currentStoryIndex]) {
                    this.storyCards[this.currentStoryIndex].stopAutoPlay();
                }
                
                this.currentStoryIndex = index;
                
                // Start new story's carousel
                if (this.storyCards[index]) {
                    this.storyCards[index].startCarousel();
                }
            }
        });
    }

    setupInfiniteScroll() {
        const container = this.element.querySelector('.news-feed-container');
        if (!container) return;

        container.addEventListener('scroll', () => {
            const scrollHeight = container.scrollHeight;
            const scrollTop = container.scrollTop;
            const clientHeight = container.clientHeight;

            // When near the bottom (within 200px), add more stories
            if (scrollHeight - scrollTop - clientHeight < 200) {
                this.loadMoreStories();
            }
        });
    }

    async loadMoreStories() {
        // Prevent multiple loads
        if (this.isLoadingMore) return;
        this.isLoadingMore = true;

        const container = this.element.querySelector('.news-feed-container');
        container.classList.add('loading');

        // Duplicate existing posts for infinite scroll
        const newPosts = [...this.posts];
        
        for (const post of newPosts) {
            const storyCardElement = document.createElement('story-card');
            storyCardElement.setAttribute('data-presenter', 'story-card');
            storyCardElement.post = post;
            storyCardElement.storyIndex = this.storyCards.length;
            storyCardElement.totalStories = this.posts.length * 2; // Update total
            container.appendChild(storyCardElement);

            // Wait for presenter to be ready
            await customElements.whenDefined('story-card');
            await storyCardElement.presenterReadyPromise;
            if (storyCardElement.webSkelPresenter) {
                this.storyCards.push(storyCardElement.webSkelPresenter);
            }
        }

        container.classList.remove('loading');
        this.isLoadingMore = false;
    }

    nextStory() {
        const container = this.element.querySelector('.news-feed-container');
        const cards = container.querySelectorAll('story-card');
        
        if (this.currentStoryIndex < cards.length - 1) {
            this.currentStoryIndex++;
            cards[this.currentStoryIndex].scrollIntoView({ behavior: 'smooth' });
        }
    }

    cleanup() {
        this.element.removeEventListener('story-finished', this.boundNextStory);
        this.storyCards.forEach(card => card.cleanup());
    }

    createTutorialPost() {
        return {
            id: "tutorial-1",
            title: "Welcome to Axiologic.news!",
            essence: "Axiologic.news is a new way to experience news, focusing on core ideas and diverse perspectives, away from clickbait and sensationalism.",
            reactions: [
                "The code is open-source, and you can install your own version for free.",
                "Swipe UP or DOWN to discover new stories.",
                "Swipe LEFT or RIGHT to explore details, different reactions, and the source of the news."
            ],
            source: "https://www.axiologic.net",
            backgroundColor: "purple",
            promoBanner: {
                text: "Axiologic Research",
                url: "https://www.axiologic.net"
            }
        };
    }

    createFallbackPost() {
        return {
            id: "fallback-1",
            title: "Welcome to Axiologic.news!",
            essence: "It seems there are no posts available right now. Please check back later.",
            reactions: [],
            source: "#",
            backgroundColor: "night"
        };
    }
}
