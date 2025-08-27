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
        this.startAtFirstNews = false;
        try {
            const jump = await window.LocalStorage.get('jumpToFirstNews');
            this.startAtFirstNews = !!jump;
        } catch (_) { this.startAtFirstNews = false; }
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
                    const response = await fetch(url, { cache: 'no-store' });
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
                    const resp = await fetch(`./sources/${cat}/posts.json`, { cache: 'no-store' });
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

        // Ensure every post has a stable id for tracking/ordering
        const ensureId = (p) => {
            try {
                if (p && !p.id) {
                    const date = p.publishedAt || p.generatedAt || p.pubDate || p.date || p.createdAt || '';
                    const src = p.source || p.url || '';
                    const title = p.title || '';
                    p.id = `${src}|${title}|${date}`.slice(0, 256);
                }
            } catch (_) {}
            return p;
        };
        allPosts.forEach(ensureId);

        // Filter out posts that look like HTML/code or have too-short pages
        const isLikelyHtmlOrCode = (text = '') => {
            if (!text || typeof text !== 'string') return false;
            const htmlTag = /<\/?[a-z][^>]*>/i;
            const codeFence = /```|<script|function\s|class\s|\{\s*\}|console\.|import\s|export\s|;\s*\n/mi;
            const attrs = /\s(?:class|style|id|onclick|onerror|href|src)=/i;
            return htmlTag.test(text) || codeFence.test(text) || attrs.test(text);
        };
        const wordCount = (text = '') => (text.trim().match(/\b\w+\b/g) || []).length;
        const isValidPost = (p) => {
            if (!p) return false;
            // Keep tutorial/fallback posts regardless
            if (typeof p.id === 'string' && (p.id.startsWith('tutorial-') || p.id.startsWith('fallback-'))) return true;
            const pages = [];
            if (p.essence) pages.push(p.essence);
            if (Array.isArray(p.reactions)) pages.push(...p.reactions.filter(Boolean));
            if (pages.length === 0) return false;
            // Reject if any page looks like html/code
            if (pages.some(isLikelyHtmlOrCode)) return false;
            // Require each page to have at least 15 words
            if (pages.some(txt => wordCount(txt) < 15)) return false;
            return true;
        };
        
        const uniquePosts = allPosts.filter((post, index, self) =>
            index === self.findIndex((p) => p.id === post.id)
        );
        const filteredPosts = uniquePosts.filter(isValidPost);

        // Get viewing history data: which posts have ever been centered (brought in prime plan)
        const centeredMap = await window.LocalStorage.get('postCenteredHistory') || {};
        
        // Helper to get the publication/generation date
        const getDate = (p) => {
            // Try multiple date fields
            const dateStr = p.publishedAt || p.generatedAt || p.pubDate || p.date || p.createdAt;
            if (dateStr) {
                const date = new Date(dateStr);
                return isNaN(date.getTime()) ? 0 : date.getTime();
            }
            return 0;
        };
        
        // Sort logic:
        // 1) Posts never centered (not seen in prime plan) first
        // 2) Within each group, newest first by published/generated date
        const stableId = (p) => {
            try {
                const src = (p.source || p.url || '').trim().toLowerCase();
                const date = (p.publishedAt || p.generatedAt || p.pubDate || p.date || p.createdAt || '').trim();
                if (src) return `${src}|${date}`;
                return p.id || `${(p.title||'').trim()}|${date}`;
            } catch (_) { return p.id; }
        };
        this.posts = filteredPosts.sort((a, b) => {
            const aKey = stableId(a);
            const bKey = stableId(b);
            const aCentered = (centeredMap[aKey]?.centered || centeredMap[a.id]?.centered) ? 1 : 0;
            const bCentered = (centeredMap[bKey]?.centered || centeredMap[b.id]?.centered) ? 1 : 0;
            if (aCentered !== bCentered) return aCentered - bCentered; // 0 before 1
            return getDate(b) - getDate(a);
        });

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
        // Add a top spacer (invisible) to allow the first card to center when scrolled
        const topSpacer = document.createElement('div');
        topSpacer.className = 'top-spacer';
        container.appendChild(topSpacer);
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

            // Keep a minimal top spacer; no dynamic large gaps

            // Do not auto-advance to next post on story-finished
            this.element.removeEventListener('story-finished', this.boundNextStory);

            this.setupScrollDetection();
            // Optional: infinite scroll can remain off for now

            // Mark initial active based on current center
            // Default: start at first real news (index 1) and let user manually navigate to selection card (index 0)
            this.currentStoryIndex = this.posts.length > 1 ? 1 : 0;
            // If explicitly requested via flag, keep centering on first news as well
            if (this.startAtFirstNews && this.posts.length > 1) this.currentStoryIndex = 1;
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
        requestAnimationFrame(async () => {
            this.checkActiveStory();
            const cards = container.querySelectorAll('story-card');
            if (cards[this.currentStoryIndex]) {
                cards[this.currentStoryIndex].classList.add('active-card');
                // Also mark neighbor classes initially
                const prevEl = cards[this.currentStoryIndex - 1];
                const nextEl = cards[this.currentStoryIndex + 1];
                if (prevEl) prevEl.classList.add('prev-card');
                if (nextEl) nextEl.classList.add('next-card');
                // Use a standard behavior
                cards[this.currentStoryIndex].scrollIntoView({ behavior: 'auto', block: 'center' });
                this.storyCards[this.currentStoryIndex]?.startCarousel();
                // Ensure initial active is recorded as centered
                await this.markAsCentered(this.currentStoryIndex);
            }
            // Clear jump flag after applying once
            try { await window.LocalStorage.set('jumpToFirstNews', false); } catch (_) {}
        });
    }

    async markAsCentered(index) {
        try {
            if (!this.posts[index]) return;
            const post = this.posts[index];
            const postId = post.id;
            const src = (post.source || post.url || '').trim().toLowerCase();
            const date = (post.publishedAt || post.generatedAt || post.pubDate || post.date || post.createdAt || '').trim();
            const sKey = src ? `${src}|${date}` : postId;
            const centeredMap = await window.LocalStorage.get('postCenteredHistory') || {};
            let changed = false;
            if (!centeredMap[postId]?.centered) {
                centeredMap[postId] = { centered: true, firstCenteredAt: new Date().toISOString() };
                changed = true;
            }
            if (!centeredMap[sKey]?.centered) {
                centeredMap[sKey] = { centered: true, firstCenteredAt: new Date().toISOString() };
                changed = true;
            }
            if (changed) await window.LocalStorage.set('postCenteredHistory', centeredMap);
        } catch (_) { /* ignore */ }
    }

    async checkActiveStory() {
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
                if (el) {
                    el.classList.remove('active-card');
                    el.classList.remove('prev-card', 'next-card');
                }
            });

            // Set new active and start
            this.currentStoryIndex = newActive;
            const activePresenter = this.storyCards[newActive];
            const activeEl = cards[newActive];
            if (activeEl) activeEl.classList.add('active-card');
            // Mark neighbors
            const prevEl = cards[newActive - 1];
            const nextEl = cards[newActive + 1];
            if (prevEl) prevEl.classList.add('prev-card');
            if (nextEl) nextEl.classList.add('next-card');
            if (activePresenter) activePresenter.startCarousel();
            
            // Mark this post as having been centered
            await this.markAsCentered(newActive);

            // Ensure center alignment
            if (cards[newActive]) {
                cards[newActive].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            // Maintain active class on current
            cards.forEach((el, idx) => {
                el.classList.toggle('active-card', idx === this.currentStoryIndex);
                el.classList.toggle('prev-card', idx === this.currentStoryIndex - 1);
                el.classList.toggle('next-card', idx === this.currentStoryIndex + 1);
            });
            // Ensure current active is registered as centered
            await this.markAsCentered(this.currentStoryIndex);
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
