/**
 * SpriteAnimation.js - Advanced sprite animation system
 * Handles animation playback, state management, and transitions for Nintendo-style games
 */

class SpriteAnimation {
    constructor(spriteSheet) {
        this.spriteSheet = spriteSheet;
        this.animations = new Map(); // Animation instances
        this.currentAnimation = null;
        this.currentFrame = 0;
        this.animationTime = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.speed = 1.0;
        this.eventListeners = new Map();
        
        // Animation states
        this.states = {
            IDLE: 'idle',
            PLAYING: 'playing',
            PAUSED: 'paused',
            STOPPED: 'stopped',
            TRANSITIONING: 'transitioning'
        };
        this.currentState = this.states.STOPPED;
        
        // Transition system
        this.transitionQueue = [];
        this.currentTransition = null;
    }

    /**
     * Create new animation from sprite sheet
     * @param {string} name - Animation name
     * @param {string} sheetId - Sprite sheet ID
     * @param {Array} frameNames - Frame names for animation
     * @param {Object} options - Animation options
     */
    createAnimation(name, sheetId, frameNames, options = {}) {
        const animation = {
            name,
            sheetId,
            frames: frameNames,
            frameData: frameNames.map(frameName => 
                this.spriteSheet.getFrame(sheetId, frameName)
            ).filter(frame => frame !== null),
            
            // Timing options
            duration: options.duration || 1000,
            frameDuration: options.frameDuration || null,
            speed: options.speed || 1.0,
            
            // Playback options
            loop: options.loop !== false,
            pingPong: options.pingPong || false,
            reverse: options.reverse || false,
            
            // Animation states
            autoPlay: options.autoPlay || false,
            priority: options.priority || 0,
            
            // Callbacks
            onComplete: options.onComplete || null,
            onLoop: options.onLoop || null,
            onFrameChange: options.onFrameChange || null
        };

        // Calculate frame durations
        this._calculateFrameDurations(animation);
        
        this.animations.set(name, animation);
        
        if (animation.autoPlay && !this.currentAnimation) {
            this.play(name);
        }
        
        return animation;
    }

    /**
     * Play animation by name
     * @param {string} name - Animation name
     * @param {Object} options - Playback options
     */
    play(name, options = {}) {
        const animation = this.animations.get(name);
        if (!animation) {
            console.warn(`Animation '${name}' not found`);
            return false;
        }

        // Handle animation transitions
        if (this.currentAnimation && this.currentAnimation.name !== name) {
            if (options.transition) {
                this._startTransition(animation, options.transition);
                return true;
            }
        }

        this._setCurrentAnimation(animation, options);
        this.isPlaying = true;
        this.isPaused = false;
        this.currentState = this.states.PLAYING;
        
        this._triggerEvent('animationStart', { animation: name });
        
        return true;
    }

    /**
     * Pause current animation
     */
    pause() {
        if (this.isPlaying) {
            this.isPaused = true;
            this.currentState = this.states.PAUSED;
            this._triggerEvent('animationPause', { animation: this.currentAnimation?.name });
        }
    }

    /**
     * Resume paused animation
     */
    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            this.currentState = this.states.PLAYING;
            this._triggerEvent('animationResume', { animation: this.currentAnimation?.name });
        }
    }

    /**
     * Stop current animation
     */
    stop() {
        if (this.currentAnimation) {
            this.isPlaying = false;
            this.isPaused = false;
            this.currentState = this.states.STOPPED;
            this.animationTime = 0;
            this.currentFrame = 0;
            this._triggerEvent('animationStop', { animation: this.currentAnimation.name });
            this.currentAnimation = null;
        }
    }

    /**
     * Update animation (call in game loop)
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        if (!this.isPlaying || this.isPaused || !this.currentAnimation) {
            return;
        }

        // Handle transitions
        if (this.currentTransition) {
            this._updateTransition(deltaTime);
            return;
        }

        const animation = this.currentAnimation;
        const adjustedDelta = deltaTime * this.speed * animation.speed;
        
        this.animationTime += adjustedDelta;

        // Calculate current frame
        const previousFrame = this.currentFrame;
        this.currentFrame = this._calculateCurrentFrame(animation, this.animationTime);

        // Check for frame change
        if (this.currentFrame !== previousFrame) {
            this._onFrameChange(animation, this.currentFrame, previousFrame);
        }

        // Check for animation completion
        if (this._isAnimationComplete(animation, this.animationTime)) {
            this._onAnimationComplete(animation);
        }
    }

    /**
     * Get current frame data
     * @returns {Object|null} Current frame data
     */
    getCurrentFrame() {
        if (!this.currentAnimation || !this.currentAnimation.frameData) {
            return null;
        }
        
        return this.currentAnimation.frameData[this.currentFrame] || null;
    }

    /**
     * Set animation speed
     * @param {number} speed - Animation speed multiplier
     */
    setSpeed(speed) {
        this.speed = Math.max(0, speed);
    }

    /**
     * Queue animation to play after current one
     * @param {string} name - Animation name
     * @param {Object} options - Transition options
     */
    queueAnimation(name, options = {}) {
        this.transitionQueue.push({ name, options });
    }

    /**
     * Clear animation queue
     */
    clearQueue() {
        this.transitionQueue = [];
    }

    /**
     * Get animation info
     * @param {string} name - Animation name
     * @returns {Object|null} Animation info
     */
    getAnimationInfo(name) {
        const animation = this.animations.get(name);
        if (!animation) {
            return null;
        }

        return {
            name: animation.name,
            frameCount: animation.frames.length,
            duration: animation.duration,
            loop: animation.loop,
            pingPong: animation.pingPong,
            isPlaying: this.currentAnimation?.name === name && this.isPlaying
        };
    }

    /**
     * Get current animation state
     * @returns {Object} Animation state
     */
    getState() {
        return {
            currentAnimation: this.currentAnimation?.name || null,
            currentFrame: this.currentFrame,
            animationTime: this.animationTime,
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            speed: this.speed,
            state: this.currentState,
            progress: this._getAnimationProgress()
        };
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
     * Render current frame
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Rendering options
     */
    render(ctx, x, y, options = {}) {
        const frameData = this.getCurrentFrame();
        if (!frameData) {
            return;
        }

        // Apply transition effects
        if (this.currentTransition) {
            options = this._applyTransitionEffects(options);
        }

        this.spriteSheet.renderFrame(ctx, frameData, x, y, options);
    }

    /**
     * Calculate frame durations for animation
     * @private
     */
    _calculateFrameDurations(animation) {
        if (animation.frameDuration) {
            // Use fixed frame duration
            animation.frameDurations = new Array(animation.frames.length).fill(animation.frameDuration);
        } else {
            // Use frame-specific durations or distribute total duration
            animation.frameDurations = animation.frameData.map(frame => 
                frame.duration || (animation.duration / animation.frames.length)
            );
        }
        
        // Calculate cumulative times for frame lookup
        animation.cumulativeTimes = [];
        let totalTime = 0;
        for (const duration of animation.frameDurations) {
            totalTime += duration;
            animation.cumulativeTimes.push(totalTime);
        }
        animation.totalDuration = totalTime;
    }

    /**
     * Set current animation
     * @private
     */
    _setCurrentAnimation(animation, options) {
        this.currentAnimation = animation;
        this.animationTime = options.startTime || 0;
        this.currentFrame = options.startFrame || 0;
        
        if (options.speed !== undefined) {
            animation.speed = options.speed;
        }
    }

    /**
     * Calculate current frame based on time
     * @private
     */
    _calculateCurrentFrame(animation, time) {
        if (!animation.cumulativeTimes.length) {
            return 0;
        }

        let adjustedTime = time;
        
        // Handle looping
        if (animation.loop && time >= animation.totalDuration) {
            adjustedTime = time % animation.totalDuration;
        }
        
        // Handle ping-pong
        if (animation.pingPong) {
            const cycleTime = animation.totalDuration * 2;
            const normalizedTime = adjustedTime % cycleTime;
            
            if (normalizedTime > animation.totalDuration) {
                // Reverse direction
                adjustedTime = cycleTime - normalizedTime;
            } else {
                adjustedTime = normalizedTime;
            }
        }

        // Find frame index
        for (let i = 0; i < animation.cumulativeTimes.length; i++) {
            if (adjustedTime <= animation.cumulativeTimes[i]) {
                return animation.reverse ? (animation.frames.length - 1 - i) : i;
            }
        }

        return animation.reverse ? 0 : (animation.frames.length - 1);
    }

    /**
     * Check if animation is complete
     * @private
     */
    _isAnimationComplete(animation, time) {
        if (animation.loop || animation.pingPong) {
            return false;
        }
        return time >= animation.totalDuration;
    }

    /**
     * Handle frame change event
     * @private
     */
    _onFrameChange(animation, newFrame, oldFrame) {
        this._triggerEvent('frameChange', {
            animation: animation.name,
            newFrame,
            oldFrame,
            frameData: animation.frameData[newFrame]
        });

        if (animation.onFrameChange) {
            animation.onFrameChange(newFrame, oldFrame);
        }
    }

    /**
     * Handle animation completion
     * @private
     */
    _onAnimationComplete(animation) {
        if (animation.loop) {
            this.animationTime = 0;
            this.currentFrame = 0;
            this._triggerEvent('animationLoop', { animation: animation.name });
            
            if (animation.onLoop) {
                animation.onLoop();
            }
        } else {
            this.isPlaying = false;
            this.currentState = this.states.STOPPED;
            this._triggerEvent('animationComplete', { animation: animation.name });
            
            if (animation.onComplete) {
                animation.onComplete();
            }

            // Play next animation in queue
            if (this.transitionQueue.length > 0) {
                const next = this.transitionQueue.shift();
                this.play(next.name, next.options);
            }
        }
    }

    /**
     * Start animation transition
     * @private
     */
    _startTransition(toAnimation, transitionOptions) {
        this.currentTransition = {
            from: this.currentAnimation,
            to: toAnimation,
            duration: transitionOptions.duration || 300,
            type: transitionOptions.type || 'fade',
            progress: 0,
            options: transitionOptions
        };
        
        this.currentState = this.states.TRANSITIONING;
        this._triggerEvent('transitionStart', {
            from: this.currentTransition.from?.name,
            to: this.currentTransition.to.name
        });
    }

    /**
     * Update transition
     * @private
     */
    _updateTransition(deltaTime) {
        if (!this.currentTransition) {
            return;
        }

        this.currentTransition.progress += deltaTime / this.currentTransition.duration;
        
        if (this.currentTransition.progress >= 1.0) {
            // Transition complete
            this._setCurrentAnimation(this.currentTransition.to, {});
            this.currentState = this.states.PLAYING;
            
            this._triggerEvent('transitionComplete', {
                from: this.currentTransition.from?.name,
                to: this.currentTransition.to.name
            });
            
            this.currentTransition = null;
        }
    }

    /**
     * Apply transition effects to rendering options
     * @private
     */
    _applyTransitionEffects(options) {
        if (!this.currentTransition) {
            return options;
        }

        const progress = this.currentTransition.progress;
        const transitionOptions = { ...options };

        switch (this.currentTransition.type) {
            case 'fade':
                transitionOptions.alpha = (options.alpha || 1.0) * progress;
                break;
            case 'slide':
                // Implementation depends on slide direction
                break;
            case 'scale':
                transitionOptions.scale = (options.scale || 1.0) * progress;
                break;
        }

        return transitionOptions;
    }

    /**
     * Get animation progress (0-1)
     * @private
     */
    _getAnimationProgress() {
        if (!this.currentAnimation) {
            return 0;
        }
        
        return Math.min(1.0, this.animationTime / this.currentAnimation.totalDuration);
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
                    console.error(`Error in animation event listener for ${event}:`, error);
                }
            });
        }
    }
}

// Export for Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpriteAnimation;
} else if (typeof window !== 'undefined') {
    window.SpriteAnimation = SpriteAnimation;
}