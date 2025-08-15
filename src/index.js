/**
 * Nintendo NFS Game Balance System
 * 
 * A comprehensive game balancing and difficulty tuning system for the Nintendo-styled Need for Speed game.
 * 
 * @author ammarasad2005
 * @version 1.0.0
 */

import { BalanceManager } from './game/balance/BalanceManager.js';
import { GameParameters } from './game/balance/GameParameters.js';
import { DifficultyTuner } from './game/balance/DifficultyTuner.js';
import { BalanceAnalytics } from './game/balance/BalanceAnalytics.js';

// Export all balance system components
export {
    BalanceManager,
    GameParameters,
    DifficultyTuner,
    BalanceAnalytics
};

// Create and export a default configured balance manager instance
export function createBalanceManager(config = {}) {
    return new BalanceManager({
        enableDynamicAdjustment: true,
        enableRealTimeMonitoring: true,
        enableAnalytics: true,
        autoOptimization: false,
        monitoringInterval: 30000,
        ...config
    });
}

// Utility function to create a quick demo setup
export function createDemoBalance() {
    const balanceManager = createBalanceManager({
        enableDynamicAdjustment: true,
        autoOptimization: true
    });

    console.log('🎮 Nintendo NFS Balance System Demo Mode');
    console.log('Features: Dynamic difficulty, real-time monitoring, auto-optimization');
    
    return balanceManager;
}

// Version and system info
export const VERSION = '1.0.0';
export const SYSTEM_INFO = {
    name: 'Nintendo NFS Balance System',
    version: VERSION,
    description: 'Comprehensive game balancing and difficulty tuning system',
    features: [
        'Dynamic difficulty adjustment',
        'Real-time performance monitoring',
        'Nintendo-style balance philosophy',
        'Player analytics and feedback',
        'Auto-optimization capabilities',
        'Fair catch-up mechanics',
        'Accessibility-focused design'
    ],
    compatibility: 'Node.js 14+, ES6 Modules'
};

// Main entry point when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🏎️ Nintendo-Style Need for Speed - Balance System');
    console.log('='.repeat(50));
    console.log(`Version: ${VERSION}`);
    console.log('Starting demo...\n');

    const demo = createDemoBalance();
    
    // Start a demo session
    demo.startSession({
        difficulty: 'normal',
        gameMode: 'championship',
        playerProfile: {
            skillLevel: 'intermediate',
            playtime: 3600000 // 1 hour
        }
    });

    // Simulate some demo races
    simulateDemo(demo);
}

async function simulateDemo(balanceManager) {
    console.log('🏁 Simulating races...\n');

    // Simulate a few races with different outcomes
    const demoRaces = [
        {
            participants: [
                { id: 'player1', isPlayer: true, finalPosition: 3, finalTime: 125000, powerupsUsed: 2, driftsCompleted: 8, mistakesMade: 1, averageSpeed: 95 },
                { id: 'ai1', isPlayer: false, finalPosition: 1, finalTime: 120000, powerupsUsed: 1, driftsCompleted: 12, mistakesMade: 0, averageSpeed: 100 },
                { id: 'ai2', isPlayer: false, finalPosition: 2, finalTime: 123000, powerupsUsed: 2, driftsCompleted: 10, mistakesMade: 1, averageSpeed: 98 },
                { id: 'ai3', isPlayer: false, finalPosition: 4, finalTime: 128000, powerupsUsed: 1, driftsCompleted: 6, mistakesMade: 2, averageSpeed: 92 }
            ],
            duration: 125000,
            track: 'demo_track_1',
            difficulty: 'normal',
            events: ['race_start', 'powerup_collected', 'drift_completed', 'race_finish']
        },
        {
            participants: [
                { id: 'player1', isPlayer: true, finalPosition: 1, finalTime: 118000, powerupsUsed: 3, driftsCompleted: 15, mistakesMade: 0, averageSpeed: 102 },
                { id: 'ai1', isPlayer: false, finalPosition: 2, finalTime: 120000, powerupsUsed: 2, driftsCompleted: 12, mistakesMade: 1, averageSpeed: 100 },
                { id: 'ai2', isPlayer: false, finalPosition: 3, finalTime: 122000, powerupsUsed: 1, driftsCompleted: 8, mistakesMade: 2, averageSpeed: 96 },
                { id: 'ai3', isPlayer: false, finalPosition: 4, finalTime: 125000, powerupsUsed: 1, driftsCompleted: 6, mistakesMade: 3, averageSpeed: 94 }
            ],
            duration: 118000,
            track: 'demo_track_2',
            difficulty: 'normal',
            events: ['race_start', 'powerup_collected', 'drift_completed', 'overtake', 'race_finish']
        }
    ];

    for (let i = 0; i < demoRaces.length; i++) {
        console.log(`Race ${i + 1}:`);
        const result = balanceManager.processRaceCompletion(demoRaces[i]);
        console.log(`  Player finished in position ${result.playerPerformance.position}`);
        console.log(`  Difficulty adjustment: ${result.difficultyAdjustment?.effective || 'no change'}`);
        console.log(`  Recommendations: ${result.recommendations.join(', ') || 'none'}\n`);
        
        // Wait a bit between races
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Collect some feedback
    console.log('📝 Collecting player feedback...');
    balanceManager.collectPlayerFeedback({
        type: 'balance',
        rating: 4,
        comments: 'Good balance, races feel competitive!'
    });

    // Generate and display balance report
    console.log('\n📊 Generating balance report...');
    const report = balanceManager.generateBalanceReport(true);
    console.log(`Total races analyzed: ${report.summary.totalRaces}`);
    
    if (report.playerAnalysis.error) {
        console.log(`Analysis: ${report.playerAnalysis.error}`);
    } else {
        console.log(`Player success rate: ${(report.playerAnalysis.winRate * 100).toFixed(1)}%`);
        console.log(`Average position: ${report.playerAnalysis.averagePosition.toFixed(1)}`);
        console.log(`Balance assessment: ${report.playerAnalysis.balanceAssessment}`);
    }

    // Show current balance configuration
    console.log('\n⚙️ Current balance configuration:');
    const config = balanceManager.getCurrentBalanceConfig();
    console.log(`Difficulty level: ${config.level.level} (${config.level.effective})`);
    console.log(`AI skill level: ${config.parameters.ai.skillLevel}`);
    console.log(`Catch-up assistance: ${config.parameters.catchup.maxAssistance}`);
    console.log(`Power-up spawn rate: ${config.parameters.powerups.spawnRate}`);

    // End the demo session
    console.log('\n🏁 Ending demo session...');
    const sessionSummary = balanceManager.endSession();
    console.log(`Session duration: ${Math.round(sessionSummary.duration / 1000)} seconds`);
    console.log(`Final difficulty: ${sessionSummary.finalDifficulty.level}`);
    console.log(`Player progress trend: ${sessionSummary.playerProgress?.trend || 'stable'}`);

    console.log('\n✅ Demo completed! The balance system is ready for integration.');
}