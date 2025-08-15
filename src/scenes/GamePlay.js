import Car from '../entities/Car.js';
import Track from '../entities/Track.js';
import ParticleSystem from '../utils/Particles.js';

class GamePlay {
    constructor(game) {
        this.game = game;
        this.car = null;
        this.track = null;
        this.powerUps = [];
    }

    init() {
        console.log('GamePlay initialized');
        // Initialize game objects here
        this.car = new Car({
            handling: 0.8,
            maxSpeed: 200
        });
        
        this.track = new Track({
            name: 'Test Track'
        });
    }

    update(deltaTime) {
        // Handle car input
        if (this.car) {
            const input = this.game.inputManager;
            
            // Acceleration and braking
            if (input.isKeyPressed('KeyZ') || input.isKeyPressed('ArrowUp')) {
                this.car.accelerate(5);
            } else if (input.isKeyPressed('KeyX') || input.isKeyPressed('ArrowDown')) {
                this.car.accelerate(-3);
            } else {
                this.car.accelerate(0);
            }
            
            // Steering
            if (input.isKeyPressed('ArrowLeft')) {
                this.car.steer(-1);
            }
            if (input.isKeyPressed('ArrowRight')) {
                this.car.steer(1);
            }
            
            // Drift
            if (input.isKeyPressed('KeyC')) {
                this.car.startDrift();
                ParticleSystem.emit('drift', this.car.position, 3);
            } else {
                this.car.stopDrift();
            }
            
            // Boost
            if (input.isKeyJustPressed('Space')) {
                this.car.boost();
            }
            
            this.car.update(deltaTime);
        }
        
        if (this.track) {
            this.track.update(deltaTime);
            this.track.checkCollision(this.car);
        }
        
        // Update particle system
        ParticleSystem.update(deltaTime);
        
        // Check for pause
        if (this.game.inputManager.isKeyJustPressed('Escape')) {
            this.game.setScene('menu');
        }
    }

    render() {
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Render game objects
        if (this.track) {
            this.track.render(ctx);
        }
        
        if (this.car) {
            this.car.render(ctx);
        }
        
        // Render particles
        ParticleSystem.render(ctx);
        
        // Render UI
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Controls: Arrows=Steer, Z=Accelerate, X=Brake, C=Drift, Space=Boost', 10, 20);
        ctx.fillText('Press ESC to return to menu', 10, 40);
        
        if (this.car) {
            ctx.fillText(`Speed: ${Math.round(Math.sqrt(this.car.velocity.x ** 2 + this.car.velocity.y ** 2) * 10)}`, 10, canvas.height - 40);
            ctx.fillText(`Boost: ${this.car.boostAmount}`, 10, canvas.height - 20);
        }
    }

    cleanup() {
        // Clean up game objects
    }
}

export default GamePlay;