/**
 * SpriteSheet.js - Sprite sheet parsing and management system
 * Handles sprite frames, animations, and Nintendo-style pixel art optimization
 */

class SpriteSheet {
    constructor(assetManager) {
        this.assetManager = assetManager;
        this.spriteSheets = new Map(); // Loaded sprite sheets
        this.frameCache = new Map(); // Cached individual frames
        this.animationSequences = new Map(); // Animation definitions
        this.renderingContext = null; // For frame extraction
        this.pixelPerfect = true; // Nintendo-style pixel perfect rendering
    }

    /**
     * Load and parse a sprite sheet
     * @param {string} path - Path to sprite sheet
     * @param {string} id - Unique identifier
     * @returns {Promise<Object>} Parsed sprite sheet data
     */
    async loadSpriteSheet(path, id) {
        try {
            const spriteSheetData = await this.assetManager.loadAsset(
                path, 
                this.assetManager.assetTypes.SPRITE_SHEET, 
                id
            );

            const parsedSheet = this._parseSpriteSheet(spriteSheetData, id);
            this.spriteSheets.set(id, parsedSheet);
            
            return parsedSheet;
        } catch (error) {
            throw new Error(`Failed to load sprite sheet ${id}: ${error.message}`);
        }
    }

    /**
     * Get a specific frame from a sprite sheet
     * @param {string} sheetId - Sprite sheet identifier
     * @param {string} frameName - Frame name
     * @returns {Object|null} Frame data
     */
    getFrame(sheetId, frameName) {
        const cacheKey = `${sheetId}_${frameName}`;
        
        // Return cached frame if available
        if (this.frameCache.has(cacheKey)) {
            return this.frameCache.get(cacheKey);
        }

        const sheet = this.spriteSheets.get(sheetId);
        if (!sheet || !sheet.frames[frameName]) {
            console.warn(`Frame ${frameName} not found in sprite sheet ${sheetId}`);
            return null;
        }

        const frameData = this._extractFrame(sheet, frameName);
        this.frameCache.set(cacheKey, frameData);
        
        return frameData;
    }

    /**
     * Get all frames for an animation sequence
     * @param {string} sheetId - Sprite sheet identifier
     * @param {string} animationName - Animation name
     * @returns {Array} Array of frame data
     */
    getAnimationFrames(sheetId, animationName) {
        const sheet = this.spriteSheets.get(sheetId);
        if (!sheet) {
            console.warn(`Sprite sheet ${sheetId} not found`);
            return [];
        }

        const animation = sheet.animations?.[animationName];
        if (!animation) {
            console.warn(`Animation ${animationName} not found in sprite sheet ${sheetId}`);
            return [];
        }

        return animation.frames.map(frameName => this.getFrame(sheetId, frameName));
    }

    /**
     * Create animation sequence definition
     * @param {string} name - Animation name
     * @param {Array} frameNames - Array of frame names
     * @param {Object} options - Animation options
     */
    createAnimationSequence(name, frameNames, options = {}) {
        this.animationSequences.set(name, {
            frames: frameNames,
            duration: options.duration || 1000,
            loop: options.loop !== false,
            pingPong: options.pingPong || false,
            frameDuration: options.frameDuration || null
        });
    }

    /**
     * Get animation sequence definition
     * @param {string} name - Animation name
     * @returns {Object|null} Animation sequence data
     */
    getAnimationSequence(name) {
        return this.animationSequences.get(name) || null;
    }

    /**
     * Render frame to canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} frameData - Frame data
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Rendering options
     */
    renderFrame(ctx, frameData, x, y, options = {}) {
        if (!frameData || !frameData.canvas) {
            return;
        }

        ctx.save();

        // Nintendo-style pixel perfect rendering
        if (this.pixelPerfect) {
            ctx.imageSmoothingEnabled = false;
            ctx.webkitImageSmoothingEnabled = false;
            ctx.mozImageSmoothingEnabled = false;
            ctx.msImageSmoothingEnabled = false;
        }

        // Apply transformations
        if (options.scale) {
            ctx.scale(options.scale, options.scale);
        }
        
        if (options.rotation) {
            ctx.translate(x + frameData.width / 2, y + frameData.height / 2);
            ctx.rotate(options.rotation);
            ctx.translate(-frameData.width / 2, -frameData.height / 2);
            x = 0;
            y = 0;
        }

        if (options.flip) {
            if (options.flip.horizontal) {
                ctx.scale(-1, 1);
                x = -x - frameData.width;
            }
            if (options.flip.vertical) {
                ctx.scale(1, -1);
                y = -y - frameData.height;
            }
        }

        // Apply tint/color effects
        if (options.tint) {
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = options.tint;
            ctx.fillRect(x, y, frameData.width, frameData.height);
            ctx.globalCompositeOperation = 'destination-atop';
        }

        if (options.alpha !== undefined) {
            ctx.globalAlpha = options.alpha;
        }

        // Render the frame
        ctx.drawImage(frameData.canvas, x, y);

        ctx.restore();
    }

    /**
     * Get sprite sheet dimensions
     * @param {string} sheetId - Sprite sheet identifier
     * @returns {Object} Dimensions {width, height}
     */
    getSheetDimensions(sheetId) {
        const sheet = this.spriteSheets.get(sheetId);
        if (!sheet) {
            return { width: 0, height: 0 };
        }
        return {
            width: sheet.image.width,
            height: sheet.image.height
        };
    }

    /**
     * Get frame names from sprite sheet
     * @param {string} sheetId - Sprite sheet identifier
     * @returns {Array} Array of frame names
     */
    getFrameNames(sheetId) {
        const sheet = this.spriteSheets.get(sheetId);
        return sheet ? Object.keys(sheet.frames) : [];
    }

    /**
     * Clear frame cache to free memory
     */
    clearCache() {
        this.frameCache.clear();
    }

    /**
     * Remove sprite sheet from memory
     * @param {string} sheetId - Sprite sheet identifier
     */
    unloadSpriteSheet(sheetId) {
        this.spriteSheets.delete(sheetId);
        
        // Clear related cached frames
        for (const [key] of this.frameCache) {
            if (key.startsWith(sheetId + '_')) {
                this.frameCache.delete(key);
            }
        }
    }

    /**
     * Parse sprite sheet data
     * @private
     */
    _parseSpriteSheet(spriteSheetData, id) {
        const { image, data } = spriteSheetData;
        
        // Support different sprite sheet formats
        let frames = {};
        let animations = {};

        if (data.frames) {
            // TexturePacker or similar format
            frames = this._parseTexturePackerFormat(data.frames);
        } else if (data.meta && data.meta.frameTags) {
            // Aseprite format
            const result = this._parseAsepriteFormat(data);
            frames = result.frames;
            animations = result.animations;
        } else {
            // Grid-based format
            frames = this._parseGridFormat(data, image);
        }

        return {
            id,
            image,
            frames,
            animations,
            meta: data.meta || {}
        };
    }

    /**
     * Parse TexturePacker format
     * @private
     */
    _parseTexturePackerFormat(frameData) {
        const frames = {};
        
        for (const [name, frame] of Object.entries(frameData)) {
            frames[name] = {
                x: frame.frame.x,
                y: frame.frame.y,
                width: frame.frame.w,
                height: frame.frame.h,
                offsetX: frame.spriteSourceSize?.x || 0,
                offsetY: frame.spriteSourceSize?.y || 0,
                sourceWidth: frame.sourceSize?.w || frame.frame.w,
                sourceHeight: frame.sourceSize?.h || frame.frame.h,
                rotated: frame.rotated || false,
                trimmed: frame.trimmed || false
            };
        }
        
        return frames;
    }

    /**
     * Parse Aseprite format
     * @private
     */
    _parseAsepriteFormat(data) {
        const frames = {};
        const animations = {};
        
        // Parse frames
        for (const [name, frame] of Object.entries(data.frames)) {
            frames[name] = {
                x: frame.frame.x,
                y: frame.frame.y,
                width: frame.frame.w,
                height: frame.frame.h,
                duration: frame.duration || 100
            };
        }
        
        // Parse animations from frame tags
        if (data.meta && data.meta.frameTags) {
            for (const tag of data.meta.frameTags) {
                const frameNames = [];
                for (let i = tag.from; i <= tag.to; i++) {
                    frameNames.push(`${tag.name} ${i}`);
                }
                
                animations[tag.name] = {
                    frames: frameNames,
                    direction: tag.direction || 'forward'
                };
            }
        }
        
        return { frames, animations };
    }

    /**
     * Parse grid-based format
     * @private
     */
    _parseGridFormat(data, image) {
        const frames = {};
        const frameWidth = data.frameWidth || 32;
        const frameHeight = data.frameHeight || 32;
        const cols = Math.floor(image.width / frameWidth);
        const rows = Math.floor(image.height / frameHeight);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const frameIndex = row * cols + col;
                frames[`frame_${frameIndex}`] = {
                    x: col * frameWidth,
                    y: row * frameHeight,
                    width: frameWidth,
                    height: frameHeight
                };
            }
        }
        
        return frames;
    }

    /**
     * Extract individual frame as canvas
     * @private
     */
    _extractFrame(sheet, frameName) {
        const frameInfo = sheet.frames[frameName];
        if (!frameInfo) {
            return null;
        }

        // Create canvas for this frame
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = frameInfo.width;
        canvas.height = frameInfo.height;

        // Configure for pixel-perfect rendering
        if (this.pixelPerfect) {
            ctx.imageSmoothingEnabled = false;
            ctx.webkitImageSmoothingEnabled = false;
            ctx.mozImageSmoothingEnabled = false;
            ctx.msImageSmoothingEnabled = false;
        }

        // Extract frame from sprite sheet
        if (frameInfo.rotated) {
            // Handle rotated frames
            ctx.translate(frameInfo.width / 2, frameInfo.height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.drawImage(
                sheet.image,
                frameInfo.x, frameInfo.y, frameInfo.height, frameInfo.width,
                -frameInfo.height / 2, -frameInfo.width / 2, frameInfo.height, frameInfo.width
            );
        } else {
            ctx.drawImage(
                sheet.image,
                frameInfo.x, frameInfo.y, frameInfo.width, frameInfo.height,
                0, 0, frameInfo.width, frameInfo.height
            );
        }

        return {
            canvas,
            width: frameInfo.width,
            height: frameInfo.height,
            offsetX: frameInfo.offsetX || 0,
            offsetY: frameInfo.offsetY || 0,
            sourceWidth: frameInfo.sourceWidth || frameInfo.width,
            sourceHeight: frameInfo.sourceHeight || frameInfo.height,
            duration: frameInfo.duration || 100
        };
    }
}

// Export for Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpriteSheet;
} else if (typeof window !== 'undefined') {
    window.SpriteSheet = SpriteSheet;
}