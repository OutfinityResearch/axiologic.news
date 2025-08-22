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
        this.autoPlayInterval = null;
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
            const response = await fetch('/current_posts.json');
            if (response.ok) {
                jsonPosts = await response.json();
            }
        } catch (error) {
            console.error("Could not fetch current_posts.json:", error);
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

        // Create elements and attach data, but DO NOT instantiate presenters manually
        this.posts.forEach((post, index) => {
            const storyCardElement = document.createElement('story-card');
            storyCardElement.setAttribute('data-presenter', 'story-card');
            storyCardElement.post = post; // Attach data to the element
            if (index === 0) storyCardElement.classList.add('active');
            container.appendChild(storyCardElement);
        });

        // Wait for WebSkel to initialize the presenters on the new elements
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
            
            this.setupVerticalNavigation();
            this.setupSwipeGestures();
            this.startAutoPlay();
            this.playCurrentStory();
        });
    }
    
    setupVerticalNavigation() {
        const upBtn = this.element.querySelector('.feed-nav-up');
        const downBtn = this.element.querySelector('.feed-nav-down');
        
        if (upBtn) {
            upBtn.addEventListener('click', () => this.previousStory());
        }
        
        if (downBtn) {
            downBtn.addEventListener('click', () => this.nextStory());
        }
    }
    
    setupSwipeGestures() {
        const container = this.element.querySelector('.news-feed-wrapper');
        if (!container) return;
        
        // Touch events for mobile
        container.addEventListener('touchstart', (e) => {
            this.touchStartY = e.changedTouches[0].screenY;
        });
        
        container.addEventListener('touchend', (e) => {
            this.touchEndY = e.changedTouches[0].screenY;
            this.handleVerticalSwipe();
        });
        
        // Mouse wheel for desktop
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY > 0) {
                this.nextStory();
            } else {
                this.previousStory();
            }
        }, { passive: false });
    }
    
    handleVerticalSwipe() {
        const swipeThreshold = 50;
        const diff = this.touchStartY - this.touchEndY;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe up - next story
                this.nextStory();
            } else {
                // Swipe down - previous story
                this.previousStory();
            }
        }
    }
    
    startAutoPlay() {
        // Auto-advance to next story every 15 seconds
        clearInterval(this.autoPlayInterval);
        this.autoPlayInterval = setInterval(() => {
            this.nextStory();
        }, 15000);
    }

    playCurrentStory() {
        if (this.storyCards.length > 0 && this.storyCards[this.currentStoryIndex]) {
            // Hide all story cards
            const allCards = this.element.querySelectorAll('story-card');
            allCards.forEach(card => card.classList.remove('active'));
            
            // Show current story card
            const currentCardPresenter = this.storyCards[this.currentStoryIndex];
            currentCardPresenter.element.classList.add('active');
            
            // Pass story count info
            currentCardPresenter.storyIndex = this.currentStoryIndex;
            currentCardPresenter.totalStories = this.storyCards.length;
            
            // Start carousel for current story
            currentCardPresenter.startCarousel();
        }
    }
    
    previousStory() {
        if (this.storyCards[this.currentStoryIndex]) {
            this.storyCards[this.currentStoryIndex].cleanup();
        }
        
        this.currentStoryIndex--;
        if (this.currentStoryIndex < 0) {
            this.currentStoryIndex = this.storyCards.length - 1;
        }
        
        this.playCurrentStory();
        
        // Reset auto-play timer
        this.startAutoPlay();
    }

    nextStory() {
        if (this.storyCards[this.currentStoryIndex]) {
            this.storyCards[this.currentStoryIndex].cleanup();
        }
        
        this.currentStoryIndex++;
        if (this.currentStoryIndex >= this.storyCards.length) {
            this.currentStoryIndex = 0;
        }
        
        this.playCurrentStory();
        
        // Reset auto-play timer
        this.startAutoPlay();
    }

    cleanup() {
        this.element.removeEventListener('story-finished', this.boundNextStory);
        clearInterval(this.autoPlayInterval);
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
