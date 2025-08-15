/**
 * main.js
 * Main game file that initializes and coordinates all UI/UX systems
 * Nintendo-style Need for Speed with comprehensive polish
 */

class NintendoNFSGame {
    constructor() {
        this.initialized = false;
        this.gameState = 'loading';
        
        // Core systems
        this.uiManager = null;
        this.animator = null;
        this.visualEffects = null;
        this.userFeedback = null;
        
        // Game canvas
        this.gameCanvas = document.getElementById('gameCanvas');
        this.gameCtx = null;
        
        // Performance monitoring
        this.fps = 0;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        
        console.log('🏎️ Nintendo NFS Game initializing...');
    }
    
    async initialize() {
        try {
            // Initialize game canvas
            this.setupGameCanvas();
            
            // Initialize all UI/UX systems
            await this.initializeSystems();
            
            // Setup game loop
            this.startGameLoop();
            
            // Mark as initialized
            this.initialized = true;
            this.gameState = 'menu';
            
            console.log('🎮 Nintendo NFS Game initialized successfully!');
            
            // Show welcome message
            this.userFeedback.showNotification('Welcome to Nintendo-Style Need for Speed!', 'success');
            
        } catch (error) {
            console.error('❌ Game initialization failed:', error);
            this.userFeedback?.showNotification('Game initialization failed', 'error');
        }
    }
    
    setupGameCanvas() {
        if (!this.gameCanvas) return;
        
        this.gameCtx = this.gameCanvas.getContext('2d');
        this.resizeCanvas();
        
        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        console.log('🖼️ Game canvas initialized');
    }
    
    resizeCanvas() {
        if (!this.gameCanvas || !this.gameCtx) return;
        
        this.gameCanvas.width = window.innerWidth;
        this.gameCanvas.height = window.innerHeight;
    }
    
    async initializeSystems() {
        // Initialize systems in order
        this.userFeedback = new UserFeedbackSystem();
        this.animator = new UIAnimator();
        this.visualEffects = new VisualEffectsManager();
        this.uiManager = new UIPolishManager();
        
        // Wait for all systems to initialize
        await this.uiManager.initialize(this.animator, this.visualEffects, this.userFeedback);
        
        // Setup system interactions
        this.setupSystemInteractions();
        
        console.log('🔧 All systems initialized and connected');
    }
    
    setupSystemInteractions() {
        // Gamepad events
        document.addEventListener('gamepadAction', (e) => {
            this.handleGamepadAction(e.detail.action);
        });
        
        // Custom game events
        document.addEventListener('raceStart', () => {
            this.handleRaceStart();
        });
        
        document.addEventListener('powerUpCollected', (e) => {
            this.handlePowerUpCollected(e.detail);
        });
        
        // Performance monitoring
        this.setupPerformanceMonitoring();
    }
    
    setupPerformanceMonitoring() {
        // Monitor FPS and adjust quality accordingly
        setInterval(() => {
            if (this.fps < 30) {
                this.visualEffects.setQuality('low');
                console.warn('⚠️ Low FPS detected, reducing visual effects quality');
            } else if (this.fps > 55) {
                this.visualEffects.setQuality('high');
            }
        }, 5000);
    }
    
    startGameLoop() {
        const gameLoop = (currentTime) => {
            // Calculate FPS
            this.calculateFPS(currentTime);
            
            // Update game
            this.update(currentTime);
            
            // Render game
            this.render(currentTime);
            
            // Continue loop
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
        console.log('🔄 Game loop started');
    }
    
    calculateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFrameTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
        }
    }
    
    update(currentTime) {
        if (!this.initialized) return;
        
        // Update based on game state
        switch (this.gameState) {
            case 'menu':
                this.updateMenu(currentTime);
                break;
            case 'racing':
                this.updateRacing(currentTime);
                break;
            case 'paused':
                this.updatePaused(currentTime);
                break;
        }
    }
    
    updateMenu(currentTime) {
        // Menu background effects
        if (Math.random() < 0.02) {
            this.visualEffects.addEffect('sparkle', {
                x: Math.random() * this.gameCanvas.width,
                y: Math.random() * this.gameCanvas.height,
                color: this.visualEffects.getRandomColor(this.visualEffects.colorPalettes.rainbow)
            });
        }
    }
    
    updateRacing(currentTime) {
        // Simulate racing environment
        this.updateRaceEnvironment(currentTime);
        this.updateHUD(currentTime);
    }
    
    updateRaceEnvironment(currentTime) {
        // Add speed lines for racing feel
        if (Math.random() < 0.3) {
            this.visualEffects.addEffect('trail', {
                x: this.gameCanvas.width + 50,
                y: 100 + Math.random() * (this.gameCanvas.height - 200),
                velocity: { x: -8 - Math.random() * 4, y: (Math.random() - 0.5) * 2 },
                color: '#00ffff',
                length: 30 + Math.random() * 50
            });
        }
        
        // Simulate dynamic weather
        this.updateWeatherEffects();
    }
    
    updateWeatherEffects() {
        // Random weather effects for demo
        const rand = Math.random();
        
        if (rand < 0.005) {
            // Light rain
            this.visualEffects.createRainEffect();
        } else if (rand < 0.002) {
            // Snow
            this.visualEffects.createSnowEffect();
        }
    }
    
    updateHUD(currentTime) {
        // Simulate dynamic HUD updates
        const speed = 80 + Math.sin(currentTime * 0.001) * 40;
        this.uiManager.updateHUDElement('speedDisplay', Math.round(speed));
        
        // Update position occasionally
        if (Math.random() < 0.01) {
            const positions = ['1st', '2nd', '3rd', '4th'];
            const position = positions[Math.floor(Math.random() * positions.length)];
            this.uiManager.updateHUDElement('positionDisplay', position);
        }
    }
    
    updatePaused(currentTime) {
        // Minimal updates when paused
    }
    
    render(currentTime) {
        if (!this.gameCtx) return;
        
        // Clear canvas
        this.gameCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.gameCtx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        
        // Render based on game state
        switch (this.gameState) {
            case 'menu':
                this.renderMenu();
                break;
            case 'racing':
                this.renderRacing();
                break;
        }
        
        // Render FPS counter (debug)
        this.renderDebugInfo();
    }
    
    renderMenu() {
        // Create animated background
        const gradient = this.gameCtx.createLinearGradient(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        gradient.addColorStop(0, '#1e3c72');
        gradient.addColorStop(0.5, '#2a5298');
        gradient.addColorStop(1, '#1e3c72');
        
        this.gameCtx.fillStyle = gradient;
        this.gameCtx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        
        // Add some sparkle effects
        this.renderStars();
    }
    
    renderRacing() {
        // Simulate racing track background
        const roadGradient = this.gameCtx.createLinearGradient(0, this.gameCanvas.height * 0.6, 0, this.gameCanvas.height);
        roadGradient.addColorStop(0, '#444444');
        roadGradient.addColorStop(1, '#222222');
        
        this.gameCtx.fillStyle = roadGradient;
        this.gameCtx.fillRect(0, this.gameCanvas.height * 0.6, this.gameCanvas.width, this.gameCanvas.height * 0.4);
        
        // Road lines
        this.renderRoadLines();
        
        // Horizon
        const skyGradient = this.gameCtx.createLinearGradient(0, 0, 0, this.gameCanvas.height * 0.6);
        skyGradient.addColorStop(0, '#87ceeb');
        skyGradient.addColorStop(1, '#98fb98');
        
        this.gameCtx.fillStyle = skyGradient;
        this.gameCtx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height * 0.6);
    }
    
    renderStars() {
        this.gameCtx.fillStyle = '#ffdd00';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * this.gameCanvas.width;
            const y = Math.random() * this.gameCanvas.height;
            const size = 1 + Math.random() * 2;
            
            this.gameCtx.beginPath();
            this.gameCtx.arc(x, y, size, 0, Math.PI * 2);
            this.gameCtx.fill();
        }
    }
    
    renderRoadLines() {
        this.gameCtx.strokeStyle = '#ffff00';
        this.gameCtx.lineWidth = 4;
        this.gameCtx.setLineDash([20, 20]);
        
        // Center line
        this.gameCtx.beginPath();
        this.gameCtx.moveTo(this.gameCanvas.width / 2, this.gameCanvas.height * 0.6);
        this.gameCtx.lineTo(this.gameCanvas.width / 2, this.gameCanvas.height);
        this.gameCtx.stroke();
        
        this.gameCtx.setLineDash([]);
    }
    
    renderDebugInfo() {
        this.gameCtx.fillStyle = '#ffffff';
        this.gameCtx.font = '12px monospace';
        this.gameCtx.fillText(`FPS: ${this.fps}`, 10, 30);
        this.gameCtx.fillText(`State: ${this.gameState}`, 10, 50);
        this.gameCtx.fillText(`Effects: ${this.visualEffects.effects.length}`, 10, 70);
        
        // Input responsiveness
        const responsiveness = this.userFeedback.getResponsivenessRating();
        const responseColor = {
            excellent: '#00ff88',
            good: '#ffdd00',
            poor: '#ff6b6b'
        }[responsiveness];
        
        this.gameCtx.fillStyle = responseColor;
        this.gameCtx.fillText(`Input: ${responsiveness}`, 10, 90);
    }
    
    // Game event handlers
    handleGamepadAction(action) {
        console.log(`🎮 Gamepad action: ${action}`);
        
        switch (action) {
            case 'confirm':
                if (this.gameState === 'menu') {
                    this.startRace();
                }
                break;
            case 'cancel':
                if (this.gameState === 'racing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
                break;
            case 'boost':
                if (this.gameState === 'racing') {
                    this.activateBoost();
                }
                break;
        }
    }
    
    startRace() {
        this.gameState = 'racing';
        this.userFeedback.showNotification('Race Started!', 'success');
        this.userFeedback.playSuccessSound();
        
        // Start racing effects
        this.visualEffects.createBoostEffect();
        this.userFeedback.triggerHapticFeedback('strong');
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('raceStart'));
    }
    
    pauseGame() {
        this.gameState = 'paused';
        this.userFeedback.showNotification('Game Paused', 'info');
    }
    
    resumeGame() {
        this.gameState = 'racing';
        this.userFeedback.showNotification('Game Resumed', 'info');
    }
    
    activateBoost() {
        console.log('🚀 Boost activated!');
        
        // Visual effects
        this.visualEffects.createBoostEffect();
        this.visualEffects.createSpeedLines();
        this.visualEffects.createScreenFlash('#ffdd00', 0.3);
        this.visualEffects.createCameraShake(15, 300);
        
        // Audio and haptic feedback
        this.userFeedback.playBoostSound();
        this.userFeedback.triggerHapticFeedback('boost');
        
        // Visual feedback
        this.userFeedback.showVisualFeedback(
            this.gameCanvas.width / 2, 
            this.gameCanvas.height / 2, 
            'boost', 
            '#ff6b6b'
        );
        
        this.userFeedback.showNotification('BOOST!', 'warning', 1000);
    }
    
    handleRaceStart() {
        console.log('🏁 Race start event handled');
        
        // Initialize race-specific effects
        this.startRaceEffects();
    }
    
    startRaceEffects() {
        // Start continuous speed lines
        setInterval(() => {
            if (this.gameState === 'racing') {
                this.visualEffects.createSpeedLines();
            }
        }, 200);
        
        // Random power-up spawns for demo
        setInterval(() => {
            if (this.gameState === 'racing' && Math.random() < 0.3) {
                this.spawnPowerUp();
            }
        }, 3000);
    }
    
    spawnPowerUp() {
        const x = this.gameCanvas.width * 0.3 + Math.random() * this.gameCanvas.width * 0.4;
        const y = this.gameCanvas.height * 0.7;
        
        this.visualEffects.createPowerUpEffect(x, y, 'star');
        
        // Simulate power-up collection after a delay
        setTimeout(() => {
            this.collectPowerUp(x, y);
        }, 2000);
    }
    
    collectPowerUp(x, y) {
        this.userFeedback.playCoinSound();
        this.userFeedback.triggerHapticFeedback('medium');
        this.userFeedback.showVisualFeedback(x, y, 'success', '#ffdd00');
        
        // Dispatch power-up collected event
        document.dispatchEvent(new CustomEvent('powerUpCollected', {
            detail: { x, y, type: 'speed' }
        }));
    }
    
    handlePowerUpCollected(data) {
        console.log('⭐ Power-up collected:', data);
        this.userFeedback.showNotification('Power-up collected!', 'success', 1500);
    }
    
    // Public API for external control
    getGameState() {
        return this.gameState;
    }
    
    isInitialized() {
        return this.initialized;
    }
    
    getPerformanceInfo() {
        return {
            fps: this.fps,
            effectCount: this.visualEffects.effects.length,
            inputResponsiveness: this.userFeedback.getResponsivenessRating()
        };
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const game = new NintendoNFSGame();
    await game.initialize();
    
    // Make game accessible globally for debugging
    window.game = game;
    
    console.log('🎮 Nintendo-Style Need for Speed is ready to play!');
});

// Handle page visibility for performance optimization
document.addEventListener('visibilitychange', () => {
    if (window.game) {
        if (document.hidden) {
            window.game.visualEffects?.stop();
        } else {
            window.game.visualEffects?.start();
        }
    }
});