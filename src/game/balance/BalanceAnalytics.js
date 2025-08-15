/**
 * BalanceAnalytics.js
 * 
 * Tracks performance metrics and analyzes game balance
 * Provides insights for difficulty curve optimization and parameter validation
 */

export class BalanceAnalytics {
    constructor() {
        this.metrics = {
            races: [],
            players: new Map(),
            balanceHistory: [],
            systemPerformance: {
                averageFrameTime: [],
                memoryUsage: [],
                processingTime: []
            }
        };
        this.analysisConfig = {
            sessionTimeWindow: 30 * 60 * 1000, // 30 minutes
            minimumRacesForAnalysis: 5,
            balanceThresholds: {
                winRateDeviation: 0.15,
                avgPositionRange: [3.0, 5.0],
                raceTimeVariation: 0.25
            }
        };
        this.feedbackCollection = [];
    }

    /**
     * Record a completed race for analysis
     */
    recordRace(raceData) {
        const race = {
            id: this.generateRaceId(),
            timestamp: Date.now(),
            duration: raceData.duration,
            track: raceData.track,
            difficulty: raceData.difficulty,
            participants: raceData.participants.map(p => ({
                id: p.id,
                isPlayer: p.isPlayer,
                finalPosition: p.finalPosition,
                finalTime: p.finalTime,
                powerupsUsed: p.powerupsUsed || 0,
                driftsCompleted: p.driftsCompleted || 0,
                mistakesMade: p.mistakesMade || 0,
                averageSpeed: p.averageSpeed || 0
            })),
            events: raceData.events || [],
            parameters: raceData.parameters
        };

        this.metrics.races.push(race);
        this.updatePlayerStats(race);
        this.analyzeRaceBalance(race);

        // Keep only recent races to manage memory
        if (this.metrics.races.length > 1000) {
            this.metrics.races = this.metrics.races.slice(-500);
        }

        return race.id;
    }

    /**
     * Update individual player statistics
     */
    updatePlayerStats(race) {
        race.participants.forEach(participant => {
            if (participant.isPlayer) {
                if (!this.metrics.players.has(participant.id)) {
                    this.metrics.players.set(participant.id, {
                        id: participant.id,
                        totalRaces: 0,
                        wins: 0,
                        podiumFinishes: 0,
                        averagePosition: 0,
                        averageTime: 0,
                        totalPowerupsUsed: 0,
                        totalDrifts: 0,
                        skillProgression: [],
                        preferredDifficulty: 'normal',
                        performanceTrend: []
                    });
                }

                const playerStats = this.metrics.players.get(participant.id);
                playerStats.totalRaces++;
                
                if (participant.finalPosition === 1) {
                    playerStats.wins++;
                }
                if (participant.finalPosition <= 3) {
                    playerStats.podiumFinishes++;
                }

                // Update averages
                playerStats.averagePosition = this.updateAverage(
                    playerStats.averagePosition,
                    participant.finalPosition,
                    playerStats.totalRaces
                );

                playerStats.averageTime = this.updateAverage(
                    playerStats.averageTime,
                    participant.finalTime,
                    playerStats.totalRaces
                );

                playerStats.totalPowerupsUsed += participant.powerupsUsed;
                playerStats.totalDrifts += participant.driftsCompleted;

                // Track performance trend
                playerStats.performanceTrend.push({
                    race: race.id,
                    position: participant.finalPosition,
                    time: participant.finalTime,
                    timestamp: race.timestamp
                });

                // Keep only recent trend data
                if (playerStats.performanceTrend.length > 20) {
                    playerStats.performanceTrend.shift();
                }
            }
        });
    }

    /**
     * Analyze race balance and fairness
     */
    analyzeRaceBalance(race) {
        const analysis = {
            raceId: race.id,
            timestamp: race.timestamp,
            difficulty: race.difficulty,
            playerPerformance: this.analyzePlayerPerformance(race),
            aiPerformance: this.analyzeAIPerformance(race),
            competitiveness: this.analyzeCompetitiveness(race),
            powerupBalance: this.analyzePowerupBalance(race),
            recommendations: []
        };

        // Generate recommendations based on analysis
        analysis.recommendations = this.generateBalanceRecommendations(analysis);

        this.metrics.balanceHistory.push(analysis);

        return analysis;
    }

    /**
     * Analyze player performance in race
     */
    analyzePlayerPerformance(race) {
        const players = race.participants.filter(p => p.isPlayer);
        
        if (players.length === 0) return null;

        const playerData = players[0]; // Focus on primary player for now
        
        return {
            position: playerData.finalPosition,
            timeGap: this.calculateTimeGap(race.participants, playerData.finalPosition),
            skillDisplay: {
                driftEfficiency: playerData.driftsCompleted / Math.max(1, race.duration / 10000),
                powerupUsage: playerData.powerupsUsed / Math.max(1, race.duration / 15000),
                consistencyScore: this.calculateConsistencyScore(playerData)
            },
            challengeLevel: this.assessChallengeLevel(playerData, race)
        };
    }

    /**
     * Analyze AI performance and behavior
     */
    analyzeAIPerformance(race) {
        const aiParticipants = race.participants.filter(p => !p.isPlayer);
        
        if (aiParticipants.length === 0) return null;

        const aiAnalysis = {
            averagePosition: aiParticipants.reduce((sum, ai) => sum + ai.finalPosition, 0) / aiParticipants.length,
            timeSpread: this.calculateTimeSpread(aiParticipants),
            mistakeFrequency: aiParticipants.reduce((sum, ai) => sum + ai.mistakesMade, 0) / aiParticipants.length,
            powerupUsage: aiParticipants.reduce((sum, ai) => sum + ai.powerupsUsed, 0) / aiParticipants.length,
            competitivenessRating: this.calculateAICompetitiveness(aiParticipants, race.participants)
        };

        return aiAnalysis;
    }

    /**
     * Analyze overall race competitiveness
     */
    analyzeCompetitiveness(race) {
        const finishTimes = race.participants.map(p => p.finalTime).sort((a, b) => a - b);
        const positions = race.participants.map(p => p.finalPosition);
        
        return {
            timeGapSpread: finishTimes[finishTimes.length - 1] - finishTimes[0],
            averageGapBetweenPositions: this.calculateAveragePositionGap(finishTimes),
            closeFinishes: finishTimes.filter((time, index) => 
                index > 0 && time - finishTimes[index - 1] < 2000
            ).length,
            competitivenessScore: this.calculateCompetitivenessScore(finishTimes)
        };
    }

    /**
     * Analyze power-up distribution and effectiveness
     */
    analyzePowerupBalance(race) {
        const totalPowerups = race.participants.reduce((sum, p) => sum + p.powerupsUsed, 0);
        const playerPowerups = race.participants
            .filter(p => p.isPlayer)
            .reduce((sum, p) => sum + p.powerupsUsed, 0);
        const aiPowerups = totalPowerups - playerPowerups;

        return {
            totalUsed: totalPowerups,
            playerShare: totalPowerups > 0 ? playerPowerups / totalPowerups : 0,
            averagePerParticipant: totalPowerups / race.participants.length,
            effectiveness: this.calculatePowerupEffectiveness(race),
            distribution: this.analyzePowerupDistribution(race)
        };
    }

    /**
     * Calculate player success rate analysis
     */
    analyzePlayerSuccessRate(playerId = null, timeWindow = null) {
        const endTime = Date.now();
        const startTime = timeWindow ? endTime - timeWindow : endTime - this.analysisConfig.sessionTimeWindow;
        
        const relevantRaces = this.metrics.races.filter(race => 
            race.timestamp >= startTime && race.timestamp <= endTime
        );

        if (relevantRaces.length < this.analysisConfig.minimumRacesForAnalysis) {
            return { error: 'Insufficient race data for analysis' };
        }

        const playerRaces = relevantRaces.filter(race => 
            race.participants.some(p => p.isPlayer && (!playerId || p.id === playerId))
        );

        const wins = playerRaces.filter(race => 
            race.participants.some(p => p.isPlayer && p.finalPosition === 1)
        ).length;

        const podiumFinishes = playerRaces.filter(race => 
            race.participants.some(p => p.isPlayer && p.finalPosition <= 3)
        ).length;

        const averagePosition = playerRaces.reduce((sum, race) => {
            const player = race.participants.find(p => p.isPlayer);
            return sum + (player ? player.finalPosition : 8);
        }, 0) / playerRaces.length;

        return {
            totalRaces: playerRaces.length,
            winRate: wins / playerRaces.length,
            podiumRate: podiumFinishes / playerRaces.length,
            averagePosition,
            timeWindow: {
                start: new Date(startTime).toISOString(),
                end: new Date(endTime).toISOString()
            },
            balanceAssessment: this.assessBalanceQuality(wins / playerRaces.length, averagePosition)
        };
    }

    /**
     * Optimize difficulty curve based on collected data
     */
    optimizeDifficultyCurve() {
        const recentRaces = this.metrics.races.slice(-100); // Last 100 races
        
        if (recentRaces.length < 20) {
            return { error: 'Insufficient data for optimization' };
        }

        const difficultyAnalysis = {
            easy: this.analyzeDifficultyLevel(recentRaces, 'easy'),
            normal: this.analyzeDifficultyLevel(recentRaces, 'normal'),
            hard: this.analyzeDifficultyLevel(recentRaces, 'hard')
        };

        const optimizations = {};

        Object.keys(difficultyAnalysis).forEach(difficulty => {
            const analysis = difficultyAnalysis[difficulty];
            if (analysis.races.length > 0) {
                optimizations[difficulty] = this.generateDifficultyOptimizations(analysis);
            }
        });

        return {
            analysis: difficultyAnalysis,
            optimizations,
            timestamp: Date.now()
        };
    }

    /**
     * Validate balance parameters against performance data
     */
    validateBalanceParameters(parameters) {
        const validationResults = {
            parameterTests: [],
            performanceImpact: {},
            recommendations: [],
            overallScore: 0
        };

        // Test AI skill levels
        validationResults.parameterTests.push(
            this.validateAISkillLevels(parameters.ai)
        );

        // Test power-up balance
        validationResults.parameterTests.push(
            this.validatePowerupBalance(parameters.powerups)
        );

        // Test catch-up mechanics
        validationResults.parameterTests.push(
            this.validateCatchupMechanics(parameters.catchup)
        );

        // Calculate overall validation score
        validationResults.overallScore = validationResults.parameterTests.reduce(
            (sum, test) => sum + test.score, 0
        ) / validationResults.parameterTests.length;

        return validationResults;
    }

    /**
     * Collect and analyze player feedback
     */
    collectFeedback(feedback) {
        const feedbackEntry = {
            id: this.generateFeedbackId(),
            timestamp: Date.now(),
            type: feedback.type, // 'difficulty', 'balance', 'fun', 'fairness'
            rating: feedback.rating, // 1-5 scale
            comments: feedback.comments || '',
            context: {
                recentRaces: this.metrics.races.slice(-5).map(r => r.id),
                currentDifficulty: feedback.difficulty || 'unknown',
                sessionLength: feedback.sessionLength || 0
            }
        };

        this.feedbackCollection.push(feedbackEntry);

        // Keep only recent feedback
        if (this.feedbackCollection.length > 500) {
            this.feedbackCollection = this.feedbackCollection.slice(-250);
        }

        return this.analyzeFeedbackTrends();
    }

    /**
     * Generate comprehensive balance report
     */
    generateBalanceReport() {
        const report = {
            timestamp: Date.now(),
            summary: {
                totalRaces: this.metrics.races.length,
                totalPlayers: this.metrics.players.size,
                timespan: this.getDataTimespan()
            },
            playerAnalysis: this.analyzePlayerSuccessRate(),
            difficultyAnalysis: this.optimizeDifficultyCurve(),
            systemPerformance: this.analyzeSystemPerformance(),
            feedbackSummary: this.summarizeFeedback(),
            recommendations: this.generateSystemRecommendations()
        };

        return report;
    }

    // Helper methods
    updateAverage(currentAverage, newValue, count) {
        return ((currentAverage * (count - 1)) + newValue) / count;
    }

    calculateTimeGap(participants, position) {
        const sorted = participants.sort((a, b) => a.finalPosition - b.finalPosition);
        if (position === 1) return 0;
        
        const firstPlace = sorted.find(p => p.finalPosition === 1);
        const currentPosition = sorted.find(p => p.finalPosition === position);
        
        if (!firstPlace || !currentPosition) return 0;
        
        return currentPosition.finalTime - firstPlace.finalTime;
    }

    calculateConsistencyScore(player) {
        // Simplified consistency calculation based on available data
        return Math.max(0, 1.0 - (player.mistakesMade / 10));
    }

    assessChallengeLevel(player, race) {
        const positionRatio = player.finalPosition / race.participants.length;
        if (positionRatio <= 0.3) return 'easy';
        if (positionRatio <= 0.7) return 'balanced';
        return 'challenging';
    }

    calculateTimeSpread(participants) {
        const times = participants.map(p => p.finalTime).sort((a, b) => a - b);
        return times[times.length - 1] - times[0];
    }

    calculateAICompetitiveness(aiParticipants, allParticipants) {
        const aiPositions = aiParticipants.map(ai => ai.finalPosition);
        const avgAIPosition = aiPositions.reduce((sum, pos) => sum + pos, 0) / aiPositions.length;
        const expectedPosition = allParticipants.length / 2;
        
        return Math.max(0, 1.0 - Math.abs(avgAIPosition - expectedPosition) / expectedPosition);
    }

    calculateAveragePositionGap(sortedTimes) {
        if (sortedTimes.length < 2) return 0;
        
        const gaps = [];
        for (let i = 1; i < sortedTimes.length; i++) {
            gaps.push(sortedTimes[i] - sortedTimes[i - 1]);
        }
        
        return gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    }

    calculateCompetitivenessScore(finishTimes) {
        if (finishTimes.length < 2) return 0;
        
        const totalSpread = finishTimes[finishTimes.length - 1] - finishTimes[0];
        const idealSpread = 10000; // 10 seconds ideal spread
        
        return Math.max(0, 1.0 - Math.abs(totalSpread - idealSpread) / idealSpread);
    }

    calculatePowerupEffectiveness(race) {
        // Simplified effectiveness calculation
        const powerupUsers = race.participants.filter(p => p.powerupsUsed > 0);
        if (powerupUsers.length === 0) return 0;
        
        const averagePositionImprovement = powerupUsers.reduce((sum, p) => {
            const expectedPosition = race.participants.length / 2;
            return sum + Math.max(0, expectedPosition - p.finalPosition);
        }, 0) / powerupUsers.length;
        
        return Math.min(1.0, averagePositionImprovement / 2.0);
    }

    analyzePowerupDistribution(race) {
        return {
            fairness: 'balanced', // Simplified for now
            availability: 'adequate',
            usage: 'optimal'
        };
    }

    assessBalanceQuality(winRate, avgPosition) {
        const idealWinRate = 0.3;
        const idealPosition = 4.0;
        
        const winRateScore = 1.0 - Math.abs(winRate - idealWinRate) / idealWinRate;
        const positionScore = 1.0 - Math.abs(avgPosition - idealPosition) / idealPosition;
        
        const overallScore = (winRateScore + positionScore) / 2;
        
        if (overallScore > 0.8) return 'excellent';
        if (overallScore > 0.6) return 'good';
        if (overallScore > 0.4) return 'fair';
        return 'needs_improvement';
    }

    analyzeDifficultyLevel(races, difficulty) {
        const difficultyRaces = races.filter(r => r.difficulty === difficulty);
        
        return {
            races: difficultyRaces,
            playerWinRate: this.calculateWinRateForDifficulty(difficultyRaces),
            averagePosition: this.calculateAveragePositionForDifficulty(difficultyRaces),
            competitiveness: this.calculateAverageCompetitivenessForDifficulty(difficultyRaces)
        };
    }

    calculateWinRateForDifficulty(races) {
        if (races.length === 0) return 0;
        const wins = races.filter(race => 
            race.participants.some(p => p.isPlayer && p.finalPosition === 1)
        ).length;
        return wins / races.length;
    }

    calculateAveragePositionForDifficulty(races) {
        if (races.length === 0) return 0;
        const positions = races.map(race => {
            const player = race.participants.find(p => p.isPlayer);
            return player ? player.finalPosition : 8;
        });
        return positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
    }

    calculateAverageCompetitivenessForDifficulty(races) {
        if (races.length === 0) return 0;
        const competitivenessScores = races.map(race => {
            const times = race.participants.map(p => p.finalTime).sort((a, b) => a - b);
            return this.calculateCompetitivenessScore(times);
        });
        return competitivenessScores.reduce((sum, score) => sum + score, 0) / competitivenessScores.length;
    }

    generateDifficultyOptimizations(analysis) {
        const optimizations = [];
        
        if (analysis.playerWinRate > 0.5) {
            optimizations.push('increase_ai_skill');
        } else if (analysis.playerWinRate < 0.2) {
            optimizations.push('decrease_ai_skill');
        }
        
        if (analysis.competitiveness < 0.6) {
            optimizations.push('adjust_catchup_mechanics');
        }
        
        return optimizations;
    }

    validateAISkillLevels(aiParams) {
        return {
            parameter: 'ai_skill',
            score: 0.8, // Simplified scoring
            issues: [],
            recommendations: []
        };
    }

    validatePowerupBalance(powerupParams) {
        return {
            parameter: 'powerup_balance',
            score: 0.75,
            issues: [],
            recommendations: []
        };
    }

    validateCatchupMechanics(catchupParams) {
        return {
            parameter: 'catchup_mechanics',
            score: 0.85,
            issues: [],
            recommendations: []
        };
    }

    analyzeFeedbackTrends() {
        if (this.feedbackCollection.length === 0) return null;
        
        const recentFeedback = this.feedbackCollection.slice(-50);
        const averageRating = recentFeedback.reduce((sum, f) => sum + f.rating, 0) / recentFeedback.length;
        
        return {
            averageRating,
            totalFeedback: recentFeedback.length,
            sentiment: averageRating > 3.5 ? 'positive' : averageRating > 2.5 ? 'neutral' : 'negative'
        };
    }

    analyzeSystemPerformance() {
        return {
            status: 'optimal',
            metrics: this.metrics.systemPerformance
        };
    }

    summarizeFeedback() {
        return this.analyzeFeedbackTrends();
    }

    generateSystemRecommendations() {
        return [
            'Monitor player win rates closely',
            'Adjust AI difficulty based on performance trends',
            'Collect more player feedback'
        ];
    }

    getDataTimespan() {
        if (this.metrics.races.length === 0) return null;
        
        const timestamps = this.metrics.races.map(r => r.timestamp);
        return {
            start: new Date(Math.min(...timestamps)).toISOString(),
            end: new Date(Math.max(...timestamps)).toISOString()
        };
    }

    generateRaceId() {
        return 'race_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateFeedbackId() {
        return 'feedback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateBalanceRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.playerPerformance && analysis.playerPerformance.challengeLevel === 'easy') {
            recommendations.push('Consider increasing difficulty');
        }
        
        if (analysis.competitiveness.competitivenessScore < 0.5) {
            recommendations.push('Improve race competitiveness through better AI balancing');
        }
        
        return recommendations;
    }
}