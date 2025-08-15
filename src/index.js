/**
 * index.js
 * 
 * Main entry point for the Nintendo-styled Need for Speed game
 * Demonstrates the performance optimization system integration
 */

const PerformanceManager = require('./performance/PerformanceManager');

class NintendoNFSGame {
    constructor() {
        this.isRunning = false;
        this.gameObjects = [];
        this.lastUpdateTime = 0;
        
        // Initialize performance optimization system
        this.performanceManager = new PerformanceManager({
            targetFPS: 60,
            adaptiveQuality: true,
            enableProfiling: true,
            enableDebugTools: true,
            memoryThreshold: 100 * 1024 * 1024, // 100MB
            frameTimeThreshold: 16.67 // ~60 FPS in ms
        });

        console.log('🏎️ Nintendo-styled Need for Speed - Performance Demo');
        console.log('==================================================');
    }

    /**
     * Initialize the game
     */
    async initialize() {
        console.log('🚀 Initializing game...');
        
        // Initialize performance system
        this.performanceManager.initialize();
        
        // Preload essential assets
        await this.performanceManager.resourceOptimizer.preloadEssentialAssets();
        
        // Set initial quality preset
        this.performanceManager.setQualityPreset('high');
        
        // Add some demo game objects
        this.createDemoObjects();
        
        console.log('✅ Game initialization complete!');
    }

    /**
     * Create demo objects to simulate game load
     */
    createDemoObjects() {
        // Create cars using object pooling
        for (let i = 0; i < 8; i++) {
            const car = this.performanceManager.memoryManager.getFromPool('cars');
            if (car) {
                car.position = { x: i * 50, y: 0, z: 0 };
                car.active = true;
                this.gameObjects.push({ type: 'car', object: car, poolName: 'cars' });
                
                // Add to LOD system
                this.performanceManager.renderOptimizer.addLODObject(`car_${i}`, {
                    type: 'car',
                    position: car.position,
                    boundingRadius: 5
                });
            }
        }

        // Create particles
        for (let i = 0; i < 100; i++) {
            const particle = this.performanceManager.memoryManager.getFromPool('particles');
            if (particle) {
                particle.position = { 
                    x: Math.random() * 200 - 100, 
                    y: Math.random() * 200 - 100, 
                    z: 0 
                };
                particle.active = true;
                particle.life = Math.random() * 5;
                this.gameObjects.push({ type: 'particle', object: particle, poolName: 'particles' });
            }
        }

        console.log(`🎮 Created ${this.gameObjects.length} demo objects`);
    }

    /**
     * Start the game loop
     */
    start() {
        this.isRunning = true;
        this.lastUpdateTime = performance.now();
        
        console.log('🎮 Starting game loop...');
        console.log('📊 Use performanceManager.setDebugMode(true) for detailed metrics');
        console.log('🎚️ Available quality presets: low, medium, high');
        
        this.gameLoop();
    }

    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) return;

        // Update performance system (must be called every frame)
        this.performanceManager.update();
        
        // Update game objects
        this.updateGameObjects();
        
        // Simulate rendering
        this.render();
        
        // Continue the loop
        if (typeof setImmediate !== 'undefined') {
            setImmediate(() => this.gameLoop());
        } else {
            setTimeout(() => this.gameLoop(), 0);
        }
    }

    /**
     * Update game objects
     */
    updateGameObjects() {
        // Update cars
        this.gameObjects.forEach((gameObj, index) => {
            if (gameObj.type === 'car' && gameObj.object.active) {
                // Simulate car movement
                gameObj.object.position.x += Math.sin(Date.now() * 0.001 + index) * 0.5;
                gameObj.object.speed = 50 + Math.sin(Date.now() * 0.002 + index) * 20;
            } else if (gameObj.type === 'particle' && gameObj.object.active) {
                // Simulate particle physics
                gameObj.object.life -= 0.016; // Assuming 60 FPS
                if (gameObj.object.life <= 0) {
                    // Return to pool when particle dies
                    this.performanceManager.memoryManager.returnToPool(gameObj.poolName, gameObj.object);
                    this.gameObjects.splice(index, 1);
                }
            }
        });

        // Occasionally create new particles to test pooling
        if (Math.random() < 0.1) { // 10% chance each frame
            const particle = this.performanceManager.memoryManager.getFromPool('particles');
            if (particle) {
                particle.position = { 
                    x: Math.random() * 200 - 100, 
                    y: Math.random() * 200 - 100, 
                    z: 0 
                };
                particle.active = true;
                particle.life = Math.random() * 3 + 1;
                this.gameObjects.push({ type: 'particle', object: particle, poolName: 'particles' });
            }
        }
    }

    /**
     * Simulate rendering
     */
    render() {
        // This would contain actual rendering code
        // For now, we'll just update render stats
        
        const renderStats = this.performanceManager.renderOptimizer.getRenderStats();
        renderStats.drawCalls = this.gameObjects.filter(obj => obj.object.active).length;
        renderStats.triangles = renderStats.drawCalls * 500; // Rough estimate
    }

    /**
     * Stop the game
     */
    stop() {
        this.isRunning = false;
        console.log('⏹️ Game stopped');
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            performance: this.performanceManager.getMetrics(),
            memory: this.performanceManager.memoryManager.getMemoryStats(),
            render: this.performanceManager.renderOptimizer.getRenderStats(),
            resources: this.performanceManager.resourceOptimizer.getCacheStats()
        };
    }

    /**
     * Set quality preset
     */
    setQuality(preset) {
        this.performanceManager.setQualityPreset(preset);
        console.log(`🎚️ Quality set to: ${preset}`);
    }

    /**
     * Toggle debug mode
     */
    toggleDebug() {
        const current = this.performanceManager.debugEnabled;
        this.performanceManager.setDebugMode(!current);
        console.log(`🔧 Debug mode: ${!current ? 'ON' : 'OFF'}`);
    }

    /**
     * Simulate performance stress test
     */
    stressTest() {
        console.log('⚡ Starting performance stress test...');
        
        // Create many objects to stress the system
        for (let i = 0; i < 500; i++) {
            const particle = this.performanceManager.memoryManager.getFromPool('particles');
            if (particle) {
                particle.position = { 
                    x: Math.random() * 1000 - 500, 
                    y: Math.random() * 1000 - 500, 
                    z: 0 
                };
                particle.active = true;
                particle.life = Math.random() * 10 + 5;
                this.gameObjects.push({ type: 'particle', object: particle, poolName: 'particles' });
            }
        }
        
        // Load many assets
        for (let i = 0; i < 20; i++) {
            this.performanceManager.resourceOptimizer.addToPreloadQueue({
                type: 'image',
                path: `stress-test/texture-${i}.png`,
                priority: 'background'
            });
        }
        
        console.log('⚡ Stress test initiated - watch performance metrics!');
    }

    /**
     * Clean up and destroy
     */
    destroy() {
        console.log('🧹 Cleaning up game...');
        
        this.stop();
        
        // Return all objects to pools
        this.gameObjects.forEach(gameObj => {
            if (gameObj.poolName) {
                this.performanceManager.memoryManager.returnToPool(gameObj.poolName, gameObj.object);
            }
        });
        this.gameObjects = [];
        
        // Destroy performance system
        this.performanceManager.destroy();
        
        console.log('✅ Game cleanup complete');
    }
}

// Demo execution
async function runDemo() {
    const game = new NintendoNFSGame();
    
    try {
        await game.initialize();
        game.start();
        
        // Demo various features
        console.log('\n🎮 DEMO COMMANDS AVAILABLE:');
        console.log('game.setQuality("low")     - Set quality to low');
        console.log('game.setQuality("medium")  - Set quality to medium');
        console.log('game.setQuality("high")    - Set quality to high');
        console.log('game.toggleDebug()         - Toggle debug output');
        console.log('game.stressTest()          - Run performance stress test');
        console.log('game.getPerformanceMetrics() - Get detailed metrics');
        console.log('game.destroy()             - Clean up and exit\n');
        
        // Expose game instance globally for demo interaction
        if (typeof global !== 'undefined') {
            global.game = game;
        }
        
        // Run a quick demo sequence
        setTimeout(() => {
            console.log('\n📊 Performance metrics after 3 seconds:');
            console.log(JSON.stringify(game.getPerformanceMetrics(), null, 2));
        }, 3000);
        
        setTimeout(() => {
            console.log('\n⚡ Running automatic stress test...');
            game.stressTest();
        }, 5000);
        
        setTimeout(() => {
            console.log('\n📊 Performance metrics after stress test:');
            console.log(JSON.stringify(game.getPerformanceMetrics(), null, 2));
        }, 8000);
        
    } catch (error) {
        console.error('❌ Error running demo:', error);
    }
}

// Run the demo if this file is executed directly
if (require.main === module) {
    runDemo();
}

module.exports = NintendoNFSGame;