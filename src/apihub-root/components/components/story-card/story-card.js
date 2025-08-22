export class StoryCard {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.carouselInterval = null;
        this.currentSlide = 0;
        this.slides = [];
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.progressInterval = null;
        this.slideTimings = [];
        this.totalPostTime = 0;
        this.elapsedPostTime = 0;
        this.currentSlideStartTime = 0;
        this.invalidate();
    }

    beforeRender() {
        this.post = this.element.post;
        this.storyIndex = this.element.storyIndex;
        this.totalStories = this.element.totalStories;
    }

    afterRender() {
        if (!this.post) {
            return;
        }

        // Update story counter
        const currentStoryElement = this.element.querySelector('.current-story');
        const totalStoriesElement = this.element.querySelector('.total-stories');
        if (currentStoryElement) {
            currentStoryElement.textContent = this.storyIndex + 1;
        }
        if (totalStoriesElement) {
            totalStoriesElement.textContent = this.totalStories;
        }

        // Apply background color theme
        this.applyBackgroundTheme();

        const titleElement = this.element.querySelector('.title');
        const essenceElement = this.element.querySelector('.essence');
        const sourceLinkElement = this.element.querySelector('.source-link');
        
        if (titleElement) {
            titleElement.textContent = this.post.title;
            if (webSkel.robustTextService) {
                webSkel.robustTextService.fitTextInContainer(titleElement, {
                    maxFontSize: 75,
                    minFontSize: 28,
                    enableHyphenation: false,
                    optimizeJustification: false
                });
            } else {
                webSkel.textService.adjustFontSize(titleElement);
            }
        }
        if (essenceElement) {
            essenceElement.textContent = this.post.essence;
            if (webSkel.robustTextService) {
                webSkel.robustTextService.fitTextInContainer(essenceElement, {
                    maxFontSize: 45,
                    minFontSize: 20,
                    enableHyphenation: false,
                    optimizeJustification: true
                });
            } else {
                webSkel.textService.adjustFontSize(essenceElement);
            }
        }
        if (sourceLinkElement) sourceLinkElement.href = this.post.source;

        const carousel = this.element.querySelector('.carousel-container');
        const sourceSlide = this.element.querySelector('.carousel-slide[data-id="source"]');

        if (carousel && sourceSlide) {
            this.element.querySelectorAll('.reaction-slide').forEach(slide => slide.remove());

            if (this.post.reactions && Array.isArray(this.post.reactions)) {
                this.post.reactions.forEach((reaction, index) => {
                    const reactionSlide = document.createElement('div');
                    reactionSlide.classList.add('carousel-slide', 'reaction-slide');
                    reactionSlide.setAttribute('data-id', `reaction-${index}`);
                    reactionSlide.innerHTML = `
                        <div class="content-panel">
                            <div class="reaction-title">Reaction #${index + 1}</div>
                            <p class="reaction"></p>
                        </div>`;
                    const reactionTextElement = reactionSlide.querySelector('.reaction');
                    reactionTextElement.textContent = reaction;
                    if (webSkel.robustTextService) {
                        webSkel.robustTextService.fitTextInContainer(reactionTextElement, {
                            maxFontSize: 38,
                            minFontSize: 18,
                            enableHyphenation: false,
                            optimizeJustification: true
                        });
                    } else {
                        webSkel.textService.adjustFontSize(reactionTextElement);
                    }
                    carousel.insertBefore(reactionSlide, sourceSlide);
                });
            }
        }
        
        this.slides = Array.from(this.element.querySelectorAll('.carousel-slide'));
        this.setupIndicators();
        this.setupNavigation();
        this.setupSwipeGestures();
        this.setupProgressBar();
        
        this.currentSlide = 0;
        this.showSlide(0);
    }
    
    setupProgressBar() {
        const progressWrapper = this.element.querySelector('.progress-bar-wrapper');
        if (!progressWrapper) return;

        // Calculate timings for all slides
        const userSpeed = localStorage.getItem('readingSpeed') || 'normal';
        if (webSkel.robustTextService) {
            this.slideTimings = webSkel.robustTextService.calculateSlideTimings(this.slides);
            
            if (userSpeed !== 'normal') {
                const speedConfig = webSkel.robustTextService.getAdaptiveReadingSpeed(userSpeed);
                const speedMultiplier = 200 / speedConfig.wordsPerMinute;
                this.slideTimings = this.slideTimings.map(time => time * speedMultiplier);
            }
        } else {
            this.slideTimings = this.slides.map(() => 3000);
        }
        
        this.totalPostTime = this.slideTimings.reduce((sum, time) => sum + time, 0);
        const totalSeconds = Math.ceil(this.totalPostTime / 1000);

        // Create dots for each second
        for (let i = 0; i <= totalSeconds; i++) {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            const position = (i / totalSeconds) * 100;
            dot.style.left = `${position}%`;
            progressWrapper.appendChild(dot);
        }
        
        // Click on progress bar to seek
        progressWrapper.addEventListener('click', (e) => {
            const rect = progressWrapper.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const targetTime = percentage * this.totalPostTime;
            
            // Find which slide contains this time
            let cumulativeTime = 0;
            for (let i = 0; i < this.slideTimings.length; i++) {
                if (cumulativeTime + this.slideTimings[i] > targetTime) {
                    this.goToSlide(i);
                    break;
                }
                cumulativeTime += this.slideTimings[i];
            }
        });
    }
    
    setupIndicators() {
        const indicatorsContainer = this.element.querySelector('.carousel-indicators');
        if (!indicatorsContainer) return;
        
        indicatorsContainer.innerHTML = '';
        this.slides.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.classList.add('carousel-indicator');
            if (index === 0) indicator.classList.add('active');
            indicator.addEventListener('click', () => this.goToSlide(index));
            indicatorsContainer.appendChild(indicator);
        });
    }
    
    setupNavigation() {
        const leftBtn = this.element.querySelector('.carousel-nav-left');
        const rightBtn = this.element.querySelector('.carousel-nav-right');
        
        if (leftBtn) {
            leftBtn.addEventListener('click', () => this.previousSlide());
        }
        
        if (rightBtn) {
            rightBtn.addEventListener('click', () => this.nextSlide());
        }
    }
    
    setupSwipeGestures() {
        const container = this.element.querySelector('.carousel-wrapper');
        if (!container) return;
        
        container.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        });
        
        container.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });
        
        let mouseDown = false;
        container.addEventListener('mousedown', (e) => {
            mouseDown = true;
            this.touchStartX = e.screenX;
        });
        
        container.addEventListener('mouseup', (e) => {
            if (mouseDown) {
                this.touchEndX = e.screenX;
                this.handleSwipe();
                mouseDown = false;
            }
        });
        
        container.addEventListener('mouseleave', () => {
            mouseDown = false;
        });
    }
    
    handleSwipe() {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                this.nextSlide();
            } else {
                this.previousSlide();
            }
        }
    }
    
    showSlide(index) {
        this.slides.forEach(slide => slide.classList.remove('active'));
        
        if (this.slides[index]) {
            this.slides[index].classList.add('active');
            this.updateSlideInfo(index);
        }
        
        const indicators = this.element.querySelectorAll('.carousel-indicator');
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });
    }
    
    updateSlideInfo(slideIndex) {
        const slideNameEl = this.element.querySelector('.current-slide-name');
        const slide = this.slides[slideIndex];
        
        if (slideNameEl && slide) {
            const slideId = slide.dataset.id;
            let slideName = 'Slide';
            
            if (slideId === 'title') {
                slideName = 'Title';
            } else if (slideId === 'essence') {
                slideName = 'Essence';
            } else if (slideId === 'source') {
                slideName = 'Source';
            } else if (slide.classList.contains('reaction-slide')) {
                const reactionTitle = slide.querySelector('.reaction-title');
                slideName = reactionTitle ? reactionTitle.textContent : 'Reaction';
            }
            
            slideNameEl.textContent = slideName;
        }
    }
    
    goToSlide(index) {
        this.currentSlide = index;
        this.showSlide(index);
        if (this.carouselInterval) {
            clearTimeout(this.carouselInterval);
            
            const userSpeed = localStorage.getItem('readingSpeed') || 'normal';
            let slideTimings = [];
            
            if (webSkel.robustTextService) {
                slideTimings = webSkel.robustTextService.calculateSlideTimings(this.slides);
                
                if (userSpeed !== 'normal') {
                    const speedConfig = webSkel.robustTextService.getAdaptiveReadingSpeed(userSpeed);
                    const speedMultiplier = 200 / speedConfig.wordsPerMinute;
                    slideTimings = slideTimings.map(time => time * speedMultiplier);
                }
            } else {
                slideTimings = this.slides.map(() => 3000);
            }
            
            const scheduleNext = () => {
                const currentTiming = slideTimings[this.currentSlide] || 3000;
                
                this.carouselInterval = setTimeout(() => {
                    this.nextSlide();
                    if (this.currentSlide !== 0) {
                        scheduleNext();
                    }
                }, currentTiming);
            };
            
            scheduleNext();
        }
    }
    
    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.showSlide(this.currentSlide);
        
        if (this.currentSlide === 0) {
            this.element.dispatchEvent(new CustomEvent('story-finished', { bubbles: true }));
        }
    }
    
    previousSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.showSlide(this.currentSlide);
    }

    startCarousel() {
        if (!this.slides || this.slides.length === 0) return;
        
        clearTimeout(this.carouselInterval);
        clearInterval(this.progressInterval);
        
        this.currentSlide = 0;
        this.showSlide(0);
        
        // Start the total post timer
        this.startPostTimer();
        
        const scheduleNext = () => {
            const currentTiming = this.slideTimings[this.currentSlide] || 3000;
            
            this.carouselInterval = setTimeout(() => {
                this.nextSlide();
                if (this.currentSlide !== 0) {
                    scheduleNext();
                }
            }, currentTiming);
        };
        
        scheduleNext();
    }
    
    startPostTimer() {
        clearInterval(this.progressInterval);
        
        const startTime = Date.now();
        const progressFill = this.element.querySelector('.progress-bar-fill');
        
        // Update timer every 100ms for smooth progress
        this.progressInterval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            
            // Update progress bar fill smoothly
            if (progressFill) {
                const progressPercentage = (elapsedTime / this.totalPostTime) * 100;
                progressFill.style.width = `${Math.min(100, progressPercentage)}%`;
            }
            
            if (elapsedTime >= this.totalPostTime) {
                clearInterval(this.progressInterval);
            }
        }, 100);
    }

    applyBackgroundTheme() {
        const storyCard = this.element.querySelector('.story-card');
        if (!storyCard || !this.post.backgroundColor) return;
        
        const themes = {
            purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            blue: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            green: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            sunset: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            fire: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            cosmic: 'linear-gradient(135deg, #4481eb 0%, #04befe 100%)',
            earth: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
            night: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)'
        };
        
        const selectedTheme = themes[this.post.backgroundColor] || themes.purple;
        storyCard.style.background = selectedTheme;
        storyCard.style.animation = 'none'; // Stop gradient animation
    }
    
    cleanup() {
        clearTimeout(this.carouselInterval);
        clearInterval(this.progressInterval);
    }
}
