// GamePlay.js - Core racing gameplay scene
class GamePlay {
    constructor(game) {
        this.game = game;
        this.time = 0;
        this.isPaused = false;
        this.showPauseMenu = false;
        
        // Player car properties
        this.playerCar = {
            x: 512,
            y: 600,
            speed: 0,
            maxSpeed: 300,
            acceleration: 400,
            deceleration: 200,
            turnSpeed: 3,
            angle: 0,
            lap: 1,
            position: 1
        };
        
        // AI opponents
        this.aiCars = [
            { x: 500, y: 550, speed: 150, angle: 0, color: '#00ff00' },
            { x: 520, y: 500, speed: 180, angle: 0, color: '#ffdd00' },
            { x: 480, y: 450, speed: 160, angle: 0, color: '#ff00ff' }
        ];
        
        // Race track
        this.track = {
            centerX: 512,
            centerY: 384,
            radius: 200,
            width: 100
        };
        
        // Game state
        this.raceTime = 0;
        this.lapTime = 0;
        this.totalLaps = 3;
        this.raceFinished = false;
        this.lapCompleted = false;
        this.checkpoints = [];
        
        // Power-ups
        this.powerUps = [];
        this.playerPowerUp = null;
        
        // Initialize checkpoints
        this.initializeCheckpoints();
        this.initializePowerUps();
        
        console.log('GamePlay initialized');
    }
    
    enter() {
        console.log('Entering GamePlay');
        this.time = 0;
        this.raceTime = 0;
        this.lapTime = 0;
        this.isPaused = false;
        this.showPauseMenu = false;
        this.raceFinished = false;
        this.lapCompleted = false;
        
        // Reset player car
        this.playerCar.x = 512;
        this.playerCar.y = 600;
        this.playerCar.speed = 0;
        this.playerCar.angle = 0;
        this.playerCar.lap = 1;
        this.playerCar.position = 1;
        
        // Play racing music
        // this.game.audioManager.playMusic('raceTheme');
    }
    
    exit() {
        console.log('Exiting GamePlay');
        // this.game.audioManager.stopMusic();
    }
    
    initializeCheckpoints() {
        // Simple circular track checkpoints
        const checkpointCount = 8;
        for (let i = 0; i < checkpointCount; i++) {
            const angle = (i / checkpointCount) * Math.PI * 2;
            this.checkpoints.push({
                x: this.track.centerX + Math.cos(angle) * this.track.radius,
                y: this.track.centerY + Math.sin(angle) * this.track.radius,
                passed: false
            });
        }
    }
    
    initializePowerUps() {
        // Add some power-ups around the track
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = this.track.radius + (Math.random() - 0.5) * this.track.width;
            this.powerUps.push({
                x: this.track.centerX + Math.cos(angle) * radius,
                y: this.track.centerY + Math.sin(angle) * radius,
                type: Math.random() > 0.5 ? 'speed' : 'shield',
                active: true,
                animTime: 0
            });
        }
    }
    
    update(deltaTime) {
        if (this.isPaused) {
            this.updatePauseMenu(deltaTime);
            return;
        }
        
        this.time += deltaTime;
        this.raceTime += deltaTime;
        this.lapTime += deltaTime;
        
        // Check for pause
        if (this.game.inputManager.isPressed('pause')) {
            this.togglePause();
        }
        
        if (!this.raceFinished) {
            this.updatePlayerCar(deltaTime);
            this.updateAICars(deltaTime);
            this.updatePowerUps(deltaTime);
            this.checkCollisions();
            this.checkLapCompletion();
        }
    }
    
    updatePlayerCar(deltaTime) {
        const car = this.playerCar;
        
        // Handle acceleration/deceleration
        if (this.game.inputManager.isPressed('accelerate')) {
            car.speed = Math.min(car.maxSpeed, car.speed + car.acceleration * deltaTime);
            if (Math.random() < 0.1) {
                this.game.audioManager.playEngineSound();
            }
        } else if (this.game.inputManager.isPressed('brake')) {
            car.speed = Math.max(0, car.speed - car.deceleration * deltaTime);
        } else {
            // Natural deceleration
            car.speed = Math.max(0, car.speed - car.deceleration * 0.5 * deltaTime);
        }
        
        // Handle turning
        if (car.speed > 0) {
            if (this.game.inputManager.isPressed('left')) {
                car.angle -= car.turnSpeed * deltaTime;
            }
            if (this.game.inputManager.isPressed('right')) {
                car.angle += car.turnSpeed * deltaTime;
            }
        }
        
        // Handle drift
        if (this.game.inputManager.isPressed('drift')) {
            car.turnSpeed = 5; // Faster turning while drifting
        } else {
            car.turnSpeed = 3; // Normal turning
        }
        
        // Handle power-up usage
        if (this.game.inputManager.isPressed('powerup') && this.playerPowerUp) {
            this.usePowerUp();
        }
        
        // Update position
        car.x += Math.cos(car.angle) * car.speed * deltaTime;
        car.y += Math.sin(car.angle) * car.speed * deltaTime;
        
        // Keep car on screen (basic bounds)
        car.x = Math.max(50, Math.min(this.game.width - 50, car.x));
        car.y = Math.max(50, Math.min(this.game.height - 50, car.y));
    }
    
    updateAICars(deltaTime) {
        this.aiCars.forEach((car, index) => {
            // Simple AI: follow track roughly
            const targetAngle = Math.atan2(
                this.track.centerY - car.y,
                this.track.centerX - car.x
            ) + Math.PI / 2;
            
            car.angle += (targetAngle - car.angle) * 2 * deltaTime;
            car.x += Math.cos(car.angle) * car.speed * deltaTime;
            car.y += Math.sin(car.angle) * car.speed * deltaTime;
        });
    }
    
    updatePowerUps(deltaTime) {
        this.powerUps.forEach(powerUp => {
            powerUp.animTime += deltaTime * 4;
        });
    }
    
    checkCollisions() {
        // Check power-up collection
        this.powerUps.forEach(powerUp => {
            if (powerUp.active) {
                const dx = this.playerCar.x - powerUp.x;
                const dy = this.playerCar.y - powerUp.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 20) {
                    powerUp.active = false;
                    this.playerPowerUp = powerUp.type;
                    this.game.audioManager.playPowerUp();
                }
            }
        });
    }
    
    checkLapCompletion() {
        // Simple lap counting based on crossing finish line
        // Only check if player has moved around the track (simple distance check)
        const distanceFromStart = Math.sqrt(
            Math.pow(this.playerCar.x - 512, 2) + 
            Math.pow(this.playerCar.y - 600, 2)
        );
        
        if (this.playerCar.y > 580 && this.playerCar.x > 400 && this.playerCar.x < 600 && 
            this.raceTime > 10 && distanceFromStart < 50) { // Only after 10 seconds and if close to start
            if (this.playerCar.lap <= this.totalLaps && !this.lapCompleted) {
                this.playerCar.lap++;
                this.lapTime = 0;
                this.lapCompleted = true;
                
                // Reset lap completion flag after a delay
                setTimeout(() => {
                    this.lapCompleted = false;
                }, 2000);
                
                if (this.playerCar.lap > this.totalLaps) {
                    this.finishRace();
                }
            }
        }
    }
    
    usePowerUp() {
        if (this.playerPowerUp === 'speed') {
            this.playerCar.maxSpeed = 500;
            setTimeout(() => {
                this.playerCar.maxSpeed = 300;
            }, 3000);
        } else if (this.playerPowerUp === 'shield') {
            // Implement shield logic
        }
        
        this.playerPowerUp = null;
    }
    
    finishRace() {
        this.raceFinished = true;
        // Transition to end screen after a delay
        setTimeout(() => {
            this.game.sceneManager.changeScene('endScreen', 'fade');
        }, 2000);
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        this.showPauseMenu = this.isPaused;
    }
    
    updatePauseMenu(deltaTime) {
        if (this.game.inputManager.isPressed('pause')) {
            this.togglePause();
        }
        
        if (this.game.inputManager.isPressed('back')) {
            this.game.sceneManager.changeScene('mainMenu', 'fade');
        }
    }
    
    render(ctx) {
        const { width, height } = this.game;
        
        // Track background
        this.renderTrack(ctx);
        
        // Power-ups
        this.renderPowerUps(ctx);
        
        // AI cars
        this.renderAICars(ctx);
        
        // Player car
        this.renderPlayerCar(ctx);
        
        // HUD
        this.renderHUD(ctx);
        
        // Pause menu
        if (this.showPauseMenu) {
            this.renderPauseMenu(ctx);
        }
        
        // Race finish overlay
        if (this.raceFinished) {
            this.renderFinishOverlay(ctx);
        }
    }
    
    renderTrack(ctx) {
        const { width, height } = this.game;
        
        // Grass background
        ctx.fillStyle = '#2d5a1e';
        ctx.fillRect(0, 0, width, height);
        
        // Track (simplified oval)
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.ellipse(this.track.centerX, this.track.centerY, this.track.radius + this.track.width/2, this.track.radius + this.track.width/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner track
        ctx.fillStyle = '#2d5a1e';
        ctx.beginPath();
        ctx.ellipse(this.track.centerX, this.track.centerY, this.track.radius - this.track.width/2, this.track.radius - this.track.width/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Track lines
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.ellipse(this.track.centerX, this.track.centerY, this.track.radius, this.track.radius, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Finish line
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.track.centerX - 50, this.track.centerY + this.track.radius - 5, 100, 10);
        ctx.fillStyle = '#000';
        for (let i = 0; i < 10; i++) {
            if (i % 2 === 0) {
                ctx.fillRect(this.track.centerX - 50 + i * 10, this.track.centerY + this.track.radius - 5, 10, 10);
            }
        }
    }
    
    renderPowerUps(ctx) {
        this.powerUps.forEach(powerUp => {
            if (powerUp.active) {
                const pulse = Math.sin(powerUp.animTime) * 0.3 + 0.7;
                const size = 15 * pulse;
                
                ctx.fillStyle = powerUp.type === 'speed' ? '#ffdd00' : '#00ffff';
                ctx.fillRect(powerUp.x - size/2, powerUp.y - size/2, size, size);
                
                // Type indicator
                ctx.fillStyle = '#000';
                const text = powerUp.type === 'speed' ? 'S' : 'D';
                this.game.drawPixelText(text, powerUp.x - 4, powerUp.y + 4, '#000', 10);
            }
        });
    }
    
    renderPlayerCar(ctx) {
        const car = this.playerCar;
        
        ctx.save();
        ctx.translate(car.x, car.y);
        ctx.rotate(car.angle);
        
        // Car body
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(-15, -10, 30, 20);
        
        // Car details
        ctx.fillStyle = '#aa3333';
        ctx.fillRect(-10, -5, 20, 10);
        
        // Wheels
        ctx.fillStyle = '#333';
        ctx.fillRect(-15, -12, 6, 4);
        ctx.fillRect(-15, 8, 6, 4);
        ctx.fillRect(9, -12, 6, 4);
        ctx.fillRect(9, 8, 6, 4);
        
        ctx.restore();
        
        // Speed trail effect
        if (car.speed > 200) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            for (let i = 0; i < 5; i++) {
                const trailX = car.x - Math.cos(car.angle) * (i * 10 + 20);
                const trailY = car.y - Math.sin(car.angle) * (i * 10 + 20);
                ctx.fillRect(trailX - 2, trailY - 2, 4, 4);
            }
        }
    }
    
    renderAICars(ctx) {
        this.aiCars.forEach(car => {
            ctx.save();
            ctx.translate(car.x, car.y);
            ctx.rotate(car.angle);
            
            ctx.fillStyle = car.color;
            ctx.fillRect(-12, -8, 24, 16);
            
            ctx.fillStyle = '#333';
            ctx.fillRect(-12, -10, 4, 3);
            ctx.fillRect(-12, 7, 4, 3);
            ctx.fillRect(8, -10, 4, 3);
            ctx.fillRect(8, 7, 4, 3);
            
            ctx.restore();
        });
    }
    
    renderHUD(ctx) {
        const { width, height } = this.game;
        
        // Semi-transparent HUD background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, 80);
        
        // Speed
        this.game.drawPixelText(`Speed: ${Math.floor(this.playerCar.speed)}`, 20, 25, '#00ff00', 12);
        
        // Position
        this.game.drawPixelText(`Position: ${this.playerCar.position}/4`, 20, 45, '#ffdd00', 12);
        
        // Lap
        this.game.drawPixelText(`Lap: ${this.playerCar.lap}/${this.totalLaps}`, 20, 65, '#ff6b6b', 12);
        
        // Race time
        const minutes = Math.floor(this.raceTime / 60);
        const seconds = Math.floor(this.raceTime % 60);
        this.game.drawPixelText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, width - 150, 25, '#fff', 12);
        
        // Power-up indicator
        if (this.playerPowerUp) {
            this.game.drawPixelText(`Power-up: ${this.playerPowerUp.toUpperCase()}`, width - 200, 45, '#ffdd00', 12);
            this.game.drawPixelText('SPACE to use', width - 150, 65, '#aaa', 10);
        }
        
        // Minimap
        this.renderMinimap(ctx, width - 120, height - 120, 100);
    }
    
    renderMinimap(ctx, x, y, size) {
        // Minimap background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(x, y, size, size);
        
        // Track representation
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x + size/2, y + size/2, size/4, size/4, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Player car on minimap
        const mapPlayerX = x + size/2 + (this.playerCar.x - this.track.centerX) / this.track.radius * size/4;
        const mapPlayerY = y + size/2 + (this.playerCar.y - this.track.centerY) / this.track.radius * size/4;
        
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(mapPlayerX - 2, mapPlayerY - 2, 4, 4);
        
        // AI cars on minimap
        this.aiCars.forEach(car => {
            const mapX = x + size/2 + (car.x - this.track.centerX) / this.track.radius * size/4;
            const mapY = y + size/2 + (car.y - this.track.centerY) / this.track.radius * size/4;
            
            ctx.fillStyle = car.color;
            ctx.fillRect(mapX - 1, mapY - 1, 2, 2);
        });
    }
    
    renderPauseMenu(ctx) {
        const { width, height } = this.game;
        
        // Overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);
        
        // Pause menu
        const centerX = width / 2;
        const centerY = height / 2;
        
        this.game.drawNintendoBox(centerX - 150, centerY - 100, 300, 200, '#333');
        
        this.game.drawPixelText('PAUSED', centerX - 50, centerY - 60, '#fff', 20);
        this.game.drawPixelText('ESC - Resume', centerX - 60, centerY - 20, '#aaa', 12);
        this.game.drawPixelText('BACKSPACE - Main Menu', centerX - 100, centerY + 10, '#aaa', 12);
    }
    
    renderFinishOverlay(ctx) {
        const { width, height } = this.game;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);
        
        const centerX = width / 2;
        const centerY = height / 2;
        
        this.game.drawPixelText('RACE FINISHED!', centerX - 120, centerY - 50, '#00ff00', 24);
        this.game.drawPixelText('Preparing results...', centerX - 80, centerY, '#fff', 12);
    }
}