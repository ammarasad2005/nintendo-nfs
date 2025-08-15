// AudioManager.js - Manages 8-bit style audio for Nintendo aesthetics
class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = {};
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        this.currentMusic = null;
        
        console.log('Audio Manager initialized');
    }
    
    // Load sound effect
    loadSound(name, url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.addEventListener('canplaythrough', () => {
                this.sounds[name] = audio;
                console.log(`Sound loaded: ${name}`);
                resolve(audio);
            });
            audio.addEventListener('error', reject);
            audio.src = url;
        });
    }
    
    // Load background music
    loadMusic(name, url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.loop = true;
            audio.addEventListener('canplaythrough', () => {
                this.music[name] = audio;
                console.log(`Music loaded: ${name}`);
                resolve(audio);
            });
            audio.addEventListener('error', reject);
            audio.src = url;
        });
    }
    
    // Play sound effect
    playSound(name, volume = 1.0) {
        if (this.sounds[name]) {
            const sound = this.sounds[name].cloneNode();
            sound.volume = this.sfxVolume * volume;
            sound.play().catch(e => console.warn('Could not play sound:', e));
        } else {
            console.warn(`Sound not found: ${name}`);
        }
    }
    
    // Play background music
    playMusic(name, volume = 1.0) {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }
        
        if (this.music[name]) {
            this.currentMusic = this.music[name];
            this.currentMusic.volume = this.musicVolume * volume;
            this.currentMusic.play().catch(e => console.warn('Could not play music:', e));
        } else {
            console.warn(`Music not found: ${name}`);
        }
    }
    
    // Stop current music
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic = null;
        }
    }
    
    // Set volume levels
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume;
        }
    }
    
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
    
    // Create synthetic 8-bit style sounds using Web Audio API
    createBeepSound(frequency = 440, duration = 0.1, type = 'square') {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(this.sfxVolume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    // Nintendo-style sound effects
    playMenuSelect() {
        this.createBeepSound(800, 0.1, 'square');
    }
    
    playMenuMove() {
        this.createBeepSound(600, 0.05, 'square');
    }
    
    playEngineSound() {
        this.createBeepSound(200, 0.2, 'sawtooth');
    }
    
    playPowerUp() {
        // Ascending beep sequence
        setTimeout(() => this.createBeepSound(440, 0.1), 0);
        setTimeout(() => this.createBeepSound(554, 0.1), 100);
        setTimeout(() => this.createBeepSound(659, 0.1), 200);
    }
}