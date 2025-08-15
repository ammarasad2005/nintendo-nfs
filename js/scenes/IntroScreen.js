// IntroScreen.js - Animated logo sequence and loading screen
class IntroScreen {
    constructor(game) {
        this.game = game;
        this.time = 0;
        this.phase = 'loading'; // loading, logo, prompt
        this.loadingProgress = 0;
        this.logoScale = 0;
        this.promptBlink = 0;
        this.loadingElement = document.getElementById('loadingScreen');
        this.progressElement = document.getElementById('loadingProgress');
        
        console.log('IntroScreen initialized');
    }
    
    enter() {
        console.log('Entering IntroScreen');
        this.time = 0;
        this.phase = 'loading';
        this.loadingProgress = 0;
        this.logoScale = 0;
        this.promptBlink = 0;
        
        // Show loading screen
        this.loadingElement.classList.remove('hidden');
        
        // Simulate loading
        this.startLoading();
    }
    
    exit() {
        console.log('Exiting IntroScreen');
        this.loadingElement.classList.add('hidden');
    }
    
    startLoading() {
        const loadingInterval = setInterval(() => {
            this.loadingProgress += Math.random() * 15 + 5;
            this.progressElement.style.width = Math.min(this.loadingProgress, 100) + '%';
            
            if (this.loadingProgress >= 100) {
                clearInterval(loadingInterval);
                setTimeout(() => {
                    this.loadingElement.classList.add('hidden');
                    this.phase = 'logo';
                }, 500);
            }
        }, 100);
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        
        switch (this.phase) {
            case 'loading':
                // Loading is handled by startLoading()
                break;
                
            case 'logo':
                // Animate logo scaling
                if (this.logoScale < 1) {
                    this.logoScale += deltaTime * 2;
                    if (this.logoScale >= 1) {
                        this.logoScale = 1;
                        setTimeout(() => {
                            this.phase = 'prompt';
                        }, 1000);
                    }
                }
                break;
                
            case 'prompt':
                this.promptBlink += deltaTime * 3;
                
                // Check for input to continue
                if (this.game.inputManager.isPressed('start') || 
                    this.game.inputManager.isPressed('select') ||
                    this.game.inputManager.isMousePressed(0)) {
                    this.game.audioManager.playMenuSelect();
                    this.game.sceneManager.changeScene('mainMenu', 'fade');
                }
                break;
        }
    }
    
    render(ctx) {
        const { width, height } = this.game;
        
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#001122');
        gradient.addColorStop(0.5, '#002244');
        gradient.addColorStop(1, '#001122');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Animated stars background
        this.renderStars(ctx);
        
        if (this.phase === 'logo' || this.phase === 'prompt') {
            this.renderLogo(ctx);
        }
        
        if (this.phase === 'prompt') {
            this.renderPrompt(ctx);
        }
    }
    
    renderStars(ctx) {
        const starCount = 100;
        for (let i = 0; i < starCount; i++) {
            const x = (i * 1234.5 % this.game.width);
            const y = (i * 5678.9 % this.game.height);
            const twinkle = Math.sin(this.time * 2 + i) * 0.5 + 0.5;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    
    renderLogo(ctx) {
        const centerX = this.game.width / 2;
        const centerY = this.game.height / 2 - 50;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(this.logoScale, this.logoScale);
        
        // Nintendo NFS Logo
        this.game.drawPixelText('NINTENDO', -80, -30, '#ff6b6b', 20);
        this.game.drawPixelText('NFS', -30, 10, '#00ff00', 32);
        
        // Racing stripes
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(-100, 40, 200, 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(-100, 48, 200, 4);
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(-100, 56, 200, 4);
        
        ctx.restore();
    }
    
    renderPrompt(ctx) {
        const centerX = this.game.width / 2;
        const centerY = this.game.height / 2 + 100;
        
        // Blinking "Press Start" text
        const alpha = Math.sin(this.promptBlink) * 0.5 + 0.5;
        const color = `rgba(255, 255, 255, ${alpha})`;
        
        this.game.drawPixelText('PRESS START', centerX - 110, centerY, color, 16);
        
        // Input hints
        this.game.drawPixelText('SPACE or ENTER to continue', centerX - 140, centerY + 40, '#aaa', 10);
    }
}