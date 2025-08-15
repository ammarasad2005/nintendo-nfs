class Car {
    constructor(config = {}) {
        this.position = { x: 400, y: 500 };
        this.velocity = { x: 0, y: 0 };
        this.acceleration = 0;
        this.rotation = 0;
        this.handling = config.handling || 0.8;
        this.maxSpeed = config.maxSpeed || 10;
        this.sprite = null;
        this.isDrifting = false;
        this.boostAmount = 0;
        this.isInvincible = false;
        
        this.loadSprite(config.spriteSheet);
    }

    loadSprite(spriteSheet) {
        // Placeholder for sprite loading
        this.sprite = {
            width: 32,
            height: 64,
            draw: (ctx, x, y, rotation) => {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rotation);
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(-16, -32, 32, 64);
                ctx.restore();
            }
        };
    }

    update(deltaTime) {
        // Update physics
        this.updatePhysics(deltaTime);
        
        // Update visual effects
        this.updateEffects(deltaTime);
    }

    updatePhysics(deltaTime) {
        const dt = deltaTime / 1000; // Convert to seconds
        
        // Apply acceleration
        this.velocity.x += this.acceleration * Math.cos(this.rotation) * dt;
        this.velocity.y += this.acceleration * Math.sin(this.rotation) * dt;
        
        // Apply drag
        const drag = this.isDrifting ? 0.95 : 0.98;
        this.velocity.x *= Math.pow(drag, dt);
        this.velocity.y *= Math.pow(drag, dt);
        
        // Limit speed
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (speed > this.maxSpeed) {
            this.velocity.x = (this.velocity.x / speed) * this.maxSpeed;
            this.velocity.y = (this.velocity.y / speed) * this.maxSpeed;
        }
        
        // Update position
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
    }

    updateEffects(deltaTime) {
        // Update particle effects, animations, etc.
    }

    startDrift() {
        this.isDrifting = true;
        // Add drift particles
        console.log('Drift started');
    }

    stopDrift() {
        this.isDrifting = false;
    }

    boost() {
        if (this.boostAmount > 0) {
            this.acceleration *= 2;
            this.boostAmount--;
            console.log('Boost activated');
        }
    }

    accelerate(amount) {
        this.acceleration = amount;
    }

    steer(direction) {
        const steerAmount = 0.1;
        this.rotation += direction * steerAmount;
    }

    render(context) {
        if (this.sprite) {
            this.sprite.draw(context, this.position.x, this.position.y, this.rotation);
        }
    }
}

export default Car;