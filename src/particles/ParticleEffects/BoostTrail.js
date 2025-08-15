/**
 * BoostTrail.js
 * Dynamic speed lines and glowing particles for boost effects
 * Nintendo-style with bright colors and smooth transitions
 */

class BoostTrail {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
        this.emitters = [];
        this.isActive = false;
        this.currentSpeed = 0;
        
        // Boost colors (Nintendo-style - bright and energetic)
        this.boostColors = [
            { r: 255, g: 255, b: 0, a: 1.0 },   // Bright yellow
            { r: 255, g: 200, b: 0, a: 0.9 },   // Orange-yellow
            { r: 255, g: 150, b: 0, a: 0.8 },   // Orange
            { r: 255, g: 100, b: 100, a: 0.7 }, // Red-orange
            { r: 100, g: 200, b: 255, a: 0.8 }  // Electric blue
        ];
    }
    
    /**
     * Start boost trail effect
     */
    start(x, y, velocity = { x: 0, y: 0 }, boostIntensity = 1.0) {
        this.stop(); // Clear any existing emitters
        
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        this.currentSpeed = speed;
        
        // Create multiple emitters for layered effect
        this.createSpeedLines(x, y, velocity, boostIntensity);
        this.createGlowParticles(x, y, velocity, boostIntensity);
        this.createEnergyCore(x, y, velocity, boostIntensity);
        
        this.isActive = true;
    }
    
    /**
     * Update boost trail position and intensity
     */
    update(x, y, velocity = { x: 0, y: 0 }, boostIntensity = 1.0) {
        if (!this.isActive) return;
        
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        this.currentSpeed = speed;
        
        // Update all emitters
        for (const emitter of this.emitters) {
            emitter.setPosition(x, y);
            
            // Adjust properties based on speed and boost intensity
            if (emitter.effectType === 'boost_lines') {
                this.updateSpeedLines(emitter, velocity, boostIntensity, speed);
            } else if (emitter.effectType === 'boost_glow') {
                this.updateGlowParticles(emitter, velocity, boostIntensity, speed);
            } else if (emitter.effectType === 'boost_core') {
                this.updateEnergyCore(emitter, velocity, boostIntensity, speed);
            }
        }
    }
    
    /**
     * Stop boost trail effect
     */
    stop() {
        for (const emitter of this.emitters) {
            this.particleSystem.removeEmitter(emitter);
        }
        this.emitters = [];
        this.isActive = false;
    }
    
    /**
     * Create speed line emitters
     */
    createSpeedLines(x, y, velocity, intensity) {
        const velocityAngle = Math.atan2(-velocity.y, -velocity.x);
        
        const lineEmitter = new ParticleEmitter(this.particleSystem, {
            x: x,
            y: y,
            direction: velocityAngle,
            spread: Math.PI / 8, // Narrow spread for lines
            
            emissionRate: 30 * intensity,
            particlesPerEmission: 2,
            
            particleLife: 0.3 + intensity * 0.2,
            particleLifeVariation: 0.1,
            particleSpeed: 80 + this.currentSpeed * 0.5,
            particleSpeedVariation: 20,
            particleSize: 1,
            particleSizeVariation: 0.5,
            particleColor: this.boostColors[0], // Bright yellow
            particleGravity: 0,
            particleFriction: 0.98,
            particleRotationSpeed: 0,
            
            effectType: 'boost_lines',
            continuous: true
        });
        
        // Override particle creation for speed lines
        this.customizeSpeedLineEmitter(lineEmitter);
        
        this.emitters.push(lineEmitter);
        this.particleSystem.addEmitter(lineEmitter);
    }
    
    /**
     * Create glowing particle emitters
     */
    createGlowParticles(x, y, velocity, intensity) {
        const velocityAngle = Math.atan2(-velocity.y, -velocity.x);
        
        const glowEmitter = new ParticleEmitter(this.particleSystem, {
            x: x,
            y: y,
            direction: velocityAngle + Math.PI, // Particles trail behind
            spread: Math.PI / 4,
            
            emissionRate: 40 * intensity,
            particlesPerEmission: 1,
            
            particleLife: 0.8,
            particleLifeVariation: 0.3,
            particleSpeed: 40,
            particleSpeedVariation: 15,
            particleSize: 2,
            particleSizeVariation: 1,
            particleColor: this.boostColors[1], // Orange-yellow
            particleGravity: 0,
            particleFriction: 0.95,
            particleRotationSpeed: (Math.random() - 0.5) * 4,
            
            effectType: 'boost_glow',
            continuous: true
        });
        
        this.customizeGlowEmitter(glowEmitter);
        
        this.emitters.push(glowEmitter);
        this.particleSystem.addEmitter(glowEmitter);
    }
    
    /**
     * Create energy core emitter
     */
    createEnergyCore(x, y, velocity, intensity) {
        const coreEmitter = new ParticleEmitter(this.particleSystem, {
            x: x,
            y: y,
            direction: 0,
            spread: Math.PI * 2, // Full circle
            
            emissionRate: 20 * intensity,
            particlesPerEmission: 1,
            
            particleLife: 0.5,
            particleLifeVariation: 0.2,
            particleSpeed: 10,
            particleSpeedVariation: 5,
            particleSize: 3,
            particleSizeVariation: 1,
            particleColor: this.boostColors[4], // Electric blue
            particleGravity: 0,
            particleFriction: 0.9,
            particleRotationSpeed: (Math.random() - 0.5) * 6,
            
            effectType: 'boost_core',
            continuous: true
        });
        
        this.customizeCoreEmitter(coreEmitter);
        
        this.emitters.push(coreEmitter);
        this.particleSystem.addEmitter(coreEmitter);
    }
    
    /**
     * Customize speed line emitter behavior
     */
    customizeSpeedLineEmitter(emitter) {
        emitter.emitParticle = function() {
            const angle = this.direction + (Math.random() - 0.5) * this.spread;
            const speed = this.particleSpeed + (Math.random() - 0.5) * this.particleSpeedVariation;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            // Create elongated particles for speed lines
            const config = {
                x: this.x + (Math.random() - 0.5) * 4,
                y: this.y + (Math.random() - 0.5) * 4,
                vx: vx,
                vy: vy,
                maxLife: this.particleLife,
                size: this.particleSize + Math.random(),
                color: { ...this.particleColor },
                gravity: 0,
                friction: this.particleFriction,
                rotationSpeed: 0,
                type: 'boost_lines'
            };
            
            this.particleSystem.emit(config);
        }.bind(emitter);
    }
    
    /**
     * Customize glow particle emitter behavior
     */
    customizeGlowEmitter(emitter) {
        emitter.emitParticle = function() {
            const angle = this.direction + (Math.random() - 0.5) * this.spread;
            const speed = this.particleSpeed + (Math.random() - 0.5) * this.particleSpeedVariation;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            // Randomly choose from boost colors
            const colorIndex = Math.floor(Math.random() * 3); // Use first 3 colors
            const boostColors = [
                { r: 255, g: 255, b: 0, a: 1.0 },   // Bright yellow
                { r: 255, g: 200, b: 0, a: 0.9 },   // Orange-yellow
                { r: 255, g: 150, b: 0, a: 0.8 }    // Orange
            ];
            const color = { ...boostColors[colorIndex] };
            
            const config = {
                x: this.x,
                y: this.y,
                vx: vx,
                vy: vy,
                maxLife: this.particleLife + (Math.random() - 0.5) * this.particleLifeVariation,
                size: this.particleSize + (Math.random() - 0.5) * this.particleSizeVariation,
                color: color,
                gravity: 0,
                friction: this.particleFriction,
                rotationSpeed: this.particleRotationSpeed,
                type: 'boost_glow'
            };
            
            this.particleSystem.emit(config);
        }.bind(emitter);
    }
    
    /**
     * Customize core emitter behavior
     */
    customizeCoreEmitter(emitter) {
        emitter.emitParticle = function() {
            const angle = Math.random() * Math.PI * 2;
            const speed = this.particleSpeed + (Math.random() - 0.5) * this.particleSpeedVariation;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const config = {
                x: this.x,
                y: this.y,
                vx: vx,
                vy: vy,
                maxLife: this.particleLife,
                size: this.particleSize,
                color: { ...this.particleColor },
                gravity: 0,
                friction: this.particleFriction,
                rotationSpeed: this.particleRotationSpeed,
                type: 'boost_core'
            };
            
            this.particleSystem.emit(config);
        }.bind(emitter);
    }
    
    /**
     * Update speed line properties
     */
    updateSpeedLines(emitter, velocity, intensity, speed) {
        const velocityAngle = Math.atan2(-velocity.y, -velocity.x);
        emitter.setDirection(velocityAngle);
        emitter.emissionRate = 30 * intensity * (1 + speed * 0.01);
        emitter.particleSpeed = 80 + speed * 0.5;
    }
    
    /**
     * Update glow particle properties
     */
    updateGlowParticles(emitter, velocity, intensity, speed) {
        const velocityAngle = Math.atan2(-velocity.y, -velocity.x);
        emitter.setDirection(velocityAngle + Math.PI);
        emitter.emissionRate = 40 * intensity;
        emitter.particleSpeed = 40 + speed * 0.2;
    }
    
    /**
     * Update energy core properties
     */
    updateEnergyCore(emitter, velocity, intensity, speed) {
        emitter.emissionRate = 20 * intensity * (1 + speed * 0.005);
        emitter.particleSize = 3 + intensity;
    }
    
    /**
     * Check if boost trail is active
     */
    isEmitting() {
        return this.isActive;
    }
    
    /**
     * Get current speed for external reference
     */
    getSpeed() {
        return this.currentSpeed;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BoostTrail;
}