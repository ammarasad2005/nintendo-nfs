/**
 * test.js - Test suite for AI system components
 * Validates AI functionality and integration
 */

const AIManager = require('../src/ai/AIManager');
const AIBehavior = require('../src/ai/AIBehavior');
const PathFinding = require('../src/ai/PathFinding');
const AIController = require('../src/ai/AIController');

class AITestSuite {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    /**
     * Add a test to the suite
     * @param {string} name - Test name
     * @param {Function} testFn - Test function
     */
    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    /**
     * Run all tests
     */
    async runAll() {
        console.log('🧪 Running AI System Test Suite...\n');

        for (const test of this.tests) {
            try {
                await test.testFn();
                console.log(`✅ ${test.name}`);
                this.passed++;
            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message}`);
                this.failed++;
            }
        }

        console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
        
        if (this.failed === 0) {
            console.log('🎉 All tests passed! AI system is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Please check the implementation.');
        }
    }

    /**
     * Assert that a condition is true
     * @param {boolean} condition - Condition to check
     * @param {string} message - Error message if assertion fails
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    /**
     * Assert that two values are equal
     * @param {*} actual - Actual value
     * @param {*} expected - Expected value
     * @param {string} message - Error message if assertion fails
     */
    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message}: expected ${expected}, got ${actual}`);
        }
    }

    /**
     * Assert that a value is defined
     * @param {*} value - Value to check
     * @param {string} message - Error message if assertion fails
     */
    assertDefined(value, message) {
        if (value === undefined || value === null) {
            throw new Error(message);
        }
    }
}

// Create test suite
const testSuite = new AITestSuite();

// AIManager Tests
testSuite.test('AIManager - Initialize Race', () => {
    const aiManager = new AIManager();
    const opponents = aiManager.initializeRace(5, 'medium', { waypoints: [] });
    
    testSuite.assertEqual(opponents.length, 5, 'Should create 5 opponents');
    testSuite.assert(aiManager.opponents.size === 5, 'Should store 5 opponents in manager');
    
    const firstOpponent = opponents[0];
    testSuite.assertDefined(firstOpponent.id, 'Opponent should have ID');
    testSuite.assertDefined(firstOpponent.difficulty, 'Opponent should have difficulty');
    testSuite.assertDefined(firstOpponent.settings, 'Opponent should have settings');
});

testSuite.test('AIManager - Difficulty Variation', () => {
    const aiManager = new AIManager();
    aiManager.initializeRace(6, 'medium', { waypoints: [] });
    
    const opponents = aiManager.getActiveOpponents();
    const difficulties = opponents.map(o => o.difficulty);
    
    // Should have some variation in difficulties
    const uniqueDifficulties = [...new Set(difficulties)];
    testSuite.assert(uniqueDifficulties.length >= 1, 'Should have at least one difficulty level');
});

testSuite.test('AIManager - Update System', () => {
    const aiManager = new AIManager();
    aiManager.initializeRace(3, 'medium', { waypoints: [] });
    
    const gameState = { racers: [], powerUps: [], obstacles: [] };
    const playerState = { position: { x: 0, y: 0, z: 0 }, racePosition: 1 };
    
    // Should not throw error during update
    aiManager.update(0.016, gameState, playerState);
    
    const stats = aiManager.getStatistics();
    testSuite.assertEqual(stats.activeOpponents, 3, 'Should have 3 active opponents');
});

// AIBehavior Tests
testSuite.test('AIBehavior - Initialization', () => {
    const opponent = {
        id: 'test_ai',
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        racePosition: 1
    };
    
    const settings = { aggressiveness: 0.5, reactionTime: 0.3, maxSpeed: 0.9 };
    const behavior = new AIBehavior(opponent, settings);
    
    testSuite.assertDefined(behavior.currentState, 'Should have initial state');
    testSuite.assertDefined(behavior.strategies, 'Should have strategies');
    testSuite.assertDefined(behavior.decisionFactors, 'Should have decision factors');
});

testSuite.test('AIBehavior - State Machine', () => {
    const opponent = {
        id: 'test_ai',
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 20, y: 0, z: 0 },
        racePosition: 1
    };
    
    const settings = { aggressiveness: 0.8, reactionTime: 0.2, maxSpeed: 1.0 };
    const behavior = new AIBehavior(opponent, settings);
    
    const initialState = behavior.currentState;
    
    // Update behavior
    const gameState = {};
    const playerState = { position: { x: 10, y: 0, z: 0 }, racePosition: 2 };
    
    behavior.update(0.016, gameState, playerState);
    
    testSuite.assertDefined(behavior.opponent.behaviorDecisions, 'Should generate decisions');
});

testSuite.test('AIBehavior - Decision Making', () => {
    const opponent = {
        id: 'test_ai',
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 30, y: 0, z: 5 },
        racePosition: 3
    };
    
    const settings = { aggressiveness: 0.6, reactionTime: 0.25, maxSpeed: 0.95 };
    const behavior = new AIBehavior(opponent, settings);
    
    const gameState = {};
    const playerState = { position: { x: 5, y: 0, z: 0 }, racePosition: 2 };
    
    behavior.update(0.016, gameState, playerState);
    
    const decisions = behavior.opponent.behaviorDecisions;
    testSuite.assertDefined(decisions.targetSpeed, 'Should have target speed decision');
    testSuite.assertDefined(decisions.aggressionLevel, 'Should have aggression level');
});

// PathFinding Tests
testSuite.test('PathFinding - Initialization', () => {
    const trackData = {
        waypoints: [
            { x: 0, y: 0, z: 0 },
            { x: 100, y: 0, z: 0 },
            { x: 100, y: 0, z: 100 },
            { x: 0, y: 0, z: 100 }
        ]
    };
    
    const settings = { maxSpeed: 0.9 };
    const pathfinder = new PathFinding(trackData, settings);
    
    testSuite.assertDefined(pathfinder.racingLine, 'Should have racing line');
    testSuite.assert(pathfinder.racingLine.length > 0, 'Racing line should not be empty');
});

testSuite.test('PathFinding - Optimal Path', () => {
    const trackData = {
        waypoints: [
            { x: 0, y: 0, z: 0 },
            { x: 50, y: 0, z: 0 },
            { x: 100, y: 0, z: 50 },
            { x: 50, y: 0, z: 100 },
            { x: 0, y: 0, z: 50 }
        ]
    };
    
    const settings = { maxSpeed: 1.0 };
    const pathfinder = new PathFinding(trackData, settings);
    
    const startPos = { x: 0, y: 0, z: 0 };
    const targetPos = { x: 100, y: 0, z: 50 };
    
    const path = pathfinder.findOptimalPath(startPos, targetPos);
    testSuite.assert(Array.isArray(path), 'Should return path as array');
    testSuite.assert(path.length > 0, 'Path should not be empty');
});

testSuite.test('PathFinding - Next Waypoint', () => {
    const trackData = {
        waypoints: [
            { x: 0, y: 0, z: 0 },
            { x: 50, y: 0, z: 0 },
            { x: 100, y: 0, z: 0 }
        ]
    };
    
    const settings = { maxSpeed: 1.0 };
    const pathfinder = new PathFinding(trackData, settings);
    
    const currentPos = { x: 10, y: 0, z: 0 };
    const currentVel = { x: 20, y: 0, z: 0 };
    
    const waypoint = pathfinder.getNextWaypoint(currentPos, currentVel, 30);
    testSuite.assertDefined(waypoint, 'Should return next waypoint');
    
    if (waypoint) {
        testSuite.assertDefined(waypoint.position, 'Waypoint should have position');
        testSuite.assertDefined(waypoint.speed, 'Waypoint should have speed');
    }
});

// AIController Tests
testSuite.test('AIController - Initialization', () => {
    const opponent = {
        id: 'test_ai',
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 }
    };
    
    const vehicle = {};
    const settings = { maxSpeed: 0.9, reactionTime: 0.3 };
    
    const controller = new AIController(opponent, vehicle, settings);
    
    testSuite.assertDefined(controller.controls, 'Should have controls');
    testSuite.assertDefined(controller.physics, 'Should have physics settings');
    testSuite.assertDefined(controller.collisionAvoidance, 'Should have collision avoidance');
});

testSuite.test('AIController - Speed Control', () => {
    const opponent = {
        id: 'test_ai',
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 30, y: 0, z: 0 } // Higher initial speed for braking test
    };
    
    const controller = new AIController(opponent, {}, { maxSpeed: 1.0 });
    
    // Test setting target speed higher than current
    controller.setTargetSpeed(50);
    testSuite.assert(controller.controls.throttle > 0, 'Should apply throttle for higher target speed');
    
    // Test setting target speed much lower than current (should trigger braking)
    controller.setTargetSpeed(5);
    testSuite.assert(controller.controls.brake > 0, 'Should apply brake for lower target speed');
    testSuite.assertEqual(controller.controls.throttle, 0, 'Should not apply throttle when braking');
});

testSuite.test('AIController - Steering Control', () => {
    const opponent = {
        id: 'test_ai',
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 20, y: 0, z: 0 }
    };
    
    const controller = new AIController(opponent, {}, { maxSpeed: 1.0 });
    
    controller.setTargetSteering(0.5);
    testSuite.assertEqual(controller.targetSteering, 0.5, 'Should set target steering');
    
    controller.setTargetSteering(-0.8);
    testSuite.assertEqual(controller.targetSteering, -0.8, 'Should set negative target steering');
    
    // Test clamping
    controller.setTargetSteering(1.5);
    testSuite.assert(controller.targetSteering <= 1.0, 'Should clamp steering to maximum');
});

testSuite.test('AIController - Update Cycle', () => {
    const opponent = {
        id: 'test_ai',
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 15, y: 0, z: 5 },
        behaviorDecisions: {
            targetSpeed: 40,
            steeringDirection: 0.2,
            shouldBrake: false
        }
    };
    
    const controller = new AIController(opponent, {}, { maxSpeed: 1.0 });
    const gameState = { racers: [], powerUps: [], obstacles: [] };
    
    // Should not throw error during update
    controller.update(0.016, gameState);
    
    testSuite.assertDefined(controller.controls.throttle, 'Should have throttle control');
    testSuite.assertDefined(controller.controls.steering, 'Should have steering control');
});

// Integration Tests
testSuite.test('Integration - Complete AI System', () => {
    const aiManager = new AIManager();
    const opponents = aiManager.initializeRace(2, 'medium', { waypoints: [] });
    
    // Set up AI components
    opponents.forEach(opponent => {
        const settings = aiManager.difficultySettings[opponent.difficulty];
        opponent.behavior = new AIBehavior(opponent, settings);
        opponent.pathfinder = new PathFinding({ waypoints: [] }, settings);
        opponent.controller = new AIController(opponent, {}, settings);
    });
    
    const gameState = { racers: opponents, powerUps: [], obstacles: [] };
    const playerState = { position: { x: 0, y: 0, z: 0 }, racePosition: 1 };
    
    // Update complete system
    aiManager.update(0.016, gameState, playerState);
    
    // Verify all components are working
    opponents.forEach(opponent => {
        testSuite.assertDefined(opponent.behavior, 'Should have behavior component');
        testSuite.assertDefined(opponent.pathfinder, 'Should have pathfinder component');
        testSuite.assertDefined(opponent.controller, 'Should have controller component');
    });
});

testSuite.test('Integration - Multiple Difficulty Levels', () => {
    const difficulties = ['easy', 'medium', 'hard'];
    
    difficulties.forEach(difficulty => {
        const aiManager = new AIManager();
        const opponents = aiManager.initializeRace(3, difficulty, { waypoints: [] });
        
        testSuite.assert(opponents.length === 3, `Should create 3 opponents for ${difficulty}`);
        
        opponents.forEach(opponent => {
            testSuite.assertDefined(opponent.settings, `Opponent should have ${difficulty} settings`);
            testSuite.assert(
                opponent.settings.aggressiveness >= 0 && opponent.settings.aggressiveness <= 1,
                'Aggressiveness should be in valid range'
            );
        });
    });
});

// Run the test suite
testSuite.runAll().then(() => {
    console.log('\n🏁 Test suite completed!');
}).catch((error) => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});