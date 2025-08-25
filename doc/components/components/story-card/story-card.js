export class StoryCard {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.currentSlide = 0;
        this.slides = [];
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.autoPlayTimeout = null;
        this.invalidate();
    }

    beforeRender() {
        this.post = this.element.post;
        this.storyIndex = this.element.storyIndex || 0;
        this.totalStories = this.element.totalStories || 1;
    }

    afterRender() {
        if (!this.post) return;

        this.applyDynamicGradient();
        this.populateContent();
        this.createReactionSlides();
        this.initializeSlides();
        this.setupSwipeGestures();
        this.setupIndicators();
        this.showSlide(0);
        this.startAutoPlay();
    }

    applyDynamicGradient() {
        const totalGradients = 30;
        const id = (this.post && this.post.id) ? String(this.post.id) : String(this.storyIndex);
        
        let hash = 0; 
        for (let i = 0; i < id.length; i++) {
            hash = ((hash << 5) - hash) + id.charCodeAt(i);
        }
        
        const gradientNumber = (Math.abs(hash) % totalGradients) + 1;
        this.element.setAttribute('data-bg', `gradient-${gradientNumber}`);
        
        if (Math.abs(hash) % 10 === 0) {
            this.element.setAttribute('data-pattern', 'dots');
        } else if (Math.abs(hash) % 10 === 1) {
            this.element.setAttribute('data-pattern', 'lines');
        }
    }

    populateContent() {
        // Populate all title elements
        const titleElements = this.element.querySelectorAll('.card-title');
        titleElements.forEach(el => {
            if (el) el.textContent = this.post.title;
        });

        // Populate main slide essence
        const essenceElement = this.element.querySelector('.card-essence');
        if (essenceElement) essenceElement.textContent = this.post.essence;

        // Populate source slide
        const sourceLink = this.element.querySelector('.source-link');
        if (sourceLink) sourceLink.href = this.post.source;

        // Populate sponsor if exists
        if (this.post.promoBanner) {
            const sponsorSection = this.element.querySelector('.sponsor-section');
            if (sponsorSection) {
                sponsorSection.innerHTML = `
                    <a href="${this.post.promoBanner.url}" target="_blank" class="sponsor-link">
                        <i class="fas fa-ad"></i> ${this.post.promoBanner.text}
                    </a>
                `;
            }
        }
    }

    createReactionSlides() {
        if (!this.post.reactions || !Array.isArray(this.post.reactions)) return;

        const container = this.element.querySelector('.card-container');
        const sourceSlide = this.element.querySelector('[data-id="source"]');
        
        this.post.reactions.forEach((reaction, index) => {
            const reactionSlide = document.createElement('div');
            reactionSlide.className = 'card-slide';
            reactionSlide.setAttribute('data-id', `reaction-${index}`);
            reactionSlide.innerHTML = `
                <div class="card-gradient-overlay"></div>
                <div class="card-content">
                    <div class="card-header">
                        <h2 class="card-title">${this.post.title}</h2>
                        <div class="card-badge">Perspective ${index + 1}</div>
                    </div>
                    <div class="card-body">
                        <p class="reaction-text">${reaction}</p>
                    </div>
                </div>
            `;
            container.insertBefore(reactionSlide, sourceSlide);
        });
    }

    initializeSlides() {
        this.slides = Array.from(this.element.querySelectorAll('.card-slide'));
    }

    setupSwipeGestures() {
        const container = this.element.querySelector('.card-container');
        if (!container) return;

        // Touch events
        container.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.element.classList.add('swiping');
        });

        container.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.element.classList.remove('swiping');
            this.handleSwipe();
        });

        // Mouse events for desktop
        let mouseDown = false;
        container.addEventListener('mousedown', (e) => {
            mouseDown = true;
            this.touchStartX = e.screenX;
            this.element.classList.add('swiping');
        });

        container.addEventListener('mouseup', (e) => {
            if (mouseDown) {
                mouseDown = false;
                this.touchEndX = e.screenX;
                this.element.classList.remove('swiping');
                this.handleSwipe();
            }
        });

        container.addEventListener('mouseleave', () => {
            mouseDown = false;
            this.element.classList.remove('swiping');
        });
    }

    handleSwipe() {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - next slide
                this.nextSlide();
            } else {
                // Swipe right - previous slide
                this.previousSlide();
            }
        }
    }

    setupIndicators() {
        const indicatorContainer = this.element.querySelector('.slide-indicators');
        if (!indicatorContainer) return;

        indicatorContainer.innerHTML = '';
        this.slides.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.className = 'slide-indicator';
            if (index === 0) indicator.classList.add('active');
            indicator.addEventListener('click', () => this.goToSlide(index));
            indicatorContainer.appendChild(indicator);
        });
    }

    showSlide(index) {
        if (index < 0 || index >= this.slides.length) return;

        // Hide all slides
        this.slides.forEach((slide, i) => {
            slide.classList.remove('active', 'prev');
            if (i < index) {
                slide.classList.add('prev');
            }
        });

        // Show current slide
        this.slides[index].classList.add('active');
        this.currentSlide = index;

        // Update indicators
        const indicators = this.element.querySelectorAll('.slide-indicator');
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });

        // Reset auto-play
        this.startAutoPlay();
    }

    nextSlide() {
        const nextIndex = this.currentSlide + 1;
        if (nextIndex < this.slides.length) {
            this.showSlide(nextIndex);
        } else {
            // At the last slide, trigger next story
            this.triggerNextStory();
        }
    }

    previousSlide() {
        const prevIndex = this.currentSlide - 1;
        if (prevIndex >= 0) {
            this.showSlide(prevIndex);
        }
    }

    goToSlide(index) {
        this.showSlide(index);
    }

    startAutoPlay() {
        this.stopAutoPlay();
        // Auto-advance after 5 seconds
        this.autoPlayTimeout = setTimeout(() => {
            this.nextSlide();
        }, 5000);
    }

    stopAutoPlay() {
        if (this.autoPlayTimeout) {
            clearTimeout(this.autoPlayTimeout);
            this.autoPlayTimeout = null;
        }
    }

    triggerNextStory() {
        // Dispatch event to parent to move to next story
        this.element.dispatchEvent(new CustomEvent('story-finished', {
            bubbles: true,
            detail: { storyIndex: this.storyIndex }
        }));
    }

    startCarousel() {
        // Called by parent when story becomes active
        this.showSlide(0);
        this.startAutoPlay();
    }

    cleanup() {
        this.stopAutoPlay();
    }
}