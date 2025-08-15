/**
 * index.js - Main entry point for Nintendo-styled Need for Speed game
 * Demonstrates the AI system implementation
 */

const AIManager = require('./ai/AIManager');
const AIBehavior = require('./ai/AIBehavior');
const PathFinding = require('./ai/PathFinding');
const AIController = require('./ai/AIController');

class NintendoNFS {
    constructor() {
        this.aiManager = new AIManager();
        this.gameState = {
            racers: [],
            powerUps: [],
            obstacles: [],
            track: null
        };
        this.playerState = {
            position: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            racePosition: 1,
            currentLap: 1
        };
        this.isRunning = false;
    }

    /**
     * Initialize the game with AI opponents
     * @param {Object} config - Game configuration
     */
    initialize(config = {}) {
        const {
            numOpponents = 7,
            difficulty = 'medium',
            trackData = null
        } = config;

        console.log('🏎️ Initializing Nintendo-Style Need for Speed...');
        console.log(`📊 Spawning ${numOpponents} AI opponents with ${difficulty} difficulty`);

        // Initialize track data
        this.gameState.track = trackData || this.createDefaultTrack();

        // Initialize AI opponents
        const opponents = this.aiManager.initializeRace(numOpponents, difficulty, this.gameState.track);

        // Set up AI components for each opponent
        opponents.forEach(opponent => {
            const difficultySettings = this.aiManager.difficultySettings[opponent.difficulty];
            
            // Create AI behavior component
            opponent.behavior = new AIBehavior(opponent, difficultySettings);
            
            // Create pathfinding component
            opponent.pathfinder = new PathFinding(this.gameState.track, difficultySettings);
            
            // Create AI controller component
            opponent.controller = new AIController(opponent, null, difficultySettings);
            
            console.log(`🤖 AI ${opponent.id} initialized with ${opponent.difficulty} difficulty`);
        });

        this.gameState.racers = opponents;
        console.log('✅ AI system initialized successfully!');
    }

    /**
     * Start the game simulation
     */
    start() {
        console.log('🚦 Starting race simulation...');
        this.isRunning = true;
        this.lastUpdateTime = Date.now();
        
        // Start main game loop
        this.gameLoop();
    }

    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
        this.lastUpdateTime = currentTime;

        // Update AI system
        this.aiManager.update(deltaTime, this.gameState, this.playerState);

        // Update player state (simulated for demonstration)
        this.updateSimulatedPlayer(deltaTime);

        // Log race progress periodically
        if (currentTime % 2000 < 50) { // Every ~2 seconds
            this.logRaceProgress();
        }

        // Continue game loop
        setTimeout(() => this.gameLoop(), 16); // ~60 FPS
    }

    /**
     * Update simulated player for demonstration
     * @param {number} deltaTime - Time since last update
     */
    updateSimulatedPlayer(deltaTime) {
        // Simulate player movement around the track
        const speed = 50; // Constant speed for demo
        this.playerState.position.x += Math.cos(Date.now() * 0.001) * speed * deltaTime;
        this.playerState.position.z += Math.sin(Date.now() * 0.001) * speed * deltaTime;
        
        this.playerState.velocity.x = Math.cos(Date.now() * 0.001) * speed;
        this.playerState.velocity.z = Math.sin(Date.now() * 0.001) * speed;
    }

    /**
     * Log current race progress
     */
    logRaceProgress() {
        console.log('\n📊 Race Progress:');
        console.log(`👤 Player: Position ${this.playerState.racePosition}`);
        
        const activeOpponents = this.aiManager.getActiveOpponents();
        activeOpponents.forEach(opponent => {
            const speed = Math.sqrt(opponent.velocity.x ** 2 + opponent.velocity.z ** 2);
            console.log(`🤖 ${opponent.id}: Position ${opponent.racePosition}, Speed: ${speed.toFixed(1)}, Difficulty: ${opponent.difficulty}`);
        });

        const stats = this.aiManager.getStatistics();
        console.log(`📈 AI Stats: ${stats.activeOpponents}/${stats.totalOpponents} active opponents`);
    }

    /**
     * Create default track for demonstration
     * @returns {Object} Track data
     */
    createDefaultTrack() {
        const waypoints = [];
        const radius = 200;
        const segments = 32;

        // Create a simple oval track
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            waypoints.push({
                x: Math.cos(angle) * radius,
                y: 0,
                z: Math.sin(angle) * radius
            });
        }

        return {
            name: 'Demo Oval Track',
            waypoints: waypoints,
            width: 30,
            laps: 3
        };
    }

    /**
     * Stop the game simulation
     */
    stop() {
        console.log('🏁 Race simulation stopped');
        this.isRunning = false;
    }

    /**
     * Demonstrate AI system capabilities
     */
    demonstrateAI() {
        console.log('\n🔬 AI System Demonstration:');
        
        const opponent = this.gameState.racers[0];
        if (!opponent) return;

        console.log(`\n🧠 AI Behavior for ${opponent.id}:`);
        console.log(`- Current State: ${opponent.behavior.currentState}`);
        console.log(`- Strategic Focus: ${opponent.behavior.strategicFocus || 'normal racing'}`);
        console.log(`- Player Interaction: ${opponent.behavior.playerInteraction || 'ignore'}`);

        console.log(`\n🛣️  Pathfinding for ${opponent.id}:`);
        const waypoint = opponent.pathfinder.getNextWaypoint(
            opponent.position, 
            opponent.velocity, 
            50
        );
        if (waypoint) {
            console.log(`- Next Waypoint: (${waypoint.position.x.toFixed(1)}, ${waypoint.position.z.toFixed(1)})`);
            console.log(`- Target Speed: ${waypoint.speed.toFixed(1)}`);
            console.log(`- In Corner: ${waypoint.isCorner}`);
        }

        console.log(`\n🎮 Controller for ${opponent.id}:`);
        const controls = opponent.controller.controls;
        console.log(`- Throttle: ${(controls.throttle * 100).toFixed(1)}%`);
        console.log(`- Brake: ${(controls.brake * 100).toFixed(1)}%`);
        console.log(`- Steering: ${(controls.steering * 100).toFixed(1)}%`);
        console.log(`- Drift Mode: ${controls.drift ? 'Active' : 'Inactive'}`);
    }
}

// Demo execution
function runDemo() {
    const game = new NintendoNFS();
    
    // Initialize with different difficulty configurations
    const configs = [
        { numOpponents: 7, difficulty: 'medium' },
        { numOpponents: 5, difficulty: 'hard' },
        { numOpponents: 4, difficulty: 'easy' }
    ];
    
    const config = configs[0]; // Use first config for demo
    
    game.initialize(config);
    game.start();
    
    // Demonstrate AI capabilities after 3 seconds
    setTimeout(() => {
        game.demonstrateAI();
    }, 3000);
    
    // Stop demo after 10 seconds
    setTimeout(() => {
        game.stop();
        console.log('\n🎉 Demo completed! The AI system is ready for integration.');
        process.exit(0);
    }, 10000);
}

// Export for use as module
module.exports = NintendoNFS;

// Run demo if this file is executed directly
if (require.main === module) {
    runDemo();
}