export class StoryCard {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.currentSlide = 0;
        this.slides = [];
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.autoPlayTimeout = null;
        this.enableAutoPlay = false;
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
        this.setupProgressBars();
        this.setupSwipeGestures();
        this.showSlide(0);
    }

    applyDynamicGradient() {
        // Use our new natural gradient classes for better visual appeal
        const totalGradients = 30; // We have 30 beautiful natural gradients defined
        const id = (this.post && this.post.id) ? String(this.post.id) : String(this.storyIndex);
        
        // Generate a hash from the post ID for consistent gradient assignment
        let hash = 0; 
        for (let i = 0; i < id.length; i++) {
            hash = ((hash << 5) - hash) + id.charCodeAt(i);
        }
        
        // Select a gradient number from 1-30
        const gradientNumber = (Math.abs(hash) % totalGradients) + 1;
        
        // Apply the gradient class
        this.element.setAttribute('data-bg', `gradient-${gradientNumber}`);
        
        // Optionally add a subtle pattern overlay for variety (10% chance)
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

        // Badge: "Story from domain.com" on main slide
        try {
            const url = new URL(this.post.source);
            const domain = url.hostname.replace(/^www\./, '');
            const mainBadge = this.element.querySelector('.card-slide[data-id="main"] .card-badge');
            if (mainBadge) mainBadge.textContent = `Story from ${domain}`;
        } catch {}

        // Time ago on all slides
        const timeElList = this.element.querySelectorAll('.card-time');
        const timeText = this.humanizeTime(this.post);
        timeElList.forEach(el => { el.textContent = timeText; });

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
                        <div class="card-time">${this.humanizeTime(this.post)}</div>
                    </div>
                    <div class="card-body">
                        <p class="reaction-text">${reaction}</p>
                    </div>
                </div>
            `;
            container.insertBefore(reactionSlide, sourceSlide);
        });
    }

    humanizeTime(post) {
        const src = post.generatedAt || post.pubDate || post.date || post.createdAt;
        const d = src ? new Date(src) : new Date();
        const now = new Date();
        const diff = Math.max(0, now - d);
        const s = Math.floor(diff / 1000);
        const m = Math.floor(s / 60);
        const h = Math.floor(m / 60);
        const d2 = Math.floor(h / 24);
        const w = Math.floor(d2 / 7);
        const mo = Math.floor(d2 / 30);
        const y = Math.floor(d2 / 365);
        if (s < 60) return `${s} seconds ago`;
        if (m < 60) return `${m} minute${m===1?'':'s'} ago`;
        if (h < 24) return `${h} hour${h===1?'':'s'} ago`;
        if (d2 < 7) return `${d2} day${d2===1?'':'s'} ago`;
        if (w < 5) return `${w} week${w===1?'':'s'} ago`;
        if (mo < 12) return `${mo} month${mo===1?'':'s'} ago`;
        return `${y} year${y===1?'':'s'} ago`;
    }

    getSlideTextLength(index) {
        const slide = this.slides[index];
        if (!slide) return 0;
        const essence = slide.querySelector('.card-essence');
        const react = slide.querySelector('.reaction-text');
        const text = (essence?.textContent || react?.textContent || '').trim();
        return text.length;
    }

    estimateDurationSeconds(index) {
        const len = this.getSlideTextLength(index);
        // Slow-reader friendly: ~8 chars/sec + base 2s
        const secs = 2 + len / 8;
        return Math.max(8, Math.min(60, Math.round(secs)));
    }

    initializeSlides() {
        this.slides = Array.from(this.element.querySelectorAll('.card-slide'));
    }

    setupProgressBars() {
        const container = this.element.querySelector('.progress-bars');
        if (!container) return;
        container.innerHTML = '';
        this.slides.forEach(() => {
            const seg = document.createElement('div');
            seg.className = 'progress-segment';
            const fill = document.createElement('div');
            fill.className = 'fill';
            seg.appendChild(fill);
            container.appendChild(seg);
        });
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

    // Slide indicators removed; progress bars are used instead

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

        // Update progress bars
        const segments = this.element.querySelectorAll('.progress-segment');
        segments.forEach((seg, i) => {
            seg.classList.toggle('active', i === index);
            const fill = seg.querySelector('.fill');
            if (!fill) return;
            // Reset then trigger transition
            fill.style.transition = 'none';
            fill.style.width = i < index ? '100%' : '0%';
            // Force reflow to re-apply transition
            // eslint-disable-next-line no-unused-expressions
            fill.offsetHeight;
            if (i === index && this.enableAutoPlay) {
                fill.style.transition = 'width linear 5s';
                requestAnimationFrame(() => {
                    fill.style.width = '100%';
                });
            } else if (i === index && !this.enableAutoPlay) {
                fill.style.width = '0%';
            }
        });

        // No dot indicators; progress bars indicate position

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
        if (!this.enableAutoPlay) return;
        const duration = this.estimateDurationSeconds(this.currentSlide);
        // Animate progress bar at this duration
        const segments = this.element.querySelectorAll('.progress-segment');
        segments.forEach((seg, i) => {
            const fill = seg.querySelector('.fill');
            if (fill && i === this.currentSlide) {
                fill.style.transition = `width linear ${duration}s`;
                // ensure starts at 0
                fill.style.width = '0%';
                // force reflow
                // eslint-disable-next-line no-unused-expressions
                fill.offsetHeight;
                requestAnimationFrame(() => { fill.style.width = '100%'; });
            }
        });
        this.autoPlayTimeout = setTimeout(() => {
            this.nextSlide();
        }, duration * 1000);
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
        this.enableAutoPlay = true;
        this.showSlide(0);
        this.startAutoPlay();
    }

    cleanup() {
        this.stopAutoPlay();
        this.enableAutoPlay = false;
    }
}
