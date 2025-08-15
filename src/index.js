/**
 * index.js - Main entry point for Nintendo NFS sprite system
 * Integrates AssetManager, SpriteSheet, and SpriteAnimation components
 */

// Import components (for Node.js environment)
let AssetManager, SpriteSheet, SpriteAnimation;

if (typeof require !== 'undefined') {
    AssetManager = require('./assets/managers/AssetManager');
    SpriteSheet = require('./assets/sprites/SpriteSheet');
    SpriteAnimation = require('./assets/sprites/SpriteAnimation');
}

/**
 * Nintendo NFS Sprite System
 * Main class that orchestrates all sprite-related functionality
 */
class NintendoNFSSpriteSystem {
    constructor(options = {}) {
        // Initialize core components
        this.assetManager = new AssetManager();
        this.spriteSheet = new SpriteSheet(this.assetManager);
        this.spriteAnimations = new Map(); // Multiple animation instances
        
        // Configuration
        this.config = {
            pixelPerfect: options.pixelPerfect !== false,
            memoryLimit: options.memoryLimit || 100 * 1024 * 1024, // 100MB
            preloadAssets: options.preloadAssets || true,
            debugMode: options.debugMode || false
        };

        // Set memory limit
        this.assetManager.setMemoryLimit(this.config.memoryLimit);
        
        // Asset definitions for Nintendo NFS game
        this.gameAssets = {
            vehicles: [
                { path: 'assets/sprites/cars/sports_car.json', type: 'spritesheet', id: 'sports_car' },
                { path: 'assets/sprites/cars/racing_car.json', type: 'spritesheet', id: 'racing_car' },
                { path: 'assets/sprites/cars/classic_car.json', type: 'spritesheet', id: 'classic_car' }
            ],
            tracks: [
                { path: 'assets/sprites/tracks/city_track.json', type: 'spritesheet', id: 'city_track' },
                { path: 'assets/sprites/tracks/highway_track.json', type: 'spritesheet', id: 'highway_track' },
                { path: 'assets/sprites/tracks/mountain_track.json', type: 'spritesheet', id: 'mountain_track' }
            ],
            ui: [
                { path: 'assets/sprites/ui/hud_elements.json', type: 'spritesheet', id: 'hud' },
                { path: 'assets/sprites/ui/menu_elements.json', type: 'spritesheet', id: 'menu' },
                { path: 'assets/sprites/ui/buttons.json', type: 'spritesheet', id: 'buttons' }
            ],
            effects: [
                { path: 'assets/sprites/effects/boost_effect.json', type: 'spritesheet', id: 'boost' },
                { path: 'assets/sprites/effects/explosion.json', type: 'spritesheet', id: 'explosion' },
                { path: 'assets/sprites/effects/powerups.json', type: 'spritesheet', id: 'powerups' }
            ],
            backgrounds: [
                { path: 'assets/sprites/backgrounds/city_bg.json', type: 'spritesheet', id: 'city_bg' },
                { path: 'assets/sprites/backgrounds/highway_bg.json', type: 'spritesheet', id: 'highway_bg' }
            ]
        };

        // Setup event listeners
        this._setupEventListeners();
        
        if (this.config.debugMode) {
            console.log('Nintendo NFS Sprite System initialized');
        }
    }

    /**
     * Initialize the sprite system
     * @returns {Promise} Initialization promise
     */
    async initialize() {
        try {
            if (this.config.preloadAssets) {
                await this.preloadGameAssets();
            }
            
            this._setupDefaultAnimations();
            
            if (this.config.debugMode) {
                console.log('Sprite system initialization complete');
                console.log('Memory usage:', this.assetManager.getMemoryStats());
            }
            
            return true;
        } catch (error) {
            console.error('Failed to initialize sprite system:', error);
            throw error;
        }
    }

    /**
     * Preload all game assets
     * @returns {Promise} Loading promise
     */
    async preloadGameAssets() {
        const allAssets = [
            ...this.gameAssets.vehicles,
            ...this.gameAssets.tracks,
            ...this.gameAssets.ui,
            ...this.gameAssets.effects,
            ...this.gameAssets.backgrounds
        ];

        try {
            await this.assetManager.preloadAssets(allAssets);
            
            // Load sprite sheets
            for (const asset of allAssets) {
                if (asset.type === 'spritesheet') {
                    await this.spriteSheet.loadSpriteSheet(asset.path, asset.id);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Failed to preload assets:', error);
            throw error;
        }
    }

    /**
     * Create sprite animation for a game object
     * @param {string} id - Animation instance ID
     * @param {string} sheetId - Sprite sheet ID
     * @returns {SpriteAnimation} Animation instance
     */
    createAnimation(id, sheetId) {
        const animation = new SpriteAnimation(this.spriteSheet);
        this.spriteAnimations.set(id, animation);
        return animation;
    }

    /**
     * Get sprite animation by ID
     * @param {string} id - Animation instance ID
     * @returns {SpriteAnimation|null} Animation instance
     */
    getAnimation(id) {
        return this.spriteAnimations.get(id) || null;
    }

    /**
     * Remove sprite animation
     * @param {string} id - Animation instance ID
     */
    removeAnimation(id) {
        this.spriteAnimations.delete(id);
    }

    /**
     * Update all animations (call in game loop)
     * @param {number} deltaTime - Time since last update
     */
    updateAnimations(deltaTime) {
        for (const animation of this.spriteAnimations.values()) {
            animation.update(deltaTime);
        }
    }

    /**
     * Get asset loading progress
     * @returns {Object} Loading progress
     */
    getLoadingProgress() {
        return {
            ...this.assetManager.loadingStats,
            memoryUsage: this.assetManager.getMemoryStats()
        };
    }

    /**
     * Setup default animations for game objects
     * @private
     */
    _setupDefaultAnimations() {
        // Car animations
        this._setupCarAnimations();
        
        // Effect animations
        this._setupEffectAnimations();
        
        // UI animations
        this._setupUIAnimations();
    }

    /**
     * Setup car animations
     * @private
     */
    _setupCarAnimations() {
        const carTypes = ['sports_car', 'racing_car', 'classic_car'];
        
        for (const carType of carTypes) {
            if (this.spriteSheet.spriteSheets.has(carType)) {
                const animation = this.createAnimation(`${carType}_main`, carType);
                
                // Define standard car animation sequences
                animation.createAnimation('idle', carType, ['idle_0'], {
                    loop: true,
                    duration: 1000
                });
                
                animation.createAnimation('moving', carType, [
                    'move_0', 'move_1', 'move_2', 'move_3'
                ], {
                    loop: true,
                    duration: 400
                });
                
                animation.createAnimation('turning_left', carType, [
                    'turn_left_0', 'turn_left_1', 'turn_left_2'
                ], {
                    loop: true,
                    duration: 300
                });
                
                animation.createAnimation('turning_right', carType, [
                    'turn_right_0', 'turn_right_1', 'turn_right_2'
                ], {
                    loop: true,
                    duration: 300
                });
                
                animation.createAnimation('boosting', carType, [
                    'boost_0', 'boost_1', 'boost_2', 'boost_3'
                ], {
                    loop: true,
                    duration: 200
                });
            }
        }
    }

    /**
     * Setup effect animations
     * @private
     */
    _setupEffectAnimations() {
        // Boost effect
        if (this.spriteSheet.spriteSheets.has('boost')) {
            const boostAnimation = this.createAnimation('boost_effect', 'boost');
            boostAnimation.createAnimation('boost', 'boost', [
                'boost_0', 'boost_1', 'boost_2', 'boost_3', 'boost_4'
            ], {
                loop: false,
                duration: 500,
                onComplete: () => {
                    // Effect finished
                }
            });
        }
        
        // Explosion effect
        if (this.spriteSheet.spriteSheets.has('explosion')) {
            const explosionAnimation = this.createAnimation('explosion_effect', 'explosion');
            explosionAnimation.createAnimation('explode', 'explosion', [
                'explosion_0', 'explosion_1', 'explosion_2', 'explosion_3',
                'explosion_4', 'explosion_5', 'explosion_6', 'explosion_7'
            ], {
                loop: false,
                duration: 800
            });
        }
    }

    /**
     * Setup UI animations
     * @private
     */
    _setupUIAnimations() {
        // Button animations
        if (this.spriteSheet.spriteSheets.has('buttons')) {
            const buttonAnimation = this.createAnimation('button_ui', 'buttons');
            
            buttonAnimation.createAnimation('button_normal', 'buttons', ['button_normal'], {
                loop: true
            });
            
            buttonAnimation.createAnimation('button_hover', 'buttons', [
                'button_hover_0', 'button_hover_1'
            ], {
                loop: true,
                duration: 600
            });
            
            buttonAnimation.createAnimation('button_pressed', 'buttons', ['button_pressed'], {
                loop: false
            });
        }
    }

    /**
     * Setup event listeners
     * @private
     */
    _setupEventListeners() {
        // Asset manager events
        this.assetManager.addEventListener('preloadCompleted', (data) => {
            if (this.config.debugMode) {
                console.log('Asset preloading completed:', data);
            }
        });

        this.assetManager.addEventListener('memoryOptimized', (data) => {
            if (this.config.debugMode) {
                console.log('Memory optimized:', data);
            }
        });

        this.assetManager.addEventListener('assetError', (data) => {
            console.error('Asset loading error:', data);
        });
    }

    /**
     * Get system statistics
     * @returns {Object} System statistics
     */
    getStats() {
        return {
            memoryUsage: this.assetManager.getMemoryStats(),
            loadedAssets: this.assetManager.assets.size,
            loadedSpriteSheets: this.spriteSheet.spriteSheets.size,
            activeAnimations: this.spriteAnimations.size,
            frameCache: this.spriteSheet.frameCache.size
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.assetManager.clearAllAssets();
        this.spriteSheet.clearCache();
        this.spriteAnimations.clear();
        
        if (this.config.debugMode) {
            console.log('Sprite system cleaned up');
        }
    }
}

// Export for Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NintendoNFSSpriteSystem;
} else if (typeof window !== 'undefined') {
    window.NintendoNFSSpriteSystem = NintendoNFSSpriteSystem;
}