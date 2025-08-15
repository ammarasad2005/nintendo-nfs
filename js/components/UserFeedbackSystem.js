/**
 * UserFeedbackSystem.js
 * Handles input responsiveness, haptic feedback, sound effects, visual feedback, and controller support
 * Nintendo-style user experience with immediate and satisfying feedback
 */

class UserFeedbackSystem {
    constructor() {
        this.soundEnabled = true;
        this.hapticEnabled = true;
        this.vibrationEnabled = true;
        
        // Sound system
        this.audioContext = null;
        this.sounds = new Map();
        this.masterVolume = 0.7;
        
        // Haptic feedback
        this.gamepad = null;
        this.gamepadIndex = -1;
        
        // Visual feedback
        this.feedbackElements = new Map();
        
        // Input timing tracking
        this.inputHistory = [];
        this.responsiveness = {
            excellent: 16, // 60fps
            good: 33,      // 30fps
            poor: 66       // 15fps
        };
        
        this.initialize();
        
        console.log('🎮 UserFeedbackSystem initialized with Nintendo-style feedback');
    }
    
    async initialize() {
        await this.initializeAudio();
        this.initializeHaptics();
        this.initializeVisualFeedback();
        this.bindInputEvents();
        this.startGamepadPolling();
    }
    
    async initializeAudio() {
        try {
            // Create audio context (for modern browsers)
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create sounds with Nintendo-style 8-bit synthesis
            await this.createSounds();
            
            console.log('🔊 Audio system initialized');
        } catch (error) {
            console.warn('Audio initialization failed:', error);
            this.soundEnabled = false;
        }
    }
    
    async createSounds() {
        // Nintendo-style sound effects using Web Audio API
        const soundConfigs = {
            click: { frequency: 800, type: 'square', duration: 0.1, volume: 0.3 },
            hover: { frequency: 600, type: 'triangle', duration: 0.05, volume: 0.2 },
            success: { 
                frequencies: [523, 659, 784, 1047], // C5, E5, G5, C6
                type: 'sine', 
                duration: 0.6, 
                volume: 0.4 
            },
            error: { frequency: 200, type: 'sawtooth', duration: 0.3, volume: 0.4 },
            powerup: {
                frequencies: [523, 587, 659, 698, 784, 880, 988, 1047],
                type: 'triangle',
                duration: 1.0,
                volume: 0.5
            },
            boost: { frequency: 440, type: 'square', duration: 0.8, volume: 0.6 },
            coin: { 
                frequencies: [1319, 1568], // E6, G6
                type: 'square', 
                duration: 0.3, 
                volume: 0.4 
            }
        };
        
        for (const [name, config] of Object.entries(soundConfigs)) {
            this.sounds.set(name, config);
        }
    }
    
    playSound(soundName, volume = 1.0) {
        if (!this.soundEnabled || !this.audioContext || !this.sounds.has(soundName)) {
            return;
        }
        
        const config = this.sounds.get(soundName);
        const actualVolume = config.volume * volume * this.masterVolume;
        
        if (config.frequencies) {
            // Play sequence of frequencies (like success or powerup sounds)
            this.playFrequencySequence(config.frequencies, config, actualVolume);
        } else {
            // Play single frequency
            this.playFrequency(config.frequency, config.type, config.duration, actualVolume);
        }
    }
    
    playFrequency(frequency, type, duration, volume) {
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            // Envelope for Nintendo-style sound
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            console.warn('Sound playback failed:', error);
        }
    }
    
    playFrequencySequence(frequencies, config, volume) {
        const noteDuration = config.duration / frequencies.length;
        
        frequencies.forEach((frequency, index) => {
            setTimeout(() => {
                this.playFrequency(frequency, config.type, noteDuration * 1.5, volume);
            }, index * noteDuration * 1000);
        });
    }
    
    // Nintendo-style preset sounds
    playClickSound() {
        this.playSound('click');
    }
    
    playHoverSound() {
        this.playSound('hover');
    }
    
    playSuccessSound() {
        this.playSound('success');
    }
    
    playErrorSound() {
        this.playSound('error');
    }
    
    playPowerUpSound() {
        this.playSound('powerup');
    }
    
    playBoostSound() {
        this.playSound('boost');
    }
    
    playCoinSound() {
        this.playSound('coin');
    }
    
    // Haptic feedback system
    initializeHaptics() {
        // Check for vibration API support
        this.vibrationEnabled = 'vibrate' in navigator;
        
        if (this.vibrationEnabled) {
            console.log('📳 Vibration API available');
        }
    }
    
    triggerHapticFeedback(type = 'light', duration = null) {
        if (!this.hapticEnabled) return;
        
        // Controller vibration
        this.triggerControllerVibration(type);
        
        // Mobile vibration
        this.triggerMobileVibration(type, duration);
    }
    
    triggerControllerVibration(type) {
        if (!this.gamepad || !this.gamepad.vibrationActuator) return;
        
        const patterns = {
            light: { startDelay: 0, duration: 100, weakMagnitude: 0.3, strongMagnitude: 0.1 },
            medium: { startDelay: 0, duration: 200, weakMagnitude: 0.6, strongMagnitude: 0.3 },
            strong: { startDelay: 0, duration: 300, weakMagnitude: 1.0, strongMagnitude: 0.7 },
            boost: { startDelay: 0, duration: 500, weakMagnitude: 0.8, strongMagnitude: 0.5 },
            crash: { startDelay: 0, duration: 800, weakMagnitude: 1.0, strongMagnitude: 1.0 }
        };
        
        const pattern = patterns[type] || patterns.light;
        
        try {
            this.gamepad.vibrationActuator.playEffect('dual-rumble', pattern);
        } catch (error) {
            console.warn('Controller vibration failed:', error);
        }
    }
    
    triggerMobileVibration(type, duration) {
        if (!this.vibrationEnabled) return;
        
        const patterns = {
            light: duration || [50],
            medium: duration || [100],
            strong: duration || [200],
            boost: duration || [100, 50, 100, 50, 200],
            crash: duration || [300, 100, 300],
            click: duration || [10],
            success: duration || [50, 50, 50, 50, 200]
        };
        
        const pattern = patterns[type] || patterns.light;
        
        try {
            navigator.vibrate(pattern);
        } catch (error) {
            console.warn('Mobile vibration failed:', error);
        }
    }
    
    // Visual feedback system
    initializeVisualFeedback() {
        // Create feedback overlay
        this.createFeedbackOverlay();
        
        // Setup responsive cursor
        this.setupResponsiveCursor();
        
        console.log('👁️ Visual feedback system initialized');
    }
    
    createFeedbackOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'feedbackOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9998;
        `;
        document.body.appendChild(overlay);
        
        this.feedbackOverlay = overlay;
    }
    
    setupResponsiveCursor() {
        const style = document.createElement('style');
        style.textContent = `
            .nintendo-cursor {
                cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="%23ffdd00" stroke="%23000" stroke-width="2"/></svg>') 10 10, auto;
            }
            
            .hover-cursor {
                cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%23ff6b6b" stroke="%23fff" stroke-width="2"/></svg>') 12 12, pointer;
            }
            
            .click-cursor {
                cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="%2300ff88" stroke="%23000" stroke-width="2"/></svg>') 8 8, pointer;
            }
        `;
        document.head.appendChild(style);
        
        document.body.classList.add('nintendo-cursor');
    }
    
    showVisualFeedback(x, y, type = 'click', color = '#ffdd00') {
        const feedback = document.createElement('div');
        feedback.className = `visual-feedback feedback-${type}`;
        
        const animations = {
            click: this.createClickFeedback,
            hover: this.createHoverFeedback,
            success: this.createSuccessFeedback,
            error: this.createErrorFeedback,
            boost: this.createBoostFeedback
        };
        
        if (animations[type]) {
            animations[type].call(this, feedback, x, y, color);
        }
        
        this.feedbackOverlay.appendChild(feedback);
        
        // Remove after animation
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 1000);
    }
    
    createClickFeedback(element, x, y, color) {
        element.style.cssText = `
            position: absolute;
            left: ${x - 15}px;
            top: ${y - 15}px;
            width: 30px;
            height: 30px;
            border: 3px solid ${color};
            border-radius: 50%;
            background: transparent;
            animation: clickPulse 0.3s ease-out;
        `;
        
        // Add animation keyframes
        if (!document.getElementById('clickFeedbackStyles')) {
            const style = document.createElement('style');
            style.id = 'clickFeedbackStyles';
            style.textContent = `
                @keyframes clickPulse {
                    0% { transform: scale(0.5); opacity: 1; }
                    100% { transform: scale(2); opacity: 0; }
                }
                
                @keyframes hoverGlow {
                    0% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.8; }
                }
                
                @keyframes successBurst {
                    0% { transform: scale(0) rotate(0deg); opacity: 1; }
                    50% { transform: scale(1.5) rotate(180deg); opacity: 0.8; }
                    100% { transform: scale(2) rotate(360deg); opacity: 0; }
                }
                
                @keyframes errorShake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    createSuccessFeedback(element, x, y, color) {
        element.innerHTML = '⭐';
        element.style.cssText = `
            position: absolute;
            left: ${x - 20}px;
            top: ${y - 20}px;
            font-size: 40px;
            color: ${color};
            text-shadow: 0 0 10px ${color};
            animation: successBurst 0.6s ease-out;
        `;
    }
    
    createErrorFeedback(element, x, y, color) {
        element.innerHTML = '❌';
        element.style.cssText = `
            position: absolute;
            left: ${x - 15}px;
            top: ${y - 15}px;
            font-size: 30px;
            animation: errorShake 0.5s ease-in-out;
        `;
    }
    
    createBoostFeedback(element, x, y, color) {
        element.innerHTML = '💨';
        element.style.cssText = `
            position: absolute;
            left: ${x - 20}px;
            top: ${y - 20}px;
            font-size: 40px;
            animation: clickPulse 0.4s ease-out;
        `;
    }
    
    // Input responsiveness tracking
    bindInputEvents() {
        // Track mouse events
        document.addEventListener('mousedown', (e) => this.trackInput('mouse', e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Track keyboard events
        document.addEventListener('keydown', (e) => this.trackInput('keyboard', e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Track touch events
        document.addEventListener('touchstart', (e) => this.trackInput('touch', e));
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        console.log('⌨️ Input tracking initialized');
    }
    
    trackInput(type, event) {
        const timestamp = performance.now();
        
        this.inputHistory.push({
            type,
            timestamp,
            target: event.target,
            processed: false
        });
        
        // Keep only recent history
        const cutoff = timestamp - 1000; // 1 second
        this.inputHistory = this.inputHistory.filter(input => input.timestamp > cutoff);
        
        this.processInput(type, event, timestamp);
    }
    
    processInput(type, event, timestamp) {
        // Immediate visual feedback
        if (type === 'mouse' && event.type === 'mousedown') {
            this.showVisualFeedback(event.clientX, event.clientY, 'click');
            this.triggerHapticFeedback('light');
            
            // Update cursor
            document.body.classList.add('click-cursor');
            setTimeout(() => {
                document.body.classList.remove('click-cursor');
            }, 100);
        }
        
        // Play appropriate sound
        if (event.target.classList.contains('menu-button')) {
            this.playClickSound();
        }
        
        // Mark as processed
        const input = this.inputHistory.find(i => i.timestamp === timestamp);
        if (input) {
            input.processed = true;
            input.processingTime = performance.now() - timestamp;
        }
    }
    
    handleMouseUp(event) {
        document.body.classList.remove('click-cursor');
    }
    
    handleMouseMove(event) {
        // Update hover states
        if (event.target.classList.contains('menu-button')) {
            document.body.classList.add('hover-cursor');
        } else {
            document.body.classList.remove('hover-cursor');
        }
    }
    
    handleKeyUp(event) {
        // Add key release feedback if needed
    }
    
    handleTouchEnd(event) {
        // Add touch-specific feedback
        const touch = event.changedTouches[0];
        if (touch) {
            this.showVisualFeedback(touch.clientX, touch.clientY, 'click', '#00ff88');
            this.triggerHapticFeedback('medium');
        }
    }
    
    // Gamepad support
    startGamepadPolling() {
        this.pollGamepad();
        console.log('🎮 Gamepad polling started');
    }
    
    pollGamepad() {
        const gamepads = navigator.getGamepads();
        
        // Find connected gamepad
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                if (this.gamepadIndex !== i) {
                    this.gamepadIndex = i;
                    this.gamepad = gamepads[i];
                    console.log(`🎮 Gamepad connected: ${this.gamepad.id}`);
                }
                break;
            }
        }
        
        // Update gamepad state
        if (this.gamepadIndex >= 0) {
            this.gamepad = gamepads[this.gamepadIndex];
            this.handleGamepadInput();
        }
        
        requestAnimationFrame(() => this.pollGamepad());
    }
    
    handleGamepadInput() {
        if (!this.gamepad) return;
        
        // Handle button presses
        this.gamepad.buttons.forEach((button, index) => {
            if (button.pressed && !this.previousButtons?.[index]?.pressed) {
                this.handleGamepadButton(index);
            }
        });
        
        // Store previous state
        this.previousButtons = this.gamepad.buttons.map(b => ({ pressed: b.pressed }));
    }
    
    handleGamepadButton(buttonIndex) {
        // Map gamepad buttons to actions
        const buttonMap = {
            0: 'confirm',    // A button
            1: 'cancel',     // B button
            2: 'special',    // X button
            3: 'boost',      // Y button
            12: 'up',        // D-pad up
            13: 'down',      // D-pad down
            14: 'left',      // D-pad left
            15: 'right'      // D-pad right
        };
        
        const action = buttonMap[buttonIndex];
        if (action) {
            this.handleGamepadAction(action);
        }
    }
    
    handleGamepadAction(action) {
        this.playClickSound();
        this.triggerHapticFeedback('light');
        
        // Emit custom event for other systems to handle
        const event = new CustomEvent('gamepadAction', { detail: { action } });
        document.dispatchEvent(event);
    }
    
    // Notification system
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `feedback-notification notification-${type}`;
        notification.textContent = message;
        
        const colors = {
            info: '#00bfff',
            success: '#00ff88',
            warning: '#ffdd00',
            error: '#ff6b6b'
        };
        
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: ${colors[type] || colors.info};
            padding: 15px 25px;
            border-radius: 10px;
            border: 2px solid ${colors[type] || colors.info};
            font-family: 'Press Start 2P', cursive;
            font-size: 10px;
            z-index: 9999;
            animation: slideUpIn 0.3s ease-out;
        `;
        
        // Add slide animation
        if (!document.getElementById('notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes slideUpIn {
                    from { transform: translateX(-50%) translateY(100%); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
                
                @keyframes slideUpOut {
                    from { transform: translateX(-50%) translateY(0); opacity: 1; }
                    to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Play notification sound
        this.playSound(type === 'error' ? 'error' : 'success');
        
        // Remove after duration
        setTimeout(() => {
            notification.style.animation = 'slideUpOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    // Performance monitoring
    getInputResponseTime() {
        const recentInputs = this.inputHistory.filter(input => 
            input.processed && input.processingTime !== undefined
        );
        
        if (recentInputs.length === 0) return 0;
        
        const averageTime = recentInputs.reduce((sum, input) => 
            sum + input.processingTime, 0
        ) / recentInputs.length;
        
        return averageTime;
    }
    
    getResponsivenessRating() {
        const avgTime = this.getInputResponseTime();
        
        if (avgTime <= this.responsiveness.excellent) return 'excellent';
        if (avgTime <= this.responsiveness.good) return 'good';
        return 'poor';
    }
    
    // Settings
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }
    
    toggleHaptics() {
        this.hapticEnabled = !this.hapticEnabled;
        return this.hapticEnabled;
    }
    
    toggleVibration() {
        this.vibrationEnabled = !this.vibrationEnabled;
        return this.vibrationEnabled;
    }
}

// Export for use in other modules
window.UserFeedbackSystem = UserFeedbackSystem;