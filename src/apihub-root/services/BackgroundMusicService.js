/**
 * BackgroundMusicService - Service for managing background music files
 * Stores MP3 files in localStorage organized by categories
 */
class BackgroundMusicService {
    constructor() {
        this.storageKey = 'background-music';
        this.categories = {
            particles: {
                name: "Particles",
                description: "Ambient music for particle animations",
                defaultTempo: "slow"
            },
            waves: {
                name: "Waves", 
                description: "Flowing music for wave animations",
                defaultTempo: "medium"
            },
            geometric: {
                name: "Geometric",
                description: "Electronic music for geometric patterns",
                defaultTempo: "medium-fast"
            },
            network: {
                name: "Network",
                description: "Tech-inspired music for network animations",
                defaultTempo: "fast"
            },
            gradient: {
                name: "Gradient",
                description: "Smooth transitions for gradient effects",
                defaultTempo: "slow"
            },
            matrix: {
                name: "Matrix",
                description: "Digital sounds for matrix effects",
                defaultTempo: "fast"
            },
            quiz: {
                name: "Quiz",
                description: "Upbeat music for quiz content",
                defaultTempo: "medium-fast"
            },
            educational: {
                name: "Educational",
                description: "Focus music for learning content",
                defaultTempo: "medium"
            },
            news: {
                name: "News",
                description: "Professional background for news content",
                defaultTempo: "medium"
            },
            philosophical: {
                name: "Philosophical",
                description: "Contemplative music for deep thoughts",
                defaultTempo: "slow"
            }
        };
        this.loadMusicData();
    }

    /**
     * Load music data from localStorage
     */
    loadMusicData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            this.musicData = stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading music data:', error);
            this.musicData = {};
        }
    }

    /**
     * Save music data to localStorage
     */
    saveMusicData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.musicData));
        } catch (error) {
            console.error('Error saving music data:', error);
            // If localStorage is full, try to clean up old data
            if (error.name === 'QuotaExceededError') {
                this.cleanupOldMusic();
                try {
                    localStorage.setItem(this.storageKey, JSON.stringify(this.musicData));
                } catch (retryError) {
                    throw new Error('Storage quota exceeded. Please remove some files.');
                }
            }
        }
    }

    /**
     * Get all categories
     */
    getCategories() {
        return Object.keys(this.categories);
    }

    /**
     * Get category info
     */
    getCategoryInfo(category) {
        return this.categories[category] || null;
    }

    /**
     * Store music file for a category
     * @param {string} category - The category name
     * @param {File} file - The audio file
     * @param {object} metadata - Additional metadata
     */
    async storeMusic(category, file, metadata = {}) {
        if (!this.categories[category]) {
            throw new Error(`Invalid category: ${category}`);
        }

        if (!file.type.startsWith('audio/')) {
            throw new Error('File must be an audio file');
        }

        // Convert file to base64 for localStorage
        const base64 = await this.fileToBase64(file);
        
        // Store with metadata
        if (!this.musicData[category]) {
            this.musicData[category] = [];
        }

        const musicEntry = {
            id: `${category}_${Date.now()}`,
            name: file.name,
            size: file.size,
            type: file.type,
            data: base64,
            uploadedAt: new Date().toISOString(),
            duration: metadata.duration || null,
            ...metadata
        };

        // Replace existing music for the category (one per category for now)
        this.musicData[category] = [musicEntry];
        
        this.saveMusicData();
        return musicEntry.id;
    }

    /**
     * Get music for a category
     */
    getMusic(category) {
        if (!this.categories[category]) {
            return null;
        }
        const categoryMusic = this.musicData[category];
        return categoryMusic && categoryMusic.length > 0 ? categoryMusic[0] : null;
    }

    /**
     * Get music URL for playback
     */
    getMusicUrl(category) {
        const music = this.getMusic(category);
        if (!music || !music.data) {
            return null;
        }
        
        // Convert base64 back to blob URL
        try {
            const blob = this.base64ToBlob(music.data, music.type);
            return URL.createObjectURL(blob);
        } catch (error) {
            console.error('Error creating music URL:', error);
            return null;
        }
    }

    /**
     * Remove music from a category
     */
    removeMusic(category) {
        if (this.musicData[category]) {
            // Revoke any existing blob URLs
            const music = this.musicData[category][0];
            if (music && music.blobUrl) {
                URL.revokeObjectURL(music.blobUrl);
            }
            
            delete this.musicData[category];
            this.saveMusicData();
            return true;
        }
        return false;
    }

    /**
     * Get all stored music info (without data)
     */
    getAllMusicInfo() {
        const info = {};
        for (const category in this.musicData) {
            if (this.musicData[category] && this.musicData[category].length > 0) {
                const music = this.musicData[category][0];
                info[category] = {
                    id: music.id,
                    name: music.name,
                    size: music.size,
                    uploadedAt: music.uploadedAt,
                    duration: music.duration
                };
            }
        }
        return info;
    }

    /**
     * Get storage size used
     */
    getStorageSize() {
        const dataString = JSON.stringify(this.musicData);
        return new Blob([dataString]).size;
    }

    /**
     * Clean up old music files (if needed for space)
     */
    cleanupOldMusic() {
        // Find and remove the oldest entries
        const entries = [];
        for (const category in this.musicData) {
            if (this.musicData[category] && this.musicData[category].length > 0) {
                entries.push({
                    category,
                    uploadedAt: this.musicData[category][0].uploadedAt
                });
            }
        }
        
        // Sort by upload date
        entries.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));
        
        // Remove oldest 20% of entries
        const toRemove = Math.ceil(entries.length * 0.2);
        for (let i = 0; i < toRemove; i++) {
            if (entries[i]) {
                delete this.musicData[entries[i].category];
            }
        }
    }

    /**
     * Convert file to base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Remove the data URL prefix to save space
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Convert base64 to blob
     */
    base64ToBlob(base64, mimeType = 'audio/mpeg') {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    /**
     * Check if a category has music
     */
    hasMusic(category) {
        return !!(this.musicData[category] && this.musicData[category].length > 0);
    }

    /**
     * Get recommended music for animation type
     */
    getRecommendedMusic(animationCategory, animationType) {
        // First check if there's music for the specific animation category
        if (this.hasMusic(animationCategory)) {
            return this.getMusic(animationCategory);
        }
        
        // Fallback recommendations based on animation characteristics
        const fallbackMap = {
            particles: ['ambient', 'educational'],
            waves: ['ambient', 'philosophical'],
            geometric: ['electronic', 'quiz'],
            network: ['electronic', 'news'],
            gradient: ['ambient', 'philosophical'],
            matrix: ['electronic', 'quiz']
        };
        
        const fallbacks = fallbackMap[animationCategory] || [];
        for (const fallback of fallbacks) {
            if (this.hasMusic(fallback)) {
                return this.getMusic(fallback);
            }
        }
        
        return null;
    }

    /**
     * Export all music data (for backup)
     */
    exportMusicData() {
        return JSON.stringify(this.musicData, null, 2);
    }

    /**
     * Import music data (from backup)
     */
    importMusicData(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.musicData = imported;
            this.saveMusicData();
            return true;
        } catch (error) {
            console.error('Error importing music data:', error);
            return false;
        }
    }
}

// Make BackgroundMusicService globally available
window.BackgroundMusicService = new BackgroundMusicService();
export default window.BackgroundMusicService;