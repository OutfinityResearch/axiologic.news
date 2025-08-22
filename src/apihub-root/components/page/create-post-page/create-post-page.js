export class CreatePostPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        // Check if there's suggestion data passed from the RSS page
        if (webSkel.pageParams && webSkel.pageParams.suggestion) {
            const { title, essence, reactions, source } = webSkel.pageParams.suggestion;
            this.element.querySelector('#title').value = title;
            this.element.querySelector('#essence').value = essence;
            this.element.querySelector('#reactions').value = reactions.join('\n');
            this.element.querySelector('#source').value = source;
        }
    }
    
    afterRender() {
        this.setupCharacterCounters();
        this.setupReactionValidation();
    }
    
    setupCharacterCounters() {
        const titleInput = this.element.querySelector('#title');
        const essenceTextarea = this.element.querySelector('#essence');
        const titleCounter = this.element.querySelector('#title-counter');
        const essenceCounter = this.element.querySelector('#essence-counter');
        
        if (titleInput && titleCounter) {
            titleInput.addEventListener('input', () => {
                const length = titleInput.value.length;
                titleCounter.textContent = `(${length}/80)`;
                titleCounter.classList.toggle('warning', length > 70);
                titleCounter.classList.toggle('error', length >= 80);
            });
        }
        
        if (essenceTextarea && essenceCounter) {
            essenceTextarea.addEventListener('input', () => {
                const length = essenceTextarea.value.length;
                essenceCounter.textContent = `(${length}/250)`;
                essenceCounter.classList.toggle('warning', length > 225);
                essenceCounter.classList.toggle('error', length >= 250);
            });
        }
    }
    
    setupReactionValidation() {
        const reactionsTextarea = this.element.querySelector('#reactions');
        const reactionsCounter = this.element.querySelector('#reactions-counter');
        
        if (reactionsTextarea && reactionsCounter) {
            reactionsTextarea.addEventListener('input', () => {
                const lines = reactionsTextarea.value.split('\n').filter(line => line.trim());
                const validReactions = lines.filter(line => line.length <= 200);
                const invalidReactions = lines.filter(line => line.length > 200);
                
                reactionsCounter.textContent = `(${validReactions.length} reactions)`;
                
                if (invalidReactions.length > 0) {
                    reactionsCounter.classList.add('error');
                    reactionsCounter.textContent += ` - ${invalidReactions.length} too long!`;
                    reactionsTextarea.classList.add('error');
                } else {
                    reactionsCounter.classList.remove('error');
                    reactionsTextarea.classList.remove('error');
                }
                
                // Limit reactions to max 5
                if (lines.length > 5) {
                    reactionsCounter.classList.add('warning');
                    reactionsCounter.textContent += ' (max 5)';
                }
            });
        }
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
        const reactions = formData.get('reactions')
            .split('\n')
            .filter(r => r.trim() !== '')
            .slice(0, 5)
            .map(r => r.substring(0, 200));
        const source = formData.get('source');
        const backgroundColor = formData.get('background-color') || 'purple';

        const post = {
            id: Date.now().toString(),
            title,
            essence,
            reactions,
            source,
            backgroundColor
        };

        let posts = await window.LocalStorage.get('posts') || [];
        posts.push(post);
        await window.LocalStorage.set('posts', posts);

        await window.webSkel.changeToDynamicPage('news-feed-page', 'app');
    }
}
