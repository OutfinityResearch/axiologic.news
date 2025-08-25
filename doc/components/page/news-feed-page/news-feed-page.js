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
            
            // Load from selected local source categories (default to 'default')
            const selected = await window.LocalStorage.get('selectedSourceCategories') || ['default'];
            for (const cat of selected) {
                try {
                    const resp = await fetch(`./sources/${cat}/posts.json`);
                    if (resp.ok) {
                        const catPosts = await resp.json();
                        jsonPosts = jsonPosts.concat(catPosts);
                    }
                } catch (e) {
                    console.warn(`Could not load sources/${cat}/posts.json`, e);
                }
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

        // Create story card elements for all posts (vertical carousel)
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

            // Do not auto-advance to next post on story-finished
            this.element.removeEventListener('story-finished', this.boundNextStory);

            this.setupScrollDetection();
            // Optional: infinite scroll can remain off for now

            // Mark initial active based on current center
            this.checkActiveStory();
        });

        // Add bottom spacer to allow last post to center
        const spacer = document.createElement('div');
        spacer.className = 'bottom-spacer';
        container.appendChild(spacer);
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
            }, 120);
        });

        // Initial activation and centering on first render
        requestAnimationFrame(() => {
            this.checkActiveStory();
            const cards = container.querySelectorAll('story-card');
            if (cards[this.currentStoryIndex]) {
                cards[this.currentStoryIndex].classList.add('active-card');
                // Use a standard behavior
                cards[this.currentStoryIndex].scrollIntoView({ behavior: 'auto', block: 'center' });
                this.storyCards[this.currentStoryIndex]?.startCarousel();
            }
        });
    }

    checkActiveStory() {
        const container = this.element.querySelector('.news-feed-container');
        const cards = container.querySelectorAll('story-card');
        const containerRect = container.getBoundingClientRect();

        // Find the card closest to center
        let newActive = 0;
        let minDist = Infinity;
        cards.forEach((card, index) => {
            const rect = card.getBoundingClientRect();
            const cardCenter = rect.top + rect.height / 2;
            const containerCenter = containerRect.top + containerRect.height / 2;
            const dist = Math.abs(cardCenter - containerCenter);
            if (dist < minDist) { minDist = dist; newActive = index; }
        });

        if (newActive !== this.currentStoryIndex) {
            // Stop autoplay on all others and remove active class
            this.storyCards.forEach((presenter, idx) => {
                if (!presenter) return;
                presenter.stopAutoPlay();
                presenter.enableAutoPlay = false;
                const el = cards[idx];
                if (el) el.classList.remove('active-card');
            });

            // Set new active and start
            this.currentStoryIndex = newActive;
            const activePresenter = this.storyCards[newActive];
            const activeEl = cards[newActive];
            if (activeEl) activeEl.classList.add('active-card');
            if (activePresenter) activePresenter.startCarousel();

            // Ensure center alignment
            if (cards[newActive]) {
                cards[newActive].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            // Maintain active class on current
            cards.forEach((el, idx) => el.classList.toggle('active-card', idx === this.currentStoryIndex));
        }
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
            cards[this.currentStoryIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    previousStory() {
        const container = this.element.querySelector('.news-feed-container');
        const cards = container.querySelectorAll('story-card');
        if (this.currentStoryIndex > 0) {
            this.currentStoryIndex--;
            cards[this.currentStoryIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
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
