/**
 * AnimationService - Centralized service for managing all background animations
 * Loads animations dynamically from category folders
 * 
 * Categories:
 * 1. Energetic & Dynamic
 * 2. Peaceful & Calming  
 * 3. Spiritual & Mystic
 * 4. Playful & Creative
 * 5. Melancholic & Reflective
 */
class AnimationService {
    constructor() {
        this.animations = {};
        this.categories = [
            { id: "energetic-dynamic", name: "Energetic & Dynamic" },
            { id: "peaceful-calming", name: "Peaceful & Calming" },
            { id: "spiritual-mystic", name: "Spiritual & Mystic" },
            { id: "playful-creative", name: "Playful & Creative" },
            { id: "melancholic-reflective", name: "Melancholic & Reflective" }
        ];
        
        // Create a ready promise that resolves when animations are loaded
        this.ready = this.initialize();
    }
    
    async initialize() {
        // Load animations from each category
        await this.loadAnimations();
        
        // Load custom animations from localStorage
        this.loadCustomAnimations();
        
        return true;
    }

    async loadAnimations() {
        for (const category of this.categories) {
            try {
                // Dynamically import the category index
                const module = await import(`./animations/${category.id}/index.js`);
                this.animations[category.id] = module.default || {};
                console.log(`Loaded animations for ${category.name}:`, Object.keys(this.animations[category.id]));
            } catch (error) {
                console.warn(`Failed to load animations for ${category.id}:`, error);
                this.animations[category.id] = {};
            }
        }
    }

    /**
     * Get animation by category and type
     */
    getAnimation(category, type) {
        if (this.animations[category] && this.animations[category][type]) {
            return this.animations[category][type];
        }
        return null;
    }

    /**
     * Get animation code by category and type
     */
    getAnimationCode(category, type) {
        const animation = this.getAnimation(category, type);
        return animation ? animation.code : null;
    }

    /**
     * Get all available categories with display names
     */
    getCategories() {
        return this.categories;
    }

    /**
     * Get all types for a category
     */
    getTypes(categoryId) {
        if (!this.animations[categoryId]) return [];
        
        return Object.keys(this.animations[categoryId]).map(typeId => {
            const animation = this.animations[categoryId][typeId];
            return {
                id: typeId,
                name: animation.name || typeId,
                description: animation.description || "Animation effect"
            };
        });
    }

    /**
     * Get all animations as a structured list
     */
    getAllAnimations() {
        const list = [];
        for (const category in this.animations) {
            for (const type in this.animations[category]) {
                const animation = this.animations[category][type];
                list.push({
                    category,
                    type,
                    name: animation.name || type,
                    description: animation.description || "Animation effect"
                });
            }
        }
        return list;
    }

    /**
     * Load custom animations from localStorage
     */
    loadCustomAnimations() {
        try {
            const customAnimations = localStorage.getItem('custom-animations');
            if (customAnimations) {
                const parsed = JSON.parse(customAnimations);
                // Add custom animations to appropriate categories
                Object.keys(parsed).forEach(category => {
                    if (!this.animations[category]) {
                        this.animations[category] = {};
                    }
                    Object.assign(this.animations[category], parsed[category]);
                });
            }
        } catch (e) {
            console.error('Failed to load custom animations:', e);
        }
    }

    /**
     * Save custom animation
     */
    saveCustomAnimation(category, type, animation) {
        try {
            let customAnimations = {};
            const stored = localStorage.getItem('custom-animations');
            if (stored) {
                customAnimations = JSON.parse(stored);
            }
            
            if (!customAnimations[category]) {
                customAnimations[category] = {};
            }
            
            customAnimations[category][type] = animation;
            localStorage.setItem('custom-animations', JSON.stringify(customAnimations));
            
            // Add to current animations
            if (!this.animations[category]) {
                this.animations[category] = {};
            }
            this.animations[category][type] = animation;
            
            return true;
        } catch (e) {
            console.error('Failed to save custom animation:', e);
            return false;
        }
    }

    /**
     * Get a random animation from a category
     */
    getRandomAnimation(category = null) {
        const categories = category ? [category] : Object.keys(this.animations);
        const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
        const types = Object.keys(this.animations[selectedCategory] || {});
        
        if (types.length === 0) return null;
        
        const selectedType = types[Math.floor(Math.random() * types.length)];
        
        return {
            category: selectedCategory,
            type: selectedType,
            animation: this.animations[selectedCategory][selectedType]
        };
    }

    /**
     * Search animations by keyword
     */
    searchAnimations(keyword) {
        const results = [];
        const searchTerm = keyword.toLowerCase();
        
        for (const category in this.animations) {
            for (const type in this.animations[category]) {
                const animation = this.animations[category][type];
                const name = animation.name || type;
                const description = animation.description || "";
                
                if (name.toLowerCase().includes(searchTerm) ||
                    description.toLowerCase().includes(searchTerm) ||
                    category.includes(searchTerm) ||
                    type.includes(searchTerm)) {
                    results.push({
                        category,
                        type,
                        name,
                        description
                    });
                }
            }
        }
        
        return results;
    }
}

// Make AnimationService globally available
window.AnimationService = new AnimationService();
export default window.AnimationService;