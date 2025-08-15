/**
 * AudioMixer.js
 * 
 * Advanced audio mixing system with channel management, dynamic mixing,
 * effect processing, and Nintendo-style audio enhancements.
 */

class AudioMixer {
    constructor(audioContext) {
        this.context = audioContext;
        
        // Main mixer nodes
        this.masterGain = this.context.createGain();
        this.musicChannel = this.context.createGain();
        this.effectsChannel = this.context.createGain();
        this.uiChannel = this.context.createGain();
        this.ambientChannel = this.context.createGain();
        
        // Compressor for Nintendo-style dynamics
        this.compressor = this.context.createDynamicsCompressor();
        this.compressor.threshold.value = -12;
        this.compressor.knee.value = 30;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;
        
        // Nintendo-style filter for retro sound
        this.retroFilter = this.context.createBiquadFilter();
        this.retroFilter.type = 'lowpass';
        this.retroFilter.frequency.value = 8000;
        this.retroFilter.Q.value = 0.8;
        
        // Reverb for spatial enhancement
        this.reverb = null;
        this.reverbGain = this.context.createGain();
        this.reverbGain.gain.value = 0.2;
        
        // Channel volumes
        this.channelVolumes = {
            music: 0.8,
            effects: 0.9,
            ui: 0.7,
            ambient: 0.6
        };
        
        // Effect processing chains
        this.effectChains = new Map();
        this.routingMatrix = new Map();
        
        // Initialize mixer
        this.setupMixer();
        this.createReverb();
    }
    
    /**
     * Set up the main mixer routing
     */
    setupMixer() {
        // Set initial channel volumes
        this.musicChannel.gain.value = this.channelVolumes.music;
        this.effectsChannel.gain.value = this.channelVolumes.effects;
        this.uiChannel.gain.value = this.channelVolumes.ui;
        this.ambientChannel.gain.value = this.channelVolumes.ambient;
        
        // Create routing matrix
        this.routingMatrix.set('music', this.musicChannel);
        this.routingMatrix.set('effects', this.effectsChannel);
        this.routingMatrix.set('ui', this.uiChannel);
        this.routingMatrix.set('ambient', this.ambientChannel);
        
        // Connect channels to compressor
        this.musicChannel.connect(this.compressor);
        this.effectsChannel.connect(this.compressor);
        this.uiChannel.connect(this.compressor);
        this.ambientChannel.connect(this.compressor);
        
        // Connect compressor to retro filter
        this.compressor.connect(this.retroFilter);
        
        // Connect filter to master gain
        this.retroFilter.connect(this.masterGain);
        
        // Set up reverb send
        this.musicChannel.connect(this.reverbGain);
        this.effectsChannel.connect(this.reverbGain);
        this.ambientChannel.connect(this.reverbGain);
    }
    
    /**
     * Create reverb effect for spatial enhancement
     */
    async createReverb() {
        try {
            // Create impulse response for reverb
            const reverbBuffer = this.createReverbImpulse(2, 2, false);
            
            this.reverb = this.context.createConvolver();
            this.reverb.buffer = reverbBuffer;
            
            // Connect reverb
            this.reverbGain.connect(this.reverb);
            this.reverb.connect(this.masterGain);
            
        } catch (error) {
            console.warn('Failed to create reverb:', error);
        }
    }
    
    /**
     * Create impulse response for reverb
     * @param {number} duration - Reverb duration in seconds
     * @param {number} decay - Decay factor
     * @param {boolean} reverse - Whether to reverse the impulse
     */
    createReverbImpulse(duration, decay, reverse) {
        const sampleRate = this.context.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.context.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            
            for (let i = 0; i < length; i++) {
                const n = reverse ? length - i : i;
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
            }
        }
        
        return impulse;
    }
    
    /**
     * Get input node for music channel
     */
    getMusicInput() {
        return this.musicChannel;
    }
    
    /**
     * Get input node for effects channel
     */
    getEffectsInput() {
        return this.effectsChannel;
    }
    
    /**
     * Get input node for UI channel
     */
    getUIInput() {
        return this.uiChannel;
    }
    
    /**
     * Get input node for ambient channel
     */
    getAmbientInput() {
        return this.ambientChannel;
    }
    
    /**
     * Connect mixer to destination
     * @param {AudioNode} destination - Destination node
     */
    connect(destination) {
        this.masterGain.connect(destination);
    }
    
    /**
     * Set volume for a specific channel
     * @param {string} channel - Channel name (music, effects, ui, ambient)
     * @param {number} volume - Volume level (0.0 to 1.0)
     * @param {number} fadeTime - Fade time in seconds
     */
    setChannelVolume(channel, volume, fadeTime = 0) {
        if (!this.routingMatrix.has(channel)) {
            console.warn(`Unknown channel: ${channel}`);
            return;
        }
        
        volume = Math.max(0, Math.min(1, volume));
        this.channelVolumes[channel] = volume;
        
        const channelNode = this.routingMatrix.get(channel);
        
        if (fadeTime > 0) {
            channelNode.gain.setValueAtTime(channelNode.gain.value, this.context.currentTime);
            channelNode.gain.linearRampToValueAtTime(volume, this.context.currentTime + fadeTime);
        } else {
            channelNode.gain.setValueAtTime(volume, this.context.currentTime);
        }
    }
    
    /**
     * Get current volume for a channel
     * @param {string} channel - Channel name
     */
    getChannelVolume(channel) {
        return this.channelVolumes[channel] || 0;
    }
    
    /**
     * Mute/unmute a channel
     * @param {string} channel - Channel name
     * @param {boolean} muted - Mute state
     * @param {number} fadeTime - Fade time in seconds
     */
    muteChannel(channel, muted, fadeTime = 0.1) {
        if (!this.routingMatrix.has(channel)) {
            console.warn(`Unknown channel: ${channel}`);
            return;
        }
        
        const channelNode = this.routingMatrix.get(channel);
        const targetVolume = muted ? 0 : this.channelVolumes[channel];
        
        if (fadeTime > 0) {
            channelNode.gain.setValueAtTime(channelNode.gain.value, this.context.currentTime);
            channelNode.gain.linearRampToValueAtTime(targetVolume, this.context.currentTime + fadeTime);
        } else {
            channelNode.gain.setValueAtTime(targetVolume, this.context.currentTime);
        }
    }
    
    /**
     * Apply Nintendo-style retro filter
     * @param {boolean} enabled - Whether to enable the filter
     * @param {number} cutoff - Filter cutoff frequency
     * @param {number} resonance - Filter resonance (Q)
     */
    setRetroFilter(enabled, cutoff = 8000, resonance = 0.8) {
        if (enabled) {
            this.retroFilter.frequency.setValueAtTime(cutoff, this.context.currentTime);
            this.retroFilter.Q.setValueAtTime(resonance, this.context.currentTime);
        } else {
            // Bypass filter by setting high cutoff
            this.retroFilter.frequency.setValueAtTime(22050, this.context.currentTime);
            this.retroFilter.Q.setValueAtTime(0.1, this.context.currentTime);
        }
    }
    
    /**
     * Set reverb amount
     * @param {number} amount - Reverb amount (0.0 to 1.0)
     * @param {number} fadeTime - Fade time in seconds
     */
    setReverbAmount(amount, fadeTime = 0) {
        amount = Math.max(0, Math.min(1, amount));
        
        if (fadeTime > 0) {
            this.reverbGain.gain.setValueAtTime(this.reverbGain.gain.value, this.context.currentTime);
            this.reverbGain.gain.linearRampToValueAtTime(amount, this.context.currentTime + fadeTime);
        } else {
            this.reverbGain.gain.setValueAtTime(amount, this.context.currentTime);
        }
    }
    
    /**
     * Configure dynamic compressor
     * @param {Object} settings - Compressor settings
     */
    setCompressionSettings(settings) {
        if (settings.threshold !== undefined) {
            this.compressor.threshold.setValueAtTime(settings.threshold, this.context.currentTime);
        }
        if (settings.knee !== undefined) {
            this.compressor.knee.setValueAtTime(settings.knee, this.context.currentTime);
        }
        if (settings.ratio !== undefined) {
            this.compressor.ratio.setValueAtTime(settings.ratio, this.context.currentTime);
        }
        if (settings.attack !== undefined) {
            this.compressor.attack.setValueAtTime(settings.attack, this.context.currentTime);
        }
        if (settings.release !== undefined) {
            this.compressor.release.setValueAtTime(settings.release, this.context.currentTime);
        }
    }
    
    /**
     * Create and apply an effect chain to a channel
     * @param {string} channel - Channel name
     * @param {Array} effects - Array of effect configurations
     */
    applyEffectChain(channel, effects) {
        if (!this.routingMatrix.has(channel)) {
            console.warn(`Unknown channel: ${channel}`);
            return;
        }
        
        // Remove existing effect chain
        if (this.effectChains.has(channel)) {
            this.removeEffectChain(channel);
        }
        
        const channelNode = this.routingMatrix.get(channel);
        const effectNodes = [];
        let currentNode = channelNode;
        
        // Create effect chain
        effects.forEach(effectConfig => {
            const effectNode = this.createEffect(effectConfig);
            if (effectNode) {
                effectNodes.push(effectNode);
                currentNode.connect(effectNode);
                currentNode = effectNode;
            }
        });
        
        // Connect final node to compressor
        if (effectNodes.length > 0) {
            currentNode.connect(this.compressor);
            this.effectChains.set(channel, effectNodes);
        }
    }
    
    /**
     * Create an audio effect node
     * @param {Object} config - Effect configuration
     */
    createEffect(config) {
        switch (config.type) {
            case 'filter':
                return this.createFilter(config);
            case 'delay':
                return this.createDelay(config);
            case 'distortion':
                return this.createDistortion(config);
            case 'gain':
                return this.createGain(config);
            default:
                console.warn(`Unknown effect type: ${config.type}`);
                return null;
        }
    }
    
    /**
     * Create a filter effect
     * @param {Object} config - Filter configuration
     */
    createFilter(config) {
        const filter = this.context.createBiquadFilter();
        filter.type = config.filterType || 'lowpass';
        filter.frequency.value = config.frequency || 1000;
        filter.Q.value = config.Q || 1;
        if (config.gain !== undefined) {
            filter.gain.value = config.gain;
        }
        return filter;
    }
    
    /**
     * Create a delay effect
     * @param {Object} config - Delay configuration
     */
    createDelay(config) {
        const delay = this.context.createDelay(config.maxDelay || 1);
        delay.delayTime.value = config.delayTime || 0.3;
        
        // Add feedback if specified
        if (config.feedback) {
            const feedback = this.context.createGain();
            feedback.gain.value = config.feedback;
            delay.connect(feedback);
            feedback.connect(delay);
        }
        
        return delay;
    }
    
    /**
     * Create a distortion effect
     * @param {Object} config - Distortion configuration
     */
    createDistortion(config) {
        const waveshaper = this.context.createWaveShaper();
        const amount = config.amount || 50;
        const samples = 44100;
        const curve = new Float32Array(samples);
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * Math.PI / 180) / (Math.PI + amount * Math.abs(x));
        }
        
        waveshaper.curve = curve;
        waveshaper.oversample = '4x';
        
        return waveshaper;
    }
    
    /**
     * Create a gain effect
     * @param {Object} config - Gain configuration
     */
    createGain(config) {
        const gain = this.context.createGain();
        gain.gain.value = config.gain || 1;
        return gain;
    }
    
    /**
     * Remove effect chain from a channel
     * @param {string} channel - Channel name
     */
    removeEffectChain(channel) {
        if (this.effectChains.has(channel)) {
            const effects = this.effectChains.get(channel);
            
            // Disconnect all effects
            effects.forEach(effect => {
                effect.disconnect();
            });
            
            // Reconnect channel directly to compressor
            const channelNode = this.routingMatrix.get(channel);
            channelNode.disconnect();
            channelNode.connect(this.compressor);
            
            this.effectChains.delete(channel);
        }
    }
    
    /**
     * Apply Nintendo-style preset configurations
     * @param {string} preset - Preset name (retro, modern, arcade)
     */
    applyPreset(preset) {
        switch (preset) {
            case 'retro':
                this.setRetroFilter(true, 6000, 1.2);
                this.setCompressionSettings({
                    threshold: -8,
                    ratio: 8,
                    attack: 0.001,
                    release: 0.1
                });
                this.setReverbAmount(0.1);
                break;
                
            case 'modern':
                this.setRetroFilter(false);
                this.setCompressionSettings({
                    threshold: -12,
                    ratio: 4,
                    attack: 0.003,
                    release: 0.25
                });
                this.setReverbAmount(0.3);
                break;
                
            case 'arcade':
                this.setRetroFilter(true, 8000, 0.8);
                this.setCompressionSettings({
                    threshold: -6,
                    ratio: 12,
                    attack: 0.001,
                    release: 0.05
                });
                this.setReverbAmount(0.05);
                break;
                
            default:
                console.warn(`Unknown preset: ${preset}`);
        }
    }
    
    /**
     * Get mixer status
     */
    getStatus() {
        return {
            channels: Object.keys(this.channelVolumes),
            channelVolumes: { ...this.channelVolumes },
            effectChains: Array.from(this.effectChains.keys()),
            reverbAmount: this.reverbGain.gain.value,
            compressionReduction: this.compressor.reduction,
            filterCutoff: this.retroFilter.frequency.value
        };
    }
    
    /**
     * Destroy the mixer
     */
    destroy() {
        // Remove all effect chains
        this.effectChains.forEach((_, channel) => {
            this.removeEffectChain(channel);
        });
        
        // Disconnect all nodes
        this.masterGain.disconnect();
        this.musicChannel.disconnect();
        this.effectsChannel.disconnect();
        this.uiChannel.disconnect();
        this.ambientChannel.disconnect();
        this.compressor.disconnect();
        this.retroFilter.disconnect();
        this.reverbGain.disconnect();
        
        if (this.reverb) {
            this.reverb.disconnect();
        }
        
        this.effectChains.clear();
        this.routingMatrix.clear();
    }
}

export default AudioMixer;