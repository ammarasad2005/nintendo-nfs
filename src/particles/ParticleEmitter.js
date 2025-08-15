/**
 * ParticleEmitter.js
 * Controls particle emission with configurable properties and patterns
 */

class ParticleEmitter {
    constructor(particleSystem, config = {}) {
        this.particleSystem = particleSystem;
        
        // Position and direction
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.direction = config.direction || 0; // radians
        this.spread = config.spread || Math.PI / 4; // emission cone angle
        
        // Emission properties
        this.emissionRate = config.emissionRate || 10; // particles per second
        this.particlesPerEmission = config.particlesPerEmission || 1;
        this.emissionTimer = 0;
        
        // Particle properties
        this.particleLife = config.particleLife || 1.0;
        this.particleLifeVariation = config.particleLifeVariation || 0.2;
        this.particleSpeed = config.particleSpeed || 50;
        this.particleSpeedVariation = config.particleSpeedVariation || 20;
        this.particleSize = config.particleSize || 2;
        this.particleSizeVariation = config.particleSizeVariation || 1;
        this.particleColor = config.particleColor || { r: 255, g: 255, b: 255, a: 1 };
        this.particleGravity = config.particleGravity || 0;
        this.particleFriction = config.particleFriction || 0.98;
        this.particleRotationSpeed = config.particleRotationSpeed || 0;
        
        // Emitter state
        this.enabled = config.enabled !== false;
        this.continuous = config.continuous !== false;
        this.duration = config.duration || Infinity;
        this.elapsed = 0;
        
        // Effect type
        this.effectType = config.effectType || 'default';
    }
    
    /**
     * Update emitter and emit particles
     */
    update(deltaTime) {
        if (!this.enabled) return;
        
        this.elapsed += deltaTime;
        
        // Check if duration has expired
        if (this.elapsed >= this.duration) {
            this.enabled = false;
            return;
        }
        
        // Update emission timer
        this.emissionTimer += deltaTime;
        
        // Check if it's time to emit
        const emissionInterval = 1.0 / this.emissionRate;
        if (this.emissionTimer >= emissionInterval) {
            this.emitBurst();
            this.emissionTimer = 0;
        }
    }
    
    /**
     * Emit a burst of particles
     */
    emitBurst() {
        for (let i = 0; i < this.particlesPerEmission; i++) {
            this.emitParticle();
        }
    }
    
    /**
     * Emit a single particle
     */
    emitParticle() {
        // Calculate random direction within spread
        const angle = this.direction + (Math.random() - 0.5) * this.spread;
        
        // Calculate speed with variation
        const speed = this.particleSpeed + (Math.random() - 0.5) * this.particleSpeedVariation;
        
        // Calculate velocity components
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        // Calculate life with variation
        const life = this.particleLife + (Math.random() - 0.5) * this.particleLifeVariation;
        
        // Calculate size with variation
        const size = Math.max(1, this.particleSize + (Math.random() - 0.5) * this.particleSizeVariation);
        
        // Create particle configuration
        const config = {
            x: this.x,
            y: this.y,
            vx: vx,
            vy: vy,
            maxLife: life,
            size: size,
            color: { ...this.particleColor },
            gravity: this.particleGravity,
            friction: this.particleFriction,
            rotationSpeed: this.particleRotationSpeed + (Math.random() - 0.5) * 2,
            type: this.effectType
        };
        
        this.particleSystem.emit(config);
    }
    
    /**
     * Set emitter position
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    
    /**
     * Set emission direction
     */
    setDirection(direction) {
        this.direction = direction;
    }
    
    /**
     * Enable/disable emitter
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    /**
     * Reset emitter timer
     */
    reset() {
        this.elapsed = 0;
        this.emissionTimer = 0;
        this.enabled = true;
    }
    
    /**
     * Create preset configurations for different effect types
     */
    static createPreset(type, particleSystem, x = 0, y = 0) {
        const presets = {
            drift: {
                x, y,
                emissionRate: 20,
                particleLife: 2.0,
                particleSpeed: 30,
                particleSize: 3,
                particleColor: { r: 200, g: 200, b: 200, a: 0.8 },
                particleGravity: -20,
                particleFriction: 0.95,
                spread: Math.PI / 6,
                effectType: 'drift'
            },
            
            boost: {
                x, y,
                emissionRate: 50,
                particleLife: 0.5,
                particleSpeed: 100,
                particleSize: 2,
                particleColor: { r: 255, g: 200, b: 0, a: 1 },
                particleGravity: 0,
                particleFriction: 0.9,
                spread: Math.PI / 8,
                effectType: 'boost'
            },
            
            collision: {
                x, y,
                emissionRate: 100,
                particleLife: 1.0,
                particleSpeed: 80,
                particleSize: 1,
                particleColor: { r: 255, g: 255, b: 0, a: 1 },
                particleGravity: 50,
                particleFriction: 0.95,
                spread: Math.PI * 2,
                continuous: false,
                duration: 0.2,
                effectType: 'collision'
            }
        };
        
        return new ParticleEmitter(particleSystem, presets[type] || {});
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleEmitter;
}