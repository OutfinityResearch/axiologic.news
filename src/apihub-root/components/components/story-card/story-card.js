export class StoryCard {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.currentSlide = 0;
        this.slides = [];
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.progressInterval = null;
        this.carouselTimeout = null;
        this.finalCountdownTimeout = null;
        this.slideTimings = [];
        this.totalPostTime = 0;
        this.invalidate();
    }

    beforeRender() {
        this.post = this.element.post;
        this.storyIndex = this.element.storyIndex;
        this.totalStories = this.element.totalStories;
    }

    afterRender() {
        if (!this.post) { return; }

        this.updateStoryCounter();
        this.applyBackgroundTheme();
        this.populateSlides();
        
        this.slides = Array.from(this.element.querySelectorAll('.carousel-slide'));
        this.setupTimings();
        this.setupIndicators();
        this.setupNavigation();
        this.setupSwipeGestures();
        this.setupProgressBar();
        
        this.currentSlide = 0;
        this.showSlide(0, false); // Don't start auto-advance on initial render
    }

    updateStoryCounter() {
        const current = this.element.querySelector('.current-story');
        const total = this.element.querySelector('.total-stories');
        if (current) current.textContent = this.storyIndex + 1;
        if (total) total.textContent = this.totalStories;
    }

    populateSlides() {
        const titleElement = this.element.querySelector('.title');
        const essenceElement = this.element.querySelector('.essence');
        const sourceLinkElement = this.element.querySelector('.source-link');
        
        if (titleElement) {
            titleElement.textContent = this.post.title;
            webSkel.robustTextService.fitTextInContainer(titleElement, { maxFontSize: 75, minFontSize: 28 });
        }
        if (essenceElement) {
            essenceElement.textContent = this.post.essence;
            webSkel.robustTextService.fitTextInContainer(essenceElement, { maxFontSize: 45, minFontSize: 20 });
        }
        if (sourceLinkElement) sourceLinkElement.href = this.post.source;

        const sponsorPanel = this.element.querySelector('.sponsor-panel');
        if (this.post.promoBanner && this.post.promoBanner.text && this.post.promoBanner.url) {
            sponsorPanel.querySelector('.sponsor-banner-link').href = this.post.promoBanner.url;
            sponsorPanel.querySelector('.sponsor-banner span').textContent = this.post.promoBanner.text;
            sponsorPanel.style.display = 'block';
        } else {
            sponsorPanel.style.display = 'none';
        }

        const carousel = this.element.querySelector('.carousel-container');
        const sourceSlide = this.element.querySelector('.carousel-slide[data-id="source"]');
        this.element.querySelectorAll('.reaction-slide').forEach(slide => slide.remove());

        if (this.post.reactions && Array.isArray(this.post.reactions)) {
            this.post.reactions.forEach((reaction, index) => {
                const slide = document.createElement('div');
                slide.className = 'carousel-slide reaction-slide';
                slide.dataset.id = `reaction-${index}`;
                slide.innerHTML = `
                    <div class="content-panel">
                        <div class="reaction-title">Reaction #${index + 1}</div>
                        <p class="reaction"></p>
                    </div>`;
                const reactionText = slide.querySelector('.reaction');
                reactionText.textContent = reaction;
                webSkel.robustTextService.fitTextInContainer(reactionText, { maxFontSize: 38, minFontSize: 18 });
                carousel.insertBefore(slide, sourceSlide);
            });
        }
    }

    setupTimings() {
        this.slideTimings = webSkel.robustTextService.calculateSlideTimings(this.slides);
        this.totalPostTime = this.slideTimings.reduce((sum, time) => sum + time, 0);
    }
    
    setupProgressBar() {
        const progressWrapper = this.element.querySelector('.progress-bar-wrapper');
        if (!progressWrapper) return;

        progressWrapper.innerHTML = '<div class="progress-bar-background"></div><div class="progress-bar-fill"></div>';
        const totalSeconds = Math.ceil(this.totalPostTime / 1000);

        for (let i = 0; i <= totalSeconds; i++) {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            dot.style.left = `${(i / totalSeconds) * 100}%`;
            progressWrapper.appendChild(dot);
        }

        let cumulativeTime = 0;
        this.slideTimings.forEach(time => {
            cumulativeTime += time;
            const dot = document.createElement('div');
            dot.className = 'progress-dot slide-change';
            dot.style.left = `${(cumulativeTime / this.totalPostTime) * 100}%`;
            progressWrapper.appendChild(dot);
        });
    }
    
    setupIndicators() {
        const container = this.element.querySelector('.carousel-indicators');
        if (!container) return;
        container.innerHTML = '';
        this.slides.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.className = 'carousel-indicator';
            indicator.addEventListener('click', () => this.goToSlide(index));
            container.appendChild(indicator);
        });
    }
    
    setupNavigation() {
        this.element.querySelector('.carousel-nav-left')?.addEventListener('click', () => this.previousSlide());
        this.element.querySelector('.carousel-nav-right')?.addEventListener('click', () => this.nextSlide());
    }
    
    setupSwipeGestures() {
        const container = this.element.querySelector('.carousel-wrapper');
        if (!container) return;
        container.addEventListener('touchstart', e => this.touchStartX = e.changedTouches[0].screenX);
        container.addEventListener('touchend', e => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });
    }
    
    handleSwipe() {
        if (Math.abs(this.touchStartX - this.touchEndX) > 50) {
            if (this.touchStartX > this.touchEndX) this.nextSlide();
            else this.previousSlide();
        }
    }

    clearAllTimers() {
        clearTimeout(this.carouselTimeout);
        this.carouselTimeout = null;
        clearTimeout(this.finalCountdownTimeout);
        this.finalCountdownTimeout = null;
    }

    showSlide(index, scheduleNext = true) {
        this.slides.forEach(slide => slide.classList.remove('active'));
        if (this.slides[index]) {
            this.slides[index].classList.add('active');
            this.updateSlideInfo(index);
        }
        
        this.element.querySelectorAll('.carousel-indicator').forEach((ind, i) => {
            ind.classList.toggle('active', i === index);
        });

        if (scheduleNext) {
            this.scheduleNextSlide();
        }
    }
    
    updateSlideInfo(slideIndex) {
        const slideNameEl = this.element.querySelector('.current-slide-name');
        const slide = this.slides[slideIndex];
        if (!slideNameEl || !slide) return;
        
        const id = slide.dataset.id;
        if (id === 'title') slideNameEl.textContent = 'Title';
        else if (id === 'essence') slideNameEl.textContent = 'Essence';
        else if (id === 'source') slideNameEl.textContent = 'Source';
        else if (id.startsWith('reaction')) {
            slideNameEl.textContent = `Reaction #${parseInt(id.split('-')[1]) + 1}`;
        }
    }
    
    goToSlide(index) {
        this.clearAllTimers();
        this.currentSlide = index;
        this.showSlide(index);
    }
    
    nextSlide() {
        this.clearAllTimers();
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.showSlide(this.currentSlide);
        
        if (this.currentSlide === 0) {
            this.element.dispatchEvent(new CustomEvent('story-finished', { bubbles: true }));
        }
    }
    
    previousSlide() {
        this.clearAllTimers();
        this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.showSlide(this.currentSlide);
    }

    scheduleNextSlide() {
        this.clearAllTimers();
        const isLastSlide = this.currentSlide === this.slides.length - 1;

        if (isLastSlide) {
            this.finalCountdownTimeout = setTimeout(() => {
                this.element.dispatchEvent(new CustomEvent('story-finished', { bubbles: true }));
            }, 10000);
        } else {
            const currentTiming = this.slideTimings[this.currentSlide] || 3000;
            this.carouselTimeout = setTimeout(() => this.nextSlide(), currentTiming);
        }
    }

    startCarousel() {
        if (!this.slides || this.slides.length === 0) return;
        
        this.clearAllTimers();
        clearInterval(this.progressInterval);
        
        this.currentSlide = 0;
        this.showSlide(0, false);
        this.startPostTimer();
        this.scheduleNextSlide();
    }
    
    startPostTimer() {
        clearInterval(this.progressInterval);
        const startTime = Date.now();
        const progressFill = this.element.querySelector('.progress-bar-fill');
        
        this.progressInterval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            if (progressFill) {
                const percentage = Math.min(100, (elapsedTime / this.totalPostTime) * 100);
                progressFill.style.width = `${percentage}%`;
            }
            if (elapsedTime >= this.totalPostTime) {
                clearInterval(this.progressInterval);
            }
        }, 100);
    }

    applyBackgroundTheme() {
        const storyCard = this.element.querySelector('.story-card');
        if (!storyCard || !this.post.backgroundColor) return;
        const themes = { purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', blue: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', green: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', sunset: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', fire: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', cosmic: 'linear-gradient(135deg, #4481eb 0%, #04befe 100%)', earth: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)', night: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)' };
        storyCard.style.background = themes[this.post.backgroundColor] || themes.purple;
    }
    
    cleanup() {
        this.clearAllTimers();
        clearInterval(this.progressInterval);
    }

    async sharePost() {
        const shareData = { title: this.post.title, text: this.post.essence, url: this.post.source || window.location.href };
        try {
            if (navigator.share) await navigator.share(shareData);
            else alert('Web Share API is not supported in your browser.');
        } catch (err) {
            console.error('Error sharing:', err);
        }
    }
}
