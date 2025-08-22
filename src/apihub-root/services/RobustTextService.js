export class RobustTextService {
    static calculateOptimalFontSize(element, options = {}) {
        if (!element || !element.parentElement) {
            return;
        }

        const defaults = {
            maxFontSize: 70,
            minFontSize: 16,
            lineHeightRatio: 1.3, /* Slightly increased for better readability */
            padding: 15, /* Increased default padding */
            enableHyphenation: false,
            optimizeJustification: true,
            adjustContainer: true
        };

        const config = { ...defaults, ...options };
        const container = element.parentElement;
        const style = getComputedStyle(container);

        // Adjust container size based on text amount if enabled
        if (config.adjustContainer && container.classList.contains('content-panel')) {
            const textLength = (element.textContent || '').length;
            if (textLength > 400) {
                container.style.maxHeight = '75vh';
                container.style.height = 'auto';
                container.style.minHeight = '350px';
            } else if (textLength > 250) {
                container.style.maxHeight = '65vh';
                container.style.height = 'auto';
                container.style.minHeight = '280px';
            } else if (textLength > 150) {
                container.style.maxHeight = '55vh';
                container.style.height = 'auto';
                container.style.minHeight = '220px';
            } else {
                container.style.maxHeight = '45vh';
                container.style.height = 'auto';
                container.style.minHeight = '180px';
            }
        }
        
        const availableWidth = container.clientWidth - (parseFloat(style.paddingLeft) + parseFloat(style.paddingRight));
        const availableHeight = container.clientHeight - (parseFloat(style.paddingTop) + parseFloat(style.paddingBottom));
        
        const text = element.textContent || '';
        const wordCount = text.split(/\s+/).length;
        const charCount = text.length;
        const avgWordLength = charCount / wordCount;
        
        const testDiv = document.createElement('div');
        testDiv.style.position = 'absolute';
        testDiv.style.visibility = 'hidden';
        testDiv.style.width = `${availableWidth}px`;
        testDiv.style.padding = '0';
        testDiv.style.margin = '0';
        testDiv.style.whiteSpace = 'normal';
        testDiv.style.wordBreak = 'keep-all';
        testDiv.style.overflowWrap = 'normal';
        testDiv.style.boxSizing = 'border-box';
        testDiv.textContent = text;
        document.body.appendChild(testDiv);

        let optimalFontSize = config.maxFontSize;
        let lastValidSize = config.minFontSize;
        let low = config.minFontSize;
        let high = config.maxFontSize;
        
        // Binary search for the best font size
        while (high - low > 0.5) {
            const mid = (low + high) / 2;
            testDiv.style.fontSize = `${mid}px`;
            testDiv.style.lineHeight = `${mid * config.lineHeightRatio}px`;
            
            if (testDiv.scrollHeight <= availableHeight && testDiv.scrollWidth <= availableWidth) {
                lastValidSize = mid;
                low = mid;
            } else {
                high = mid;
            }
        }
        
        optimalFontSize = lastValidSize;
        document.body.removeChild(testDiv);
        
        element.style.fontSize = `${optimalFontSize}px`;
        element.style.lineHeight = `${optimalFontSize * config.lineHeightRatio}px`;
        
        this.applyOptimalTextJustification(element, {
            charCount,
            wordCount,
            avgWordLength,
            fontSize: optimalFontSize,
            containerWidth: availableWidth,
            enableHyphenation: config.enableHyphenation,
            optimizeJustification: config.optimizeJustification
        });
        
        return optimalFontSize;
    }

    static applyOptimalTextJustification(element, metrics) {
        const isTitle = element.classList.contains('title');
        const isShortText = metrics.charCount < 100;
        const avgLineChars = metrics.containerWidth / (metrics.fontSize * 0.5);
        
        // Reset all text styles first
        element.style.textAlign = 'left';
        element.style.wordSpacing = 'normal';
        element.style.letterSpacing = 'normal';
        element.style.hyphens = 'none';
        element.style.wordBreak = 'keep-all';  // Never break words
        element.style.wordWrap = 'normal';
        element.style.overflowWrap = 'normal';
        element.style.whiteSpace = 'normal';
        
        if (isTitle) {
            element.style.textAlign = 'center';
            element.style.letterSpacing = '-0.02em';
            element.style.wordBreak = 'keep-all';  // Keep words intact
            element.style.overflowWrap = 'normal';
            element.style.whiteSpace = 'normal';
            element.style.lineBreak = 'strict';
        } else if (isShortText) {
            element.style.textAlign = 'center';
            element.style.wordBreak = 'keep-all';  // Keep words intact
            element.style.overflowWrap = 'normal';
        } else {
            const wordsPerLine = avgLineChars / (metrics.avgWordLength + 1);
            
            if (wordsPerLine >= 6 && metrics.optimizeJustification) {
                element.style.textAlign = 'justify';
                element.style.textJustify = 'inter-word';
                
                const wordSpacingOptimal = Math.min(0.1, 0.5 / wordsPerLine);
                element.style.wordSpacing = `${wordSpacingOptimal}em`;
                
                if (metrics.enableHyphenation && wordsPerLine < 12) {
                    element.style.hyphens = 'manual';
                    element.style.hyphenateCharacter = '‐';
                    element.style.webkitHyphens = 'manual';
                    element.style.msHyphens = 'manual';
                    element.style.mozHyphens = 'manual';
                    
                    if (!element.hasAttribute('lang')) {
                        element.setAttribute('lang', 'en');
                    }
                }
                
                element.style.wordBreak = 'keep-all';  // Keep words intact
                element.style.overflowWrap = 'normal';
                element.style.whiteSpace = 'normal';
                
                element.style.textAlignLast = 'left';
            } else if (wordsPerLine >= 4) {
                element.style.textAlign = 'left';
                element.style.wordBreak = 'keep-all';  // Keep words intact
                element.style.overflowWrap = 'normal';
                element.style.whiteSpace = 'normal';
            } else {
                element.style.textAlign = 'center';
                element.style.wordBreak = 'keep-all';  // Keep words intact
                element.style.overflowWrap = 'normal';
                element.style.whiteSpace = 'normal';
            }
        }
        
        element.style.textRendering = 'optimizeLegibility';
        element.style.webkitFontSmoothing = 'antialiased';
        element.style.mozOsxFontSmoothing = 'grayscale';
    }

    static calculateTextMetrics(text, fontSize, fontFamily = 'Inter') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${fontSize}px ${fontFamily}`;
        
        const lines = text.split('\n');
        let maxWidth = 0;
        let totalHeight = 0;
        
        lines.forEach(line => {
            const metrics = context.measureText(line);
            maxWidth = Math.max(maxWidth, metrics.width);
            totalHeight += fontSize * 1.4;
        });
        
        return {
            width: maxWidth,
            height: totalHeight,
            lineHeight: fontSize * 1.4,
            averageCharWidth: maxWidth / text.length
        };
    }

    static fitTextInContainer(element, options = {}) {
        const config = {
            maxIterations: 20,
            precision: 0.5,
            maintainAspectRatio: true,
            ...options
        };
        
        const container = element.parentElement;
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        const aspectRatio = containerRect.width / containerRect.height;
        
        let fontSize = this.calculateOptimalFontSize(element, {
            ...config,
            maxFontSize: Math.min(containerRect.height / 2, config.maxFontSize || 50)
        });
        
        if (config.maintainAspectRatio && aspectRatio > 1.5) {
            const textMetrics = this.calculateTextMetrics(
                element.textContent,
                fontSize,
                getComputedStyle(element).fontFamily
            );
            
            if (textMetrics.width / textMetrics.height < aspectRatio * 0.8) {
                fontSize *= 1.1;
                element.style.fontSize = `${fontSize}px`;
            }
        }
        
        return fontSize;
    }

    static applyResponsiveTypography(element) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const isMobile = viewportWidth <= 768;
        
        const baseSize = isMobile ? 16 : 18;
        const scaleFactor = Math.min(viewportWidth / 375, viewportHeight / 667);
        
        const config = {
            maxFontSize: baseSize * 3 * scaleFactor,
            minFontSize: baseSize * 0.75,
            lineHeightRatio: isMobile ? 1.5 : 1.6,
            padding: isMobile ? 15 : 30,
            enableHyphenation: !isMobile,
            optimizeJustification: true
        };
        
        return this.calculateOptimalFontSize(element, config);
    }

    static watchAndAdjust(element, options = {}) {
        const config = {
            debounceTime: 150,
            observeContent: true,
            observeResize: true,
            ...options
        };
        
        let debounceTimer;
        const adjust = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.fitTextInContainer(element, config);
            }, config.debounceTime);
        };
        
        if (config.observeResize) {
            if (typeof ResizeObserver !== 'undefined') {
                const resizeObserver = new ResizeObserver(adjust);
                resizeObserver.observe(element.parentElement);
                
                element._resizeObserver = resizeObserver;
            } else {
                window.addEventListener('resize', adjust);
                element._resizeHandler = adjust;
            }
        }
        
        if (config.observeContent) {
            const mutationObserver = new MutationObserver(adjust);
            mutationObserver.observe(element, {
                characterData: true,
                childList: true,
                subtree: true
            });
            
            element._mutationObserver = mutationObserver;
        }
        
        adjust();
        
        return () => {
            if (element._resizeObserver) {
                element._resizeObserver.disconnect();
            }
            if (element._resizeHandler) {
                window.removeEventListener('resize', element._resizeHandler);
            }
            if (element._mutationObserver) {
                element._mutationObserver.disconnect();
            }
        };
    }

    static cleanup(element) {
        if (element._resizeObserver) {
            element._resizeObserver.disconnect();
            delete element._resizeObserver;
        }
        if (element._resizeHandler) {
            window.removeEventListener('resize', element._resizeHandler);
            delete element._resizeHandler;
        }
        if (element._mutationObserver) {
            element._mutationObserver.disconnect();
            delete element._mutationObserver;
        }
    }

    static calculateReadingTime(text, options = {}) {
        const defaults = {
            wordsPerMinute: 220, // Adjusted to a more common average reading speed
            minDuration: 3000,   // Minimum 3 seconds per slide
            maxDuration: 20000,  // Maximum 20 seconds per slide
            baseTime: 1500       // Base time to allow for context switching
        };
        
        const config = { ...defaults, ...options };
        
        if (!text || text.trim().length === 0) {
            return config.minDuration;
        }
        
        const words = text.trim().split(/\s+/);
        const wordCount = words.length;
        
        // Calculate raw reading time
        const readingTimeMs = (wordCount / config.wordsPerMinute) * 60 * 1000;
        
        const totalTime = config.baseTime + readingTimeMs;
        
        // Clamp the result between min and max duration
        return Math.min(Math.max(totalTime, config.minDuration), config.maxDuration);
    }

    static calculateSlideTimings(slides) {
        const timings = [];
        
        slides.forEach((slide, index) => {
            let text = '';
            let slideType = 'default';
            
            if (slide.classList.contains('title-slide') || slide.querySelector('.title')) {
                const titleEl = slide.querySelector('.title');
                text = titleEl ? titleEl.textContent : slide.textContent;
                slideType = 'title';
            } else if (slide.classList.contains('essence-slide') || slide.querySelector('.essence')) {
                const essenceEl = slide.querySelector('.essence');
                text = essenceEl ? essenceEl.textContent : slide.textContent;
                slideType = 'essence';
            } else if (slide.classList.contains('reaction-slide') || slide.querySelector('.reaction')) {
                const reactionEl = slide.querySelector('.reaction');
                text = reactionEl ? reactionEl.textContent : slide.textContent;
                slideType = 'reaction';
            } else if (slide.classList.contains('source-slide') || slide.querySelector('.source-link')) {
                text = 'View Source';
                slideType = 'source';
            } else {
                text = slide.textContent || '';
            }
            
            const baseOptions = {
                wordsPerMinute: 200,
                minDuration: 2500,
                maxDuration: 12000
            };
            
            switch(slideType) {
                case 'title':
                    timings.push(this.calculateReadingTime(text, {
                        ...baseOptions,
                        wordsPerMinute: 200, // Slower reading for titles
                        minDuration: 4000,   // Minimum 4 seconds for titles
                        maxDuration: 8000,   // Maximum 8 seconds for titles
                        baseTime: 2500
                    }));
                    break;
                case 'essence':
                    timings.push(this.calculateReadingTime(text, {
                        ...baseOptions,
                        wordsPerMinute: 180, // Slower for essence
                        minDuration: 5000,   // Minimum 5 seconds
                        maxDuration: 15000,  // Maximum 15 seconds for long essence
                        baseTime: 2000
                    }));
                    break;
                case 'reaction':
                    timings.push(this.calculateReadingTime(text, {
                        ...baseOptions,
                        wordsPerMinute: 180, // Same speed as essence
                        minDuration: 4500,   // Minimum 4.5 seconds
                        maxDuration: 12000,  // Maximum 12 seconds
                        baseTime: 2000
                    }));
                    break;
                case 'source':
                    timings.push(10000); // Fixed 10 seconds for source slide (as requested)
                    break;
                default:
                    timings.push(this.calculateReadingTime(text, {
                        ...baseOptions,
                        minDuration: 4000,
                        maxDuration: 10000
                    }));
            }
        });
        
        return timings;
    }

    static getAdaptiveReadingSpeed(userPreference = 'normal') {
        const speeds = {
            slow: {
                wordsPerMinute: 150,
                minDuration: 3500,
                maxDuration: 18000
            },
            normal: {
                wordsPerMinute: 200,
                minDuration: 2500,
                maxDuration: 12000
            },
            fast: {
                wordsPerMinute: 250,
                minDuration: 2000,
                maxDuration: 8000
            },
            veryfast: {
                wordsPerMinute: 300,
                minDuration: 1500,
                maxDuration: 6000
            }
        };
        
        return speeds[userPreference] || speeds.normal;
    }
    
    static calculateMaxCharacters(containerHeight = 600, fontSize = 28, lineHeight = 1.5) {
        // Calculate based on typical viewport without scrolling
        const linesAvailable = Math.floor(containerHeight / (fontSize * lineHeight));
        const avgCharsPerLine = Math.floor(350 / (fontSize * 0.5)); // Approximate chars per line
        const maxChars = linesAvailable * avgCharsPerLine;
        
        // Safety margins for different text types
        const limits = {
            title: Math.min(100, maxChars * 0.3), // Short titles
            essence: Math.min(300, maxChars * 0.6), // Medium descriptions
            reaction: Math.min(250, maxChars * 0.5), // Medium reactions
            source: 100 // URL length
        };
        
        return limits;
    }
    
    static getTextLimits() {
        // Conservative limits to ensure no scrolling on mobile
        return {
            title: 80,
            essence: 250,
            reaction: 200,
            minTitle: 10,
            minEssence: 30,
            minReaction: 20
        };
    }
}