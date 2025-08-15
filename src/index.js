/**
 * index.js
 * 
 * Main entry point and demonstration of the Nintendo-style NFS audio system
 */

import AudioManager from './audio/AudioManager.js';

class NintendoNFSGame {
    constructor() {
        this.audioManager = null;
        this.gameState = 'menu'; // menu, racing, paused, gameOver
        this.isInitialized = false;
    }
    
    /**
     * Initialize the game and audio system
     */
    async init() {
        try {
            console.log('🏎️ Initializing Nintendo-style Need for Speed...');
            
            // Initialize audio system
            this.audioManager = new AudioManager();
            await this.waitForAudioInit();
            
            // Preload some demo audio assets (in a real game, these would be actual files)
            await this.preloadDemoAssets();
            
            this.isInitialized = true;
            console.log('✅ Game initialized successfully!');
            
            // Start demo
            this.startDemo();
            
        } catch (error) {
            console.error('❌ Failed to initialize game:', error);
        }
    }
    
    /**
     * Wait for audio manager to initialize
     */
    async waitForAudioInit() {
        let attempts = 0;
        while (!this.audioManager.isInitialized && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!this.audioManager.isInitialized) {
            throw new Error('Audio system failed to initialize');
        }
    }
    
    /**
     * Preload demo audio assets
     * In a real game, this would load actual audio files
     */
    async preloadDemoAssets() {
        console.log('🎵 Preloading demo audio assets...');
        
        // Generate demo audio buffers (sine waves for demonstration)
        const demoTracks = [
            { name: 'menu-music', duration: 30, frequency: 440, category: 'menu' },
            { name: 'race-music', duration: 120, frequency: 523, category: 'race' },
            { name: 'victory-music', duration: 15, frequency: 659, category: 'victory' }
        ];
        
        const demoSounds = [
            { name: 'engine-idle', duration: 2, frequency: 110, category: 'engine' },
            { name: 'engine-rev', duration: 1, frequency: 220, category: 'engine' },
            { name: 'collision', duration: 0.5, frequency: 80, category: 'collision' },
            { name: 'powerup', duration: 1, frequency: 880, category: 'powerup' },
            { name: 'ui-select', duration: 0.2, frequency: 1000, category: 'ui' },
            { name: 'ui-confirm', duration: 0.3, frequency: 1200, category: 'ui' }
        ];
        
        // Generate and load demo tracks
        for (const track of demoTracks) {
            const buffer = this.generateDemoAudio(track.duration, track.frequency);
            await this.audioManager.backgroundMusic.loadTrack(track.name, buffer, {
                category: track.category,
                loopStart: 2,
                loopEnd: track.duration - 2
            });
        }
        
        // Generate and load demo sounds
        for (const sound of demoSounds) {
            const buffer = this.generateDemoAudio(sound.duration, sound.frequency, sound.category === 'collision');
            await this.audioManager.soundEffects.loadSound(sound.name, buffer, {
                category: sound.category
            });
        }
        
        console.log('✅ Demo audio assets loaded');
    }
    
    /**
     * Generate demo audio buffer (sine wave)
     * @param {number} duration - Duration in seconds
     * @param {number} frequency - Frequency in Hz
     * @param {boolean} noise - Add noise for collision effects
     */
    generateDemoAudio(duration, frequency, noise = false) {
        const sampleRate = this.audioManager.context.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioManager.context.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            let sample = Math.sin(2 * Math.PI * frequency * t) * 0.3;
            
            // Add envelope
            const envelope = Math.exp(-t * 2) * (1 - Math.exp(-t * 10));
            sample *= envelope;
            
            // Add noise for collision effects
            if (noise) {
                sample += (Math.random() - 0.5) * 0.2 * envelope;
            }
            
            data[i] = sample;
        }
        
        return buffer;
    }
    
    /**
     * Start the demo
     */
    startDemo() {
        console.log('🎮 Starting Nintendo NFS Audio Demo...');
        console.log('Use the following commands to test the audio system:');
        console.log('- game.playMenuMusic() - Play menu music');
        console.log('- game.startRace() - Start racing mode with music and effects');
        console.log('- game.playVictoryMusic() - Play victory music');
        console.log('- game.testSounds() - Test various sound effects');
        console.log('- game.audioManager.setMasterVolume(0.5) - Set volume');
        console.log('- game.audioManager.toggleMute() - Toggle mute');
        console.log('- game.audioManager.getStatus() - Get audio status');
        
        // Start with menu music
        this.playMenuMusic();
        
        // Make game instance globally available for testing
        if (typeof window !== 'undefined') {
            window.game = this;
        } else {
            global.game = this;
        }
    }
    
    /**
     * Play menu music
     */
    async playMenuMusic() {
        this.gameState = 'menu';
        console.log('🎵 Playing menu music...');
        
        try {
            await this.audioManager.playMusic('menu-music', {
                loop: true,
                fadeIn: 1.0
            });
            
            // Apply Nintendo preset
            this.audioManager.audioMixer.applyPreset('retro');
            
        } catch (error) {
            console.error('Failed to play menu music:', error);
        }
    }
    
    /**
     * Start racing mode
     */
    async startRace() {
        this.gameState = 'racing';
        console.log('🏁 Starting race...');
        
        try {
            // Crossfade to race music
            await this.audioManager.crossfadeMusic('race-music', 2.0);
            
            // Apply arcade preset for racing
            this.audioManager.audioMixer.applyPreset('arcade');
            
            // Start engine sound
            this.audioManager.playSound('engine-idle', {
                loop: true,
                volume: 0.6,
                category: 'engine'
            });
            
            // Demo some race sounds after a delay
            setTimeout(() => this.simulateRaceEvents(), 3000);
            
        } catch (error) {
            console.error('Failed to start race:', error);
        }
    }
    
    /**
     * Simulate race events with sound effects
     */
    simulateRaceEvents() {
        console.log('🎮 Simulating race events...');
        
        // Engine rev
        setTimeout(() => {
            this.audioManager.playSound('engine-rev', {
                volume: 0.8,
                category: 'engine'
            });
        }, 1000);
        
        // Collision
        setTimeout(() => {
            this.audioManager.playSound('collision', {
                volume: 1.0,
                category: 'collision'
            });
        }, 3000);
        
        // Power-up
        setTimeout(() => {
            this.audioManager.playSound('powerup', {
                volume: 0.9,
                category: 'powerup'
            });
        }, 5000);
    }
    
    /**
     * Play victory music
     */
    async playVictoryMusic() {
        this.gameState = 'victory';
        console.log('🏆 Victory! Playing victory music...');
        
        try {
            // Stop engine sounds
            this.audioManager.soundEffects.stopCategory('engine');
            
            // Crossfade to victory music
            await this.audioManager.crossfadeMusic('victory-music', 1.0);
            
            // Apply modern preset for victory
            this.audioManager.audioMixer.applyPreset('modern');
            
        } catch (error) {
            console.error('Failed to play victory music:', error);
        }
    }
    
    /**
     * Test various sound effects
     */
    testSounds() {
        console.log('🔊 Testing sound effects...');
        
        const sounds = ['ui-select', 'ui-confirm', 'engine-rev', 'collision', 'powerup'];
        
        sounds.forEach((sound, index) => {
            setTimeout(() => {
                console.log(`Playing: ${sound}`);
                this.audioManager.playSound(sound);
            }, index * 1000);
        });
    }
    
    /**
     * Demonstrate volume controls
     */
    demonstrateVolumeControls() {
        console.log('🎚️ Demonstrating volume controls...');
        
        // Fade music down
        this.audioManager.audioMixer.setChannelVolume('music', 0.3, 2.0);
        
        // Fade effects up
        setTimeout(() => {
            this.audioManager.audioMixer.setChannelVolume('effects', 1.0, 1.0);
        }, 1000);
        
        // Reset volumes
        setTimeout(() => {
            this.audioManager.audioMixer.setChannelVolume('music', 0.8, 1.0);
            this.audioManager.audioMixer.setChannelVolume('effects', 0.9, 1.0);
        }, 4000);
    }
    
    /**
     * Clean up the game
     */
    destroy() {
        if (this.audioManager) {
            this.audioManager.destroy();
        }
        console.log('🏎️ Game destroyed');
    }
}

// Auto-start demo if running in browser or Node.js
if (typeof window !== 'undefined' || typeof global !== 'undefined') {
    const game = new NintendoNFSGame();
    
    // Handle user interaction requirement for Web Audio API
    if (typeof document !== 'undefined') {
        document.addEventListener('click', async () => {
            if (!game.isInitialized) {
                await game.init();
            } else {
                await game.audioManager.resume();
            }
        }, { once: true });
        
        console.log('👆 Click anywhere to start the audio demo!');
    } else {
        // Node.js environment
        game.init();
    }
}

export default NintendoNFSGame;