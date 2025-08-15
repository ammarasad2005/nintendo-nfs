/**
 * SoundEffects.js
 * 
 * Manages sound effects with pooling, spatial audio, and priority-based playback.
 * Optimized for Nintendo-style gaming audio with performance considerations.
 */

class SoundEffects {
    constructor(audioContext, audioMixer) {
        this.context = audioContext;
        this.mixer = audioMixer;
        
        // Sound management
        this.soundBuffers = new Map();
        this.soundPool = new Map();
        this.activeSounds = new Map();
        this.soundCategories = new Map();
        
        // Volume control
        this.volume = 0.9;
        this.categoryVolumes = new Map();
        
        // Performance settings
        this.maxConcurrentSounds = 32;
        this.poolSize = 8; // Sounds per type to keep pooled
        this.maxDistance = 100;
        this.referenceDistance = 1;
        
        // Priority system
        this.priorityLevels = {
            UI: 100,
            ENGINE: 90,
            COLLISION: 80,
            ENVIRONMENT: 70,
            AMBIENT: 60,
            EFFECT: 50
        };
        
        // Nintendo-style sound categories
        this.initializeSoundCategories();
        
        // Spatial audio settings
        this.listenerPosition = { x: 0, y: 0, z: 0 };
        this.listenerOrientation = { x: 0, y: 0, z: -1 };
    }
    
    /**
     * Initialize Nintendo-style sound categories
     */
    initializeSoundCategories() {
        this.soundCategories.set('engine', {
            priority: this.priorityLevels.ENGINE,
            maxConcurrent: 4,
            volume: 0.8,
            loop: true,
            spatial: true
        });
        
        this.soundCategories.set('collision', {
            priority: this.priorityLevels.COLLISION,
            maxConcurrent: 8,
            volume: 1.0,
            loop: false,
            spatial: true
        });
        
        this.soundCategories.set('ui', {
            priority: this.priorityLevels.UI,
            maxConcurrent: 4,
            volume: 0.7,
            loop: false,
            spatial: false
        });
        
        this.soundCategories.set('powerup', {
            priority: this.priorityLevels.EFFECT,
            maxConcurrent: 2,
            volume: 0.9,
            loop: false,
            spatial: false
        });
        
        this.soundCategories.set('environment', {
            priority: this.priorityLevels.ENVIRONMENT,
            maxConcurrent: 6,
            volume: 0.6,
            loop: true,
            spatial: true
        });
        
        this.soundCategories.set('ambient', {
            priority: this.priorityLevels.AMBIENT,
            maxConcurrent: 3,
            volume: 0.4,
            loop: true,
            spatial: false
        });
    }
    
    /**
     * Load a sound effect
     * @param {string} soundName - Name identifier for the sound
     * @param {string|ArrayBuffer} source - URL or audio buffer
     * @param {Object} options - Sound options
     */
    async loadSound(soundName, source, options = {}) {
        try {
            let audioBuffer;
            
            if (typeof source === 'string') {
                const response = await fetch(source);
                const arrayBuffer = await response.arrayBuffer();
                audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            } else {
                audioBuffer = await this.context.decodeAudioData(source);
            }
            
            this.soundBuffers.set(soundName, audioBuffer);
            
            // Initialize sound pool for this sound
            this.soundPool.set(soundName, []);
            
            // Set default category if not specified
            const category = options.category || 'effect';
            if (!this.soundCategories.has(category)) {
                console.warn(`Unknown sound category: ${category}, using 'effect'`);
                options.category = 'effect';
            }
            
            // Store sound metadata
            this.soundCategories.set(soundName, {
                ...this.soundCategories.get(category),
                ...options
            });
            
            console.log(`Sound effect loaded: ${soundName} (${audioBuffer.duration.toFixed(2)}s)`);
            return audioBuffer;
            
        } catch (error) {
            console.error(`Failed to load sound effect ${soundName}:`, error);
            throw error;
        }
    }
    
    /**
     * Play a sound effect
     * @param {string} soundName - Name of the sound to play
     * @param {Object} options - Playback options
     */
    play(soundName, options = {}) {
        if (!this.soundBuffers.has(soundName)) {
            console.warn(`Sound effect not found: ${soundName}`);
            return null;
        }
        
        const soundConfig = this.soundCategories.get(soundName) || {};
        const priority = options.priority || soundConfig.priority || this.priorityLevels.EFFECT;
        
        // Check if we can play this sound (priority and concurrent limits)
        if (!this.canPlaySound(soundName, priority)) {
            return null;
        }
        
        // Get or create audio nodes
        const { source, gain, panner } = this.createSoundNodes(soundName, options);
        
        // Configure playback
        const buffer = this.soundBuffers.get(soundName);
        source.buffer = buffer;
        source.loop = options.loop !== undefined ? options.loop : soundConfig.loop || false;
        
        // Configure volume
        const baseVolume = options.volume !== undefined ? options.volume : soundConfig.volume || 1.0;
        const categoryVolume = this.categoryVolumes.get(soundConfig.category) || 1.0;
        const finalVolume = baseVolume * categoryVolume * this.volume;
        
        gain.gain.setValueAtTime(finalVolume, this.context.currentTime);
        
        // Configure spatial audio if enabled
        if (soundConfig.spatial && panner && options.position) {
            this.configureSpatialAudio(panner, options.position, options);
        }
        
        // Handle sound end
        const soundId = this.generateSoundId();
        source.addEventListener('ended', () => {
            this.cleanupSound(soundId);
        });
        
        // Start playback
        source.start(this.context.currentTime, options.startTime || 0);
        
        // Track active sound
        this.activeSounds.set(soundId, {
            source,
            gain,
            panner,
            soundName,
            priority,
            startTime: this.context.currentTime,
            category: soundConfig.category
        });
        
        return soundId;
    }
    
    /**
     * Create audio nodes for a sound
     * @param {string} soundName - Name of the sound
     * @param {Object} options - Configuration options
     */
    createSoundNodes(soundName, options) {
        const soundConfig = this.soundCategories.get(soundName) || {};
        
        // Try to get from pool first
        const pool = this.soundPool.get(soundName) || [];
        let nodes = pool.pop();
        
        if (!nodes) {
            // Create new nodes
            const source = this.context.createBufferSource();
            const gain = this.context.createGain();
            
            let panner = null;
            if (soundConfig.spatial) {
                panner = this.context.createPanner();
                panner.panningModel = 'HRTF';
                panner.distanceModel = 'inverse';
                panner.refDistance = this.referenceDistance;
                panner.maxDistance = this.maxDistance;
                panner.rolloffFactor = 1;
                
                source.connect(gain);
                gain.connect(panner);
                panner.connect(this.mixer.getEffectsInput());
            } else {
                source.connect(gain);
                gain.connect(this.mixer.getEffectsInput());
            }
            
            nodes = { source, gain, panner };
        }
        
        return nodes;
    }
    
    /**
     * Configure spatial audio for a panner node
     * @param {PannerNode} panner - The panner node
     * @param {Object} position - Sound position {x, y, z}
     * @param {Object} options - Additional spatial options
     */
    configureSpatialAudio(panner, position, options = {}) {
        panner.setPosition(position.x || 0, position.y || 0, position.z || 0);
        
        if (options.velocity) {
            panner.setVelocity(options.velocity.x || 0, options.velocity.y || 0, options.velocity.z || 0);
        }
        
        if (options.orientation) {
            panner.setOrientation(
                options.orientation.x || 0,
                options.orientation.y || 0,
                options.orientation.z || -1
            );
        }
        
        // Set distance model parameters
        if (options.refDistance !== undefined) {
            panner.refDistance = options.refDistance;
        }
        if (options.maxDistance !== undefined) {
            panner.maxDistance = options.maxDistance;
        }
        if (options.rolloffFactor !== undefined) {
            panner.rolloffFactor = options.rolloffFactor;
        }
    }
    
    /**
     * Check if a sound can be played (priority and concurrent limits)
     * @param {string} soundName - Name of the sound
     * @param {number} priority - Sound priority
     */
    canPlaySound(soundName, priority) {
        const soundConfig = this.soundCategories.get(soundName) || {};
        const maxConcurrent = soundConfig.maxConcurrent || this.maxConcurrentSounds;
        
        // Count active sounds of this category
        const categorySounds = Array.from(this.activeSounds.values())
            .filter(sound => sound.category === soundConfig.category);
        
        if (categorySounds.length >= maxConcurrent) {
            // Try to stop a lower priority sound
            const lowestPrioritySound = categorySounds
                .filter(sound => sound.priority < priority)
                .sort((a, b) => a.priority - b.priority)[0];
            
            if (lowestPrioritySound) {
                this.stopSoundById(lowestPrioritySound.soundId);
                return true;
            }
            
            return false;
        }
        
        return true;
    }
    
    /**
     * Stop a specific sound effect
     * @param {string} soundName - Name of the sound effect
     */
    stop(soundName) {
        const soundsToStop = Array.from(this.activeSounds.entries())
            .filter(([_, sound]) => sound.soundName === soundName);
        
        soundsToStop.forEach(([soundId, _]) => {
            this.stopSoundById(soundId);
        });
    }
    
    /**
     * Stop a sound by its ID
     * @param {string} soundId - ID of the sound to stop
     */
    stopSoundById(soundId) {
        const sound = this.activeSounds.get(soundId);
        if (sound) {
            try {
                sound.source.stop();
            } catch (error) {
                // Sound might already be stopped
            }
            this.cleanupSound(soundId);
        }
    }
    
    /**
     * Stop all sound effects
     */
    stopAll() {
        this.activeSounds.forEach((_, soundId) => {
            this.stopSoundById(soundId);
        });
    }
    
    /**
     * Stop all sounds in a specific category
     * @param {string} category - Category name
     */
    stopCategory(category) {
        const soundsToStop = Array.from(this.activeSounds.entries())
            .filter(([_, sound]) => sound.category === category);
        
        soundsToStop.forEach(([soundId, _]) => {
            this.stopSoundById(soundId);
        });
    }
    
    /**
     * Set volume for all sound effects
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        // Update active sounds
        this.activeSounds.forEach(sound => {
            if (sound.gain) {
                const soundConfig = this.soundCategories.get(sound.soundName) || {};
                const categoryVolume = this.categoryVolumes.get(sound.category) || 1.0;
                const finalVolume = soundConfig.volume * categoryVolume * this.volume;
                sound.gain.gain.setValueAtTime(finalVolume, this.context.currentTime);
            }
        });
    }
    
    /**
     * Set volume for a specific category
     * @param {string} category - Category name
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setCategoryVolume(category, volume) {
        this.categoryVolumes.set(category, Math.max(0, Math.min(1, volume)));
        
        // Update active sounds in this category
        this.activeSounds.forEach(sound => {
            if (sound.category === category && sound.gain) {
                const soundConfig = this.soundCategories.get(sound.soundName) || {};
                const finalVolume = soundConfig.volume * volume * this.volume;
                sound.gain.gain.setValueAtTime(finalVolume, this.context.currentTime);
            }
        });
    }
    
    /**
     * Update listener position for spatial audio
     * @param {Object} position - Listener position {x, y, z}
     * @param {Object} orientation - Listener orientation {x, y, z}
     */
    updateListener(position, orientation = null) {
        this.listenerPosition = position;
        
        if (this.context.listener) {
            this.context.listener.setPosition(position.x, position.y, position.z);
            
            if (orientation) {
                this.listenerOrientation = orientation;
                // Set listener orientation (forward vector and up vector)
                this.context.listener.setOrientation(
                    orientation.x, orientation.y, orientation.z,
                    0, 1, 0 // Up vector
                );
            }
        }
    }
    
    /**
     * Preload multiple sound effects
     * @param {Array} soundList - Array of {name, url, options} objects
     */
    async preload(soundList) {
        const promises = soundList.map(sound => {
            if (typeof sound === 'string') {
                return this.loadSound(sound, sound);
            } else {
                return this.loadSound(sound.name, sound.url, sound.options);
            }
        });
        
        await Promise.all(promises);
        console.log(`Preloaded ${soundList.length} sound effects`);
    }
    
    /**
     * Generate a unique sound ID
     */
    generateSoundId() {
        return 'sound_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Clean up a finished sound
     * @param {string} soundId - ID of the sound to clean up
     */
    cleanupSound(soundId) {
        const sound = this.activeSounds.get(soundId);
        if (sound) {
            // Return nodes to pool if possible
            const pool = this.soundPool.get(sound.soundName);
            if (pool && pool.length < this.poolSize) {
                // Reset and pool the nodes
                sound.source.disconnect();
                if (sound.panner) {
                    sound.panner.disconnect();
                }
                sound.gain.disconnect();
                
                // Don't pool the source as it can't be reused
                if (sound.panner) {
                    pool.push({ source: null, gain: sound.gain, panner: sound.panner });
                } else {
                    pool.push({ source: null, gain: sound.gain, panner: null });
                }
            } else {
                // Disconnect nodes
                sound.source.disconnect();
                if (sound.panner) {
                    sound.panner.disconnect();
                }
                sound.gain.disconnect();
            }
            
            this.activeSounds.delete(soundId);
        }
    }
    
    /**
     * Get current sound effects status
     */
    getStatus() {
        return {
            activeSounds: this.activeSounds.size,
            loadedSounds: this.soundBuffers.size,
            pooledSounds: Array.from(this.soundPool.values()).reduce((sum, pool) => sum + pool.length, 0),
            categories: Array.from(this.soundCategories.keys()),
            volume: this.volume
        };
    }
    
    /**
     * Destroy the sound effects system
     */
    destroy() {
        this.stopAll();
        this.soundBuffers.clear();
        this.soundPool.clear();
        this.activeSounds.clear();
        this.soundCategories.clear();
        this.categoryVolumes.clear();
    }
}

export default SoundEffects;