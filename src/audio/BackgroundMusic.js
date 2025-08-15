/**
 * BackgroundMusic.js
 * 
 * Handles background music playback with support for seamless looping,
 * crossfading, and Nintendo-style music transitions.
 */

class BackgroundMusic {
    constructor(audioContext, audioMixer) {
        this.context = audioContext;
        this.mixer = audioMixer;
        
        // Music state
        this.currentTrack = null;
        this.currentSource = null;
        this.currentGain = null;
        this.nextTrack = null;
        this.nextSource = null;
        this.nextGain = null;
        
        // Playback settings
        this.volume = 0.8;
        this.defaultLoopStart = 0;
        this.defaultLoopEnd = null;
        this.isPlaying = false;
        this.isPaused = false;
        
        // Track management
        this.trackBuffers = new Map();
        this.trackMetadata = new Map();
        this.fadeTimers = new Set();
        
        // Nintendo-style settings
        this.nintendoPresets = {
            menu: { loopStart: 0, loopEnd: null, fadeIn: 0.5, fadeOut: 1.0 },
            race: { loopStart: 8.0, loopEnd: null, fadeIn: 0.2, fadeOut: 0.5 },
            victory: { loopStart: 0, loopEnd: null, fadeIn: 0.1, fadeOut: 2.0 },
            gameOver: { loopStart: 0, loopEnd: null, fadeIn: 0.1, fadeOut: 1.5 }
        };
    }
    
    /**
     * Load a music track from URL or buffer
     * @param {string} trackName - Name identifier for the track
     * @param {string|ArrayBuffer} source - URL or audio buffer
     * @param {Object} metadata - Track metadata (loop points, etc.)
     */
    async loadTrack(trackName, source, metadata = {}) {
        try {
            let audioBuffer;
            
            if (typeof source === 'string') {
                // Load from URL
                const response = await fetch(source);
                const arrayBuffer = await response.arrayBuffer();
                audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            } else {
                // Use provided buffer
                audioBuffer = await this.context.decodeAudioData(source);
            }
            
            this.trackBuffers.set(trackName, audioBuffer);
            
            // Set default metadata
            const trackMeta = {
                loopStart: metadata.loopStart || this.defaultLoopStart,
                loopEnd: metadata.loopEnd || audioBuffer.duration,
                fadeIn: metadata.fadeIn || 1.0,
                fadeOut: metadata.fadeOut || 1.0,
                category: metadata.category || 'default',
                ...metadata
            };
            
            this.trackMetadata.set(trackName, trackMeta);
            
            console.log(`Music track loaded: ${trackName} (${audioBuffer.duration.toFixed(2)}s)`);
            return audioBuffer;
            
        } catch (error) {
            console.error(`Failed to load music track ${trackName}:`, error);
            throw error;
        }
    }
    
    /**
     * Play a music track
     * @param {string} trackName - Name of the track to play
     * @param {Object} options - Playback options
     */
    async play(trackName, options = {}) {
        if (!this.trackBuffers.has(trackName)) {
            throw new Error(`Music track not found: ${trackName}`);
        }
        
        // Stop current track if playing
        if (this.isPlaying) {
            this.stop(options.fadeOut || 0.5);
        }
        
        const buffer = this.trackBuffers.get(trackName);
        const metadata = this.trackMetadata.get(trackName);
        const preset = this.nintendoPresets[metadata.category] || this.nintendoPresets.default;
        
        // Create audio nodes
        this.currentSource = this.context.createBufferSource();
        this.currentGain = this.context.createGain();
        
        // Configure source
        this.currentSource.buffer = buffer;
        this.currentSource.loop = options.loop !== false; // Default to looping
        this.currentSource.loopStart = options.loopStart || metadata.loopStart || preset.loopStart;
        this.currentSource.loopEnd = options.loopEnd || metadata.loopEnd || preset.loopEnd || buffer.duration;
        
        // Configure gain
        const fadeInTime = options.fadeIn || metadata.fadeIn || preset.fadeIn;
        this.currentGain.gain.setValueAtTime(0, this.context.currentTime);
        this.currentGain.gain.linearRampToValueAtTime(
            this.volume, 
            this.context.currentTime + fadeInTime
        );
        
        // Connect audio graph
        this.currentSource.connect(this.currentGain);
        this.currentGain.connect(this.mixer.getMusicInput());
        
        // Handle track end
        this.currentSource.addEventListener('ended', () => {
            if (!this.currentSource.loop) {
                this.isPlaying = false;
                this.currentTrack = null;
            }
        });
        
        // Start playback
        const startTime = options.startTime || 0;
        this.currentSource.start(this.context.currentTime, startTime);
        
        this.currentTrack = trackName;
        this.isPlaying = true;
        this.isPaused = false;
        
        console.log(`Playing music: ${trackName}`);
        return this.currentSource;
    }
    
    /**
     * Stop current music track
     * @param {number} fadeTime - Time to fade out (seconds)
     */
    stop(fadeTime = 1.0) {
        if (!this.isPlaying || !this.currentSource) {
            return;
        }
        
        const stopTime = this.context.currentTime + fadeTime;
        
        if (this.currentGain) {
            this.currentGain.gain.setValueAtTime(this.currentGain.gain.value, this.context.currentTime);
            this.currentGain.gain.linearRampToValueAtTime(0, stopTime);
        }
        
        // Schedule stop
        setTimeout(() => {
            if (this.currentSource) {
                try {
                    this.currentSource.stop();
                } catch (error) {
                    // Source might already be stopped
                }
            }
            this.cleanup();
        }, fadeTime * 1000);
        
        this.isPlaying = false;
    }
    
    /**
     * Pause current music track
     */
    pause() {
        if (this.isPlaying && !this.isPaused) {
            this.stop(0.1);
            this.isPaused = true;
            console.log('Music paused');
        }
    }
    
    /**
     * Resume paused music track
     */
    resume() {
        if (this.isPaused && this.currentTrack) {
            this.play(this.currentTrack, { fadeIn: 0.1 });
            this.isPaused = false;
            console.log('Music resumed');
        }
    }
    
    /**
     * Crossfade to a new track
     * @param {string} newTrack - Track to crossfade to
     * @param {number} fadeTime - Crossfade duration (seconds)
     */
    async crossfade(newTrack, fadeTime = 2.0) {
        if (!this.trackBuffers.has(newTrack)) {
            throw new Error(`Music track not found: ${newTrack}`);
        }
        
        // Fade out current track
        if (this.isPlaying && this.currentGain) {
            this.currentGain.gain.setValueAtTime(this.currentGain.gain.value, this.context.currentTime);
            this.currentGain.gain.linearRampToValueAtTime(0, this.context.currentTime + fadeTime);
            
            // Schedule cleanup of old track
            setTimeout(() => {
                if (this.currentSource) {
                    try {
                        this.currentSource.stop();
                    } catch (error) {
                        // Source might already be stopped
                    }
                }
            }, fadeTime * 1000);
        }
        
        // Start new track with fade in
        setTimeout(() => {
            this.play(newTrack, { fadeIn: fadeTime });
        }, fadeTime * 500); // Start halfway through fade
        
        console.log(`Crossfading to: ${newTrack}`);
    }
    
    /**
     * Set music volume
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        if (this.currentGain) {
            this.currentGain.gain.setValueAtTime(this.volume, this.context.currentTime);
        }
    }
    
    /**
     * Get current volume
     */
    getVolume() {
        return this.volume;
    }
    
    /**
     * Check if music is currently playing
     */
    isCurrentlyPlaying() {
        return this.isPlaying;
    }
    
    /**
     * Get current track name
     */
    getCurrentTrack() {
        return this.currentTrack;
    }
    
    /**
     * Preload multiple music tracks
     * @param {Array} trackList - Array of {name, url, metadata} objects
     */
    async preload(trackList) {
        const promises = trackList.map(track => {
            if (typeof track === 'string') {
                return this.loadTrack(track, track);
            } else {
                return this.loadTrack(track.name, track.url, track.metadata);
            }
        });
        
        await Promise.all(promises);
        console.log(`Preloaded ${trackList.length} music tracks`);
    }
    
    /**
     * Apply Nintendo-style audio processing
     * @param {string} preset - Preset name (menu, race, victory, gameOver)
     */
    applyNintendoPreset(preset) {
        if (this.nintendoPresets[preset] && this.currentGain) {
            const settings = this.nintendoPresets[preset];
            
            // Apply any specific audio processing for Nintendo-style sound
            // This could include filters, reverb, etc.
            if (settings.filter) {
                const filter = this.context.createBiquadFilter();
                filter.type = settings.filter.type || 'lowpass';
                filter.frequency.value = settings.filter.frequency || 8000;
                filter.Q.value = settings.filter.Q || 1;
                
                this.currentGain.disconnect();
                this.currentGain.connect(filter);
                filter.connect(this.mixer.getMusicInput());
            }
        }
    }
    
    /**
     * Clean up audio nodes
     */
    cleanup() {
        if (this.currentSource) {
            this.currentSource.disconnect();
            this.currentSource = null;
        }
        
        if (this.currentGain) {
            this.currentGain.disconnect();
            this.currentGain = null;
        }
        
        this.currentTrack = null;
    }
    
    /**
     * Destroy the background music system
     */
    destroy() {
        this.stop(0);
        this.cleanup();
        this.trackBuffers.clear();
        this.trackMetadata.clear();
        this.fadeTimers.forEach(timer => clearTimeout(timer));
        this.fadeTimers.clear();
    }
}

export default BackgroundMusic;