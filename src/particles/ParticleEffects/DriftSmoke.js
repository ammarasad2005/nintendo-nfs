/**
 * DriftSmoke.js
 * Realistic smoke trail effects for drifting cars
 * Nintendo-style with color gradients and size variations
 */

class DriftSmoke {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
        this.emitters = [];
        this.isActive = false;
        
        // Smoke colors (Nintendo-style - bright and vibrant)
        this.smokeColors = [
            { r: 220, g: 220, b: 220, a: 0.8 }, // Light gray
            { r: 180, g: 180, b: 180, a: 0.7 }, // Medium gray
            { r: 140, g: 140, b: 140, a: 0.6 }, // Dark gray
            { r: 200, g: 190, b: 180, a: 0.5 }  // Warm gray
        ];
    }
    
    /**
     * Start drift smoke at specified position
     */
    start(x, y, velocity = { x: 0, y: 0 }, intensity = 1.0) {
        this.stop(); // Clear any existing emitters
        
        const numEmitters = Math.ceil(2 * intensity);
        
        for (let i = 0; i < numEmitters; i++) {
            const emitter = this.createSmokeEmitter(x, y, velocity, intensity, i);
            this.emitters.push(emitter);
            this.particleSystem.addEmitter(emitter);
        }
        
        this.isActive = true;
    }
    
    /**
     * Update smoke position and properties
     */
    update(x, y, velocity = { x: 0, y: 0 }, intensity = 1.0) {
        if (!this.isActive) return;
        
        for (let i = 0; i < this.emitters.length; i++) {
            const emitter = this.emitters[i];
            
            // Add slight offset for each emitter
            const offsetX = (Math.random() - 0.5) * 10;
            const offsetY = (Math.random() - 0.5) * 5;
            
            emitter.setPosition(x + offsetX, y + offsetY);
            
            // Update emission properties based on velocity and intensity
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
            emitter.emissionRate = 15 + speed * 0.1 * intensity;
            emitter.particleSpeed = 20 + speed * 0.3;
            
            // Adjust direction based on velocity (smoke trails behind)
            if (speed > 5) {
                const velocityAngle = Math.atan2(-velocity.y, -velocity.x);
                emitter.setDirection(velocityAngle + (Math.random() - 0.5) * 0.5);
            }
        }
    }
    
    /**
     * Stop drift smoke emission
     */
    stop() {
        for (const emitter of this.emitters) {
            this.particleSystem.removeEmitter(emitter);
        }
        this.emitters = [];
        this.isActive = false;
    }
    
    /**
     * Create a smoke emitter with Nintendo-style properties
     */
    createSmokeEmitter(x, y, velocity, intensity, index) {
        // Choose color from palette
        const colorIndex = index % this.smokeColors.length;
        const baseColor = { ...this.smokeColors[colorIndex] };
        
        const emitter = new ParticleEmitter(this.particleSystem, {
            x: x,
            y: y,
            direction: Math.PI + (Math.random() - 0.5) * Math.PI / 3, // Generally upward
            spread: Math.PI / 4, // 45-degree spread
            
            emissionRate: 20 * intensity,
            particlesPerEmission: 1,
            
            particleLife: 1.5 + Math.random() * 1.0,
            particleLifeVariation: 0.5,
            particleSpeed: 25 + Math.random() * 15,
            particleSpeedVariation: 10,
            particleSize: 3 + Math.random() * 2,
            particleSizeVariation: 2,
            particleColor: baseColor,
            particleGravity: -15, // Smoke rises
            particleFriction: 0.96, // Gradual slowdown
            particleRotationSpeed: (Math.random() - 0.5) * 2,
            
            effectType: 'drift',
            continuous: true
        });
        
        // Override particle rendering for smoke effect
        const originalEmit = emitter.emitParticle.bind(emitter);
        emitter.emitParticle = function() {
            const config = this.createSmokeParticleConfig();
            this.particleSystem.emit(config);
        }.bind(emitter);
        
        emitter.createSmokeParticleConfig = function() {
            const angle = this.direction + (Math.random() - 0.5) * this.spread;
            const speed = this.particleSpeed + (Math.random() - 0.5) * this.particleSpeedVariation;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const life = this.particleLife + (Math.random() - 0.5) * this.particleLifeVariation;
            const size = Math.max(1, this.particleSize + (Math.random() - 0.5) * this.particleSizeVariation);
            
            // Create color variation
            const color = { ...baseColor };
            color.r += (Math.random() - 0.5) * 30;
            color.g += (Math.random() - 0.5) * 30;
            color.b += (Math.random() - 0.5) * 30;
            color.r = Math.max(0, Math.min(255, color.r));
            color.g = Math.max(0, Math.min(255, color.g));
            color.b = Math.max(0, Math.min(255, color.b));
            
            return {
                x: this.x + (Math.random() - 0.5) * 8,
                y: this.y + (Math.random() - 0.5) * 8,
                vx: vx,
                vy: vy,
                maxLife: life,
                size: size,
                color: color,
                gravity: this.particleGravity,
                friction: this.particleFriction,
                rotationSpeed: this.particleRotationSpeed + (Math.random() - 0.5) * 2,
                type: 'drift'
            };
        }.bind(emitter);
        
        return emitter;
    }
    
    /**
     * Create a burst of smoke (for sudden direction changes)
     */
    burst(x, y, intensity = 1.0) {
        const burstEmitter = new ParticleEmitter(this.particleSystem, {
            x: x,
            y: y,
            direction: 0,
            spread: Math.PI * 2, // Full circle
            
            emissionRate: 50,
            particlesPerEmission: Math.ceil(15 * intensity),
            
            particleLife: 1.0,
            particleSpeed: 40,
            particleSpeedVariation: 20,
            particleSize: 4,
            particleSizeVariation: 2,
            particleColor: this.smokeColors[0],
            particleGravity: -10,
            particleFriction: 0.95,
            
            effectType: 'drift_burst',
            continuous: false,
            duration: 0.1
        });
        
        this.particleSystem.addEmitter(burstEmitter);
        
        // Auto-remove after duration
        setTimeout(() => {
            this.particleSystem.removeEmitter(burstEmitter);
        }, 200);
    }
    
    /**
     * Check if smoke is currently active
     */
    isEmitting() {
        return this.isActive;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DriftSmoke;
}