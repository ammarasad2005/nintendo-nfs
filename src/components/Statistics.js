const fs = require('fs');
const path = require('path');

/**
 * Nintendo-Style Statistics Manager
 * Handles player statistics, performance metrics, and historical data
 */
class Statistics {
    constructor() {
        this.playerStats = this.loadPlayerStats();
        this.sessionStats = this.initializeSessionStats();
        this.performanceMetrics = this.loadPerformanceMetrics();
        this.trackingEnabled = true;
    }

    /**
     * Initialize session statistics
     */
    initializeSessionStats() {
        return {
            sessionStart: Date.now(),
            racesCompleted: 0,
            totalPlayTime: 0,
            totalScore: 0,
            bestLapTime: null,
            topSpeed: 0,
            driftCount: 0,
            stuntCount: 0,
            powerupsUsed: 0,
            wins: 0,
            losses: 0,
            perfectRuns: 0,
            crashes: 0,
            overtakes: 0,
            averagePosition: 0
        };
    }

    /**
     * Record race completion statistics
     */
    recordRaceCompletion(raceData) {
        if (!this.trackingEnabled) return;

        const {
            trackId,
            gameMode,
            completionTime,
            position,
            maxSpeed,
            averageSpeed,
            driftsPerformed,
            stuntsCompleted,
            powerupsUsed,
            overtakeCount,
            crashes,
            isPerfectRun,
            score,
            playerName
        } = raceData;

        // Update session stats
        this.updateSessionStats(raceData);

        // Update persistent player stats
        this.updatePlayerStats(raceData);

        // Update track-specific stats
        this.updateTrackStats(trackId, raceData);

        // Update mode-specific stats
        this.updateModeStats(gameMode, raceData);

        // Update performance metrics
        this.updatePerformanceMetrics(raceData);

        // Save data
        this.savePlayerStats();
        this.savePerformanceMetrics();

        return this.getLatestRaceStats(raceData);
    }

    /**
     * Update session statistics
     */
    updateSessionStats(raceData) {
        this.sessionStats.racesCompleted++;
        this.sessionStats.totalScore += raceData.score || 0;
        this.sessionStats.topSpeed = Math.max(this.sessionStats.topSpeed, raceData.maxSpeed || 0);
        this.sessionStats.driftCount += raceData.driftsPerformed || 0;
        this.sessionStats.stuntCount += raceData.stuntsCompleted || 0;
        this.sessionStats.powerupsUsed += raceData.powerupsUsed || 0;
        this.sessionStats.crashes += raceData.crashes || 0;
        this.sessionStats.overtakes += raceData.overtakeCount || 0;

        // Update best lap time
        if (raceData.completionTime && (!this.sessionStats.bestLapTime || raceData.completionTime < this.sessionStats.bestLapTime)) {
            this.sessionStats.bestLapTime = raceData.completionTime;
        }

        // Update win/loss record
        if (raceData.position === 1) {
            this.sessionStats.wins++;
        } else {
            this.sessionStats.losses++;
        }

        // Update perfect runs
        if (raceData.isPerfectRun) {
            this.sessionStats.perfectRuns++;
        }

        // Calculate average position
        const totalRaces = this.sessionStats.wins + this.sessionStats.losses;
        if (totalRaces > 0) {
            this.sessionStats.averagePosition = ((this.sessionStats.averagePosition * (totalRaces - 1)) + raceData.position) / totalRaces;
        }
    }

    /**
     * Update persistent player statistics
     */
    updatePlayerStats(raceData) {
        if (!this.playerStats.lifetime) {
            this.playerStats.lifetime = this.initializeLifetimeStats();
        }

        const stats = this.playerStats.lifetime;
        
        stats.totalRaces++;
        stats.totalScore += raceData.score || 0;
        stats.totalPlayTime += raceData.completionTime || 0;
        stats.topSpeed = Math.max(stats.topSpeed, raceData.maxSpeed || 0);
        stats.totalDrifts += raceData.driftsPerformed || 0;
        stats.totalStunts += raceData.stuntsCompleted || 0;
        stats.totalPowerups += raceData.powerupsUsed || 0;
        stats.totalCrashes += raceData.crashes || 0;
        stats.totalOvertakes += raceData.overtakeCount || 0;

        // Update best times
        if (raceData.completionTime && (!stats.bestLapTime || raceData.completionTime < stats.bestLapTime)) {
            stats.bestLapTime = raceData.completionTime;
            stats.bestLapTrack = raceData.trackId;
        }

        // Update win/loss record
        if (raceData.position === 1) {
            stats.wins++;
        } else {
            stats.losses++;
        }

        // Update perfect runs
        if (raceData.isPerfectRun) {
            stats.perfectRuns++;
        }

        // Update records
        if (raceData.score > stats.highestScore) {
            stats.highestScore = raceData.score;
            stats.highestScoreTrack = raceData.trackId;
        }

        // Calculate derived stats
        stats.winRate = stats.totalRaces > 0 ? (stats.wins / stats.totalRaces) * 100 : 0;
        stats.averageScore = stats.totalRaces > 0 ? stats.totalScore / stats.totalRaces : 0;
        stats.perfectRunRate = stats.totalRaces > 0 ? (stats.perfectRuns / stats.totalRaces) * 100 : 0;
    }

    /**
     * Update track-specific statistics
     */
    updateTrackStats(trackId, raceData) {
        if (!this.playerStats.tracks) {
            this.playerStats.tracks = {};
        }

        if (!this.playerStats.tracks[trackId]) {
            this.playerStats.tracks[trackId] = this.initializeTrackStats();
        }

        const trackStats = this.playerStats.tracks[trackId];
        
        trackStats.attempts++;
        trackStats.totalScore += raceData.score || 0;
        trackStats.totalTime += raceData.completionTime || 0;

        // Update best time
        if (raceData.completionTime && (!trackStats.bestTime || raceData.completionTime < trackStats.bestTime)) {
            trackStats.bestTime = raceData.completionTime;
        }

        // Update best score
        if (raceData.score > trackStats.bestScore) {
            trackStats.bestScore = raceData.score;
        }

        // Update completion record
        if (raceData.position === 1) {
            trackStats.wins++;
        }

        // Calculate averages
        trackStats.averageTime = trackStats.totalTime / trackStats.attempts;
        trackStats.averageScore = trackStats.totalScore / trackStats.attempts;
        trackStats.winRate = (trackStats.wins / trackStats.attempts) * 100;
    }

    /**
     * Update game mode statistics
     */
    updateModeStats(gameMode, raceData) {
        if (!this.playerStats.modes) {
            this.playerStats.modes = {};
        }

        if (!this.playerStats.modes[gameMode]) {
            this.playerStats.modes[gameMode] = this.initializeModeStats();
        }

        const modeStats = this.playerStats.modes[gameMode];
        
        modeStats.races++;
        modeStats.totalScore += raceData.score || 0;
        modeStats.totalTime += raceData.completionTime || 0;

        if (raceData.position === 1) {
            modeStats.wins++;
        }

        if (raceData.isPerfectRun) {
            modeStats.perfectRuns++;
        }

        // Calculate derived stats
        modeStats.winRate = (modeStats.wins / modeStats.races) * 100;
        modeStats.averageScore = modeStats.totalScore / modeStats.races;
        modeStats.perfectRunRate = (modeStats.perfectRuns / modeStats.races) * 100;
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(raceData) {
        const timestamp = Date.now();
        
        // Add to performance history
        if (!this.performanceMetrics.history) {
            this.performanceMetrics.history = [];
        }

        this.performanceMetrics.history.push({
            timestamp,
            score: raceData.score,
            completionTime: raceData.completionTime,
            position: raceData.position,
            trackId: raceData.trackId,
            gameMode: raceData.gameMode
        });

        // Keep only last 100 races
        if (this.performanceMetrics.history.length > 100) {
            this.performanceMetrics.history = this.performanceMetrics.history.slice(-100);
        }

        // Update trends
        this.calculatePerformanceTrends();
    }

    /**
     * Calculate performance trends
     */
    calculatePerformanceTrends() {
        const history = this.performanceMetrics.history;
        if (history.length < 10) return;

        const recent = history.slice(-10);
        const previous = history.slice(-20, -10);

        if (previous.length === 0) return;

        // Calculate score trend
        const recentAvgScore = recent.reduce((sum, entry) => sum + entry.score, 0) / recent.length;
        const previousAvgScore = previous.reduce((sum, entry) => sum + entry.score, 0) / previous.length;
        
        this.performanceMetrics.trends = {
            scoreImprovement: ((recentAvgScore - previousAvgScore) / previousAvgScore) * 100,
            recentAverageScore: recentAvgScore,
            previousAverageScore: previousAvgScore,
            lastUpdated: Date.now()
        };
    }

    /**
     * Get comprehensive player statistics
     */
    getPlayerStatistics(playerName = null) {
        const stats = {
            session: { ...this.sessionStats },
            lifetime: this.playerStats.lifetime || this.initializeLifetimeStats(),
            tracks: this.playerStats.tracks || {},
            modes: this.playerStats.modes || {},
            performance: this.performanceMetrics,
            summary: this.generateStatsSummary()
        };

        return stats;
    }

    /**
     * Get statistics for specific track
     */
    getTrackStatistics(trackId) {
        return this.playerStats.tracks?.[trackId] || this.initializeTrackStats();
    }

    /**
     * Get statistics for specific game mode
     */
    getModeStatistics(gameMode) {
        return this.playerStats.modes?.[gameMode] || this.initializeModeStats();
    }

    /**
     * Get performance trends
     */
    getPerformanceTrends(days = 7) {
        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
        
        if (!this.performanceMetrics.history) {
            return { scores: [], times: [], positions: [] };
        }

        const recentHistory = this.performanceMetrics.history.filter(
            entry => entry.timestamp >= cutoffTime
        );

        return {
            scores: recentHistory.map(entry => ({
                timestamp: entry.timestamp,
                value: entry.score
            })),
            times: recentHistory.map(entry => ({
                timestamp: entry.timestamp,
                value: entry.completionTime
            })),
            positions: recentHistory.map(entry => ({
                timestamp: entry.timestamp,
                value: entry.position
            })),
            summary: this.performanceMetrics.trends || {}
        };
    }

    /**
     * Generate statistics summary
     */
    generateStatsSummary() {
        const lifetime = this.playerStats.lifetime || this.initializeLifetimeStats();
        
        return {
            level: this.calculatePlayerLevel(lifetime.totalScore),
            rank: this.calculatePlayerRank(lifetime),
            favoriteTrack: this.getFavoriteTrack(),
            favoriteMode: this.getFavoriteMode(),
            strongestSkill: this.getStrongestSkill(lifetime),
            recentPerformance: this.getRecentPerformanceRating(),
            milestones: this.getRecentMilestones(),
            nextGoal: this.getNextGoal(lifetime)
        };
    }

    /**
     * Calculate player level based on total score
     */
    calculatePlayerLevel(totalScore) {
        // Nintendo-style level progression
        const baseXP = 1000;
        const level = Math.floor(Math.sqrt(totalScore / baseXP)) + 1;
        const currentLevelXP = Math.pow(level - 1, 2) * baseXP;
        const nextLevelXP = Math.pow(level, 2) * baseXP;
        const progress = ((totalScore - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

        return {
            level,
            progress: Math.min(progress, 100),
            currentXP: totalScore,
            nextLevelXP
        };
    }

    /**
     * Calculate player rank
     */
    calculatePlayerRank(lifetime) {
        const { winRate, averageScore, perfectRunRate } = lifetime;
        
        // Calculate overall rating
        const rating = (winRate * 0.4) + (Math.min(averageScore / 1000, 100) * 0.4) + (perfectRunRate * 0.2);
        
        if (rating >= 90) return 'S';
        if (rating >= 80) return 'A';
        if (rating >= 70) return 'B';
        if (rating >= 60) return 'C';
        if (rating >= 50) return 'D';
        return 'E';
    }

    /**
     * Get favorite track
     */
    getFavoriteTrack() {
        if (!this.playerStats.tracks) return null;
        
        let maxAttempts = 0;
        let favoriteTrack = null;
        
        Object.entries(this.playerStats.tracks).forEach(([trackId, stats]) => {
            if (stats.attempts > maxAttempts) {
                maxAttempts = stats.attempts;
                favoriteTrack = trackId;
            }
        });
        
        return favoriteTrack;
    }

    /**
     * Get favorite game mode
     */
    getFavoriteMode() {
        if (!this.playerStats.modes) return null;
        
        let maxRaces = 0;
        let favoriteMode = null;
        
        Object.entries(this.playerStats.modes).forEach(([mode, stats]) => {
            if (stats.races > maxRaces) {
                maxRaces = stats.races;
                favoriteMode = mode;
            }
        });
        
        return favoriteMode;
    }

    /**
     * Get strongest skill
     */
    getStrongestSkill(lifetime) {
        const skills = {
            'Racing': lifetime.winRate,
            'Precision': lifetime.perfectRunRate,
            'Drifting': lifetime.totalDrifts / Math.max(lifetime.totalRaces, 1),
            'Stunts': lifetime.totalStunts / Math.max(lifetime.totalRaces, 1)
        };
        
        return Object.entries(skills).reduce((best, [skill, value]) => 
            value > best.value ? { skill, value } : best, 
            { skill: 'Racing', value: 0 }
        ).skill;
    }

    /**
     * Get recent performance rating
     */
    getRecentPerformanceRating() {
        const recentRaces = Math.min(this.sessionStats.racesCompleted, 10);
        if (recentRaces === 0) return 'No recent data';
        
        const winRate = (this.sessionStats.wins / recentRaces) * 100;
        
        if (winRate >= 80) return 'Excellent';
        if (winRate >= 60) return 'Good';
        if (winRate >= 40) return 'Average';
        if (winRate >= 20) return 'Below Average';
        return 'Needs Improvement';
    }

    /**
     * Get recent milestones
     */
    getRecentMilestones() {
        const milestones = [];
        const lifetime = this.playerStats.lifetime || this.initializeLifetimeStats();
        
        // Check for milestone achievements
        if (lifetime.totalRaces === 10) milestones.push('Completed 10 races');
        if (lifetime.totalRaces === 50) milestones.push('Completed 50 races');
        if (lifetime.totalRaces === 100) milestones.push('Completed 100 races');
        if (lifetime.wins === 10) milestones.push('Won 10 races');
        if (lifetime.perfectRuns === 5) milestones.push('5 perfect runs');
        if (lifetime.topSpeed >= 300) milestones.push('Reached 300 km/h');
        
        return milestones.slice(-3); // Return last 3 milestones
    }

    /**
     * Get next goal
     */
    getNextGoal(lifetime) {
        const goals = [
            { condition: lifetime.totalRaces < 10, goal: 'Complete 10 races' },
            { condition: lifetime.wins < 5, goal: 'Win 5 races' },
            { condition: lifetime.perfectRuns < 3, goal: 'Achieve 3 perfect runs' },
            { condition: lifetime.topSpeed < 250, goal: 'Reach 250 km/h' },
            { condition: lifetime.winRate < 50, goal: 'Achieve 50% win rate' }
        ];
        
        const nextGoal = goals.find(g => g.condition);
        return nextGoal ? nextGoal.goal : 'Master all tracks';
    }

    /**
     * Get latest race statistics
     */
    getLatestRaceStats(raceData) {
        return {
            raceStats: raceData,
            sessionStats: { ...this.sessionStats },
            improvements: this.calculateImprovements(raceData),
            milestones: this.checkNewMilestones(raceData)
        };
    }

    /**
     * Calculate improvements from race
     */
    calculateImprovements(raceData) {
        const improvements = [];
        
        if (raceData.completionTime === this.sessionStats.bestLapTime) {
            improvements.push('New session best time!');
        }
        
        if (raceData.maxSpeed === this.sessionStats.topSpeed) {
            improvements.push('New session top speed!');
        }
        
        if (raceData.isPerfectRun) {
            improvements.push('Perfect run achieved!');
        }
        
        return improvements;
    }

    /**
     * Check for new milestones
     */
    checkNewMilestones(raceData) {
        const milestones = [];
        const lifetime = this.playerStats.lifetime;
        
        if (lifetime.totalRaces === 1) milestones.push('First race completed!');
        if (lifetime.wins === 1) milestones.push('First victory!');
        if (lifetime.perfectRuns === 1) milestones.push('First perfect run!');
        
        return milestones;
    }

    /**
     * Initialize lifetime stats structure
     */
    initializeLifetimeStats() {
        return {
            totalRaces: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            totalScore: 0,
            averageScore: 0,
            highestScore: 0,
            highestScoreTrack: null,
            totalPlayTime: 0,
            bestLapTime: null,
            bestLapTrack: null,
            topSpeed: 0,
            totalDrifts: 0,
            totalStunts: 0,
            totalPowerups: 0,
            totalCrashes: 0,
            totalOvertakes: 0,
            perfectRuns: 0,
            perfectRunRate: 0
        };
    }

    /**
     * Initialize track stats structure
     */
    initializeTrackStats() {
        return {
            attempts: 0,
            wins: 0,
            winRate: 0,
            bestTime: null,
            bestScore: 0,
            totalTime: 0,
            totalScore: 0,
            averageTime: 0,
            averageScore: 0
        };
    }

    /**
     * Initialize mode stats structure
     */
    initializeModeStats() {
        return {
            races: 0,
            wins: 0,
            winRate: 0,
            totalScore: 0,
            averageScore: 0,
            totalTime: 0,
            perfectRuns: 0,
            perfectRunRate: 0
        };
    }

    /**
     * Export statistics
     */
    exportStatistics(format = 'json') {
        const data = this.getPlayerStatistics();
        
        switch (format) {
            case 'csv':
                return this.convertStatsToCSV(data);
            case 'json':
            default:
                return JSON.stringify(data, null, 2);
        }
    }

    /**
     * Convert statistics to CSV
     */
    convertStatsToCSV(data) {
        const lifetime = data.lifetime;
        const csvData = [
            ['Metric', 'Value'],
            ['Total Races', lifetime.totalRaces],
            ['Wins', lifetime.wins],
            ['Win Rate', `${lifetime.winRate.toFixed(1)}%`],
            ['Total Score', lifetime.totalScore],
            ['Average Score', lifetime.averageScore.toFixed(0)],
            ['Best Lap Time', lifetime.bestLapTime || 'N/A'],
            ['Top Speed', `${lifetime.topSpeed} km/h`],
            ['Perfect Runs', lifetime.perfectRuns]
        ];
        
        return csvData.map(row => row.join(',')).join('\n');
    }

    /**
     * Load player stats from file
     */
    loadPlayerStats() {
        try {
            const dataPath = path.join(__dirname, '../..', 'data', 'player_stats.json');
            if (fs.existsSync(dataPath)) {
                const data = fs.readFileSync(dataPath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.warn('Could not load player stats:', error.message);
        }
        return {
            lifetime: this.initializeLifetimeStats(),
            tracks: {},
            modes: {}
        };
    }

    /**
     * Load performance metrics from file
     */
    loadPerformanceMetrics() {
        try {
            const dataPath = path.join(__dirname, '../..', 'data', 'performance_metrics.json');
            if (fs.existsSync(dataPath)) {
                const data = fs.readFileSync(dataPath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.warn('Could not load performance metrics:', error.message);
        }
        return {
            history: [],
            trends: {}
        };
    }

    /**
     * Save player stats to file
     */
    savePlayerStats() {
        try {
            const dataPath = path.join(__dirname, '../..', 'data', 'player_stats.json');
            const dataDir = path.dirname(dataPath);
            
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            fs.writeFileSync(dataPath, JSON.stringify(this.playerStats, null, 2));
        } catch (error) {
            console.error('Could not save player stats:', error.message);
        }
    }

    /**
     * Save performance metrics to file
     */
    savePerformanceMetrics() {
        try {
            const dataPath = path.join(__dirname, '../..', 'data', 'performance_metrics.json');
            const dataDir = path.dirname(dataPath);
            
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            fs.writeFileSync(dataPath, JSON.stringify(this.performanceMetrics, null, 2));
        } catch (error) {
            console.error('Could not save performance metrics:', error.message);
        }
    }

    /**
     * Reset all statistics (for testing)
     */
    resetStatistics() {
        this.playerStats = {
            lifetime: this.initializeLifetimeStats(),
            tracks: {},
            modes: {}
        };
        this.sessionStats = this.initializeSessionStats();
        this.performanceMetrics = {
            history: [],
            trends: {}
        };
        
        this.savePlayerStats();
        this.savePerformanceMetrics();
    }
}

module.exports = Statistics;