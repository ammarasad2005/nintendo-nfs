/**
 * audio-test.js
 * 
 * Basic tests for the Nintendo NFS audio system
 */

// Mock Web Audio API for Node.js testing
if (typeof AudioContext === 'undefined') {
    global.AudioContext = class MockAudioContext {
        constructor() {
            this.state = 'running';
            this.currentTime = 0;
            this.sampleRate = 44100;
            this.destination = { connect: () => {} };
            this.listener = {
                setPosition: () => {},
                setOrientation: () => {}
            };
        }
        
        createGain() {
            return {
                gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
                connect: () => {},
                disconnect: () => {}
            };
        }
        
        createBufferSource() {
            return {
                buffer: null,
                loop: false,
                loopStart: 0,
                loopEnd: 0,
                start: () => {},
                stop: () => {},
                connect: () => {},
                disconnect: () => {},
                addEventListener: () => {}
            };
        }
        
        createBuffer(channels, length, sampleRate) {
            return {
                duration: length / sampleRate,
                getChannelData: () => new Float32Array(length)
            };
        }
        
        createBiquadFilter() {
            return {
                type: 'lowpass',
                frequency: { value: 1000, setValueAtTime: () => {} },
                Q: { value: 1, setValueAtTime: () => {} },
                gain: { value: 0 },
                connect: () => {},
                disconnect: () => {}
            };
        }
        
        createDynamicsCompressor() {
            return {
                threshold: { value: -12, setValueAtTime: () => {} },
                knee: { value: 30, setValueAtTime: () => {} },
                ratio: { value: 12, setValueAtTime: () => {} },
                attack: { value: 0.003, setValueAtTime: () => {} },
                release: { value: 0.25, setValueAtTime: () => {} },
                reduction: 0,
                connect: () => {},
                disconnect: () => {}
            };
        }
        
        createConvolver() {
            return {
                buffer: null,
                connect: () => {},
                disconnect: () => {}
            };
        }
        
        createPanner() {
            return {
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
            };
        }
        
        createDelay(maxDelay) {
            return {
                delayTime: { value: 0.3 },
                connect: () => {},
                disconnect: () => {}
            };
        }
        
        createWaveShaper() {
            return {
                curve: null,
                oversample: '4x',
                connect: () => {},
                disconnect: () => {}
            };
        }
        
        decodeAudioData(arrayBuffer) {
            return Promise.resolve(this.createBuffer(1, 44100, 44100));
        }
        
        resume() {
            return Promise.resolve();
        }
        
        close() {
            return Promise.resolve();
        }
    };
    
    global.window = { AudioContext: global.AudioContext };
}

// Mock fetch for Node.js
if (typeof fetch === 'undefined') {
    global.fetch = () => Promise.resolve({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(44100))
    });
}

// Import modules
import AudioManager from '../src/audio/AudioManager.js';
import BackgroundMusic from '../src/audio/BackgroundMusic.js';
import SoundEffects from '../src/audio/SoundEffects.js';
import AudioMixer from '../src/audio/AudioMixer.js';

// Test runner
class AudioTestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }
    
    test(name, testFn) {
        this.tests.push({ name, testFn });
    }
    
    async run() {
        console.log('🧪 Running Nintendo NFS Audio System Tests...\n');
        
        for (const { name, testFn } of this.tests) {
            try {
                await testFn();
                console.log(`✅ ${name}`);
                this.passed++;
            } catch (error) {
                console.log(`❌ ${name}: ${error.message}`);
                this.failed++;
            }
        }
        
        console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
        
        if (this.failed === 0) {
            console.log('🎉 All tests passed!');
        } else {
            console.log('😞 Some tests failed.');
            process.exit(1);
        }
    }
}

const runner = new AudioTestRunner();

// AudioManager Tests
runner.test('AudioManager - Initialization', async () => {
    const audioManager = new AudioManager();
    
    // Wait for initialization
    let attempts = 0;
    while (!audioManager.isInitialized && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 10));
        attempts++;
    }
    
    if (!audioManager.isInitialized) {
        throw new Error('AudioManager failed to initialize');
    }
    
    audioManager.destroy();
});

runner.test('AudioManager - Volume Control', async () => {
    const audioManager = new AudioManager();
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    audioManager.setMasterVolume(0.5);
    audioManager.setMusicVolume(0.7);
    audioManager.setEffectsVolume(0.9);
    
    const status = audioManager.getStatus();
    if (status.masterVolume !== 0.5) {
        throw new Error('Master volume not set correctly');
    }
    if (status.musicVolume !== 0.7) {
        throw new Error('Music volume not set correctly');
    }
    if (status.effectsVolume !== 0.9) {
        throw new Error('Effects volume not set correctly');
    }
    
    audioManager.destroy();
});

runner.test('AudioManager - Mute/Unmute', async () => {
    const audioManager = new AudioManager();
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const wasMuted = audioManager.toggleMute();
    if (!wasMuted) {
        throw new Error('Mute toggle failed');
    }
    
    audioManager.setMute(false);
    const status = audioManager.getStatus();
    if (status.isMuted) {
        throw new Error('Unmute failed');
    }
    
    audioManager.destroy();
});

// BackgroundMusic Tests
runner.test('BackgroundMusic - Track Loading', async () => {
    const context = new AudioContext();
    const mixer = { getMusicInput: () => ({ connect: () => {} }) };
    const bgMusic = new BackgroundMusic(context, mixer);
    
    const buffer = context.createBuffer(1, 44100, 44100);
    await bgMusic.loadTrack('test-track', buffer, { category: 'menu' });
    
    if (!bgMusic.trackBuffers.has('test-track')) {
        throw new Error('Track not loaded');
    }
    
    bgMusic.destroy();
});

runner.test('BackgroundMusic - Volume Control', async () => {
    const context = new AudioContext();
    const mixer = { getMusicInput: () => ({ connect: () => {} }) };
    const bgMusic = new BackgroundMusic(context, mixer);
    
    bgMusic.setVolume(0.6);
    if (bgMusic.getVolume() !== 0.6) {
        throw new Error('Volume not set correctly');
    }
    
    bgMusic.destroy();
});

// SoundEffects Tests
runner.test('SoundEffects - Sound Loading', async () => {
    const context = new AudioContext();
    const mixer = { getEffectsInput: () => ({ connect: () => {} }) };
    const soundFX = new SoundEffects(context, mixer);
    
    const buffer = context.createBuffer(1, 44100, 44100);
    await soundFX.loadSound('test-sound', buffer, { category: 'ui' });
    
    if (!soundFX.soundBuffers.has('test-sound')) {
        throw new Error('Sound not loaded');
    }
    
    soundFX.destroy();
});

runner.test('SoundEffects - Category Management', async () => {
    const context = new AudioContext();
    const mixer = { getEffectsInput: () => ({ connect: () => {} }) };
    const soundFX = new SoundEffects(context, mixer);
    
    soundFX.setCategoryVolume('engine', 0.8);
    
    const status = soundFX.getStatus();
    if (status.categories.length === 0) {
        throw new Error('No sound categories found');
    }
    
    soundFX.destroy();
});

// AudioMixer Tests
runner.test('AudioMixer - Channel Management', async () => {
    const context = new AudioContext();
    const mixer = new AudioMixer(context);
    
    mixer.setChannelVolume('music', 0.7);
    if (mixer.getChannelVolume('music') !== 0.7) {
        throw new Error('Channel volume not set correctly');
    }
    
    mixer.muteChannel('effects', true);
    
    const status = mixer.getStatus();
    if (status.channels.length === 0) {
        throw new Error('No channels found');
    }
    
    mixer.destroy();
});

runner.test('AudioMixer - Preset Application', async () => {
    const context = new AudioContext();
    const mixer = new AudioMixer(context);
    
    mixer.applyPreset('retro');
    mixer.applyPreset('arcade');
    mixer.applyPreset('modern');
    
    // Test should complete without errors
    mixer.destroy();
});

runner.test('AudioMixer - Effect Processing', async () => {
    const context = new AudioContext();
    const mixer = new AudioMixer(context);
    
    const effects = [
        { type: 'filter', filterType: 'lowpass', frequency: 1000 },
        { type: 'gain', gain: 0.8 }
    ];
    
    mixer.applyEffectChain('music', effects);
    mixer.removeEffectChain('music');
    
    // Test should complete without errors
    mixer.destroy();
});

// Integration Tests
runner.test('Integration - Full Audio System', async () => {
    const audioManager = new AudioManager();
    
    // Wait for initialization
    let attempts = 0;
    while (!audioManager.isInitialized && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 10));
        attempts++;
    }
    
    // Test basic operations
    audioManager.setMasterVolume(0.8);
    audioManager.setMusicVolume(0.7);
    audioManager.setEffectsVolume(0.9);
    audioManager.toggleMute();
    audioManager.toggleMute();
    
    const status = audioManager.getStatus();
    if (!status.initialized) {
        throw new Error('Audio system not properly initialized');
    }
    
    audioManager.destroy();
});

// Run all tests
runner.run().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
});