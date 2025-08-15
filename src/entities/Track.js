import PowerUp from './PowerUp.js';

class Track {
    constructor(config = {}) {
        this.name = config.name || 'Default Track';
        this.checkpoints = [];
        this.obstacles = [];
        this.powerUps = [];
        this.powerUpSpawns = [];
        this.background = null;
        this.boundaries = [];
        this.lastPowerUpSpawn = 0;
        
        this.loadTrack(config);
    }

    loadTrack(config) {
        // Load track layout and assets
        this.background = {
            draw: (ctx, camera) => {
                // Simple grass background
                ctx.fillStyle = '#228b22';
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                
                // Simple track
                ctx.fillStyle = '#555555';
                ctx.fillRect(200, 0, 400, ctx.canvas.height);
                
                // Track lines
                ctx.fillStyle = '#ffff00';
                for (let y = 0; y < ctx.canvas.height; y += 40) {
                    ctx.fillRect(395, y, 10, 20);
                }
            }
        };
        
        this.boundaries = config.boundaries || [
            { x: 200, y: 0, width: 400, height: 600 }
        ];
        
        // Set up power-up spawn points
        this.powerUpSpawns = config.powerUpSpawns || [
            { x: 300, y: 150, rate: 0.0001, type: 'boost' },
            { x: 500, y: 300, rate: 0.0001, type: 'star' },
            { x: 400, y: 450, rate: 0.0001, type: 'boost' }
        ];
    }

    update(deltaTime) {
        // Update dynamic track elements
        this.updateObstacles(deltaTime);
        this.updatePowerUps(deltaTime);
        this.spawnPowerUps(deltaTime);
    }

    updateObstacles(deltaTime) {
        this.obstacles.forEach(obstacle => {
            if (obstacle.update) {
                obstacle.update(deltaTime);
            }
        });
    }

    updatePowerUps(deltaTime) {
        this.powerUps = this.powerUps.filter(powerUp => {
            if (powerUp.isActive) {
                powerUp.update(deltaTime);
                return true;
            }
            return false;
        });
    }

    spawnPowerUps(deltaTime) {
        this.lastPowerUpSpawn += deltaTime;
        
        // Spawn new power-ups if needed
        this.powerUpSpawns.forEach(spawn => {
            if (Math.random() < spawn.rate * deltaTime) {
                this.spawnPowerUp(spawn);
            }
        });
    }

    spawnPowerUp(spawn) {
        // Don't spawn if there's already a power-up nearby
        const nearbyPowerUp = this.powerUps.some(powerUp => {
            const dx = powerUp.position.x - spawn.x;
            const dy = powerUp.position.y - spawn.y;
            return Math.sqrt(dx * dx + dy * dy) < 100;
        });
        
        if (!nearbyPowerUp) {
            this.powerUps.push(new PowerUp(spawn.type, { x: spawn.x, y: spawn.y }));
        }
    }

    checkCollision(car) {
        // Check track boundaries
        if (!this.isWithinBoundaries(car.position)) {
            return this.handleOutOfBounds(car);
        }
        
        // Check power-up collisions
        this.powerUps.forEach(powerUp => {
            if (powerUp.checkCollision(car)) {
                powerUp.collect(car);
            }
        });
        
        // Check obstacle collisions
        return this.checkObstacleCollisions(car);
    }

    isWithinBoundaries(position) {
        // Check if position is within track boundaries
        return this.boundaries.some(boundary => 
            position.x >= boundary.x &&
            position.x <= boundary.x + boundary.width &&
            position.y >= boundary.y &&
            position.y <= boundary.y + boundary.height
        );
    }

    handleOutOfBounds(car) {
        // Reset car to track bounds
        if (car.position.x < 200) car.position.x = 200;
        if (car.position.x > 600) car.position.x = 600;
        if (car.position.y < 0) car.position.y = 0;
        if (car.position.y > 600) car.position.y = 600;
        
        // Reduce speed when going off-track
        car.velocity.x *= 0.5;
        car.velocity.y *= 0.5;
        
        return true; // Collision occurred
    }

    checkObstacleCollisions(car) {
        // Check collision with obstacles
        for (let obstacle of this.obstacles) {
            if (obstacle.checkCollision && obstacle.checkCollision(car)) {
                return true;
            }
        }
        return false;
    }

    render(context, camera) {
        // Draw background
        this.background.draw(context, camera);
        
        // Draw track elements
        this.renderObstacles(context, camera);
        this.renderPowerUps(context, camera);
    }

    renderObstacles(context, camera) {
        this.obstacles.forEach(obstacle => {
            if (obstacle.render) {
                obstacle.render(context);
            }
        });
    }

    renderPowerUps(context, camera) {
        this.powerUps.forEach(powerUp => {
            powerUp.render(context);
        });
    }
}

export default Track;