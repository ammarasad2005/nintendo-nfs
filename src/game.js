const ScoreManager = require('./scoring/ScoreManager');
const Achievement = require('./components/Achievement');
const Leaderboard = require('./components/Leaderboard');
const Statistics = require('./components/Statistics');

/**
 * Nintendo-Style Need for Speed Game
 * Main game class that integrates scoring, achievements, leaderboard, and statistics
 */
class NintendoNFS {
    constructor() {
        this.scoreManager = new ScoreManager();
        this.achievementSystem = new Achievement();
        this.leaderboard = new Leaderboard();
        this.statistics = new Statistics();
        
        this.currentPlayer = 'Player1';
        this.isGameRunning = false;
        
        // Setup achievement event listeners
        this.setupAchievementListeners();
        
        console.log('🏎️  Nintendo-Style Need for Speed Initialized! 🏎️');
        console.log('══════════════════════════════════════════════════');
    }

    /**
     * Setup achievement event listeners
     */
    setupAchievementListeners() {
        this.achievementSystem.addEventListener((eventType, data) => {
            switch (eventType) {
                case 'notification':
                    this.displayNotification(data);
                    break;
                case 'reward_points':
                    this.scoreManager.addRealtimeScore('achievement_bonus', data);
                    break;
                case 'reward_multiplier':
                    this.scoreManager.setMultiplier(this.scoreManager.scoreMultiplier * data);
                    break;
                case 'reward_unlock':
                    console.log(`🎁 Unlocked: ${data}`);
                    break;
                case 'reward_title':
                    console.log(`🏆 New Title: ${data}`);
                    break;
            }
        });
    }

    /**
     * Start a race simulation
     */
    async startRace(trackId = 'rainbow_road', gameMode = 'quick_race') {
        console.log(`\n🏁 Starting race on ${trackId} (${gameMode})...`);
        this.isGameRunning = true;
        
        // Reset score manager for new race
        this.scoreManager.resetSession();
        
        // Simulate race data
        const raceData = this.simulateRace(trackId, gameMode);
        
        // Calculate final score
        const scoreResult = this.scoreManager.calculateRaceScore(raceData);
        
        // Record statistics
        const raceStats = this.statistics.recordRaceCompletion({
            ...raceData,
            score: scoreResult.totalScore,
            playerName: this.currentPlayer
        });
        
        // Check achievements
        const newAchievements = this.achievementSystem.updateProgress('race_completed', raceData);
        
        // Update win streak
        this.achievementSystem.updateConsecutiveWins(raceData.position === 1);
        
        // Submit to leaderboard
        const leaderboardResult = this.leaderboard.submitScore({
            playerName: this.currentPlayer,
            trackId,
            gameMode,
            score: scoreResult.totalScore,
            completionTime: raceData.completionTime,
            breakdown: scoreResult.breakdown,
            timestamp: new Date().toISOString(),
            sessionId: this.scoreManager.generateSessionId()
        });
        
        this.isGameRunning = false;
        
        // Display race results
        this.displayRaceResults(raceData, scoreResult, leaderboardResult, newAchievements);
        
        return {
            raceData,
            scoreResult,
            leaderboardResult,
            achievements: newAchievements,
            statistics: raceStats
        };
    }

    /**
     * Simulate race data (Nintendo-style random generation)
     */
    simulateRace(trackId, gameMode) {
        // Base times and speeds based on track difficulty
        const trackDifficulty = {
            'rainbow_road': { baseTime: 120, difficulty: 0.8 },
            'mario_speedway': { baseTime: 90, difficulty: 0.6 },
            'bowser_castle': { baseTime: 150, difficulty: 0.9 },
            'toad_turnpike': { baseTime: 100, difficulty: 0.7 }
        };

        const track = trackDifficulty[trackId] || trackDifficulty['mario_speedway'];
        
        // Simulate realistic race performance
        const completionTime = track.baseTime + (Math.random() - 0.5) * 20;
        const position = Math.floor(Math.random() * 8) + 1; // 1-8 position
        const maxSpeed = 200 + Math.random() * 100; // 200-300 km/h
        const averageSpeed = maxSpeed * 0.7;
        
        // Nintendo-style gameplay elements
        const driftsPerformed = Math.floor(Math.random() * 30) + 5;
        const stuntsCompleted = Math.floor(Math.random() * 8);
        const powerupsUsed = Math.floor(Math.random() * 10) + 2;
        const overtakeCount = Math.floor(Math.random() * 15) + 3;
        const crashes = Math.floor(Math.random() * 3);
        
        // Determine if perfect run (no crashes, good position)
        const isPerfectRun = crashes === 0 && position <= 3 && Math.random() > 0.7;
        
        // Stunt variety
        const stuntTypes = [];
        if (stuntsCompleted > 0) {
            const possibleStunts = ['flip', 'barrel_roll', 'jump', 'grind', 'drift_jump'];
            for (let i = 0; i < Math.min(stuntsCompleted, 3); i++) {
                stuntTypes.push(possibleStunts[Math.floor(Math.random() * possibleStunts.length)]);
            }
        }
        
        return {
            trackId,
            gameMode,
            completionTime: Math.round(completionTime * 100) / 100,
            bestTime: track.baseTime - 10, // Reference best time
            position,
            maxSpeed: Math.round(maxSpeed),
            averageSpeed: Math.round(averageSpeed),
            driftsPerformed,
            stuntsCompleted,
            stuntTypes,
            powerupsUsed,
            overtakeCount,
            crashes,
            isPerfectRun,
            totalAirtime: stuntsCompleted * 0.5 + Math.random() * 2
        };
    }

    /**
     * Display race results with Nintendo-style formatting
     */
    displayRaceResults(raceData, scoreResult, leaderboardResult, achievements) {
        console.log('\n🏆 RACE RESULTS 🏆');
        console.log('═══════════════════════════════════════');
        console.log(`🏁 Position: ${this.getPositionEmoji(raceData.position)} ${raceData.position}${this.getPositionSuffix(raceData.position)}`);
        console.log(`⏱️  Time: ${raceData.completionTime}s`);
        console.log(`🏎️  Max Speed: ${raceData.maxSpeed} km/h`);
        console.log(`💨 Drifts: ${raceData.driftsPerformed}`);
        console.log(`🎭 Stunts: ${raceData.stuntsCompleted}`);
        console.log(`⚡ Powerups: ${raceData.powerupsUsed}`);
        console.log(`🚗 Overtakes: ${raceData.overtakeCount}`);
        if (raceData.isPerfectRun) {
            console.log('⭐ PERFECT RUN! ⭐');
        }
        
        console.log('\n💰 SCORE BREAKDOWN');
        console.log('─────────────────────────────────────');
        Object.entries(scoreResult.breakdown).forEach(([category, points]) => {
            if (points > 0) {
                console.log(`${this.getCategoryEmoji(category)} ${category}: ${points.toLocaleString()}`);
            }
        });
        console.log(`🎯 Multiplier: ${scoreResult.multiplier.toFixed(1)}x`);
        console.log(`🏆 Total Score: ${scoreResult.totalScore.toLocaleString()}`);
        
        if (leaderboardResult.success) {
            console.log('\n📊 LEADERBOARD');
            console.log('─────────────────────────────────────');
            console.log(`🎖️  Global Rank: #${leaderboardResult.rank || 'N/A'}`);
            if (leaderboardResult.personalBest) {
                console.log('🔥 NEW PERSONAL BEST! 🔥');
            }
        }
        
        if (achievements.length > 0) {
            console.log('\n🎉 NEW ACHIEVEMENTS UNLOCKED!');
            console.log('─────────────────────────────────────');
            achievements.forEach(achievement => {
                console.log(`${achievement.name} - ${achievement.points} pts`);
            });
        }
        
        console.log('\n═══════════════════════════════════════\n');
    }

    /**
     * Display Nintendo-style notification
     */
    displayNotification(notification) {
        if (notification.type === 'achievement_unlock') {
            console.log('\n🎮 ' + '═'.repeat(40) + ' 🎮');
            console.log(`    🎉 ACHIEVEMENT UNLOCKED! 🎉`);
            console.log(`    ${notification.achievement.name}`);
            console.log(`    ${notification.achievement.description}`);
            console.log(`    Rarity: ${notification.achievement.rarity.toUpperCase()}`);
            console.log(`    Points: ${notification.achievement.points}`);
            console.log('🎮 ' + '═'.repeat(40) + ' 🎮\n');
        }
    }

    /**
     * Display current statistics
     */
    displayStatistics() {
        const stats = this.statistics.getPlayerStatistics();
        const achievementStats = this.achievementSystem.getAchievementStats();
        const leaderboardStats = this.leaderboard.getLeaderboardStats();
        
        console.log('\n📊 PLAYER STATISTICS 📊');
        console.log('═══════════════════════════════════════');
        
        // Lifetime stats
        console.log('\n🏆 Lifetime Statistics:');
        console.log(`📈 Total Races: ${stats.lifetime.totalRaces}`);
        console.log(`🏁 Wins: ${stats.lifetime.wins} (${stats.lifetime.winRate.toFixed(1)}%)`);
        console.log(`💰 Total Score: ${stats.lifetime.totalScore.toLocaleString()}`);
        console.log(`⭐ Perfect Runs: ${stats.lifetime.perfectRuns}`);
        console.log(`🏎️  Top Speed: ${stats.lifetime.topSpeed} km/h`);
        if (stats.lifetime.bestLapTime) {
            console.log(`⏱️  Best Lap: ${stats.lifetime.bestLapTime}s`);
        }
        
        // Achievement progress
        console.log('\n🎖️  Achievement Progress:');
        console.log(`🏆 Unlocked: ${achievementStats.unlocked}/${achievementStats.total} (${achievementStats.percentage}%)`);
        console.log(`💎 Total Points: ${achievementStats.totalPoints}`);
        
        // Player level and rank
        const level = stats.summary.level;
        console.log('\n🌟 Player Level:');
        console.log(`📊 Level ${level.level} (${level.progress.toFixed(1)}% to next)`);
        console.log(`🎯 Rank: ${stats.summary.rank}`);
        
        // Recent performance
        console.log('\n📈 Recent Performance:');
        console.log(`🔥 Rating: ${stats.summary.recentPerformance}`);
        console.log(`🎯 Strongest Skill: ${stats.summary.strongestSkill}`);
        
        console.log('\n═══════════════════════════════════════\n');
    }

    /**
     * Display top leaderboard
     */
    displayLeaderboard(trackId = null, gameMode = null, limit = 10) {
        console.log('\n🏆 LEADERBOARD 🏆');
        console.log('═══════════════════════════════════════');
        
        let leaderboard;
        let title;
        
        if (trackId) {
            leaderboard = this.leaderboard.getTrackLeaderboard(trackId, limit);
            title = `🏁 ${trackId} Leaderboard`;
        } else if (gameMode) {
            leaderboard = this.leaderboard.getModeLeaderboard(gameMode, limit);
            title = `🎮 ${gameMode} Leaderboard`;
        } else {
            leaderboard = this.leaderboard.getGlobalLeaderboard(limit);
            title = '🌟 Global Leaderboard';
        }
        
        console.log(`\n${title}:`);
        console.log('─────────────────────────────────────');
        
        if (leaderboard.length === 0) {
            console.log('📝 No scores recorded yet!');
        } else {
            leaderboard.forEach((entry, index) => {
                const medal = this.getRankMedal(index + 1);
                console.log(`${medal} ${entry.playerName}: ${entry.score.toLocaleString()} pts`);
            });
        }
        
        console.log('\n═══════════════════════════════════════\n');
    }

    /**
     * Display recent achievements
     */
    displayRecentAchievements() {
        const recentAchievements = this.achievementSystem.getAchievementStats().recentUnlocks;
        
        console.log('\n🎖️  RECENT ACHIEVEMENTS 🎖️');
        console.log('═══════════════════════════════════════');
        
        if (recentAchievements.length === 0) {
            console.log('📝 No recent achievements unlocked.');
        } else {
            recentAchievements.forEach(({ achievement, timestamp }) => {
                const date = new Date(timestamp).toLocaleDateString();
                console.log(`${achievement.name} - ${date}`);
                console.log(`   ${achievement.description}`);
            });
        }
        
        console.log('\n═══════════════════════════════════════\n');
    }

    /**
     * Utility methods for display formatting
     */
    getPositionEmoji(position) {
        switch (position) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return '🏁';
        }
    }

    getPositionSuffix(position) {
        const suffixes = ['st', 'nd', 'rd'];
        const suffix = suffixes[position - 1] || 'th';
        return suffix;
    }

    getCategoryEmoji(category) {
        const emojis = {
            timeBonus: '⏱️',
            driftPoints: '💨',
            stuntPoints: '🎭',
            perfectRuns: '⭐',
            overtakes: '🚗',
            powerupBonus: '⚡'
        };
        return emojis[category] || '💰';
    }

    getRankMedal(rank) {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `${rank}.`;
        }
    }

    /**
     * Demo mode - run multiple races to showcase the system
     */
    async runDemo() {
        console.log('\n🎮 NINTENDO NFS DEMO MODE 🎮');
        console.log('Running automated demo to showcase scoring and achievement system...\n');
        
        const tracks = ['rainbow_road', 'mario_speedway', 'bowser_castle', 'toad_turnpike'];
        const modes = ['quick_race', 'time_trial', 'championship'];
        
        // Run 5 demo races
        for (let i = 0; i < 5; i++) {
            const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
            const randomMode = modes[Math.floor(Math.random() * modes.length)];
            
            await this.startRace(randomTrack, randomMode);
            
            // Short pause between races for readability
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Display final statistics
        this.displayStatistics();
        this.displayLeaderboard();
        this.displayRecentAchievements();
        
        console.log('🎮 Demo completed! The scoring and achievement system is ready! 🎮');
    }
}

// Main execution
if (require.main === module) {
    const game = new NintendoNFS();
    
    // Check for command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--demo') || process.argv.includes('--demo')) {
        game.runDemo();
    } else if (args.includes('--stats') || process.argv.includes('--stats')) {
        game.displayStatistics();
    } else if (args.includes('--leaderboard') || process.argv.includes('--leaderboard')) {
        game.displayLeaderboard();
    } else {
        // Run a single race
        game.startRace('rainbow_road', 'quick_race').then(() => {
            console.log('\n🎯 Try these commands:');
            console.log('npm start --demo     - Run demo mode');
            console.log('npm start --stats    - View statistics');
            console.log('npm start --leaderboard - View leaderboard');
        });
    }
}

module.exports = NintendoNFS;