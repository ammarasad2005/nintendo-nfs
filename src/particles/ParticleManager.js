/**
 * ParticleManager.js
 * Main integration class for managing all particle effects in the Nintendo NFS game
 */

class ParticleManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Initialize particle system with optimized pool size
        this.particleSystem = new ParticleSystem(2000);
        
        // Initialize effect managers
        this.driftSmoke = new DriftSmoke(this.particleSystem);
        this.boostTrail = new BoostTrail(this.particleSystem);
        this.collisionSparks = new CollisionSparks(this.particleSystem);
        
        // Track active effects
        this.activeEffects = new Map();
    }
    
    /**
     * Start drift smoke effect for a car
     */
    startDriftSmoke(carId, x, y, velocity, intensity = 1.0) {
        this.driftSmoke.start(x, y, velocity, intensity);
        this.activeEffects.set(`drift_${carId}`, {
            type: 'drift',
            effect: this.driftSmoke,
            carId: carId
        });
    }
    
    /**
     * Update drift smoke position
     */
    updateDriftSmoke(carId, x, y, velocity, intensity = 1.0) {
        if (this.activeEffects.has(`drift_${carId}`)) {
            this.driftSmoke.update(x, y, velocity, intensity);
        }
    }
    
    /**
     * Stop drift smoke for a car
     */
    stopDriftSmoke(carId) {
        this.driftSmoke.stop();
        this.activeEffects.delete(`drift_${carId}`);
    }
    
    /**
     * Start boost trail effect
     */
    startBoostTrail(carId, x, y, velocity, intensity = 1.0) {
        this.boostTrail.start(x, y, velocity, intensity);
        this.activeEffects.set(`boost_${carId}`, {
            type: 'boost',
            effect: this.boostTrail,
            carId: carId
        });
    }
    
    /**
     * Update boost trail position
     */
    updateBoostTrail(carId, x, y, velocity, intensity = 1.0) {
        if (this.activeEffects.has(`boost_${carId}`)) {
            this.boostTrail.update(x, y, velocity, intensity);
        }
    }
    
    /**
     * Stop boost trail
     */
    stopBoostTrail(carId) {
        this.boostTrail.stop();
        this.activeEffects.delete(`boost_${carId}`);
    }
    
    /**
     * Create collision sparks
     */
    createCollisionSparks(x, y, velocity, intensity = 1.0, type = 'normal') {
        this.collisionSparks.createCollision(x, y, velocity, intensity, type);
    }
    
    /**
     * Update particle system (call this in your game loop)
     */
    update(deltaTime) {
        this.particleSystem.update(deltaTime);
    }
    
    /**
     * Render all particles (call this in your render loop)
     */
    render() {
        this.particleSystem.render(this.ctx);
    }
    
    /**
     * Get performance statistics
     */
    getStats() {
        return {
            ...this.particleSystem.getStats(),
            activeEffects: this.activeEffects.size
        };
    }
    
    /**
     * Clear all particles and effects
     */
    clear() {
        this.particleSystem.clear();
        this.driftSmoke.stop();
        this.boostTrail.stop();
        this.activeEffects.clear();
    }
}

// Example usage in a Nintendo NFS game:
/*
// Initialize particle manager
const particleManager = new ParticleManager(gameCanvas);

// In your game loop:
function gameLoop(deltaTime) {
    // Update game objects...
    
    // Update particles
    particleManager.update(deltaTime);
    
    // Render game objects...
    
    // Render particles (usually last for proper layering)
    particleManager.render();
}

// When a car starts drifting:
particleManager.startDriftSmoke(car.id, car.x, car.y, car.velocity, car.driftIntensity);

// When a car is boosting:
particleManager.startBoostTrail(car.id, car.x, car.y, car.velocity, car.boostPower);

// When a collision occurs:
particleManager.createCollisionSparks(collision.x, collision.y, collision.velocity, collision.force, 'car');
*/

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleManager;
}