// MainMenu.js - Nintendo-style main menu with animated navigation
class MainMenu {
    constructor(game) {
        this.game = game;
        this.time = 0;
        this.selectedIndex = 0;
        this.menuItems = [
            { text: 'START GAME', action: 'startGame' },
            { text: 'CAR SELECTION', action: 'carSelection' },
            { text: 'TRACK SELECTION', action: 'trackSelection' },
            { text: 'OPTIONS', action: 'options' },
            { text: 'HIGH SCORES', action: 'highScores' }
        ];
        this.lastInputTime = 0;
        this.inputDelay = 0.2; // Prevent input spam
        this.backgroundOffset = 0;
        
        console.log('MainMenu initialized');
    }
    
    enter() {
        console.log('Entering MainMenu');
        this.time = 0;
        this.selectedIndex = 0;
        this.lastInputTime = 0;
        this.backgroundOffset = 0;
        
        // Play menu music (placeholder for now)
        // this.game.audioManager.playMusic('menuTheme');
    }
    
    exit() {
        console.log('Exiting MainMenu');
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        this.lastInputTime += deltaTime;
        this.backgroundOffset += deltaTime * 20; // Scrolling background
        
        // Handle input with delay to prevent spam
        if (this.lastInputTime > this.inputDelay) {
            if (this.game.inputManager.isPressed('up')) {
                this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
                this.game.audioManager.playMenuMove();
                this.lastInputTime = 0;
            } else if (this.game.inputManager.isPressed('down')) {
                this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
                this.game.audioManager.playMenuMove();
                this.lastInputTime = 0;
            } else if (this.game.inputManager.isPressed('select') || this.game.inputManager.isPressed('start')) {
                this.selectCurrentItem();
                this.lastInputTime = 0;
            }
        }
        
        // Handle mouse input
        const mousePos = this.game.inputManager.getMousePosition();
        const menuStartY = 300;
        const itemHeight = 60;
        
        for (let i = 0; i < this.menuItems.length; i++) {
            const itemY = menuStartY + (i * itemHeight);
            if (mousePos.y >= itemY - 20 && mousePos.y <= itemY + 20) {
                if (this.selectedIndex !== i) {
                    this.selectedIndex = i;
                    this.game.audioManager.playMenuMove();
                }
                
                if (this.game.inputManager.isMousePressed(0)) {
                    this.selectCurrentItem();
                }
                break;
            }
        }
    }
    
    selectCurrentItem() {
        const action = this.menuItems[this.selectedIndex].action;
        this.game.audioManager.playMenuSelect();
        
        switch (action) {
            case 'startGame':
                this.game.sceneManager.changeScene('gamePlay', 'slide');
                break;
            case 'carSelection':
                // TODO: Implement car selection screen
                console.log('Car Selection - Coming Soon!');
                break;
            case 'trackSelection':
                // TODO: Implement track selection screen
                console.log('Track Selection - Coming Soon!');
                break;
            case 'options':
                // TODO: Implement options screen
                console.log('Options - Coming Soon!');
                break;
            case 'highScores':
                // TODO: Implement high scores screen
                console.log('High Scores - Coming Soon!');
                break;
        }
    }
    
    render(ctx) {
        const { width, height } = this.game;
        
        // Animated background
        this.renderBackground(ctx);
        
        // Title
        this.renderTitle(ctx);
        
        // Menu items
        this.renderMenu(ctx);
        
        // Racing car animation
        this.renderAnimatedCar(ctx);
        
        // Version info
        this.game.drawPixelText('v1.0.0', width - 80, height - 20, '#666', 10);
    }
    
    renderBackground(ctx) {
        const { width, height } = this.game;
        
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0a1a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Scrolling grid pattern (parallax effect)
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        
        const gridSize = 50;
        const offsetX = this.backgroundOffset % gridSize;
        const offsetY = (this.backgroundOffset * 0.5) % gridSize;
        
        for (let x = -offsetX; x < width + gridSize; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        for (let y = -offsetY; y < height + gridSize; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }
    
    renderTitle(ctx) {
        const centerX = this.game.width / 2;
        
        // Main title with glow effect
        const glowIntensity = Math.sin(this.time * 2) * 0.3 + 0.7;
        
        // Title shadow/glow
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20 * glowIntensity;
        this.game.drawPixelText('NINTENDO NFS', centerX - 140, 80, '#00ffff', 24);
        ctx.shadowBlur = 0;
        
        // Subtitle
        this.game.drawPixelText('RACING CHAMPIONSHIP', centerX - 120, 120, '#ffdd00', 12);
    }
    
    renderMenu(ctx) {
        const centerX = this.game.width / 2;
        const menuStartY = 300;
        const itemHeight = 60;
        
        for (let i = 0; i < this.menuItems.length; i++) {
            const item = this.menuItems[i];
            const y = menuStartY + (i * itemHeight);
            const isSelected = i === this.selectedIndex;
            
            if (isSelected) {
                // Selected item background
                const pulseScale = 1 + Math.sin(this.time * 6) * 0.1;
                const boxWidth = 300 * pulseScale;
                const boxHeight = 40;
                
                this.game.drawNintendoBox(
                    centerX - boxWidth/2, 
                    y - boxHeight/2, 
                    boxWidth, 
                    boxHeight, 
                    '#ff6b6b'
                );
                
                // Selection indicator
                this.game.drawPixelText('>', centerX - 180, y + 5, '#fff', 16);
                this.game.drawPixelText('<', centerX + 160, y + 5, '#fff', 16);
            }
            
            // Menu item text
            const color = isSelected ? '#fff' : '#ccc';
            const textX = centerX - (item.text.length * 8);
            this.game.drawPixelText(item.text, textX, y + 5, color, 16);
        }
        
        // Controls hint
        this.game.drawPixelText('↑↓ Navigate  ENTER/SPACE Select', centerX - 160, menuStartY + 350, '#888', 10);
    }
    
    renderAnimatedCar(ctx) {
        // Animated racing car sprite (simplified pixel art)
        const carX = 50 + Math.sin(this.time * 2) * 30;
        const carY = this.game.height - 100;
        
        // Car body
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(carX, carY, 40, 20);
        ctx.fillStyle = '#aa4444';
        ctx.fillRect(carX + 5, carY + 5, 30, 10);
        
        // Wheels
        ctx.fillStyle = '#333';
        ctx.fillRect(carX + 5, carY + 20, 8, 8);
        ctx.fillRect(carX + 27, carY + 20, 8, 8);
        
        // Exhaust puff
        const puffX = carX - 10;
        const puffY = carY + 10;
        const puffAlpha = Math.sin(this.time * 8) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${puffAlpha * 0.7})`;
        ctx.fillRect(puffX, puffY, 8, 4);
    }
}