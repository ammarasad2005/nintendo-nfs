/**
 * AssetManager.js - Comprehensive asset loading and management system
 * Handles loading, caching, and resource management for Nintendo-styled NFS game
 */

class AssetManager {
    constructor() {
        this.assets = new Map(); // Main asset cache
        this.loadingPromises = new Map(); // Track loading operations
        this.loadQueue = []; // Asset loading queue
        this.loadingStats = {
            loaded: 0,
            total: 0,
            failed: 0
        };
        this.memoryLimit = 100 * 1024 * 1024; // 100MB default limit
        this.currentMemoryUsage = 0;
        this.assetTypes = {
            IMAGE: 'image',
            AUDIO: 'audio',
            JSON: 'json',
            SPRITE_SHEET: 'spritesheet'
        };
        this.eventListeners = new Map();
    }

    /**
     * Load a single asset
     * @param {string} path - Asset path
     * @param {string} type - Asset type
     * @param {string} id - Unique asset identifier
     * @returns {Promise} Loading promise
     */
    async loadAsset(path, type, id = null) {
        const assetId = id || this.generateAssetId(path);
        
        // Return cached asset if already loaded
        if (this.assets.has(assetId)) {
            return this.assets.get(assetId).data;
        }

        // Return existing loading promise if already in progress
        if (this.loadingPromises.has(assetId)) {
            return this.loadingPromises.get(assetId);
        }

        // Create new loading promise
        const loadingPromise = this._loadAssetData(path, type, assetId);
        this.loadingPromises.set(assetId, loadingPromise);

        try {
            const data = await loadingPromise;
            this._cacheAsset(assetId, data, type, path);
            this.loadingPromises.delete(assetId);
            this.loadingStats.loaded++;
            this._triggerEvent('assetLoaded', { id: assetId, type, path });
            return data;
        } catch (error) {
            this.loadingPromises.delete(assetId);
            this.loadingStats.failed++;
            this._triggerEvent('assetError', { id: assetId, type, path, error });
            throw error;
        }
    }

    /**
     * Preload multiple assets
     * @param {Array} assetList - Array of {path, type, id} objects
     * @returns {Promise} Promise resolving when all assets are loaded
     */
    async preloadAssets(assetList) {
        this.loadingStats.total = assetList.length;
        this.loadingStats.loaded = 0;
        this.loadingStats.failed = 0;

        const loadPromises = assetList.map(asset => 
            this.loadAsset(asset.path, asset.type, asset.id)
                .catch(error => {
                    console.warn(`Failed to load asset: ${asset.path}`, error);
                    return null; // Continue loading other assets
                })
        );

        this._triggerEvent('preloadStarted', { total: assetList.length });
        
        const results = await Promise.allSettled(loadPromises);
        
        this._triggerEvent('preloadCompleted', { 
            total: assetList.length,
            loaded: this.loadingStats.loaded,
            failed: this.loadingStats.failed
        });

        return results;
    }

    /**
     * Get cached asset
     * @param {string} id - Asset identifier
     * @returns {any} Asset data or null if not found
     */
    getAsset(id) {
        const asset = this.assets.get(id);
        if (asset) {
            asset.lastAccessed = Date.now();
            return asset.data;
        }
        return null;
    }

    /**
     * Check if asset is loaded
     * @param {string} id - Asset identifier
     * @returns {boolean}
     */
    isAssetLoaded(id) {
        return this.assets.has(id);
    }

    /**
     * Unload asset from memory
     * @param {string} id - Asset identifier
     */
    unloadAsset(id) {
        const asset = this.assets.get(id);
        if (asset) {
            this.currentMemoryUsage -= asset.size;
            this.assets.delete(id);
            this._triggerEvent('assetUnloaded', { id });
        }
    }

    /**
     * Clear all assets from memory
     */
    clearAllAssets() {
        this.assets.clear();
        this.currentMemoryUsage = 0;
        this._triggerEvent('allAssetsCleared');
    }

    /**
     * Memory optimization - remove least recently used assets
     */
    optimizeMemory() {
        if (this.currentMemoryUsage <= this.memoryLimit) {
            return;
        }

        const sortedAssets = Array.from(this.assets.entries())
            .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

        let memoryFreed = 0;
        const freedAssets = [];

        for (const [id, asset] of sortedAssets) {
            if (this.currentMemoryUsage - memoryFreed <= this.memoryLimit * 0.8) {
                break;
            }
            
            memoryFreed += asset.size;
            freedAssets.push(id);
            this.assets.delete(id);
        }

        this.currentMemoryUsage -= memoryFreed;
        this._triggerEvent('memoryOptimized', { freedAssets, memoryFreed });
    }

    /**
     * Get memory usage statistics
     * @returns {Object} Memory usage info
     */
    getMemoryStats() {
        return {
            currentUsage: this.currentMemoryUsage,
            limit: this.memoryLimit,
            percentage: (this.currentMemoryUsage / this.memoryLimit) * 100,
            assetCount: this.assets.size
        };
    }

    /**
     * Set memory limit
     * @param {number} bytes - Memory limit in bytes
     */
    setMemoryLimit(bytes) {
        this.memoryLimit = bytes;
        this.optimizeMemory();
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    removeEventListener(event, callback) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Private method to load asset data based on type
     * @private
     */
    async _loadAssetData(path, type, id) {
        switch (type) {
            case this.assetTypes.IMAGE:
                return this._loadImage(path);
            case this.assetTypes.AUDIO:
                return this._loadAudio(path);
            case this.assetTypes.JSON:
                return this._loadJSON(path);
            case this.assetTypes.SPRITE_SHEET:
                return this._loadSpriteSheet(path);
            default:
                throw new Error(`Unsupported asset type: ${type}`);
        }
    }

    /**
     * Load image asset
     * @private
     */
    _loadImage(path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
            img.src = path;
        });
    }

    /**
     * Load audio asset
     * @private
     */
    _loadAudio(path) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => resolve(audio);
            audio.onerror = () => reject(new Error(`Failed to load audio: ${path}`));
            audio.src = path;
            audio.load();
        });
    }

    /**
     * Load JSON asset
     * @private
     */
    async _loadJSON(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to fetch JSON: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            throw new Error(`Failed to load JSON: ${path} - ${error.message}`);
        }
    }

    /**
     * Load sprite sheet (JSON + Image)
     * @private
     */
    async _loadSpriteSheet(path) {
        try {
            const jsonPath = path.endsWith('.json') ? path : `${path}.json`;
            const spriteData = await this._loadJSON(jsonPath);
            
            const imagePath = spriteData.meta?.image || path.replace('.json', '.png');
            const image = await this._loadImage(imagePath);
            
            return {
                image,
                data: spriteData,
                frames: spriteData.frames || {}
            };
        } catch (error) {
            throw new Error(`Failed to load sprite sheet: ${path} - ${error.message}`);
        }
    }

    /**
     * Cache asset with metadata
     * @private
     */
    _cacheAsset(id, data, type, path) {
        const size = this._estimateAssetSize(data, type);
        
        this.assets.set(id, {
            data,
            type,
            path,
            size,
            loadedAt: Date.now(),
            lastAccessed: Date.now()
        });

        this.currentMemoryUsage += size;
        
        // Trigger memory optimization if needed
        if (this.currentMemoryUsage > this.memoryLimit) {
            this.optimizeMemory();
        }
    }

    /**
     * Estimate asset memory usage
     * @private
     */
    _estimateAssetSize(data, type) {
        switch (type) {
            case this.assetTypes.IMAGE:
                return data.width * data.height * 4; // RGBA
            case this.assetTypes.AUDIO:
                return 1024 * 1024; // Rough estimate
            case this.assetTypes.JSON:
                return JSON.stringify(data).length * 2; // Unicode
            case this.assetTypes.SPRITE_SHEET:
                return data.image.width * data.image.height * 4 + 
                       JSON.stringify(data.data).length * 2;
            default:
                return 1024; // Default estimate
        }
    }

    /**
     * Generate asset ID from path
     * @private
     */
    generateAssetId(path) {
        return path.split('/').pop().split('.')[0];
    }

    /**
     * Trigger event
     * @private
     */
    _triggerEvent(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
}

// Export for Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AssetManager;
} else if (typeof window !== 'undefined') {
    window.AssetManager = AssetManager;
}