export class ScenePreview {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.script = null;
        this.sceneIndex = 0;
        this.isPlaying = false;
        this.animationLoop = null;
        this.textElements = [];
        this.startTime = 0;
        
        // Get initialization params if provided
        this.scriptId = this.element.dataset.scriptId;
        this.sceneIndex = parseInt(this.element.dataset.sceneIndex) || 0;
        
        this.invalidate(async () => {
            if (this.scriptId) {
                this.script = await window.LocalStorage.get(this.scriptId);
            } else {
                this.script = await window.LocalStorage.get("current-script");
            }
        });
    }

    async beforeRender() {
        // Required by WebSkel framework
    }

    afterUnload() {
        // Clean up when component is removed
        this.isPlaying = false;
        if (this.animationLoop) {
            cancelAnimationFrame(this.animationLoop);
            this.animationLoop = null;
        }
        
        // Clean up animation iframe
        const existingIframe = this.element.querySelector('.animation-iframe');
        if (existingIframe) {
            existingIframe.remove();
        }
    }

    afterRender() {
        if (this.script && this.script.scenes && this.script.scenes[this.sceneIndex]) {
            this.setupCanvas();
            this.setupBackgroundAnimation();
            this.startSceneLoop();
        }
    }

    setupBackgroundAnimation() {
        // Remove existing iframe first to ensure clean update
        const existingIframe = this.element.querySelector('.animation-iframe');
        if (existingIframe) {
            existingIframe.remove();
        }
        
        // Check if script has background animation
        if (!this.script.backgroundAnimation) return;
        
        const { category, type } = this.script.backgroundAnimation;
        
        // No custom animations allowed
        if (!category || !type) {
            console.log('No animation specified');
            return;
        }
        
        // Get animation code from service only
        let animationCode = null;
        if (window.AnimationService) {
            animationCode = window.AnimationService.getAnimationCode(category, type);
        }
        
        if (animationCode) {
            // Wait a bit for the DOM to be ready before creating iframe
            setTimeout(() => {
                this.createAnimationIframe(animationCode);
            }, 100);
        }
    }

    createAnimationIframe(animationCode) {
        // Remove existing iframe if any
        const existingIframe = this.element.querySelector('.animation-iframe');
        if (existingIframe) {
            existingIframe.remove();
        }
        
        // Create new iframe
        const iframe = document.createElement('iframe');
        iframe.className = 'animation-iframe';
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.zIndex = '0';
        iframe.style.pointerEvents = 'none';
        
        // Find preview container
        const previewContainer = this.element.querySelector('.preview-content');
        if (previewContainer) {
            previewContainer.appendChild(iframe);
            
            // Get container dimensions with fallbacks
            const containerWidth = previewContainer.offsetWidth || 300;
            const containerHeight = previewContainer.offsetHeight || 533;
            
            // Modify animation code to use container dimensions instead of window dimensions
            const modifiedAnimationCode = animationCode
                .replace(/window\.innerWidth/g, containerWidth.toString())
                .replace(/window\.innerHeight/g, containerHeight.toString())
                .replace(/window\.addEventListener\s*\(\s*['"]resize['"],\s*[^)]+\)\s*;?/g, '')
                .replace(/addEventListener\s*\(\s*['"]resize['"],\s*[^)]+\)\s*;?/g, '');
            
            // Write animation code to iframe
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { 
                            margin: 0; 
                            padding: 0; 
                            overflow: hidden; 
                            background: transparent;
                            width: ${containerWidth}px;
                            height: ${containerHeight}px;
                        }
                    </style>
                </head>
                <body>
                    <script>
                        // Override window dimensions for animation
                        Object.defineProperty(window, 'innerWidth', {
                            get: function() { return ${containerWidth}; }
                        });
                        Object.defineProperty(window, 'innerHeight', {
                            get: function() { return ${containerHeight}; }
                        });
                        
                        ${modifiedAnimationCode}
                    </script>
                </body>
                </html>
            `);
            iframeDoc.close();
        }
    }

    setupCanvas() {
        const canvas = this.element.querySelector("#scene-preview-canvas");
        if (!canvas || !this.script) return;

        const format = this.script.format || "mobile";
        if (format === "mobile") {
            canvas.width = 300;
            canvas.height = 533; // 9:16 ratio
        } else if (format === "desktop") {
            canvas.width = 533;
            canvas.height = 300; // 16:9 ratio
        } else { // square
            canvas.width = 400;
            canvas.height = 400; // 1:1 ratio
        }
    }

    startSceneLoop() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.startTime = Date.now();
        this.animateScene();
    }

    animateScene() {
        if (!this.isPlaying || !this.script) return;

        const scene = this.script.scenes[this.sceneIndex];
        if (!scene) return;

        const currentTime = Date.now();
        const elapsed = currentTime - this.startTime;
        const duration = scene.duration || 5000;
        
        // Reset if duration exceeded
        if (elapsed >= duration) {
            this.startTime = currentTime;
        }

        this.renderFrame(elapsed, duration);
        
        this.animationLoop = requestAnimationFrame(() => this.animateScene());
    }

    renderFrame(elapsed, duration) {
        const canvas = this.element.querySelector("#scene-preview-canvas");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const scene = this.script.scenes[this.sceneIndex];
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Render background
        this.renderBackground(ctx, canvas.width, canvas.height);
        
        // Render text slots with animations
        if (scene.textSlots) {
            scene.textSlots.forEach((textSlot, index) => {
                this.renderAnimatedTextSlot(ctx, textSlot, canvas.width, canvas.height, elapsed, index);
            });
        }
    }

    renderBackground(ctx, width, height) {
        // Create scene-specific gradient background
        const gradients = [
            ['#667eea', '#764ba2'],
            ['#4CAF50', '#2196F3'], 
            ['#FF6B6B', '#4ECDC4'],
            ['#FF9800', '#E91E63'],
            ['#9C27B0', '#673AB7']
        ];
        
        const colors = gradients[this.sceneIndex % gradients.length];
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add subtle texture
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 15; i++) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, 2 * Math.PI);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }

    renderAnimatedTextSlot(ctx, textSlot, canvasWidth, canvasHeight, elapsed, index) {
        // Parse CSS for positioning and styling
        const css = textSlot.css || '';
        const position = this.parseCSSPosition(css, canvasWidth, canvasHeight);
        const style = this.parseCSSStyle(css);
        
        // Animation timing - stagger text appearance
        const animationDelay = index * 500; // 500ms delay between text slots
        const animationDuration = 1000; // 1s animation
        
        if (elapsed < animationDelay) return; // Not yet time to show this text
        
        const animationElapsed = elapsed - animationDelay;
        let animationProgress = Math.min(animationElapsed / animationDuration, 1);
        
        // Parse animation effect
        const effect = textSlot.effect || 'fadeIn';
        let alpha = 1;
        let transformX = 0;
        let transformY = 0;
        let scale = 1;
        
        if (animationProgress < 1) {
            if (effect.includes('fadeIn')) {
                alpha = animationProgress;
            }
            if (effect.includes('slideInLeft')) {
                transformX = -50 * (1 - animationProgress);
            }
            if (effect.includes('slideInRight')) {
                transformX = 50 * (1 - animationProgress);
            }
            if (effect.includes('slideInUp')) {
                transformY = 30 * (1 - animationProgress);
            }
            if (effect.includes('slideInDown')) {
                transformY = -30 * (1 - animationProgress);
            }
            if (effect.includes('bounceIn')) {
                scale = 0.3 + (0.7 * animationProgress);
                if (animationProgress > 0.5) {
                    scale = 1 + 0.1 * Math.sin((animationProgress - 0.5) * Math.PI * 4);
                }
            }
        }
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Apply transformations
        const finalX = position.x + transformX;
        const finalY = position.y + transformY;
        
        if (scale !== 1) {
            ctx.translate(finalX, finalY);
            ctx.scale(scale, scale);
            ctx.translate(-finalX, -finalY);
        }
        
        // Set up text styling
        ctx.fillStyle = style.color || '#ffffff';
        ctx.font = `${style.fontWeight || 'normal'} ${style.fontSize || 16}px ${style.fontFamily || 'Arial'}`;
        ctx.textAlign = style.textAlign || 'left';
        
        // Draw background if specified
        if (style.background) {
            const bgColor = this.parseBackgroundColor(style.background);
            if (bgColor) {
                const lines = textSlot.text.split('\n');
                const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
                const padding = style.padding || 10;
                const lineHeight = style.fontSize + 5;
                
                ctx.fillStyle = bgColor;
                ctx.fillRect(
                    finalX - padding, 
                    finalY - style.fontSize - padding, 
                    maxWidth + (padding * 2), 
                    lines.length * lineHeight + padding
                );
            }
        }
        
        // Draw text shadow
        if (style.textShadow || css.includes('text-shadow')) {
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }
        
        // Draw the text
        ctx.fillStyle = style.color || '#ffffff';
        const lines = textSlot.text.split('\n');
        lines.forEach((line, lineIndex) => {
            ctx.fillText(line, finalX, finalY + (lineIndex * (style.fontSize + 5)));
        });
        
        ctx.restore();
    }

    parseCSSPosition(css, canvasWidth, canvasHeight) {
        const topMatch = css.match(/top:\s*(\d+(?:\.\d+)?%)/) || css.match(/top:\s*(\d+)px/);
        const leftMatch = css.match(/left:\s*(\d+(?:\.\d+)?%)/) || css.match(/left:\s*(\d+)px/);
        
        let x = 20, y = 50; // defaults
        
        if (leftMatch) {
            if (leftMatch[1].includes('%')) {
                x = (parseFloat(leftMatch[1]) / 100) * canvasWidth;
            } else {
                x = parseFloat(leftMatch[1]);
            }
        }
        
        if (topMatch) {
            if (topMatch[1].includes('%')) {
                y = (parseFloat(topMatch[1]) / 100) * canvasHeight;
            } else {
                y = parseFloat(topMatch[1]);
            }
        }
        
        return { x, y };
    }

    parseCSSStyle(css) {
        const style = {};
        
        const fontSizeMatch = css.match(/font-size:\s*(\d+)px/);
        if (fontSizeMatch) style.fontSize = parseInt(fontSizeMatch[1]);
        
        const fontWeightMatch = css.match(/font-weight:\s*(bold|normal|[0-9]+)/);
        if (fontWeightMatch) style.fontWeight = fontWeightMatch[1];
        
        const colorMatch = css.match(/color:\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|\w+)/);
        if (colorMatch) style.color = colorMatch[1];
        
        const textAlignMatch = css.match(/text-align:\s*(left|center|right)/);
        if (textAlignMatch) style.textAlign = textAlignMatch[1];
        
        const backgroundMatch = css.match(/background:\s*([^;]+)/);
        if (backgroundMatch) style.background = backgroundMatch[1];
        
        const paddingMatch = css.match(/padding:\s*(\d+)px/);
        if (paddingMatch) style.padding = parseInt(paddingMatch[1]);
        
        return style;
    }

    parseBackgroundColor(background) {
        const rgbaMatch = background.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/);
        if (rgbaMatch) {
            return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${rgbaMatch[4]})`;
        }
        
        const hexMatch = background.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/);
        if (hexMatch) {
            return hexMatch[0];
        }
        
        return null;
    }

    pauseScene() {
        this.isPlaying = false;
        if (this.animationLoop) {
            cancelAnimationFrame(this.animationLoop);
            this.animationLoop = null;
        }
    }

    playScene() {
        if (!this.isPlaying) {
            this.startSceneLoop();
        }
    }

    // Method to update scene externally
    updateScene(scriptId, sceneIndex) {
        this.pauseScene();
        this.scriptId = scriptId;
        this.sceneIndex = sceneIndex;
        
        this.invalidate(async () => {
            this.script = await window.LocalStorage.get(scriptId || "current-script");
            if (this.script && this.script.scenes && this.script.scenes[this.sceneIndex]) {
                this.setupCanvas();
                this.startSceneLoop();
            }
        });
    }

    destroy() {
        this.pauseScene();
    }
}