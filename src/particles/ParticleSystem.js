/**
 * ParticleSystem.js
 * Core particle system with object pooling for performance optimization
 * Nintendo-styled visual effects system
 */

class Particle {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 1.0;
        this.maxLife = 1.0;
        this.size = 1;
        this.color = { r: 255, g: 255, b: 255, a: 1 };
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.gravity = 0;
        this.friction = 1;
        this.active = false;
        this.type = 'default';
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        // Update position
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Apply gravity
        this.vy += this.gravity * deltaTime;
        
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Update rotation
        this.rotation += this.rotationSpeed * deltaTime;
        
        // Update life
        this.life -= deltaTime / this.maxLife;
        
        // Deactivate if life is over
        if (this.life <= 0) {
            this.active = false;
        }
    }
    
    render(ctx) {
        if (!this.active) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Calculate alpha based on life
        const alpha = Math.max(0, this.life) * this.color.a;
        ctx.globalAlpha = alpha;
        
        // Nintendo-style vibrant colors
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`;
        
        // Simple square particle (Nintendo pixel style)
        const halfSize = this.size / 2;
        ctx.fillRect(-halfSize, -halfSize, this.size, this.size);
        
        ctx.restore();
    }
}

class ParticleSystem {
    constructor(maxParticles = 1000) {
        this.maxParticles = maxParticles;
        this.particles = [];
        this.availableParticles = [];
        this.activeParticles = [];
        
        // Initialize particle pool
        for (let i = 0; i < maxParticles; i++) {
            const particle = new Particle();
            this.particles.push(particle);
            this.availableParticles.push(particle);
        }
        
        this.emitters = [];
    }
    
    /**
     * Get an available particle from the pool
     */
    getParticle() {
        if (this.availableParticles.length > 0) {
            const particle = this.availableParticles.pop();
            this.activeParticles.push(particle);
            return particle;
        }
        return null;
    }
    
    /**
     * Return a particle to the pool
     */
    returnParticle(particle) {
        const index = this.activeParticles.indexOf(particle);
        if (index > -1) {
            this.activeParticles.splice(index, 1);
            particle.reset();
            this.availableParticles.push(particle);
        }
    }
    
    /**
     * Emit a particle with specified properties
     */
    emit(config) {
        const particle = this.getParticle();
        if (!particle) return null;
        
        // Set particle properties from config
        particle.x = config.x || 0;
        particle.y = config.y || 0;
        particle.vx = config.vx || 0;
        particle.vy = config.vy || 0;
        particle.life = 1.0;
        particle.maxLife = config.maxLife || 1.0;
        particle.size = config.size || 2;
        particle.color = config.color || { r: 255, g: 255, b: 255, a: 1 };
        particle.rotation = config.rotation || 0;
        particle.rotationSpeed = config.rotationSpeed || 0;
        particle.gravity = config.gravity || 0;
        particle.friction = config.friction || 1;
        particle.type = config.type || 'default';
        particle.active = true;
        
        return particle;
    }
    
    /**
     * Add an emitter to the system
     */
    addEmitter(emitter) {
        this.emitters.push(emitter);
    }
    
    /**
     * Remove an emitter from the system
     */
    removeEmitter(emitter) {
        const index = this.emitters.indexOf(emitter);
        if (index > -1) {
            this.emitters.splice(index, 1);
        }
    }
    
    /**
     * Update all particles and emitters
     */
    update(deltaTime) {
        // Update emitters
        for (const emitter of this.emitters) {
            emitter.update(deltaTime);
        }
        
        // Update active particles
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];
            particle.update(deltaTime);
            
            // Return inactive particles to pool
            if (!particle.active) {
                this.returnParticle(particle);
            }
        }
    }
    
    /**
     * Render all active particles
     */
    render(ctx) {
        for (const particle of this.activeParticles) {
            particle.render(ctx);
        }
    }
    
    /**
     * Get particle count information
     */
    getStats() {
        return {
            active: this.activeParticles.length,
            available: this.availableParticles.length,
            total: this.maxParticles
        };
    }
    
    /**
     * Clear all particles
     */
    clear() {
        for (const particle of this.activeParticles) {
            this.returnParticle(particle);
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ParticleSystem, Particle };
}