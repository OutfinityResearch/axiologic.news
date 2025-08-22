export class CreatePostPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.currentReactionSlide = 0;
        this.invalidate();
    }

    beforeRender() {
        // Data population and initial setup moved to afterRender
    }
    
    afterRender() {
        this.setupCharacterCounters();

        if (webSkel.pageParams && webSkel.pageParams.suggestion) {
            const { title, essence, reactions, source } = webSkel.pageParams.suggestion;
            this.element.querySelector('#title').value = title;
            this.element.querySelector('#essence').value = essence;
            this.element.querySelector('#source').value = source;
            
            reactions.forEach(reactionText => this.addReactionSlide(reactionText));
            webSkel.pageParams.suggestion = null; // Clear after use
        }

        if (this.element.querySelector('#reactions-container').children.length === 0) {
            this.addReactionSlide();
        }

        this.updateCarouselState();
    }
    
    setupCharacterCounters() {
        this.setupCounter('#title', '#title-counter', 80);
        this.setupCounter('#essence', '#essence-counter', 250);
    }

    setupCounter(inputId, counterId, maxLength) {
        const input = this.element.querySelector(inputId);
        const counter = this.element.querySelector(counterId);
        
        if (input && counter) {
            const updateCount = () => {
                const length = input.value.length;
                counter.textContent = `(${length}/${maxLength})`;
                counter.classList.toggle('warning', length > maxLength * 0.9);
                counter.classList.toggle('error', length >= maxLength);
            };
            input.addEventListener('input', updateCount);
            updateCount(); // Initial call
        }
    }

    addReactionSlide(text = '') {
        const reactionsContainer = this.element.querySelector('#reactions-container');
        if (reactionsContainer.children.length >= 10) return;

        const reactionIndex = reactionsContainer.children.length;
        const slide = document.createElement('div');
        slide.className = 'reaction-slide';
        
        const textareaId = `reaction-input-${reactionIndex}`;
        const counterId = `reaction-counter-${reactionIndex}`;

        slide.innerHTML = `
            <div class="reaction-input-group">
                <textarea id="${textareaId}" name="reactions" class="reaction-input" rows="3" maxlength="250" placeholder="Reaction #${reactionIndex + 1}"></textarea>
                <div class="reaction-footer">
                    <span class="char-counter" id="${counterId}">(0/250)</span>
                    <button type="button" class="remove-reaction-btn" data-local-action="removeCurrentReactionSlide">Remove</button>
                </div>
            </div>
        `;
        
        slide.querySelector('textarea').value = text;
        reactionsContainer.appendChild(slide);
        
        this.setupCounter(`#${textareaId}`, `#${counterId}`, 250);
        this.currentReactionSlide = reactionIndex;
        this.updateCarouselState();
    }

    removeCurrentReactionSlide() {
        const reactionsContainer = this.element.querySelector('#reactions-container');
        const slides = reactionsContainer.children;
        if (slides.length > 1) {
            slides[this.currentReactionSlide].remove();
            if (this.currentReactionSlide >= slides.length) {
                this.currentReactionSlide = slides.length - 1;
            }
            this.updateCarouselState();
        }
    }

    showReactionSlide(index) {
        const reactionsContainer = this.element.querySelector('#reactions-container');
        const slides = reactionsContainer.children;
        if (index >= 0 && index < slides.length) {
            this.currentReactionSlide = index;
            const offset = -index * 100;
            reactionsContainer.style.transform = `translateX(${offset}%)`;
            this.updateCarouselState();
        }
    }

    prevReactionSlide() {
        this.showReactionSlide(this.currentReactionSlide - 1);
    }

    nextReactionSlide() {
        this.showReactionSlide(this.currentReactionSlide + 1);
    }

    updateCarouselState() {
        const container = this.element.querySelector('#reactions-container');
        const indicatorsContainer = this.element.querySelector('#carousel-indicators');
        const prevBtn = this.element.querySelector('.carousel-nav-btn.prev');
        const nextBtn = this.element.querySelector('.carousel-nav-btn.next');
        const addBtn = this.element.querySelector('.add-reaction-btn');
        
        const slideCount = container.children.length;

        prevBtn.style.display = this.currentReactionSlide > 0 ? 'block' : 'none';
        nextBtn.style.display = this.currentReactionSlide < slideCount - 1 ? 'block' : 'none';
        addBtn.style.display = slideCount < 10 ? 'block' : 'none';

        indicatorsContainer.innerHTML = '';
        for (let i = 0; i < slideCount; i++) {
            const dot = document.createElement('span');
            dot.className = 'indicator-dot' + (i === this.currentReactionSlide ? ' active' : '');
            dot.onclick = () => this.showReactionSlide(i);
            indicatorsContainer.appendChild(dot);
        }
        
        this.showReactionSlide(this.currentReactionSlide);
    }

    async createPost(button) {
        const form = button.closest('form');
        if (!form) {
            console.error('Form not found');
            return;
        }
        const formData = new FormData(form);
        const title = formData.get('title').substring(0, 80);
        const essence = formData.get('essence').substring(0, 250);
        const reactions = Array.from(form.querySelectorAll('textarea[name="reactions"]'))
                               .map(textarea => textarea.value.trim())
                               .filter(r => r !== '')
                               .map(r => r.substring(0, 250));
        const source = formData.get('source');
        const backgroundColor = formData.get('background-color') || 'purple';
        const promoBannerText = formData.get('promo-banner-text');
        const promoBannerUrl = formData.get('promo-banner-url');

        const post = {
            id: Date.now().toString(),
            title,
            essence,
            reactions,
            source,
            backgroundColor,
            promoBanner: {
                text: promoBannerText,
                url: promoBannerUrl
            }
        };

        let posts = await window.LocalStorage.get('posts') || [];
        posts.unshift(post);
        await window.LocalStorage.set('posts', posts);

        await window.webSkel.changeToDynamicPage('news-feed-page', 'app');
    }
}