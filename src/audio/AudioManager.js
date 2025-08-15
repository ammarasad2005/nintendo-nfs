/**
 * AudioManager.js
 * 
 * Main audio management system for Nintendo-styled Need for Speed game.
 * Coordinates background music, sound effects, and audio mixing.
 */

class AudioManager {
    constructor() {
        this.context = null;
        this.masterVolume = 1.0;
        this.musicVolume = 0.8;
        this.effectsVolume = 0.9;
        this.isMuted = false;
        
        // Audio components
        this.backgroundMusic = null;
        this.soundEffects = null;
        this.audioMixer = null;
        
        // Audio state
        this.isInitialized = false;
        this.audioPool = new Map();
        this.activeChannels = new Set();
        
        this.init();
    }
    
    /**
     * Initialize the audio system
     */
    async init() {
        try {
            // Check if we're in a browser environment
            if (typeof window === 'undefined') {
                // Node.js environment - use mock implementation
                console.log('Running in Node.js environment - using mock audio implementation');
                this.context = this.createMockAudioContext();
                
                // Create mock components
                const { default: BackgroundMusic } = await import('./BackgroundMusic.js');
                const { default: SoundEffects } = await import('./SoundEffects.js');
                const { default: AudioMixer } = await import('./AudioMixer.js');
                
                this.audioMixer = new AudioMixer(this.context);
                this.backgroundMusic = new BackgroundMusic(this.context, this.audioMixer);
                this.soundEffects = new SoundEffects(this.context, this.audioMixer);
                
                this.masterGain = this.context.createGain();
                this.audioMixer.connect = () => {}; // Mock connect
                
                this.isInitialized = true;
                console.log('AudioManager initialized successfully (Node.js mode)');
                return;
            }
            
            // Initialize Web Audio API context
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Import and initialize audio components
            const { default: BackgroundMusic } = await import('./BackgroundMusic.js');
            const { default: SoundEffects } = await import('./SoundEffects.js');
            const { default: AudioMixer } = await import('./AudioMixer.js');
            
            this.audioMixer = new AudioMixer(this.context);
            this.backgroundMusic = new BackgroundMusic(this.context, this.audioMixer);
            this.soundEffects = new SoundEffects(this.context, this.audioMixer);
            
            // Setup master gain node
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.masterGain.gain.value = this.masterVolume;
            
            // Connect mixer to master gain
            this.audioMixer.connect(this.masterGain);
            
            this.isInitialized = true;
            console.log('AudioManager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize AudioManager:', error);
        }
    }
    
    /**
     * Create a mock audio context for Node.js testing
     */
    createMockAudioContext() {
        const mockNode = {
            gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
            connect: () => {},
            disconnect: () => {}
        };
        
        return {
            state: 'running',
            currentTime: 0,
            sampleRate: 44100,
            destination: { connect: () => {} },
            listener: {
                setPosition: () => {},
                setOrientation: () => {}
            },
            createGain: () => ({ ...mockNode }),
            createBufferSource: () => ({
                buffer: null,
                loop: false,
                loopStart: 0,
                loopEnd: 0,
                start: () => {},
                stop: () => {},
                connect: () => {},
                disconnect: () => {},
                addEventListener: () => {}
            }),
            createBuffer: (channels, length, sampleRate) => ({
                duration: length / sampleRate,
                getChannelData: () => new Float32Array(length)
            }),
            createBiquadFilter: () => ({
                type: 'lowpass',
                frequency: { value: 1000, setValueAtTime: () => {} },
                Q: { value: 1, setValueAtTime: () => {} },
                gain: { value: 0 },
                connect: () => {},
                disconnect: () => {}
            }),
            createDynamicsCompressor: () => ({
                threshold: { value: -12, setValueAtTime: () => {} },
                knee: { value: 30, setValueAtTime: () => {} },
                ratio: { value: 12, setValueAtTime: () => {} },
                attack: { value: 0.003, setValueAtTime: () => {} },
                release: { value: 0.25, setValueAtTime: () => {} },
                reduction: 0,
                connect: () => {},
                disconnect: () => {}
            }),
            createConvolver: () => ({
                buffer: null,
                connect: () => {},
                disconnect: () => {}
            }),
            createPanner: () => ({
                panningModel: 'HRTF',
                distanceModel: 'inverse',
                refDistance: 1,
                maxDistance: 100,
                rolloffFactor: 1,
                setPosition: () => {},
                setVelocity: () => {},
                setOrientation: () => {},
                connect: () => {},
                disconnect: () => {}
            }),
            createDelay: (maxDelay) => ({
                delayTime: { value: 0.3 },
                connect: () => {},
                disconnect: () => {}
            }),
            createWaveShaper: () => ({
                curve: null,
                oversample: '4x',
                connect: () => {},
                disconnect: () => {}
            }),
            decodeAudioData: (arrayBuffer) => Promise.resolve({
                duration: 1.0,
                getChannelData: () => new Float32Array(44100)
            }),
            resume: () => Promise.resolve(),
            close: () => Promise.resolve()
        };
    }
    
    /**
     * Ensure audio context is running (required for modern browsers)
     */
    async resume() {
        if (this.context && this.context.state === 'suspended') {
            await this.context.resume();
        }
    }
    
    /**
     * Load and play background music
     * @param {string} trackName - Name of the music track
     * @param {Object} options - Playback options
     */
    async playMusic(trackName, options = {}) {
        if (!this.isInitialized) {
            console.warn('AudioManager not initialized');
            return;
        }
        
        await this.resume();
        return this.backgroundMusic.play(trackName, options);
    }
    
    /**
     * Stop current background music
     * @param {number} fadeTime - Time to fade out (seconds)
     */
    stopMusic(fadeTime = 1.0) {
        if (this.backgroundMusic) {
            this.backgroundMusic.stop(fadeTime);
        }
    }
    
    /**
     * Play a sound effect
     * @param {string} effectName - Name of the sound effect
     * @param {Object} options - Playback options
     */
    async playSound(effectName, options = {}) {
        if (!this.isInitialized) {
            console.warn('AudioManager not initialized');
            return;
        }
        
        await this.resume();
        return this.soundEffects.play(effectName, options);
    }
    
    /**
     * Stop a specific sound effect
     * @param {string} effectName - Name of the sound effect
     */
    stopSound(effectName) {
        if (this.soundEffects) {
            this.soundEffects.stop(effectName);
        }
    }
    
    /**
     * Stop all sound effects
     */
    stopAllSounds() {
        if (this.soundEffects) {
            this.soundEffects.stopAll();
        }
    }
    
    /**
     * Set master volume
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain && !this.isMuted) {
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.context.currentTime);
        }
    }
    
    /**
     * Set music volume
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.backgroundMusic) {
            this.backgroundMusic.setVolume(this.musicVolume);
        }
    }
    
    /**
     * Set sound effects volume
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setEffectsVolume(volume) {
        this.effectsVolume = Math.max(0, Math.min(1, volume));
        if (this.soundEffects) {
            this.soundEffects.setVolume(this.effectsVolume);
        }
    }
    
    /**
     * Toggle mute/unmute
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.updateMuteState();
        return this.isMuted;
    }
    
    /**
     * Set mute state
     * @param {boolean} muted - Whether to mute audio
     */
    setMute(muted) {
        this.isMuted = muted;
        this.updateMuteState();
    }
    
    /**
     * Update mute state on audio nodes
     */
    updateMuteState() {
        if (this.masterGain) {
            const volume = this.isMuted ? 0 : this.masterVolume;
            this.masterGain.gain.setValueAtTime(volume, this.context.currentTime);
        }
    }
    
    /**
     * Crossfade between two music tracks
     * @param {string} newTrack - New track to play
     * @param {number} fadeTime - Crossfade duration (seconds)
     */
    async crossfadeMusic(newTrack, fadeTime = 2.0) {
        if (this.backgroundMusic) {
            return this.backgroundMusic.crossfade(newTrack, fadeTime);
        }
    }
    
    /**
     * Preload audio assets
     * @param {Array} musicTracks - Array of music track names
     * @param {Array} soundEffects - Array of sound effect names
     */
    async preloadAssets(musicTracks = [], soundEffects = []) {
        const promises = [];
        
        if (this.backgroundMusic && musicTracks.length > 0) {
            promises.push(this.backgroundMusic.preload(musicTracks));
        }
        
        if (this.soundEffects && soundEffects.length > 0) {
            promises.push(this.soundEffects.preload(soundEffects));
        }
        
        await Promise.all(promises);
        console.log('Audio assets preloaded');
    }
    
    /**
     * Get current audio status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            masterVolume: this.masterVolume,
            musicVolume: this.musicVolume,
            effectsVolume: this.effectsVolume,
            isMuted: this.isMuted,
            contextState: this.context ? this.context.state : 'not-created',
            activeChannels: this.activeChannels.size,
            pooledSounds: this.audioPool.size
        };
    }
    
    /**
     * Clean up audio resources
     */
    destroy() {
        if (this.backgroundMusic) {
            this.backgroundMusic.destroy();
        }
        
        if (this.soundEffects) {
            this.soundEffects.destroy();
        }
        
        if (this.audioMixer) {
            this.audioMixer.destroy();
        }
        
        if (this.context) {
            this.context.close();
        }
        
        this.audioPool.clear();
        this.activeChannels.clear();
        this.isInitialized = false;
    }
}

export default AudioManager;