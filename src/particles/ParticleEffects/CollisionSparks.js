/**
 * CollisionSparks.js
 * Spark emission patterns with size/color variations and bounce behavior
 * Nintendo-style collision effects with vibrant colors
 */

class CollisionSparks {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
        
        // Spark colors (Nintendo-style - bright and impactful)
        this.sparkColors = [
            { r: 255, g: 255, b: 100, a: 1.0 }, // Bright yellow
            { r: 255, g: 200, b: 50, a: 1.0 },  // Orange-yellow
            { r: 255, g: 150, b: 50, a: 1.0 },  // Orange
            { r: 255, g: 100, b: 100, a: 1.0 }, // Red-orange
            { r: 255, g: 255, b: 255, a: 1.0 }, // White hot
            { r: 100, g: 150, b: 255, a: 0.8 }  // Electric blue
        ];
    }
    
    /**
     * Create collision sparks at impact point
     */
    createCollision(x, y, velocity = { x: 0, y: 0 }, intensity = 1.0, collisionType = 'normal') {
        switch (collisionType) {
            case 'wall':
                this.createWallCollision(x, y, velocity, intensity);
                break;
            case 'car':
                this.createCarCollision(x, y, velocity, intensity);
                break;
            case 'object':
                this.createObjectCollision(x, y, velocity, intensity);
                break;
            default:
                this.createStandardCollision(x, y, velocity, intensity);
        }
    }
    
    /**
     * Create standard collision sparks
     */
    createStandardCollision(x, y, velocity, intensity) {
        const sparkCount = Math.ceil(15 * intensity);
        const impactAngle = Math.atan2(velocity.y, velocity.x);
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        // Main spark burst
        const sparkEmitter = new ParticleEmitter(this.particleSystem, {
            x: x,
            y: y,
            direction: impactAngle + Math.PI, // Sparks fly back from impact
            spread: Math.PI, // Wide spread
            
            emissionRate: 100,
            particlesPerEmission: sparkCount,
            
            particleLife: 0.8,
            particleLifeVariation: 0.4,
            particleSpeed: 60 + speed * 0.3,
            particleSpeedVariation: 30,
            particleSize: 2,
            particleSizeVariation: 1,
            particleColor: this.sparkColors[0],
            particleGravity: 80, // Sparks fall
            particleFriction: 0.95,
            particleRotationSpeed: (Math.random() - 0.5) * 8,
            
            effectType: 'collision_sparks',
            continuous: false,
            duration: 0.1
        });
        
        this.customizeSparkEmitter(sparkEmitter, intensity);
        this.particleSystem.addEmitter(sparkEmitter);
        
        // Auto-remove after duration
        setTimeout(() => {
            this.particleSystem.removeEmitter(sparkEmitter);
        }, 200);
    }
    
    /**
     * Create wall collision sparks (directional)
     */
    createWallCollision(x, y, velocity, intensity) {
        const impactAngle = Math.atan2(velocity.y, velocity.x);
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        // Directional sparks along wall surface
        const wallEmitter = new ParticleEmitter(this.particleSystem, {
            x: x,
            y: y,
            direction: impactAngle + Math.PI / 2, // Perpendicular to impact
            spread: Math.PI / 3,
            
            emissionRate: 80,
            particlesPerEmission: Math.ceil(20 * intensity),
            
            particleLife: 1.0,
            particleLifeVariation: 0.3,
            particleSpeed: 40 + speed * 0.2,
            particleSpeedVariation: 20,
            particleSize: 1,
            particleSizeVariation: 1,
            particleColor: this.sparkColors[1], // Orange-yellow
            particleGravity: 60,
            particleFriction: 0.97,
            
            effectType: 'wall_sparks',
            continuous: false,
            duration: 0.15
        });
        
        this.customizeWallSparkEmitter(wallEmitter);
        this.particleSystem.addEmitter(wallEmitter);
        
        setTimeout(() => {
            this.particleSystem.removeEmitter(wallEmitter);
        }, 250);
    }
    
    /**
     * Create car-to-car collision sparks
     */
    createCarCollision(x, y, velocity, intensity) {
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        // Explosive spark pattern
        const explosionEmitter = new ParticleEmitter(this.particleSystem, {
            x: x,
            y: y,
            direction: 0,
            spread: Math.PI * 2, // Full circle
            
            emissionRate: 150,
            particlesPerEmission: Math.ceil(25 * intensity),
            
            particleLife: 1.2,
            particleLifeVariation: 0.5,
            particleSpeed: 80 + speed * 0.4,
            particleSpeedVariation: 40,
            particleSize: 3,
            particleSizeVariation: 2,
            particleColor: this.sparkColors[4], // White hot
            particleGravity: 70,
            particleFriction: 0.92,
            
            effectType: 'car_collision',
            continuous: false,
            duration: 0.2
        });
        
        this.customizeExplosionEmitter(explosionEmitter, intensity);
        this.particleSystem.addEmitter(explosionEmitter);
        
        setTimeout(() => {
            this.particleSystem.removeEmitter(explosionEmitter);
        }, 300);
    }
    
    /**
     * Create object collision sparks
     */
    createObjectCollision(x, y, velocity, intensity) {
        const impactAngle = Math.atan2(velocity.y, velocity.x);
        
        // Small burst of colorful sparks
        const objectEmitter = new ParticleEmitter(this.particleSystem, {
            x: x,
            y: y,
            direction: impactAngle + Math.PI,
            spread: Math.PI / 2,
            
            emissionRate: 60,
            particlesPerEmission: Math.ceil(12 * intensity),
            
            particleLife: 0.6,
            particleLifeVariation: 0.2,
            particleSpeed: 50,
            particleSpeedVariation: 25,
            particleSize: 2,
            particleSizeVariation: 1,
            particleColor: this.sparkColors[5], // Electric blue
            particleGravity: 50,
            particleFriction: 0.94,
            
            effectType: 'object_collision',
            continuous: false,
            duration: 0.1
        });
        
        this.customizeObjectSparkEmitter(objectEmitter);
        this.particleSystem.addEmitter(objectEmitter);
        
        setTimeout(() => {
            this.particleSystem.removeEmitter(objectEmitter);
        }, 200);
    }
    
    /**
     * Customize standard spark emitter
     */
    customizeSparkEmitter(emitter, intensity) {
        emitter.emitParticle = function() {
            const angle = this.direction + (Math.random() - 0.5) * this.spread;
            const speed = this.particleSpeed + (Math.random() - 0.5) * this.particleSpeedVariation;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            // Random color from spark palette
            const colorIndex = Math.floor(Math.random() * this.particleSystem.constructor.prototype.sparkColors?.length || 3);
            const baseColor = this.particleSystem.constructor.prototype.sparkColors?.[colorIndex] || this.particleColor;
            const color = { ...baseColor };
            
            // Add brightness variation
            const brightness = 0.7 + Math.random() * 0.3;
            color.r = Math.min(255, color.r * brightness);
            color.g = Math.min(255, color.g * brightness);
            color.b = Math.min(255, color.b * brightness);
            
            const config = {
                x: this.x + (Math.random() - 0.5) * 4,
                y: this.y + (Math.random() - 0.5) * 4,
                vx: vx,
                vy: vy,
                maxLife: this.particleLife + (Math.random() - 0.5) * this.particleLifeVariation,
                size: Math.max(1, this.particleSize + (Math.random() - 0.5) * this.particleSizeVariation),
                color: color,
                gravity: this.particleGravity,
                friction: this.particleFriction,
                rotationSpeed: this.particleRotationSpeed + (Math.random() - 0.5) * 4,
                type: 'collision_spark'
            };
            
            this.particleSystem.emit(config);
        }.bind(emitter);
    }
    
    /**
     * Customize wall spark emitter (bouncing behavior)
     */
    customizeWallSparkEmitter(emitter) {
        emitter.emitParticle = function() {
            const angle = this.direction + (Math.random() - 0.5) * this.spread;
            const speed = this.particleSpeed + (Math.random() - 0.5) * this.particleSpeedVariation;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const config = {
                x: this.x,
                y: this.y,
                vx: vx,
                vy: vy,
                maxLife: this.particleLife,
                size: this.particleSize + Math.random(),
                color: { ...this.particleColor },
                gravity: this.particleGravity,
                friction: this.particleFriction,
                rotationSpeed: (Math.random() - 0.5) * 6,
                type: 'wall_spark'
            };
            
            this.particleSystem.emit(config);
        }.bind(emitter);
    }
    
    /**
     * Customize explosion emitter for car collisions
     */
    customizeExplosionEmitter(emitter, intensity) {
        emitter.emitParticle = function() {
            const angle = Math.random() * Math.PI * 2;
            const speed = this.particleSpeed + (Math.random() - 0.5) * this.particleSpeedVariation;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            // Bright colors for explosion
            const colors = [
                { r: 255, g: 255, b: 255, a: 1.0 }, // White
                { r: 255, g: 255, b: 100, a: 1.0 }, // Yellow
                { r: 255, g: 150, b: 50, a: 1.0 }   // Orange
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const config = {
                x: this.x,
                y: this.y,
                vx: vx,
                vy: vy,
                maxLife: this.particleLife + (Math.random() - 0.5) * this.particleLifeVariation,
                size: this.particleSize + (Math.random() - 0.5) * this.particleSizeVariation,
                color: color,
                gravity: this.particleGravity,
                friction: this.particleFriction,
                rotationSpeed: (Math.random() - 0.5) * 10,
                type: 'explosion_spark'
            };
            
            this.particleSystem.emit(config);
        }.bind(emitter);
    }
    
    /**
     * Customize object spark emitter
     */
    customizeObjectSparkEmitter(emitter) {
        emitter.emitParticle = function() {
            const angle = this.direction + (Math.random() - 0.5) * this.spread;
            const speed = this.particleSpeed + (Math.random() - 0.5) * this.particleSpeedVariation;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            // Blue-white sparks for objects
            const config = {
                x: this.x,
                y: this.y,
                vx: vx,
                vy: vy,
                maxLife: this.particleLife,
                size: this.particleSize,
                color: { ...this.particleColor },
                gravity: this.particleGravity,
                friction: this.particleFriction,
                rotationSpeed: (Math.random() - 0.5) * 8,
                type: 'object_spark'
            };
            
            this.particleSystem.emit(config);
        }.bind(emitter);
    }
    
    /**
     * Create a shower of sparks (for dramatic effects)
     */
    createSparkShower(x, y, intensity = 1.0, duration = 1.0) {
        const showerEmitter = new ParticleEmitter(this.particleSystem, {
            x: x,
            y: y,
            direction: -Math.PI / 2, // Upward
            spread: Math.PI / 3,
            
            emissionRate: 30 * intensity,
            particlesPerEmission: 2,
            
            particleLife: 2.0,
            particleLifeVariation: 0.5,
            particleSpeed: 40,
            particleSpeedVariation: 20,
            particleSize: 1,
            particleSizeVariation: 1,
            particleColor: this.sparkColors[0],
            particleGravity: 100,
            particleFriction: 0.98,
            
            effectType: 'spark_shower',
            continuous: true,
            duration: duration
        });
        
        this.customizeSparkEmitter(showerEmitter, intensity);
        this.particleSystem.addEmitter(showerEmitter);
        
        setTimeout(() => {
            this.particleSystem.removeEmitter(showerEmitter);
        }, duration * 1000 + 100);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollisionSparks;
}