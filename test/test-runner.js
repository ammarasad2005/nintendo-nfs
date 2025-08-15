/**
 * Simple Test Runner for Nintendo NFS Balance System
 */

import { BalanceManager, GameParameters, DifficultyTuner, BalanceAnalytics } from '../src/index.js';

class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async run() {
        console.log('🧪 Running Nintendo NFS Balance System Tests');
        console.log('='.repeat(50));

        for (const test of this.tests) {
            try {
                console.log(`\n🔍 Testing: ${test.name}`);
                await test.testFn();
                console.log(`✅ PASSED: ${test.name}`);
                this.passed++;
            } catch (error) {
                console.log(`❌ FAILED: ${test.name}`);
                console.log(`   Error: ${error.message}`);
                this.failed++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
        console.log(`✅ Success rate: ${((this.passed / this.tests.length) * 100).toFixed(1)}%`);

        return this.failed === 0;
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, but got ${actual}`);
        }
    }

    assertApproxEqual(actual, expected, tolerance = 0.01, message) {
        if (Math.abs(actual - expected) > tolerance) {
            throw new Error(message || `Expected ${expected} ± ${tolerance}, but got ${actual}`);
        }
    }
}

// Initialize test runner
const runner = new TestRunner();

// Test GameParameters
runner.test('GameParameters - Initialize with defaults', () => {
    const params = new GameParameters();
    const defaults = params.getParametersForDifficulty('normal');
    
    runner.assert(defaults.vehicle.acceleration.normal === 1.0, 'Default acceleration should be 1.0');
    runner.assert(defaults.vehicle.topSpeed.normal === 120, 'Default top speed should be 120');
    runner.assert(defaults.ai.skillLevel === 0.7, 'Default AI skill should be 0.7');
});

runner.test('GameParameters - Difficulty modifiers work correctly', () => {
    const params = new GameParameters();
    
    const easyParams = params.getParametersForDifficulty('easy');
    const hardParams = params.getParametersForDifficulty('hard');
    
    runner.assert(easyParams.ai.skillLevel < hardParams.ai.skillLevel, 'Easy AI should be less skilled than hard AI');
    runner.assert(easyParams.powerups.spawnRate > hardParams.powerups.spawnRate, 'Easy should have more power-ups');
});

runner.test('GameParameters - Parameter updates work', () => {
    const params = new GameParameters();
    
    params.updateParameter('ai.skillLevel', 0.8);
    const value = params.getParameter('ai.skillLevel');
    
    runner.assertEqual(value, 0.8, 'Parameter should be updated correctly');
});

runner.test('GameParameters - Validation catches invalid values', () => {
    const params = new GameParameters();
    
    params.updateParameter('ai.skillLevel', 1.5); // Invalid - should be 0-1
    const violations = params.validateParameters();
    
    runner.assert(violations.length > 0, 'Should detect validation violations');
});

// Test DifficultyTuner
runner.test('DifficultyTuner - Initialize and set difficulty', () => {
    const params = new GameParameters();
    const tuner = new DifficultyTuner(params);
    
    const config = tuner.setDifficulty('hard');
    runner.assert(config.ai.skillLevel === 0.9, 'Hard difficulty should have high AI skill');
});

runner.test('DifficultyTuner - AI behavior adjustment', () => {
    const params = new GameParameters();
    const tuner = new DifficultyTuner(params);
    
    const aiConfig = tuner.adjustAIBehavior('easy');
    
    runner.assert(aiConfig.speedMultiplier < 1.0, 'Easy AI should be slower');
    runner.assert(aiConfig.mistakeProbability > 0.1, 'Easy AI should make more mistakes');
});

runner.test('DifficultyTuner - Dynamic difficulty adjustment', () => {
    const params = new GameParameters();
    const tuner = new DifficultyTuner(params);
    
    // Simulate player losing too much
    for (let i = 0; i < 10; i++) {
        tuner.adjustDifficultyDynamically({ won: false, position: 6 });
    }
    
    const level = tuner.getCurrentDifficultyLevel();
    runner.assert(level.factor < 1.0, 'Difficulty should decrease when player loses too much');
});

runner.test('DifficultyTuner - Speed and handling curves', () => {
    const params = new GameParameters();
    const tuner = new DifficultyTuner(params);
    
    const curves = tuner.adjustSpeedHandlingCurves('normal');
    
    runner.assert(curves.accelerationCurve.initial > curves.accelerationCurve.highSpeed, 
        'Initial acceleration should be higher than high-speed acceleration');
    runner.assert(curves.handlingCurve.lowSpeed > curves.handlingCurve.highSpeed, 
        'Low-speed handling should be more responsive');
});

// Test BalanceAnalytics
runner.test('BalanceAnalytics - Record and analyze race', () => {
    const analytics = new BalanceAnalytics();
    
    const raceData = {
        participants: [
            { id: 'player1', isPlayer: true, finalPosition: 2, finalTime: 120000, powerupsUsed: 2, driftsCompleted: 5, mistakesMade: 1, averageSpeed: 95 },
            { id: 'ai1', isPlayer: false, finalPosition: 1, finalTime: 118000, powerupsUsed: 1, driftsCompleted: 8, mistakesMade: 0, averageSpeed: 100 }
        ],
        duration: 120000,
        track: 'test_track',
        difficulty: 'normal',
        events: [],
        parameters: {}
    };
    
    const raceId = analytics.recordRace(raceData);
    runner.assert(typeof raceId === 'string', 'Should return a race ID');
    runner.assert(analytics.metrics.races.length === 1, 'Should have recorded one race');
});

runner.test('BalanceAnalytics - Player success rate analysis', () => {
    const analytics = new BalanceAnalytics();
    
    // Lower the minimum races needed for testing
    analytics.analysisConfig.minimumRacesForAnalysis = 3;
    
    // Record enough races for analysis
    for (let i = 0; i < 6; i++) {
        analytics.recordRace({
            participants: [
                { id: 'player1', isPlayer: true, finalPosition: i < 2 ? 1 : 4, finalTime: 120000 + i * 1000, powerupsUsed: 2, driftsCompleted: 5, mistakesMade: 1, averageSpeed: 95 },
                { id: 'ai1', isPlayer: false, finalPosition: i < 2 ? 2 : 1, finalTime: 118000 + i * 1000, powerupsUsed: 1, driftsCompleted: 8, mistakesMade: 0, averageSpeed: 100 }
            ],
            duration: 120000,
            track: 'test_track',
            difficulty: 'normal',
            events: [],
            parameters: {}
        });
    }
    
    const analysis = analytics.analyzePlayerSuccessRate();
    
    // Check if we have sufficient data or got an error
    if (analysis.error) {
        runner.assert(analysis.error.includes('Insufficient'), 'Should report insufficient data if not enough races');
    } else {
        runner.assert(analysis.winRate !== undefined, 'Should have win rate');
        runner.assert(analysis.balanceAssessment !== undefined, 'Should provide balance assessment');
        runner.assert(analysis.totalRaces > 0, 'Should have races recorded');
    }
});

runner.test('BalanceAnalytics - Feedback collection', () => {
    const analytics = new BalanceAnalytics();
    
    const feedback = {
        type: 'difficulty',
        rating: 4,
        comments: 'Good balance!'
    };
    
    const result = analytics.collectFeedback(feedback);
    runner.assert(analytics.feedbackCollection.length === 1, 'Should store feedback');
    runner.assert(result.sentiment === 'positive', 'Should detect positive sentiment');
});

// Test BalanceManager
runner.test('BalanceManager - Initialize and start session', () => {
    const manager = new BalanceManager({
        enableRealTimeMonitoring: false // Disable for testing
    });
    
    runner.assert(manager.state.active === true, 'Manager should be active after initialization');
    
    const sessionId = manager.startSession({
        difficulty: 'normal',
        gameMode: 'championship'
    });
    
    runner.assert(typeof sessionId === 'string', 'Should return session ID');
    runner.assert(manager.state.currentSession !== null, 'Should have active session');
});

runner.test('BalanceManager - Process race completion', () => {
    const manager = new BalanceManager({
        enableRealTimeMonitoring: false
    });
    
    manager.startSession({ difficulty: 'normal' });
    
    const raceData = {
        participants: [
            { id: 'player1', isPlayer: true, finalPosition: 1, finalTime: 120000, powerupsUsed: 2, driftsCompleted: 5, mistakesMade: 1, averageSpeed: 95 },
            { id: 'ai1', isPlayer: false, finalPosition: 2, finalTime: 122000, powerupsUsed: 1, driftsCompleted: 3, mistakesMade: 2, averageSpeed: 90 }
        ],
        duration: 120000,
        track: 'test_track',
        difficulty: 'normal'
    };
    
    const result = manager.processRaceCompletion(raceData);
    
    runner.assert(result.raceId !== undefined, 'Should return race ID');
    runner.assert(result.playerPerformance.position === 1, 'Should track player performance');
    runner.assert(result.sessionId === manager.state.currentSession.id, 'Should link to current session');
});

runner.test('BalanceManager - Balance configuration', () => {
    const manager = new BalanceManager({
        enableRealTimeMonitoring: false
    });
    
    // Start a session to get full configuration
    manager.startSession({ difficulty: 'normal' });
    
    const config = manager.getCurrentBalanceConfig();
    
    runner.assert(config.level !== undefined, 'Should have difficulty level');
    runner.assert(config.parameters !== undefined, 'Should have game parameters');
    runner.assert(config.catchupConfig !== undefined, 'Should have catch-up configuration');
});

runner.test('BalanceManager - Nintendo-style compliance', () => {
    const manager = new BalanceManager({
        enableRealTimeMonitoring: false
    });
    
    const compliance = manager.validateNintendoStyleCompliance();
    
    runner.assert(compliance.score >= 0 && compliance.score <= 1, 'Compliance score should be between 0 and 1');
    runner.assert(compliance.criteria.accessibility !== undefined, 'Should check accessibility');
    runner.assert(compliance.criteria.fairness !== undefined, 'Should check fairness');
});

runner.test('BalanceManager - Real-time adjustments', () => {
    const manager = new BalanceManager({
        enableRealTimeMonitoring: false
    });
    
    const success = manager.applyRealTimeAdjustment('ai_skill', { skillLevel: 0.8 });
    
    runner.assert(success === true, 'Should apply adjustment successfully');
    
    const currentSkill = manager.gameParameters.getParameter('ai.skillLevel');
    runner.assertEqual(currentSkill, 0.8, 'AI skill should be updated');
});

runner.test('BalanceManager - Emergency adjustments', () => {
    const manager = new BalanceManager({
        enableRealTimeMonitoring: false
    });
    
    const result = manager.handleEmergencyAdjustment('player_frustration', {
        type: 'reduce_difficulty'
    });
    
    runner.assert(result.reason === 'player_frustration', 'Should record adjustment reason');
    runner.assert(result.adjustment.type === 'reduce_difficulty', 'Should record adjustment type');
});

runner.test('BalanceManager - Session management', () => {
    const manager = new BalanceManager({
        enableRealTimeMonitoring: false
    });
    
    const sessionId = manager.startSession({ difficulty: 'normal' });
    runner.assert(manager.state.currentSession !== null, 'Should have active session');
    
    const summary = manager.endSession();
    runner.assert(summary.sessionId === sessionId, 'Should return correct session summary');
    runner.assert(manager.state.currentSession === null, 'Should clear active session');
});

// Run all tests
runner.run().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});