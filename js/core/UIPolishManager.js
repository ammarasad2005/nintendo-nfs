/**
 * UIPolishManager.js
 * Main coordinator for UI/UX improvements and polish
 * Handles menu system refinements, loading screen improvements, and HUD enhancements
 */

class UIPolishManager {
    constructor() {
        this.animator = null;
        this.visualEffects = null;
        this.userFeedback = null;
        this.currentScreen = 'menu';
        this.transitionInProgress = false;
        this.initialized = false;
        
        // UI Elements
        this.elements = {
            mainMenu: document.getElementById('mainMenu'),
            loadingScreen: document.getElementById('loadingScreen'),
            hud: document.getElementById('hud'),
            uiContainer: document.getElementById('uiContainer')
        };
        
        // Nintendo-style color schemes
        this.colorSchemes = {
            primary: '#ffdd00',
            secondary: '#ff6b6b',
            accent: '#00ff88',
            background: '#1e3c72',
            text: '#ffffff'
        };
        
        this.bindEvents();
    }
    
    async initialize(animator, visualEffects, userFeedback) {
        this.animator = animator;
        this.visualEffects = visualEffects;
        this.userFeedback = userFeedback;
        
        // Initialize all systems
        await this.setupMenuSystem();
        await this.setupLoadingSystem();
        await this.setupHUDSystem();
        
        this.initialized = true;
        console.log('🎮 UIPolishManager initialized with Nintendo-style polish');
    }
    
    bindEvents() {
        // Menu button events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('menu-button')) {
                const action = e.target.getAttribute('data-action');
                this.handleMenuAction(action);
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardInput(e);
        });
        
        // Mouse hover effects
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('menu-button')) {
                this.userFeedback?.playHoverSound();
                this.animator?.buttonHoverIn(e.target);
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('menu-button')) {
                this.animator?.buttonHoverOut(e.target);
            }
        });
    }
    
    async setupMenuSystem() {
        // Enhanced menu with Nintendo-style polish
        this.createMenuParticles();
        this.setupMenuAnimations();
        this.applyNintendoStyling();
    }
    
    createMenuParticles() {
        // Add floating sparkle particles behind menu
        if (this.visualEffects) {
            this.visualEffects.createMenuParticles({
                count: 50,
                type: 'sparkle',
                area: this.elements.mainMenu,
                color: this.colorSchemes.primary
            });
        }
    }
    
    setupMenuAnimations() {
        if (!this.animator) return;
        
        // Stagger menu button animations
        const buttons = this.elements.mainMenu.querySelectorAll('.menu-button');
        buttons.forEach((button, index) => {
            setTimeout(() => {
                this.animator.slideInFromBottom(button, 300 + (index * 100));
            }, index * 150);
        });
    }
    
    applyNintendoStyling() {
        // Apply dynamic Nintendo-style color effects
        const title = this.elements.mainMenu.querySelector('h1');
        if (title) {
            this.animator?.createRainbowText(title);
        }
        
        // Add pulsing glow to menu border
        this.animator?.createPulsingGlow(this.elements.mainMenu);
    }
    
    async setupLoadingSystem() {
        // Enhanced loading screen with smooth transitions
        this.createLoadingAnimations();
        this.setupLoadingProgress();
    }
    
    createLoadingAnimations() {
        if (!this.animator) return;
        
        const spinner = this.elements.loadingScreen.querySelector('.loading-spinner');
        if (spinner) {
            this.animator.enhanceSpinner(spinner);
        }
        
        // Add loading particles
        if (this.visualEffects) {
            this.visualEffects.createLoadingParticles();
        }
    }
    
    setupLoadingProgress() {
        // Create progress bar with Nintendo-style visual feedback
        const progressContainer = document.createElement('div');
        progressContainer.className = 'loading-progress';
        progressContainer.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <div class="progress-text">0%</div>
        `;
        
        // Add CSS for progress bar
        const style = document.createElement('style');
        style.textContent = `
            .loading-progress {
                margin-top: 30px;
                width: 300px;
            }
            .progress-bar {
                width: 100%;
                height: 20px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 10px;
                overflow: hidden;
                border: 2px solid ${this.colorSchemes.primary};
            }
            .progress-fill {
                width: 0%;
                height: 100%;
                background: linear-gradient(45deg, ${this.colorSchemes.primary}, ${this.colorSchemes.secondary});
                transition: width 0.3s ease;
                position: relative;
            }
            .progress-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                animation: shimmer 2s infinite;
            }
            @keyframes shimmer {
                0% { left: -100%; }
                100% { left: 100%; }
            }
            .progress-text {
                text-align: center;
                margin-top: 10px;
                font-size: 10px;
                color: ${this.colorSchemes.primary};
            }
        `;
        document.head.appendChild(style);
        this.elements.loadingScreen.appendChild(progressContainer);
    }
    
    async setupHUDSystem() {
        // Enhanced HUD with Nintendo-style elements
        this.createHUDAnimations();
        this.setupHUDUpdates();
    }
    
    createHUDAnimations() {
        if (!this.animator) return;
        
        const hudElements = this.elements.hud.querySelectorAll('.hud-element');
        hudElements.forEach((element, index) => {
            this.animator.slideInFromTop(element, 200 + (index * 50));
        });
    }
    
    setupHUDUpdates() {
        // Add pulsing effects to important HUD elements
        const speedDisplay = document.getElementById('speedDisplay');
        if (speedDisplay && this.animator) {
            this.animator.createPulsingText(speedDisplay);
        }
    }
    
    async handleMenuAction(action) {
        if (this.transitionInProgress) return;
        
        this.transitionInProgress = true;
        this.userFeedback?.playClickSound();
        this.userFeedback?.triggerHapticFeedback('light');
        
        switch (action) {
            case 'start':
                await this.transitionToGame();
                break;
            case 'options':
                await this.showOptionsMenu();
                break;
            case 'credits':
                await this.showCredits();
                break;
        }
        
        this.transitionInProgress = false;
    }
    
    async transitionToGame() {
        // Show loading screen with smooth transition
        await this.showLoadingScreen();
        
        // Simulate game loading
        await this.simulateGameLoading();
        
        // Transition to game HUD
        await this.showGameHUD();
    }
    
    async showLoadingScreen() {
        if (!this.animator) return;
        
        // Fade out menu
        await this.animator.fadeOut(this.elements.mainMenu, 500);
        this.elements.mainMenu.style.display = 'none';
        
        // Fade in loading screen
        this.elements.loadingScreen.style.display = 'flex';
        await this.animator.fadeIn(this.elements.loadingScreen, 500);
        
        this.currentScreen = 'loading';
    }
    
    async simulateGameLoading() {
        const progressFill = this.elements.loadingScreen.querySelector('.progress-fill');
        const progressText = this.elements.loadingScreen.querySelector('.progress-text');
        
        if (!progressFill || !progressText) return;
        
        // Simulate loading with smooth progress
        for (let i = 0; i <= 100; i += 2) {
            progressFill.style.width = i + '%';
            progressText.textContent = i + '%';
            
            // Add particle effects at milestones
            if (i % 25 === 0 && this.visualEffects) {
                this.visualEffects.createLoadingBurst();
            }
            
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Extra pause for effect
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    async showGameHUD() {
        if (!this.animator) return;
        
        // Fade out loading screen
        await this.animator.fadeOut(this.elements.loadingScreen, 500);
        this.elements.loadingScreen.style.display = 'none';
        
        // Show HUD with animation
        this.elements.hud.style.display = 'block';
        await this.animator.fadeIn(this.elements.hud, 300);
        
        this.currentScreen = 'game';
        
        // Start HUD updates
        this.startHUDUpdates();
    }
    
    startHUDUpdates() {
        // Simulate dynamic HUD updates
        let speed = 0;
        let targetSpeed = 120;
        
        const updateInterval = setInterval(() => {
            if (this.currentScreen !== 'game') {
                clearInterval(updateInterval);
                return;
            }
            
            // Smooth speed transitions
            speed += (targetSpeed - speed) * 0.1;
            document.getElementById('speedDisplay').textContent = Math.round(speed);
            
            // Random speed changes for demo
            if (Math.random() < 0.02) {
                targetSpeed = 60 + Math.random() * 100;
            }
        }, 50);
    }
    
    async showOptionsMenu() {
        // Implementation for options menu
        console.log('🎮 Options menu - Coming soon!');
        this.userFeedback?.showNotification('Options menu coming soon!');
    }
    
    async showCredits() {
        // Implementation for credits
        console.log('🎮 Credits - Coming soon!');
        this.userFeedback?.showNotification('Credits coming soon!');
    }
    
    handleKeyboardInput(e) {
        if (this.transitionInProgress) return;
        
        switch (e.code) {
            case 'Escape':
                if (this.currentScreen === 'game') {
                    this.returnToMenu();
                }
                break;
            case 'Enter':
                if (this.currentScreen === 'menu') {
                    this.handleMenuAction('start');
                }
                break;
        }
    }
    
    async returnToMenu() {
        if (!this.animator) return;
        
        this.transitionInProgress = true;
        
        // Fade out HUD
        await this.animator.fadeOut(this.elements.hud, 300);
        this.elements.hud.style.display = 'none';
        
        // Show menu
        this.elements.mainMenu.style.display = 'block';
        await this.animator.fadeIn(this.elements.mainMenu, 500);
        
        this.currentScreen = 'menu';
        this.transitionInProgress = false;
    }
    
    // Utility methods for other systems to interact with UI
    updateHUDElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
            
            // Add visual feedback for updates
            if (this.animator) {
                this.animator.flashElement(element);
            }
        }
    }
    
    showNotification(message, type = 'info') {
        // Create and show notification with Nintendo-style animation
        const notification = document.createElement('div');
        notification.className = 'notification notification-' + type;
        notification.textContent = message;
        
        // Add notification styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.9)',
            color: this.colorSchemes.primary,
            padding: '15px 20px',
            borderRadius: '10px',
            border: `2px solid ${this.colorSchemes.accent}`,
            fontSize: '10px',
            zIndex: '9999',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Animate out and remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Export for use in other modules
window.UIPolishManager = UIPolishManager;