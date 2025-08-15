const fs = require('fs');
const path = require('path');

/**
 * Nintendo-Style Score Manager
 * Handles scoring, multipliers, and performance tracking
 */
class ScoreManager {
    constructor() {
        this.currentScore = 0;
        this.scoreMultiplier = 1.0;
        this.baseMultiplier = 1.0;
        this.scoreBreakdown = {
            timeBonus: 0,
            driftPoints: 0,
            stuntPoints: 0,
            perfectRuns: 0,
            overtakes: 0,
            powerupBonus: 0
        };
        this.persistentScores = this.loadPersistedScores();
        this.sessionStats = {
            racesCompleted: 0,
            totalScore: 0,
            bestLapTime: null,
            consecutivePerfectRuns: 0
        };
        
        // Nintendo-style scoring constants
        this.SCORING_CONSTANTS = {
            TIME_BONUS_BASE: 1000,
            DRIFT_MULTIPLIER: 10,
            STUNT_BASE_POINTS: 250,
            PERFECT_RUN_BONUS: 5000,
            OVERTAKE_POINTS: 100,
            POWERUP_BONUS: 50,
            SPEED_BONUS_THRESHOLD: 200, // km/h
            COMBO_MULTIPLIER_MAX: 3.0,
            PERFECT_TIME_THRESHOLD: 5.0 // seconds under best time
        };
    }

    /**
     * Calculate score for race completion
     */
    calculateRaceScore(raceData) {
        const {
            completionTime,
            bestTime,
            driftsPerformed,
            stuntsCompleted,
            overtakeCount,
            powerupsUsed,
            isPerfectRun,
            averageSpeed,
            position
        } = raceData;

        // Reset current score for this race
        this.currentScore = 0;
        this.scoreBreakdown = {
            timeBonus: 0,
            driftPoints: 0,
            stuntPoints: 0,
            perfectRuns: 0,
            overtakes: 0,
            powerupBonus: 0
        };

        // Time Bonus (Nintendo-style: faster = more points)
        if (bestTime && completionTime) {
            const timeDifference = bestTime - completionTime;
            if (timeDifference > 0) {
                this.scoreBreakdown.timeBonus = Math.floor(
                    this.SCORING_CONSTANTS.TIME_BONUS_BASE * (timeDifference / bestTime)
                );
            }
            
            // Perfect time bonus
            if (timeDifference >= this.SCORING_CONSTANTS.PERFECT_TIME_THRESHOLD) {
                this.scoreBreakdown.timeBonus *= 2;
            }
        }

        // Drift Points
        if (driftsPerformed > 0) {
            this.scoreBreakdown.driftPoints = Math.floor(
                driftsPerformed * this.SCORING_CONSTANTS.DRIFT_MULTIPLIER * this.calculateDriftMultiplier(driftsPerformed)
            );
        }

        // Stunt Points
        if (stuntsCompleted > 0) {
            this.scoreBreakdown.stuntPoints = Math.floor(
                stuntsCompleted * this.SCORING_CONSTANTS.STUNT_BASE_POINTS * this.calculateStuntMultiplier(stuntsCompleted)
            );
        }

        // Perfect Run Bonus
        if (isPerfectRun) {
            this.scoreBreakdown.perfectRuns = this.SCORING_CONSTANTS.PERFECT_RUN_BONUS;
            this.sessionStats.consecutivePerfectRuns++;
            
            // Consecutive perfect run multiplier
            if (this.sessionStats.consecutivePerfectRuns > 1) {
                this.scoreBreakdown.perfectRuns *= (1 + (this.sessionStats.consecutivePerfectRuns - 1) * 0.5);
            }
        } else {
            this.sessionStats.consecutivePerfectRuns = 0;
        }

        // Overtake Points
        if (overtakeCount > 0) {
            this.scoreBreakdown.overtakes = overtakeCount * this.SCORING_CONSTANTS.OVERTAKE_POINTS;
        }

        // Powerup Bonus
        if (powerupsUsed > 0) {
            this.scoreBreakdown.powerupBonus = powerupsUsed * this.SCORING_CONSTANTS.POWERUP_BONUS;
        }

        // Calculate total base score
        this.currentScore = Object.values(this.scoreBreakdown).reduce((sum, score) => sum + score, 0);

        // Apply position multiplier (Nintendo-style: 1st place gets best multiplier)
        const positionMultiplier = this.calculatePositionMultiplier(position);
        
        // Apply speed bonus
        const speedMultiplier = this.calculateSpeedMultiplier(averageSpeed);
        
        // Final multiplier calculation
        this.scoreMultiplier = this.baseMultiplier * positionMultiplier * speedMultiplier;
        
        // Apply multiplier to final score
        this.currentScore = Math.floor(this.currentScore * this.scoreMultiplier);

        // Update session stats
        this.sessionStats.racesCompleted++;
        this.sessionStats.totalScore += this.currentScore;

        return {
            totalScore: this.currentScore,
            breakdown: { ...this.scoreBreakdown },
            multiplier: this.scoreMultiplier,
            sessionStats: { ...this.sessionStats }
        };
    }

    /**
     * Calculate drift multiplier based on combo
     */
    calculateDriftMultiplier(driftCount) {
        if (driftCount >= 20) return 3.0;
        if (driftCount >= 15) return 2.5;
        if (driftCount >= 10) return 2.0;
        if (driftCount >= 5) return 1.5;
        return 1.0;
    }

    /**
     * Calculate stunt multiplier based on variety and execution
     */
    calculateStuntMultiplier(stuntCount) {
        if (stuntCount >= 10) return 2.5;
        if (stuntCount >= 7) return 2.0;
        if (stuntCount >= 5) return 1.5;
        if (stuntCount >= 3) return 1.2;
        return 1.0;
    }

    /**
     * Calculate position-based multiplier (Nintendo-style)
     */
    calculatePositionMultiplier(position) {
        switch (position) {
            case 1: return 2.0;
            case 2: return 1.5;
            case 3: return 1.2;
            case 4: return 1.0;
            default: return 0.8;
        }
    }

    /**
     * Calculate speed-based multiplier
     */
    calculateSpeedMultiplier(averageSpeed) {
        if (averageSpeed >= this.SCORING_CONSTANTS.SPEED_BONUS_THRESHOLD) {
            return 1.0 + ((averageSpeed - this.SCORING_CONSTANTS.SPEED_BONUS_THRESHOLD) / 100);
        }
        return 1.0;
    }

    /**
     * Add real-time score for actions during race
     */
    addRealtimeScore(action, value = 0) {
        let points = 0;
        
        switch (action) {
            case 'drift_start':
                points = 10;
                break;
            case 'drift_combo':
                points = 25 * value; // value = combo multiplier
                break;
            case 'stunt_performed':
                points = 100;
                break;
            case 'overtake':
                points = 50;
                break;
            case 'powerup_used':
                points = 25;
                break;
            case 'checkpoint':
                points = 20;
                break;
            case 'speed_boost':
                points = 15;
                break;
            default:
                points = 0;
        }

        this.currentScore += Math.floor(points * this.scoreMultiplier);
        return points;
    }

    /**
     * Set score multiplier
     */
    setMultiplier(multiplier) {
        this.scoreMultiplier = Math.min(multiplier, this.SCORING_CONSTANTS.COMBO_MULTIPLIER_MAX);
    }

    /**
     * Get current score
     */
    getCurrentScore() {
        return this.currentScore;
    }

    /**
     * Get score breakdown
     */
    getScoreBreakdown() {
        return { ...this.scoreBreakdown };
    }

    /**
     * Save high score
     */
    saveHighScore(playerName, trackId, gameMode, scoreData) {
        const highScore = {
            playerName,
            trackId,
            gameMode,
            score: scoreData.totalScore,
            breakdown: scoreData.breakdown,
            timestamp: new Date().toISOString(),
            sessionId: this.generateSessionId()
        };

        if (!this.persistentScores[trackId]) {
            this.persistentScores[trackId] = {};
        }
        
        if (!this.persistentScores[trackId][gameMode]) {
            this.persistentScores[trackId][gameMode] = [];
        }

        this.persistentScores[trackId][gameMode].push(highScore);
        
        // Keep only top 10 scores per track/mode
        this.persistentScores[trackId][gameMode].sort((a, b) => b.score - a.score);
        this.persistentScores[trackId][gameMode] = this.persistentScores[trackId][gameMode].slice(0, 10);

        this.persistScores();
        return highScore;
    }

    /**
     * Get high scores for a track and mode
     */
    getHighScores(trackId, gameMode) {
        if (!this.persistentScores[trackId] || !this.persistentScores[trackId][gameMode]) {
            return [];
        }
        return [...this.persistentScores[trackId][gameMode]];
    }

    /**
     * Load persisted scores from file
     */
    loadPersistedScores() {
        try {
            const dataPath = path.join(__dirname, '../..', 'data', 'scores.json');
            if (fs.existsSync(dataPath)) {
                const data = fs.readFileSync(dataPath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.warn('Could not load persisted scores:', error.message);
        }
        return {};
    }

    /**
     * Persist scores to file
     */
    persistScores() {
        try {
            const dataPath = path.join(__dirname, '../..', 'data', 'scores.json');
            const dataDir = path.dirname(dataPath);
            
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            fs.writeFileSync(dataPath, JSON.stringify(this.persistentScores, null, 2));
        } catch (error) {
            console.error('Could not persist scores:', error.message);
        }
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Reset session stats
     */
    resetSession() {
        this.sessionStats = {
            racesCompleted: 0,
            totalScore: 0,
            bestLapTime: null,
            consecutivePerfectRuns: 0
        };
        this.currentScore = 0;
        this.scoreMultiplier = 1.0;
    }

    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        return {
            ...this.sessionStats,
            averageScorePerRace: this.sessionStats.racesCompleted > 0 
                ? Math.floor(this.sessionStats.totalScore / this.sessionStats.racesCompleted) 
                : 0,
            currentMultiplier: this.scoreMultiplier
        };
    }
}

module.exports = ScoreManager;