class IStorageStrategy {
    async upload(file) {
        throw new Error("Not implemented");
    }

    configure(settings) {
        throw new Error("Not implemented");
    }
}

class CloudinaryStorageStrategy extends IStorageStrategy {
    constructor() {
        super();
        this.cloudName = null;
        this.apiKey = null;
    }

    configure(settings) {
        this.cloudName = settings.cloudinaryCloudName;
        this.apiKey = settings.cloudinaryApiKey;
    }

    async upload(file) {
        if (!this.cloudName || !this.apiKey) {
            throw new Error("Cloudinary not properly configured");
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'unsigned_preset'); // Should be configured

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error(`Cloudinary upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            return {
                url: result.secure_url,
                publicId: result.public_id,
                provider: 'cloudinary'
            };
        } catch (error) {
            throw new Error(`Upload failed: ${error.message}`);
        }
    }
}

class StorageFactory {
    static create(strategy) {
        switch (strategy) {
            case "cloudinary":
                return new CloudinaryStorageStrategy();
            default:
                throw new Error(`Unknown strategy: ${strategy}`);
        }
    }
}

class FileStorage {
    constructor() {
        this.strategy = null;
    }

    async init() {
        const settings = await window.LocalStorage.get("filestorage-settings");
        if (settings && settings.storageStrategy) {
            this.strategy = StorageFactory.create(settings.storageStrategy);
            this.strategy.configure(settings);
        } else {
            // Default fallback - could add LocalStorageStrategy here
            console.warn("No FileStorage strategy configured");
        }
    }

    async upload(file) {
        if (!this.strategy) {
            throw new Error("No storage strategy configured");
        }
        return this.strategy.upload(file);
    }
}

window.FileStorage = new FileStorage();