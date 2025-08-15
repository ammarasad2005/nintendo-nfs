const ScoreManager = require('../src/scoring/ScoreManager');
const Achievement = require('../src/components/Achievement');
const Leaderboard = require('../src/components/Leaderboard');
const Statistics = require('../src/components/Statistics');

/**
 * Simple test suite for the Nintendo NFS scoring system
 */
class TestSuite {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    /**
     * Add a test
     */
    test(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    /**
     * Assert equality
     */
    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message} - Expected: ${expected}, Actual: ${actual}`);
        }
    }

    /**
     * Assert truthy
     */
    assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(`${message} - Expected truthy value`);
        }
    }

    /**
     * Run all tests
     */
    async runTests() {
        console.log('🧪 Running Nintendo NFS Test Suite...\n');
        
        for (const { name, testFunction } of this.tests) {
            try {
                await testFunction();
                console.log(`✅ ${name}`);
                this.passed++;
            } catch (error) {
                console.log(`❌ ${name}: ${error.message}`);
                this.failed++;
            }
        }
        
        console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
        
        if (this.failed === 0) {
            console.log('🎉 All tests passed! The scoring system is working correctly! 🎉');
        } else {
            console.log('⚠️  Some tests failed. Please review the implementation.');
        }
    }
}

// Initialize test suite
const testSuite = new TestSuite();

// Score Manager Tests
testSuite.test('ScoreManager - Calculate basic race score', () => {
    const scoreManager = new ScoreManager();
    const raceData = {
        completionTime: 120,
        bestTime: 130,
        driftsPerformed: 10,
        stuntsCompleted: 3,
        overtakeCount: 5,
        powerupsUsed: 2,
        isPerfectRun: false,
        averageSpeed: 180,
        position: 2
    };
    
    const result = scoreManager.calculateRaceScore(raceData);
    testSuite.assertTrue(result.totalScore > 0, 'Should calculate positive score');
    testSuite.assertTrue(result.breakdown.driftPoints > 0, 'Should have drift points');
    testSuite.assertTrue(result.breakdown.overtakes > 0, 'Should have overtake points');
});

testSuite.test('ScoreManager - Perfect run bonus', () => {
    const scoreManager = new ScoreManager();
    const raceData = {
        completionTime: 110,
        bestTime: 130,
        driftsPerformed: 5,
        stuntsCompleted: 1,
        overtakeCount: 3,
        powerupsUsed: 1,
        isPerfectRun: true,
        averageSpeed: 200,
        position: 1
    };
    
    const result = scoreManager.calculateRaceScore(raceData);
    testSuite.assertTrue(result.breakdown.perfectRuns > 0, 'Should have perfect run bonus');
    testSuite.assertTrue(result.multiplier >= 2.0, 'Should have high multiplier for 1st place');
});

testSuite.test('ScoreManager - Real-time scoring', () => {
    const scoreManager = new ScoreManager();
    const initialScore = scoreManager.getCurrentScore();
    
    scoreManager.addRealtimeScore('drift_start');
    testSuite.assertTrue(scoreManager.getCurrentScore() > initialScore, 'Should add real-time points');
    
    scoreManager.addRealtimeScore('drift_combo', 3);
    testSuite.assertTrue(scoreManager.getCurrentScore() > initialScore + 10, 'Should add combo points');
});

// Achievement Tests
testSuite.test('Achievement - Speed achievement unlock', () => {
    const achievementSystem = new Achievement();
    achievementSystem.resetAchievements(); // Start fresh
    
    const raceData = { maxSpeed: 260 };
    const unlocked = achievementSystem.updateProgress('race_completed', raceData);
    
    testSuite.assertTrue(unlocked.length > 0, 'Should unlock speed demon achievement');
    testSuite.assertEqual(unlocked[0].id, 'speed_demon', 'Should unlock speed_demon');
});

testSuite.test('Achievement - Drift achievement unlock', () => {
    const achievementSystem = new Achievement();
    achievementSystem.resetAchievements();
    
    const raceData = { driftsPerformed: 55 };
    const unlocked = achievementSystem.updateProgress('race_completed', raceData);
    
    testSuite.assertTrue(unlocked.some(a => a.id === 'drift_king'), 'Should unlock drift king achievement');
});

testSuite.test('Achievement - Perfect run achievement', () => {
    const achievementSystem = new Achievement();
    achievementSystem.resetAchievements();
    
    const raceData = { isPerfectRun: true };
    const unlocked = achievementSystem.updateProgress('race_completed', raceData);
    
    testSuite.assertTrue(unlocked.some(a => a.id === 'perfect_victory'), 'Should unlock perfect victory achievement');
});

// Leaderboard Tests
testSuite.test('Leaderboard - Submit and retrieve scores', () => {
    const leaderboard = new Leaderboard();
    leaderboard.clearLeaderboards(); // Start fresh
    
    const scoreData = {
        playerName: 'TestPlayer',
        trackId: 'test_track',
        gameMode: 'test_mode',
        score: 5000,
        completionTime: 120,
        breakdown: { timeBonus: 1000, driftPoints: 4000 },
        sessionId: 'test_session'
    };
    
    const result = leaderboard.submitScore(scoreData);
    testSuite.assertTrue(result.success, 'Should successfully submit score');
    testSuite.assertEqual(result.rank, 1, 'Should be rank 1 for first score');
    
    const globalBoard = leaderboard.getGlobalLeaderboard();
    testSuite.assertEqual(globalBoard.length, 1, 'Should have 1 score in global leaderboard');
    testSuite.assertEqual(globalBoard[0].score, 5000, 'Should store correct score');
});

testSuite.test('Leaderboard - Score ranking', () => {
    const leaderboard = new Leaderboard();
    leaderboard.clearLeaderboards();
    
    // Submit multiple scores
    const scores = [
        { playerName: 'Player1', score: 3000 },
        { playerName: 'Player2', score: 5000 },
        { playerName: 'Player3', score: 4000 }
    ];
    
    scores.forEach(scoreData => {
        leaderboard.submitScore({
            ...scoreData,
            trackId: 'test_track',
            gameMode: 'test_mode',
            completionTime: 120,
            sessionId: `session_${scoreData.playerName}`
        });
    });
    
    const globalBoard = leaderboard.getGlobalLeaderboard();
    testSuite.assertEqual(globalBoard[0].score, 5000, 'Highest score should be first');
    testSuite.assertEqual(globalBoard[1].score, 4000, 'Second highest should be second');
    testSuite.assertEqual(globalBoard[2].score, 3000, 'Lowest score should be last');
});

// Statistics Tests
testSuite.test('Statistics - Record race completion', () => {
    const statistics = new Statistics();
    statistics.resetStatistics(); // Start fresh
    
    const raceData = {
        trackId: 'test_track',
        gameMode: 'test_mode',
        completionTime: 120,
        position: 1,
        maxSpeed: 250,
        averageSpeed: 200,
        driftsPerformed: 10,
        stuntsCompleted: 3,
        powerupsUsed: 5,
        overtakeCount: 7,
        crashes: 0,
        isPerfectRun: true,
        score: 5000,
        playerName: 'TestPlayer'
    };
    
    const result = statistics.recordRaceCompletion(raceData);
    const stats = statistics.getPlayerStatistics();
    
    testSuite.assertEqual(stats.lifetime.totalRaces, 1, 'Should record 1 race');
    testSuite.assertEqual(stats.lifetime.wins, 1, 'Should record 1 win');
    testSuite.assertEqual(stats.lifetime.perfectRuns, 1, 'Should record 1 perfect run');
    testSuite.assertEqual(stats.lifetime.topSpeed, 250, 'Should record top speed');
});

testSuite.test('Statistics - Performance calculations', () => {
    const statistics = new Statistics();
    statistics.resetStatistics();
    
    // Record multiple races
    for (let i = 0; i < 5; i++) {
        statistics.recordRaceCompletion({
            trackId: 'test_track',
            gameMode: 'test_mode',
            completionTime: 120 + i,
            position: i < 3 ? 1 : 2, // Win first 3 races
            maxSpeed: 200 + i * 10,
            averageSpeed: 180 + i * 5,
            driftsPerformed: 10,
            stuntsCompleted: 2,
            powerupsUsed: 3,
            overtakeCount: 5,
            crashes: 0,
            isPerfectRun: i < 2, // First 2 are perfect
            score: 4000 + i * 500,
            playerName: 'TestPlayer'
        });
    }
    
    const stats = statistics.getPlayerStatistics();
    testSuite.assertEqual(stats.lifetime.totalRaces, 5, 'Should record 5 races');
    testSuite.assertEqual(stats.lifetime.wins, 3, 'Should record 3 wins');
    testSuite.assertEqual(stats.lifetime.winRate, 60, 'Should calculate 60% win rate');
    testSuite.assertEqual(stats.lifetime.perfectRuns, 2, 'Should record 2 perfect runs');
});

testSuite.test('Statistics - Level calculation', () => {
    const statistics = new Statistics();
    const summary = statistics.generateStatsSummary();
    const level = summary.level;
    
    testSuite.assertTrue(level.level >= 1, 'Should have at least level 1');
    testSuite.assertTrue(level.progress >= 0 && level.progress <= 100, 'Progress should be 0-100%');
});

// Integration Tests
testSuite.test('Integration - Complete game flow', () => {
    const scoreManager = new ScoreManager();
    const achievementSystem = new Achievement();
    const leaderboard = new Leaderboard();
    const statistics = new Statistics();
    
    // Reset all systems
    achievementSystem.resetAchievements();
    leaderboard.clearLeaderboards();
    statistics.resetStatistics();
    
    // Simulate a complete race
    const raceData = {
        trackId: 'integration_track',
        gameMode: 'integration_mode',
        completionTime: 115,
        bestTime: 120,
        position: 1,
        maxSpeed: 280,
        averageSpeed: 220,
        driftsPerformed: 25,
        stuntsCompleted: 5,
        powerupsUsed: 8,
        overtakeCount: 10,
        crashes: 0,
        isPerfectRun: true
    };
    
    // Calculate score
    const scoreResult = scoreManager.calculateRaceScore(raceData);
    testSuite.assertTrue(scoreResult.totalScore > 0, 'Should calculate score');
    
    // Check achievements
    const achievements = achievementSystem.updateProgress('race_completed', raceData);
    testSuite.assertTrue(achievements.length > 0, 'Should unlock achievements');
    
    // Submit to leaderboard
    const leaderboardResult = leaderboard.submitScore({
        playerName: 'IntegrationTest',
        trackId: raceData.trackId,
        gameMode: raceData.gameMode,
        score: scoreResult.totalScore,
        completionTime: raceData.completionTime,
        breakdown: scoreResult.breakdown,
        sessionId: 'integration_session'
    });
    
    // Debug the leaderboard result
    if (!leaderboardResult.success) {
        console.log('Leaderboard submission failed:', leaderboardResult.reason);
        console.log('Score data:', {
            score: scoreResult.totalScore,
            completionTime: raceData.completionTime,
            breakdown: scoreResult.breakdown
        });
    }
    
    testSuite.assertTrue(leaderboardResult.success, 'Should submit to leaderboard');
    
    // Record statistics
    const statsResult = statistics.recordRaceCompletion({
        ...raceData,
        score: scoreResult.totalScore,
        playerName: 'IntegrationTest'
    });
    testSuite.assertTrue(statsResult !== null, 'Should record statistics');
    
    console.log('🎮 Integration test completed successfully!');
});

// Run tests
testSuite.runTests().catch(console.error);