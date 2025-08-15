// EndScreen.js - Race results and statistics display
class EndScreen {
    constructor(game) {
        this.game = game;
        this.time = 0;
        this.animationPhase = 'results'; // results, stats, options
        this.selectedOption = 0;
        this.options = [
            { text: 'RACE AGAIN', action: 'raceAgain' },
            { text: 'MAIN MENU', action: 'mainMenu' },
            { text: 'VIEW REPLAY', action: 'replay' },
            { text: 'SAVE GHOST', action: 'saveGhost' }
        ];
        
        // Race results (would normally come from GamePlay scene)
        this.raceResults = {
            position: 1,
            totalTime: '2:45.123',
            bestLap: '0:52.456',
            averageLap: '0:55.789',
            topSpeed: '285 km/h',
            powerUpsUsed: 3,
            driftsCompleted: 12,
            perfectCorners: 8,
            score: 15420,
            isNewRecord: true,
            credits: 500
        };
        
        this.lastInputTime = 0;
        this.inputDelay = 0.2;
        this.confettiParticles = [];
        this.highScoreEntry = false;
        this.playerName = '';
        
        console.log('EndScreen initialized');
    }
    
    enter() {
        console.log('Entering EndScreen');
        this.time = 0;
        this.animationPhase = 'results';
        this.selectedOption = 0;
        this.lastInputTime = 0;
        this.confettiParticles = [];
        this.highScoreEntry = false;
        this.playerName = '';
        
        // Create victory confetti if player won
        if (this.raceResults.position === 1) {
            this.createConfetti();
            this.game.audioManager.playPowerUp(); // Victory sound
        }
        
        // Play victory/results music
        // this.game.audioManager.playMusic('resultsTheme');
    }
    
    exit() {
        console.log('Exiting EndScreen');
        // this.game.audioManager.stopMusic();
    }
    
    createConfetti() {
        for (let i = 0; i < 50; i++) {
            this.confettiParticles.push({
                x: Math.random() * this.game.width,
                y: -10,
                vx: (Math.random() - 0.5) * 100,
                vy: Math.random() * 100 + 50,
                color: ['#ff6b6b', '#ffdd00', '#00ff00', '#00ffff', '#ff00ff'][Math.floor(Math.random() * 5)],
                life: 1.0,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        this.lastInputTime += deltaTime;
        
        // Update confetti
        this.updateConfetti(deltaTime);
        
        // Handle phase transitions
        if (this.animationPhase === 'results' && this.time > 3) {
            this.animationPhase = 'stats';
        } else if (this.animationPhase === 'stats' && this.time > 6) {
            this.animationPhase = 'options';
        }
        
        // Handle input
        if (this.animationPhase === 'options') {
            this.handleOptionsInput(deltaTime);
        } else if (this.highScoreEntry) {
            this.handleNameEntry(deltaTime);
        } else {
            // Skip to options with any input
            if (this.game.inputManager.isPressed('select') || this.game.inputManager.isPressed('start')) {
                this.animationPhase = 'options';
            }
        }
    }
    
    updateConfetti(deltaTime) {
        for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
            const particle = this.confettiParticles[i];
            
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 200 * deltaTime; // Gravity
            particle.life -= deltaTime * 0.5;
            
            if (particle.life <= 0 || particle.y > this.game.height) {
                this.confettiParticles.splice(i, 1);
            }
        }
    }
    
    handleOptionsInput(deltaTime) {
        if (this.lastInputTime > this.inputDelay) {
            if (this.game.inputManager.isPressed('up')) {
                this.selectedOption = (this.selectedOption - 1 + this.options.length) % this.options.length;
                this.game.audioManager.playMenuMove();
                this.lastInputTime = 0;
            } else if (this.game.inputManager.isPressed('down')) {
                this.selectedOption = (this.selectedOption + 1) % this.options.length;
                this.game.audioManager.playMenuMove();
                this.lastInputTime = 0;
            } else if (this.game.inputManager.isPressed('select') || this.game.inputManager.isPressed('start')) {
                this.selectOption();
                this.lastInputTime = 0;
            }
        }
        
        // Handle mouse input
        const mousePos = this.game.inputManager.getMousePosition();
        const optionsStartY = 450;
        const optionHeight = 40;
        
        for (let i = 0; i < this.options.length; i++) {
            const optionY = optionsStartY + (i * optionHeight);
            if (mousePos.y >= optionY - 15 && mousePos.y <= optionY + 15) {
                if (this.selectedOption !== i) {
                    this.selectedOption = i;
                    this.game.audioManager.playMenuMove();
                }
                
                if (this.game.inputManager.isMousePressed(0)) {
                    this.selectOption();
                }
                break;
            }
        }
    }
    
    handleNameEntry(deltaTime) {
        // TODO: Implement high score name entry
        // For now, skip to options
        if (this.game.inputManager.isPressed('select') || this.game.inputManager.isPressed('start')) {
            this.highScoreEntry = false;
            this.animationPhase = 'options';
        }
    }
    
    selectOption() {
        const action = this.options[this.selectedOption].action;
        this.game.audioManager.playMenuSelect();
        
        switch (action) {
            case 'raceAgain':
                this.game.sceneManager.changeScene('gamePlay', 'slide');
                break;
            case 'mainMenu':
                this.game.sceneManager.changeScene('mainMenu', 'fade');
                break;
            case 'replay':
                // TODO: Implement replay system
                console.log('Replay feature - Coming Soon!');
                break;
            case 'saveGhost':
                // TODO: Implement ghost data saving
                console.log('Ghost saving - Coming Soon!');
                break;
        }
    }
    
    render(ctx) {
        const { width, height } = this.game;
        
        // Background
        this.renderBackground(ctx);
        
        // Confetti
        this.renderConfetti(ctx);
        
        // Main content based on phase
        switch (this.animationPhase) {
            case 'results':
                this.renderResults(ctx);
                break;
            case 'stats':
                this.renderStats(ctx);
                break;
            case 'options':
                this.renderOptions(ctx);
                break;
        }
        
        // High score entry overlay
        if (this.highScoreEntry) {
            this.renderNameEntry(ctx);
        }
    }
    
    renderBackground(ctx) {
        const { width, height } = this.game;
        
        // Gradient background
        const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
        if (this.raceResults.position === 1) {
            gradient.addColorStop(0, '#2a4d3a');
            gradient.addColorStop(1, '#0f1a0f');
        } else {
            gradient.addColorStop(0, '#3a2a2a');
            gradient.addColorStop(1, '#1a0f0f');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Animated background pattern
        const time = this.time;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 20; i++) {
            const x = (i * 50 + time * 20) % (width + 50);
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x - 100, height);
            ctx.stroke();
        }
    }
    
    renderConfetti(ctx) {
        this.confettiParticles.forEach(particle => {
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.life;
            ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            ctx.globalAlpha = 1;
        });
    }
    
    renderResults(ctx) {
        const centerX = this.game.width / 2;
        const startY = 100;
        
        // Title based on position
        let title, titleColor;
        switch (this.raceResults.position) {
            case 1:
                title = 'VICTORY!';
                titleColor = '#ffdd00';
                break;
            case 2:
                title = '2ND PLACE';
                titleColor = '#c0c0c0';
                break;
            case 3:
                title = '3RD PLACE';
                titleColor = '#cd7f32';
                break;
            default:
                title = `${this.raceResults.position}TH PLACE`;
                titleColor = '#666';
        }
        
        // Animated title
        const titleScale = Math.min(1, this.time * 2);
        ctx.save();
        ctx.translate(centerX, startY);
        ctx.scale(titleScale, titleScale);
        
        // Title glow effect
        ctx.shadowColor = titleColor;
        ctx.shadowBlur = 20;
        this.game.drawPixelText(title, -title.length * 12, 0, titleColor, 32);
        ctx.shadowBlur = 0;
        
        ctx.restore();
        
        // Position trophy/medal
        this.renderPositionIndicator(ctx, centerX, startY + 80);
        
        // Basic time display
        if (this.time > 1) {
            this.game.drawPixelText(`Total Time: ${this.raceResults.totalTime}`, centerX - 100, startY + 150, '#fff', 16);
        }
        
        if (this.time > 2) {
            this.game.drawPixelText(`Best Lap: ${this.raceResults.bestLap}`, centerX - 80, startY + 180, '#00ff00', 14);
        }
        
        // New record indicator
        if (this.raceResults.isNewRecord && this.time > 2.5) {
            const blinkAlpha = Math.sin(this.time * 8) * 0.5 + 0.5;
            const color = `rgba(255, 221, 0, ${blinkAlpha})`;
            this.game.drawPixelText('NEW RECORD!', centerX - 80, startY + 220, color, 18);
        }
    }
    
    renderPositionIndicator(ctx, x, y) {
        const position = this.raceResults.position;
        
        ctx.save();
        ctx.translate(x, y);
        
        if (position === 1) {
            // Gold trophy
            ctx.fillStyle = '#ffdd00';
            ctx.fillRect(-15, -20, 30, 25);
            ctx.fillStyle = '#ffa500';
            ctx.fillRect(-12, -15, 24, 15);
            ctx.fillStyle = '#666';
            ctx.fillRect(-5, 5, 10, 15);
        } else if (position === 2) {
            // Silver medal
            ctx.fillStyle = '#c0c0c0';
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#333';
            this.game.drawPixelText('2', -4, 5, '#333', 16);
        } else if (position === 3) {
            // Bronze medal
            ctx.fillStyle = '#cd7f32';
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#333';
            this.game.drawPixelText('3', -4, 5, '#333', 16);
        } else {
            // Participation ribbon
            ctx.fillStyle = '#666';
            ctx.fillRect(-15, -10, 30, 20);
            ctx.fillStyle = '#333';
            this.game.drawPixelText(position.toString(), -8, 5, '#333', 14);
        }
        
        ctx.restore();
    }
    
    renderStats(ctx) {
        const centerX = this.game.width / 2;
        const startY = 150;
        const lineHeight = 35;
        
        this.game.drawPixelText('RACE STATISTICS', centerX - 100, startY - 50, '#00ffff', 20);
        
        const stats = [
            [`Average Lap Time: ${this.raceResults.averageLap}`, '#fff'],
            [`Top Speed: ${this.raceResults.topSpeed}`, '#ff6b6b'],
            [`Power-ups Used: ${this.raceResults.powerUpsUsed}`, '#ffdd00'],
            [`Drifts Completed: ${this.raceResults.driftsCompleted}`, '#00ff00'],
            [`Perfect Corners: ${this.raceResults.perfectCorners}`, '#ff00ff'],
            [`Final Score: ${this.raceResults.score}`, '#00ffff'],
            [`Credits Earned: ${this.raceResults.credits}`, '#ffa500']
        ];
        
        stats.forEach((stat, index) => {
            const delay = index * 0.3;
            if (this.time > 3 + delay) {
                const [text, color] = stat;
                this.game.drawPixelText(text, centerX - 120, startY + index * lineHeight, color, 14);
            }
        });
        
        // Progress bars for some stats
        if (this.time > 5) {
            // Score progress bar
            const scoreBarY = startY + stats.length * lineHeight + 20;
            const maxScore = 20000;
            const scoreProgress = Math.min(this.raceResults.score / maxScore, 1);
            
            this.game.drawNintendoBox(centerX - 150, scoreBarY, 300, 20, '#333');
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(centerX - 148, scoreBarY + 2, (300 - 4) * scoreProgress, 16);
            
            this.game.drawPixelText('Score Rating', centerX - 60, scoreBarY - 15, '#aaa', 10);
        }
    }
    
    renderOptions(ctx) {
        const centerX = this.game.width / 2;
        const startY = 450;
        const optionHeight = 40;
        
        this.game.drawPixelText('SELECT OPTION', centerX - 80, startY - 50, '#fff', 16);
        
        this.options.forEach((option, index) => {
            const y = startY + index * optionHeight;
            const isSelected = index === this.selectedOption;
            
            if (isSelected) {
                // Selection background
                const pulseScale = 1 + Math.sin(this.time * 6) * 0.1;
                const boxWidth = 200 * pulseScale;
                
                this.game.drawNintendoBox(
                    centerX - boxWidth/2,
                    y - 15,
                    boxWidth,
                    30,
                    '#ff6b6b'
                );
                
                // Selection indicators
                this.game.drawPixelText('>', centerX - 120, y + 5, '#fff', 14);
                this.game.drawPixelText('<', centerX + 100, y + 5, '#fff', 14);
            }
            
            const color = isSelected ? '#fff' : '#ccc';
            this.game.drawPixelText(option.text, centerX - option.text.length * 6, y + 5, color, 14);
        });
        
        // Controls hint
        this.game.drawPixelText('↑↓ Navigate  ENTER Select', centerX - 120, startY + this.options.length * optionHeight + 30, '#888', 10);
    }
    
    renderNameEntry(ctx) {
        const centerX = this.game.width / 2;
        const centerY = this.game.height / 2;
        
        // Overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        // Entry box
        this.game.drawNintendoBox(centerX - 150, centerY - 50, 300, 100, '#333');
        
        this.game.drawPixelText('NEW HIGH SCORE!', centerX - 90, centerY - 30, '#ffdd00', 16);
        this.game.drawPixelText('Enter your name:', centerX - 80, centerY - 5, '#fff', 12);
        
        // Name input (simplified)
        const nameDisplay = this.playerName + '_';
        this.game.drawPixelText(nameDisplay, centerX - nameDisplay.length * 6, centerY + 20, '#00ff00', 14);
        
        this.game.drawPixelText('ENTER to confirm', centerX - 70, centerY + 45, '#aaa', 10);
    }
}