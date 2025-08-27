export class StoryCard {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.currentSlide = 0;
        this.slides = [];
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.touchStartTarget = null;
        this.autoPlayTimeout = null;
        this.autoPlayDuration = 5000;
        this.autoplayEnabled = false; // Only enable after user swipe-left on essence
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
        // For selection card, shrink to content height
        if (this.storyIndex === 0) {
            this.element.classList.add('selection-card');
            this.adjustSelectionCardHeight();
            if (!this._onResizeSel) {
                this._onResizeSel = () => this.adjustSelectionCardHeight();
                window.addEventListener('resize', this._onResizeSel);
            }
        }
        
        // Show data sources selector on the first card
        if (this.storyIndex === 0) {
            this.setupDataSourcesSelector();
        }
        
        this.createMainContinuationSlidesIfNeeded();
        this.createReactionSlides();
        this.initializeSlides();
        this.setupSwipeGestures();
        this.setupIndicators();
        this.setupProgressBars();
        this.applyStoredViewProgress();
        // Do not start carousel here; the page will start it when the card becomes active

        // Recompute height on resize when active
        this._onResize = () => {
            this.computeAndSetMaxHeight();
        };
        window.addEventListener('resize', this._onResize);
        // Precompute stable height for all non-selection cards to prevent flicker
        if (this.storyIndex !== 0) {
            this.computeAndSetMaxHeight();
        }
    }

    adjustSelectionCardHeight() {
        try {
            const host = this.element; // <story-card>
            const root = this.element.querySelector('.story-card');
            const content = this.element.querySelector('.card-slide[data-id="main"] .card-content');
            if (!host || !root || !content) return;
            // Measure main content height
            const footerReserve = 40; // progress bar + sponsor inline space
            const h = Math.ceil(content.scrollHeight + footerReserve);
            host.style.aspectRatio = 'auto';
            host.style.height = h + 'px';
            // Ensure inner root matches host
            root.style.height = '100%';
            root.classList.add('selection-mode');
        } catch (_) { }
    }

    applyDynamicGradient() {
        const totalGradients = 30;
        const id = (this.post && this.post.id) ? String(this.post.id) : String(this.storyIndex);

        // Target the inner visual root for styling
        const root = this.element.querySelector('.story-card');
        if (!root) return;

        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = ((hash << 5) - hash) + id.charCodeAt(i);
        }

        // Get the last used gradients from global storage (avoid adjacent duplicates)
        window.lastUsedGradients = window.lastUsedGradients || [];

        // Calculate base gradient number from hash
        let gradientNumber = (Math.abs(hash) % totalGradients) + 1;

        // Ensure this gradient is different from the last few used
        const recentGradients = window.lastUsedGradients.slice(-3); // Check last 3 gradients
        let attempts = 0;
        const maxAttempts = 10;

        while (recentGradients.includes(gradientNumber) && attempts < maxAttempts) {
            // Try a different gradient
            gradientNumber = ((gradientNumber + Math.floor(Math.random() * 5) + 1) % totalGradients) + 1;
            attempts++;
        }

        // Store this gradient in history (cap size to keep memory tiny)
        window.lastUsedGradients.push(gradientNumber);
        if (window.lastUsedGradients.length > 5) {
            window.lastUsedGradients.shift();
        }

        // Apply attributes on the inner root so CSS matches
        root.setAttribute('data-bg', `gradient-${gradientNumber}`);

        // Additionally: choose a solid color variant and avoid adjacent repeats
        const totalColors = 12;
        window.lastUsedColors = window.lastUsedColors || [];
        let colorNumber = (Math.abs(hash >> 2) % totalColors) + 1;
        const recentColors = window.lastUsedColors.slice(-3);
        let colorAttempts = 0;
        while (recentColors.includes(colorNumber) && colorAttempts < 10) {
            colorNumber = ((colorNumber + Math.floor(Math.random() * 4) + 1) % totalColors) + 1;
            colorAttempts++;
        }
        window.lastUsedColors.push(colorNumber);
        if (window.lastUsedColors.length > 5) window.lastUsedColors.shift();
        root.setAttribute('data-color', `color-${colorNumber}`);

        // Subtle pattern variety
        // Visual flair: choose between texture (dots/lines) or gloss
        const variant = Math.abs(hash) % 3; // 0: gloss, 1: dots, 2: lines
        root.removeAttribute('data-pattern');
        if (variant === 0) {
            root.setAttribute('data-effect', 'gloss');
        } else {
            root.setAttribute('data-effect', 'texture');
            root.setAttribute('data-pattern', variant === 1 ? 'dots' : 'lines');
        }
    }

    populateContent() {
        // Populate all title elements (sanitized)
        const cleanTitle = this.sanitizeTitle(this.post.title);
        const titleElements = this.element.querySelectorAll('.card-title');
        titleElements.forEach(el => {
            if (el) el.textContent = cleanTitle;
        });

        // For first card, show welcome message instead of essence
        const essenceElement = this.element.querySelector('.card-essence');
        if (this.storyIndex === 0) {
            if (essenceElement) {
                essenceElement.textContent = 'Welcome to Axiologic News! Customize your news sources below:';
            }
            // Update the title for first card
            const titleElements = this.element.querySelectorAll('.card-title');
            titleElements.forEach(el => {
                if (el) el.textContent = 'Select News Sources';
            });
            // Hide badge and time on the main slide for the first card
            const mainHeader = this.element.querySelector('.card-slide[data-id="main"] .card-header');
            if (mainHeader) {
                const badge = mainHeader.querySelector('.card-badge');
                const time = mainHeader.querySelector('.card-time');
                if (badge) badge.style.display = 'none';
                if (time) time.style.display = 'none';
            }
        } else {
            // Populate main slide essence for other cards
            if (essenceElement) essenceElement.textContent = this.post.essence;
        }

        // Compute and set domain/time on badges only for non-first cards
        if (this.storyIndex !== 0) {
            const domain = this.extractDomain(this.post.source) || 'Axiologic';
            const mainBadge = this.element.querySelector('.card-slide[data-id="main"] .card-badge');
            if (mainBadge) mainBadge.textContent = domain;
            const sourceBadge = this.element.querySelector('.card-slide[data-id="source"] .card-badge');
            if (sourceBadge) sourceBadge.textContent = domain;

            const timeText = this.formatTimeAgo(this.post.publishedAt || this.post.generatedAt);
            const timeEls = this.element.querySelectorAll('.card-slide .card-time');
            timeEls.forEach(el => { if (el) el.textContent = timeText; });
        }

        // Populate source slide
        const sourceLink = this.element.querySelector('.source-link');
        if (sourceLink) sourceLink.href = this.post.source;

        // Populate sponsor if exists
        if (this.post.promoBanner) {
            const sponsorSection = this.element.querySelector('.sponsor-section');
            if (sponsorSection) {
                sponsorSection.innerHTML = '';
                sponsorSection.style.display = 'none';
            }
            // Also show a compact inline sponsor note above the resume bar (visible on all slides)
            const sponsorInline = this.element.querySelector('.sponsor-inline');
            if (sponsorInline) {
                sponsorInline.innerHTML = `
                    <a href="${this.post.promoBanner.url}" target="_blank" rel="noopener noreferrer">
                        <i class="fas fa-ad"></i>
                        <span>${this.post.promoBanner.text}</span>
                    </a>
                `;
            }
        } else {
            // Hide inline sponsor if none
            const sponsorInline = this.element.querySelector('.sponsor-inline');
            if (sponsorInline) sponsorInline.style.display = 'none';
        }
    }

    createReactionSlides() {
        if (!this.post.reactions || !Array.isArray(this.post.reactions)) return;

        const container = this.element.querySelector('.card-container');
        const sourceSlide = this.element.querySelector('[data-id="source"]');
        
        const cleanTitle = this.sanitizeTitle(this.post.title);
        this.post.reactions.forEach((reaction, index) => {
            // Extract heading from first up to 5 words if a colon appears
            let heading = `Perspective ${index + 1}`;
            let bodyText = reaction;
            try {
                const match = reaction.match(/^((?:\S+\s+){0,4}\S+)\s*:\s*(.*)$/);
                if (match && match[1]) {
                    heading = match[1].trim();
                    bodyText = match[2] !== undefined ? match[2].trim() : '';
                }
            } catch (_) {}

            const reactionSlide = document.createElement('div');
            reactionSlide.className = 'card-slide';
            reactionSlide.setAttribute('data-id', `reaction-${index}`);
            reactionSlide.innerHTML = `
                <div class="card-gradient-overlay"></div>
                <div class="card-content">
                    <div class="card-header">
                        <h2 class="card-title">${cleanTitle}</h2>
                        <div class="card-badge">${heading}</div>
                        </div>
                    <div class="card-body">
                        <p class="reaction-text">${bodyText}</p>
                    </div>
                </div>
            `;
            container.insertBefore(reactionSlide, sourceSlide);
        });
    }

    createMainContinuationSlidesIfNeeded() {
        try {
            const full = (this.post.essence || '').trim();
            const chunkSize = 500;
            if (!full || full.length <= chunkSize) return;

            const chunks = [];
            let pos = 0;
            const len = full.length;
            while (pos < len) {
                if (pos + chunkSize >= len) {
                    chunks.push(full.slice(pos).trim());
                    break;
                }
                const forwardStart = Math.min(len - 1, pos + chunkSize - 20);
                const forwardEnd = Math.min(len, pos + chunkSize + 300);
                const forwardSlice = full.slice(forwardStart, forwardEnd);
                const punctMatch = forwardSlice.match(/[\.\!\?]/);
                let splitIdx = -1;
                if (punctMatch && typeof punctMatch.index === 'number') {
                    splitIdx = forwardStart + punctMatch.index;
                } else {
                    // Try a backward search near chunkSize
                    const backStart = Math.max(pos + 200, pos);
                    const backEnd = Math.min(len, pos + chunkSize + 1);
                    const backSlice = full.slice(backStart, backEnd);
                    const lastDot = backSlice.lastIndexOf('.')
                    const lastExc = backSlice.lastIndexOf('!')
                    const lastQue = backSlice.lastIndexOf('?')
                    const lastPunct = Math.max(lastDot, lastExc, lastQue);
                    if (lastPunct !== -1) splitIdx = backStart + lastPunct;
                }
                if (splitIdx === -1) {
                    // Fallback to nearest space to avoid mid-word cuts
                    const spaceBack = full.lastIndexOf(' ', pos + chunkSize);
                    if (spaceBack !== -1 && spaceBack > pos + 200) {
                        splitIdx = spaceBack;
                    } else {
                        splitIdx = pos + chunkSize;
                    }
                }
                const piece = full.slice(pos, splitIdx + 1).trim();
                chunks.push(piece);
                pos = splitIdx + 1;
            }

            // Avoid tiny tail chunk
            if (chunks.length > 1 && chunks[chunks.length - 1].length < 60) {
                chunks[chunks.length - 2] += ' ' + chunks.pop();
            }

            // Update main slide with first chunk
            const mainEssenceEl = this.element.querySelector('.card-slide[data-id="main"] .card-essence');
            if (mainEssenceEl) mainEssenceEl.textContent = chunks[0] || '';

            // Build continuation slides for remaining chunks
            if (chunks.length <= 1) return;

            const cleanTitle = this.sanitizeTitle(this.post.title);
            const timeText = this.formatTimeAgo(this.post.publishedAt || this.post.generatedAt);
            const container = this.element.querySelector('.card-container');
            const mainSlide = this.element.querySelector('.card-slide[data-id="main"]');
            if (!container || !mainSlide) return;

            let insertAfter = mainSlide.nextSibling;
            for (let i = 1; i < chunks.length; i++) {
                const contSlide = document.createElement('div');
                contSlide.className = 'card-slide';
                contSlide.setAttribute('data-id', `main-continued-${i}`);
                contSlide.innerHTML = `
                    <div class=\"card-gradient-overlay\"></div>
                    <div class=\"card-content\">\n\
                        <div class=\"card-header\">\n\
                            <h2 class=\"card-title\">${cleanTitle}</h2>\n\
                            <div class=\"card-badge\">Story (continued)</div>\n\
                            <div class=\"card-time\">${timeText}</div>\n\
                        </div>\n\
                        <div class=\"card-body\">\n\
                            <p class=\"card-essence\">${chunks[i]}</p>\n\
                        </div>\n\
                    </div>`;
                if (insertAfter) {
                    container.insertBefore(contSlide, insertAfter);
                } else {
                    container.appendChild(contSlide);
                }
                insertAfter = contSlide.nextSibling;
            }
        } catch (_) {
            // ignore
        }
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
            this.touchStartTarget = e.target;
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
            this.touchStartTarget = e.target;
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
                // If swiping from first slide on essence area, enable autoplay from now on
                if (this.currentSlide === 0 && this.isStartOnEssence()) {
                    this.autoplayEnabled = true;
                }
                this.nextSlide();
            } else {
                // Swipe right - previous slide
                this.previousSlide();
            }
        }
    }

    isStartOnEssence() {
        try {
            if (!this.touchStartTarget) return false;
            const mainEssence = this.element.querySelector('.card-slide[data-id="main"] .card-essence');
            const mainBody = this.element.querySelector('.card-slide[data-id="main"] .card-body');
            return !!(this.touchStartTarget.closest && (
                (mainEssence && this.touchStartTarget.closest('.card-slide[data-id="main"] .card-essence')) ||
                (mainBody && this.touchStartTarget.closest('.card-slide[data-id="main"] .card-body'))
            ));
        } catch (_) {
            return false;
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

    setupProgressBars() {
        const bars = this.element.querySelector('.progress-bars');
        if (!bars) return;
        bars.innerHTML = '';
        bars.style.setProperty('--segments', this.slides.length);
        this.progressSegments = [];
        for (let i = 0; i < this.slides.length; i++) {
            const seg = document.createElement('div');
            seg.className = 'progress-segment';
            const fill = document.createElement('div');
            fill.className = 'progress-fill';
            seg.appendChild(fill);
            bars.appendChild(seg);
            this.progressSegments.push({ seg, fill });
        }
        this.resetProgressVisuals();
    }

    resetProgressVisuals() {
        if (!this.progressSegments) return;
        this.progressSegments.forEach((s, i) => {
            s.fill.style.transition = 'none';
            s.fill.style.width = i < this.currentSlide ? '100%' : '0%';
        });
        // Trigger reflow to apply next transition cleanly
        void this.element.offsetWidth;
        const current = this.progressSegments[this.currentSlide];
        if (current) {
            current.fill.style.transition = `width ${this.autoPlayDuration}ms linear`;
            current.fill.style.width = '0%';
        }
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

        // Update autoplay duration based on slide content size
        this.autoPlayDuration = this.computeDurationForSlide(this.slides[index]);

        // Update progress visuals for this slide
        this.resetProgressVisuals();
        // Start progress animation for current segment only if autoplay enabled
        if (this.autoplayEnabled) {
            const current = this.progressSegments && this.progressSegments[this.currentSlide];
            if (current) {
                current.fill.style.transition = `width ${this.autoPlayDuration}ms linear`;
                void current.fill.offsetWidth;
                current.fill.style.width = '100%';
            }
        }

        // Persist approximate viewing progress (slide-based)
        this.saveViewProgress(this.currentSlide / Math.max(1, this.slides.length));

        // Reset auto-play only if enabled
        if (this.autoplayEnabled) this.startAutoPlay();
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
        // Auto-advance after configured duration
        this.autoPlayTimeout = setTimeout(() => {
            this.nextSlide();
        }, this.autoPlayDuration);
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

        // Mark as fully viewed
        this.saveViewProgress(1);
    }

    startCarousel() {
        // Called by parent when story becomes active
        this.showSlide(0);
        // Do not start autoplay yet; wait for user swipe-left on essence
        // Height already precomputed for non-selection cards to avoid flicker
    }

    cleanup() {
        this.stopAutoPlay();
        if (this._onResize) {
            window.removeEventListener('resize', this._onResize);
            this._onResize = null;
        }
        if (this._onResizeSel) {
            window.removeEventListener('resize', this._onResizeSel);
            this._onResizeSel = null;
        }
    }

    extractDomain(url) {
        try {
            if (!url) return null;
            const u = new URL(url);
            return u.hostname.replace(/^www\./, '');
        } catch (_) {
            return this.post.feedName || null;
        }
    }

    formatTimeAgo(isoString) {
        try {
            if (!isoString) return '';
            const then = new Date(isoString).getTime();
            if (isNaN(then)) return '';
            const now = Date.now();
            let diff = Math.max(0, Math.floor((now - then) / 1000)); // seconds
            const units = [
                { s: 60, name: 'second' },
                { s: 60, name: 'minute' },
                { s: 24, name: 'hour' },
                { s: 30, name: 'day' },
                { s: 12, name: 'month' }
            ];
            let i = 0;
            let value = diff;
            for (; i < units.length && value >= units[i].s; i++) {
                value = Math.floor(value / units[i].s);
            }
            const names = ['second', 'minute', 'hour', 'day', 'month', 'year'];
            const name = names[i] || 'year';
            const v = Math.max(1, value);
            return `${v} ${name}${v > 1 ? 's' : ''} ago`;
        } catch (_) {
            return '';
        }
    }

    sanitizeTitle(str) {
        try {
            if (!str) return '';
            // Decode HTML entities using the browser
            const tmp = document.createElement('div');
            tmp.innerHTML = str;
            let text = tmp.textContent || tmp.innerText || '';
            // Normalize unicode punctuation to ASCII
            text = text
                .replace(/[\u2018\u2019\u2032]/g, "'")
                .replace(/[\u201C\u201D\u2033]/g, '"')
                .replace(/[\u2013\u2014]/g, '-')
                .replace(/\s+/g, ' ') // collapse whitespace
                .trim();
            // Remove dangling punctuation at end (common when titles are cut)
            text = text.replace(/[\-:\u2013\u2014]+$/g, '').trim();
            return text;
        } catch (_) {
            return String(str || '');
        }
    }

    computeDurationForSlide(slideEl) {
        try {
            // Base time and per-word pacing
            const baseMs = 2500; // base 2.5s
            const perWordMs = 220; // ~200–250ms per word reading pace
            const minMs = 3000;
            const maxMs = 12000; // cap at 12s per slide

            if (!slideEl) return 5000;
            const textContainer = slideEl.querySelector('.reaction-text, .card-essence, .source-text');
            const text = (textContainer?.textContent || '').trim();
            if (!text) return 4000;
            const words = text.split(/\s+/).filter(Boolean);
            const est = baseMs + (words.length * perWordMs);
            return Math.max(minMs, Math.min(maxMs, est));
        } catch (_) {
            return 5000;
        }
    }

    adjustHeightForSlide(slideEl) {
        try { return; } catch (_) { }
    }

    computeAndSetMaxHeight() {
        try {
            if (this._fixedHeight) return; // already computed and fixed
            if (this.storyIndex === 0) return; // selection card handled separately
            const root = this.element.querySelector('.story-card');
            if (!root || !this.slides?.length) return;
            const extras = 34; // compact reserve for progress + sponsor
            const maxHViewport = Math.floor(window.innerHeight * 0.92); // allow a bit more for larger fonts

            // Measure max content height across slides without transitions
            let maxTotal = 0;
            for (const slideEl of this.slides) {
                const content = slideEl.querySelector('.card-content');
                if (!content) continue;
                const body = slideEl.querySelector('.card-body');

                const prevContentHeight = content.style.height;
                const prevBodyOverflow = body ? body.style.overflow : null;
                const prevBodyFlex = body ? body.style.flex : null;

                content.style.height = 'auto';
                if (body) {
                    body.style.overflow = 'visible';
                    body.style.flex = 'initial';
                }

                const contentHeight = Math.ceil(content.scrollHeight);
                const total = contentHeight + extras;
                if (total > maxTotal) maxTotal = total;

                // Restore
                content.style.height = prevContentHeight;
                if (body) {
                    body.style.overflow = prevBodyOverflow;
                    body.style.flex = prevBodyFlex;
                }
            }

            const finalH = Math.min(maxTotal, maxHViewport);
            root.style.height = `${finalH}px`;
            this._fixedHeight = true;

            const capApplied = maxTotal > maxHViewport;
            const bodies = this.element.querySelectorAll('.card-body');
            bodies.forEach(b => {
                b.style.overflowY = capApplied ? 'auto' : 'hidden';
            });
        } catch (_) { /* ignore */ }
    }

    async applyStoredViewProgress() {
        try {
            const root = this.element.querySelector('.story-card');
            if (!root || !this.post?.id) return;
            const map = await window.LocalStorage.get('postProgress') || {};
            const entry = map[this.post.id];
            const pct = entry && typeof entry.progress === 'number' ? Math.max(0, Math.min(1, entry.progress)) : 0;
            root.style.setProperty('--view-progress', `${Math.round(pct * 100)}%`);
        } catch (e) {
            // ignore
        }
    }

    async setupDataSourcesSelector() {
        const selector = this.element.querySelector('.data-sources-selector');
        if (!selector) return;
        
        // Show the selector
        selector.style.display = 'block';
        
        // Hide the essence paragraph
        const essenceElement = this.element.querySelector('.card-essence');
        if (essenceElement) essenceElement.style.display = 'none';
        
        const sourcesList = selector.querySelector('.sources-list');
        const applyBtn = selector.querySelector('.apply-sources-btn');
        const selectAllBtn = selector.querySelector('.select-all-btn');
        const clearAllBtn = selector.querySelector('.clear-all-btn');
        const addSourceBtn = selector.querySelector('.add-source-btn');
        if (applyBtn) applyBtn.style.display = 'none';
        
        // Get available sources
        const availableSources = [
            { id: 'default', name: 'Default' },
            { id: 'ai', name: 'AI' },
            { id: 'marketing', name: 'Marketing' },
            { id: 'tech', name: 'Technology' },
            { id: 'science', name: 'Science' },
            { id: 'business', name: 'Business' },
            { id: 'health', name: 'Health' },
            { id: 'world', name: 'World News' }
        ];
        
        // Get currently selected sources
        const selected = await window.LocalStorage.get('selectedSourceCategories') || ['default'];
        const externalSources = await window.LocalStorage.get('externalPostSources') || [];
        
        // Debug: Log what we're getting from storage
        console.log('External sources from storage:', externalSources);
        
        // Ensure externalSources is an array
        const externalSourcesArray = Array.isArray(externalSources) ? externalSources : [];
        const externalUrls = externalSourcesArray.map(s => s && s.url ? s.url : '').filter(Boolean);
        const selectedExternal = await window.LocalStorage.get('selectedExternalPostsUrls') || [];
        const selectedExtSet = new Set(Array.isArray(selectedExternal) ? selectedExternal : []);
        const initialSelected = new Set([
            ...selected,
            ...Array.from(selectedExtSet).map(u => `url:${encodeURIComponent(u)}`)
        ]);
        
        // Populate sources list
        sourcesList.innerHTML = '';
        const onChange = () => {
            try {
                const current = [];
                sourcesList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    if (cb.checked) {
                        const id = cb.id.replace('source-', '');
                        current.push(id);
                    }
                });
                // Determine if changed
                const changed = current.length !== initialSelected.size || current.some(id => !initialSelected.has(id));
                if (applyBtn) applyBtn.style.display = changed ? 'block' : 'none';
            } catch (_) {}
        };

        availableSources.forEach(source => {
            const sourceItem = document.createElement('div');
            sourceItem.className = 'source-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'source-checkbox';
            checkbox.id = `source-${source.id}`;
            checkbox.checked = selected.includes(source.id);
            
            const label = document.createElement('label');
            label.className = 'source-label';
            label.htmlFor = `source-${source.id}`;
            label.textContent = source.name;
            
            sourceItem.appendChild(checkbox);
            sourceItem.appendChild(label);
            sourcesList.appendChild(sourceItem);
            
            // Make the whole item clickable
            sourceItem.addEventListener('click', (e) => {
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                }
                onChange();
            });
            checkbox.addEventListener('change', onChange);
        });

        // External URLs appended after categories
        console.log('Processing external sources:', externalSourcesArray);
        externalSourcesArray.forEach(source => {
            const url = source.url;
            const tag = source.tag || '';
            const sourceItem = document.createElement('div');
            sourceItem.className = 'source-item';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'source-checkbox';
            const encoded = encodeURIComponent(url);
            checkbox.id = `source-url:${encoded}`;
            checkbox.checked = selectedExtSet.has(url);
            const label = document.createElement('label');
            label.className = 'source-label';
            label.htmlFor = `source-url:${encoded}`;
            let display = tag;
            if (!display || display.length === 0) {
                display = url;
                try { const u = new URL(url); display = u.hostname.replace(/^www\./,''); } catch {}
            } else {
                // Add # prefix to tag for display
                display = '#' + tag;
            }
            label.textContent = display;
            sourceItem.appendChild(checkbox);
            sourceItem.appendChild(label);
            sourcesList.appendChild(sourceItem);
            sourceItem.addEventListener('click', (e) => {
                if (e.target !== checkbox) checkbox.checked = !checkbox.checked;
                onChange();
            });
            checkbox.addEventListener('change', onChange);
        });

        // Add handler for Add Source button
        if (addSourceBtn) {
            addSourceBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    const res = await window.webSkel.showModal('add-external-source-modal', {}, true);
                    const data = res && res.data;
                    if (!data || !data.url) return;
                    const tag = (data.tag || '').trim();
                    const existing = await window.LocalStorage.get('externalPostSources') || [];
                    if (existing.find(s => s && s.url === data.url)) return;
                    existing.push({ url: data.url, tag });
                    await window.LocalStorage.set('externalPostSources', existing);
                    const selectedExternal = await window.LocalStorage.get('selectedExternalPostsUrls') || [];
                    if (!selectedExternal.includes(data.url)) {
                        selectedExternal.push(data.url);
                        await window.LocalStorage.set('selectedExternalPostsUrls', selectedExternal);
                    }
                    this.setupDataSourcesSelector();
                } catch (err) {
                    console.error('Add external source failed:', err);
                }
            });
        }

        // Add handlers for select all / clear all
        if (selectAllBtn) selectAllBtn.addEventListener('click', () => {
            sourcesList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
            onChange();
        });
        if (clearAllBtn) clearAllBtn.addEventListener('click', () => {
            sourcesList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            onChange();
        });
        
        // Actions removed (Select all / Clear all)

        // Handle apply button
        applyBtn.addEventListener('click', async () => {
            const newCategories = [];
            availableSources.forEach(source => {
                const checkbox = document.getElementById(`source-${source.id}`);
                if (checkbox && checkbox.checked) newCategories.push(source.id);
            });
            const newExternal = [];
            externalSourcesArray.forEach(source => {
                if (source && source.url) {
                    const encoded = encodeURIComponent(source.url);
                    const cb = document.getElementById(`source-url:${encoded}`);
                    if (cb && cb.checked) newExternal.push(source.url);
                }
            });

            await window.LocalStorage.set('selectedSourceCategories', newCategories);
            await window.LocalStorage.set('selectedExternalPostsUrls', newExternal);

            try { await window.LocalStorage.set('jumpToFirstNews', true); } catch (_) {}
            await window.webSkel.changeToDynamicPage('news-feed-page', 'app');
        });


    }

    async saveViewProgress(progress) {
        try {
            if (!this.post?.id) return;
            const pct = Math.max(0, Math.min(1, progress || 0));
            const map = await window.LocalStorage.get('postProgress') || {};
            const prev = map[this.post.id]?.progress || 0;
            const next = Math.max(prev, pct); // never decrease
            map[this.post.id] = {
                progress: next,
                lastViewedAt: new Date().toISOString(),
                slideIndex: this.currentSlide || 0,
                totalSlides: this.slides?.length || 1
            };
            await window.LocalStorage.set('postProgress', map);

            // Reflect immediately in bottom resume bar
            const root = this.element.querySelector('.story-card');
            if (root) root.style.setProperty('--view-progress', `${Math.round(next * 100)}%`);
        } catch (e) {
            // ignore
        }
    }
}
