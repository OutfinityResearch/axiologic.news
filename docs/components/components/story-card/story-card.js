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

        // Populate main slide essence
        const essenceElement = this.element.querySelector('.card-essence');
        if (essenceElement) essenceElement.textContent = this.post.essence;

        // Compute and set domain on badges (main + source)
        const domain = this.extractDomain(this.post.source) || 'Axiologic';
        const mainBadge = this.element.querySelector('.card-slide[data-id="main"] .card-badge');
        if (mainBadge) mainBadge.textContent = domain;
        const sourceBadge = this.element.querySelector('.card-slide[data-id="source"] .card-badge');
        if (sourceBadge) sourceBadge.textContent = domain;

        // Set relative time on both main and source slides
        const timeText = this.formatTimeAgo(this.post.publishedAt || this.post.generatedAt);
        const timeEls = this.element.querySelectorAll('.card-slide .card-time');
        timeEls.forEach(el => { if (el) el.textContent = timeText; });

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
        // Ensure height fits the maximum needed among all slides
        this.computeAndSetMaxHeight();
    }

    cleanup() {
        this.stopAutoPlay();
        if (this._onResize) {
            window.removeEventListener('resize', this._onResize);
            this._onResize = null;
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
        try {
            const isActive = this.element.classList.contains('active-card');
            const root = this.element.querySelector('.story-card');
            if (!isActive || !root || !slideEl) return;
            const content = slideEl.querySelector('.card-content');
            if (!content) return;
            const body = slideEl.querySelector('.card-body');

            // Temporarily allow natural sizing for accurate measurement
            const prevRootHeight = root.style.height;
            root.style.height = 'auto';
            const prevContentHeight = content.style.height;
            const prevBodyOverflow = body ? body.style.overflow : null;
            const prevBodyFlex = body ? body.style.flex : null;
            content.style.height = 'auto';
            if (body) {
                body.style.overflow = 'visible';
                body.style.flex = 'initial';
            }

            // Measure natural content height
            const contentHeight = Math.ceil(content.scrollHeight);

            // Restore styles
            content.style.height = prevContentHeight;
            if (body) {
                body.style.overflow = prevBodyOverflow;
                body.style.flex = prevBodyFlex;
            }
            const extras = 32; // top/bottom progress bars and spacing
            const total = contentHeight + extras;
            const maxH = Math.floor(window.innerHeight * 0.9);
            const finalH = Math.min(total, maxH);
            root.style.height = `${finalH}px`;

            // If content exceeds available height, allow vertical scroll in body for usability
            if (body) {
                if (total > maxH) {
                    body.style.overflowY = 'auto';
                } else {
                    body.style.overflowY = 'hidden';
                }
            }
            // Ensure we don't accidentally keep 'auto' from above
            if (prevRootHeight) {
                // keep the newly computed height; no need to restore
            }
        } catch (_) {
            // ignore
        }
    }

    computeAndSetMaxHeight() {
        try {
            const isActive = this.element.classList.contains('active-card');
            const root = this.element.querySelector('.story-card');
            if (!isActive || !root || !this.slides?.length) return;

            const extras = 32;
            const maxHViewport = Math.floor(window.innerHeight * 0.9);

            const prevRootHeight = root.style.height;
            root.style.height = 'auto';

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
                content.style.height = prevContentHeight;
                if (body) {
                    body.style.overflow = prevBodyOverflow;
                    body.style.flex = prevBodyFlex;
                }
            }

            const finalH = Math.min(maxTotal, maxHViewport);
            root.style.height = `${finalH}px`;

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
