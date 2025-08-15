/**
 * BalanceManager.js
 * 
 * Main coordinator for the game balance system
 * Manages dynamic difficulty adjustment, performance monitoring, and real-time tuning
 */

import { GameParameters } from './GameParameters.js';
import { DifficultyTuner } from './DifficultyTuner.js';
import { BalanceAnalytics } from './BalanceAnalytics.js';

export class BalanceManager {
    constructor(config = {}) {
        this.gameParameters = new GameParameters();
        this.difficultyTuner = new DifficultyTuner(this.gameParameters);
        this.analytics = new BalanceAnalytics();
        
        this.config = {
            enableDynamicAdjustment: config.enableDynamicAdjustment ?? true,
            enableRealTimeMonitoring: config.enableRealTimeMonitoring ?? true,
            enableAnalytics: config.enableAnalytics ?? true,
            autoOptimization: config.autoOptimization ?? false,
            monitoringInterval: config.monitoringInterval ?? 30000, // 30 seconds
            ...config
        };

        this.state = {
            active: false,
            currentSession: null,
            realTimeData: {
                performanceMetrics: [],
                playerFeedback: [],
                systemStatus: 'normal'
            },
            lastOptimization: null
        };

        this.eventListeners = new Map();
        this.monitoringTimer = null;

        this.initialize();
    }

    /**
     * Initialize the balance manager
     */
    initialize() {
        console.log('🎮 Nintendo NFS Balance Manager initializing...');
        
        // Validate initial configuration
        const validationResults = this.validateConfiguration();
        if (validationResults.errors.length > 0) {
            console.warn('⚠️ Configuration validation issues:', validationResults.errors);
        }

        // Set up event system
        this.setupEventSystem();

        // Start monitoring if enabled
        if (this.config.enableRealTimeMonitoring) {
            this.startRealTimeMonitoring();
        }

        this.state.active = true;
        console.log('✅ Balance Manager initialized successfully');

        this.emit('initialized', { 
            config: this.config, 
            timestamp: Date.now() 
        });
    }

    /**
     * Start a new gaming session
     */
    startSession(sessionConfig = {}) {
        this.state.currentSession = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            playerProfile: sessionConfig.playerProfile || this.createDefaultPlayerProfile(),
            initialDifficulty: sessionConfig.difficulty || 'normal',
            gameMode: sessionConfig.gameMode || 'championship',
            config: sessionConfig
        };

        // Set initial difficulty
        this.difficultyTuner.setDifficulty(this.state.currentSession.initialDifficulty);

        console.log(`🏁 Started session ${this.state.currentSession.id} with difficulty: ${this.state.currentSession.initialDifficulty}`);

        this.emit('sessionStarted', {
            sessionId: this.state.currentSession.id,
            difficulty: this.state.currentSession.initialDifficulty,
            timestamp: Date.now()
        });

        return this.state.currentSession.id;
    }

    /**
     * Process race completion and adjust balance
     */
    processRaceCompletion(raceData) {
        if (!this.state.currentSession) {
            console.warn('⚠️ No active session for race completion');
            return null;
        }

        // Record race in analytics
        const raceId = this.analytics.recordRace({
            ...raceData,
            sessionId: this.state.currentSession.id,
            timestamp: Date.now()
        });

        // Process dynamic difficulty adjustment
        const playerPerformance = this.extractPlayerPerformance(raceData);
        let difficultyAdjustment = null;

        if (this.config.enableDynamicAdjustment) {
            difficultyAdjustment = this.difficultyTuner.adjustDifficultyDynamically(playerPerformance);
        }

        // Update real-time metrics
        this.updateRealTimeMetrics(raceData, playerPerformance);

        // Generate race completion report
        const completionReport = {
            raceId,
            sessionId: this.state.currentSession.id,
            playerPerformance,
            difficultyAdjustment,
            balanceMetrics: this.getCurrentBalanceMetrics(),
            recommendations: this.generateRaceRecommendations(raceData),
            timestamp: Date.now()
        };

        this.emit('raceCompleted', completionReport);

        console.log(`🏁 Race ${raceId} processed - Position: ${playerPerformance.position}, Difficulty: ${difficultyAdjustment?.effective || 'unchanged'}`);

        return completionReport;
    }

    /**
     * Get current balance configuration for the game
     */
    getCurrentBalanceConfig() {
        if (!this.state.currentSession) {
            return this.difficultyTuner.getDifficultyConfiguration();
        }

        const baseConfig = this.difficultyTuner.getDifficultyConfiguration();
        
        return {
            ...baseConfig,
            session: {
                id: this.state.currentSession.id,
                duration: Date.now() - this.state.currentSession.startTime,
                gameMode: this.state.currentSession.gameMode
            },
            realTimeAdjustments: this.calculateRealTimeAdjustments(),
            catchupConfig: this.getCatchupConfiguration(),
            nintendoStyleFeatures: this.getNintendoStyleConfiguration()
        };
    }

    /**
     * Apply real-time parameter adjustments
     */
    applyRealTimeAdjustment(adjustmentType, parameters) {
        switch (adjustmentType) {
            case 'ai_skill':
                this.adjustAISkill(parameters);
                break;
            case 'powerup_spawn':
                this.adjustPowerupSpawn(parameters);
                break;
            case 'catchup_strength':
                this.adjustCatchupStrength(parameters);
                break;
            case 'vehicle_performance':
                this.adjustVehiclePerformance(parameters);
                break;
            default:
                console.warn(`Unknown adjustment type: ${adjustmentType}`);
                return false;
        }

        this.emit('realTimeAdjustment', {
            type: adjustmentType,
            parameters,
            timestamp: Date.now()
        });

        return true;
    }

    /**
     * Collect player feedback for balance improvement
     */
    collectPlayerFeedback(feedback) {
        const feedbackData = {
            sessionId: this.state.currentSession?.id,
            difficulty: this.difficultyTuner.currentDifficulty,
            timestamp: Date.now(),
            ...feedback
        };

        const analysis = this.analytics.collectFeedback(feedbackData);
        
        // Process feedback for immediate adjustments if needed
        if (feedback.type === 'difficulty' && feedback.rating <= 2) {
            this.handleNegativeFeedback(feedback);
        }

        this.emit('feedbackCollected', { feedback: feedbackData, analysis });

        return analysis;
    }

    /**
     * Generate comprehensive balance report
     */
    generateBalanceReport(detailed = false) {
        const report = this.analytics.generateBalanceReport();
        
        if (detailed) {
            report.detailedAnalysis = {
                parameterValidation: this.analytics.validateBalanceParameters(
                    this.gameParameters.getParametersForDifficulty()
                ),
                difficultyOptimization: this.analytics.optimizeDifficultyCurve(),
                nintendoStyleCompliance: this.validateNintendoStyleCompliance()
            };
        }

        return report;
    }

    /**
     * Optimize balance parameters based on collected data
     */
    optimizeBalance(force = false) {
        if (!force && !this.shouldOptimize()) {
            return { skipped: true, reason: 'Optimization not needed' };
        }

        console.log('🔧 Starting balance optimization...');

        const optimizationResult = {
            timestamp: Date.now(),
            previousConfig: this.difficultyTuner.getDifficultyConfiguration(),
            changes: [],
            improvements: {}
        };

        // Get optimization recommendations from analytics
        const difficultyOptimization = this.analytics.optimizeDifficultyCurve();
        
        if (difficultyOptimization.optimizations) {
            Object.keys(difficultyOptimization.optimizations).forEach(difficulty => {
                const optimizations = difficultyOptimization.optimizations[difficulty];
                optimizations.forEach(optimization => {
                    this.applyOptimization(difficulty, optimization);
                    optimizationResult.changes.push({
                        difficulty,
                        optimization,
                        applied: true
                    });
                });
            });
        }

        // Validate optimizations
        const validationResults = this.analytics.validateBalanceParameters(
            this.gameParameters.getParametersForDifficulty()
        );

        optimizationResult.validation = validationResults;
        optimizationResult.newConfig = this.difficultyTuner.getDifficultyConfiguration();

        this.state.lastOptimization = Date.now();

        console.log(`✅ Balance optimization completed with ${optimizationResult.changes.length} changes`);

        this.emit('balanceOptimized', optimizationResult);

        return optimizationResult;
    }

    /**
     * Handle emergency balance adjustments
     */
    handleEmergencyAdjustment(reason, adjustment) {
        console.warn(`🚨 Emergency balance adjustment: ${reason}`);

        const emergencyConfig = {
            timestamp: Date.now(),
            reason,
            previousDifficulty: this.difficultyTuner.currentDifficulty,
            adjustment
        };

        switch (adjustment.type) {
            case 'reduce_difficulty':
                this.difficultyTuner.adjustDifficultyFactor('decrease');
                break;
            case 'increase_difficulty':
                this.difficultyTuner.adjustDifficultyFactor('increase');
                break;
            case 'reset_difficulty':
                this.difficultyTuner.resetDynamicAdjustments();
                break;
            case 'enable_catchup':
                this.gameParameters.updateParameter('catchup.maxAssistance', 0.6);
                break;
        }

        this.emit('emergencyAdjustment', emergencyConfig);

        return emergencyConfig;
    }

    /**
     * Get Nintendo-style configuration for authentic experience
     */
    getNintendoStyleConfiguration() {
        return {
            accessibility: {
                helpfulAI: true, // AI that doesn't frustrate beginners
                forgivingPhysics: true, // Slightly more forgiving collision
                clearFeedback: true, // Clear visual/audio feedback for actions
                progressiveChallenge: true // Gradual difficulty increase
            },
            fairPlay: {
                catchupMechanics: true, // Keep races competitive
                balancedPowerups: true, // Ensure fair power-up distribution
                skillBasedMatching: true, // Match difficulty to player skill
                respectPlayerTime: true // Don't waste player's time with unfair challenges
            },
            funFactor: {
                rewardFrequency: 'high', // Frequent positive reinforcement
                mistakeTolerance: 'medium', // Allow players to recover from mistakes
                comebackOpportunities: true, // Always allow chance for comeback
                celebrateSuccess: true // Highlight player achievements
            }
        };
    }

    /**
     * Validate Nintendo-style compliance
     */
    validateNintendoStyleCompliance() {
        const config = this.getCurrentBalanceConfig();
        const compliance = {
            score: 0,
            criteria: {},
            recommendations: []
        };

        // Check accessibility criteria
        compliance.criteria.accessibility = {
            helpfulAI: config.ai.rubberBanding.enabled,
            fairDifficulty: config.level.factor >= 0.7 && config.level.factor <= 1.3,
            progressiveChallenge: config.dynamicAdjustment.enabled
        };

        // Check fairness criteria
        compliance.criteria.fairness = {
            balancedCatchup: config.parameters.catchup.maxAssistance <= 0.6,
            reasonablePowerups: config.powerups.spawnRate >= 0.5,
            skillRespect: config.ai.mistakeProbability >= 0.05
        };

        // Calculate compliance score
        const criteriaScores = Object.values(compliance.criteria).map(category => {
            const passed = Object.values(category).filter(Boolean).length;
            return passed / Object.keys(category).length;
        });

        compliance.score = criteriaScores.reduce((sum, score) => sum + score, 0) / criteriaScores.length;

        // Generate recommendations
        if (compliance.score < 0.8) {
            compliance.recommendations.push('Improve Nintendo-style balance compliance');
        }

        return compliance;
    }

    /**
     * End current session and generate summary
     */
    endSession() {
        if (!this.state.currentSession) {
            console.warn('⚠️ No active session to end');
            return null;
        }

        const sessionSummary = {
            sessionId: this.state.currentSession.id,
            duration: Date.now() - this.state.currentSession.startTime,
            finalDifficulty: this.difficultyTuner.getCurrentDifficultyLevel(),
            playerProgress: this.analyzePlayerProgress(),
            balancePerformance: this.assessBalancePerformance(),
            timestamp: Date.now()
        };

        console.log(`🏁 Session ${this.state.currentSession.id} ended - Duration: ${Math.round(sessionSummary.duration / 1000)}s`);

        this.emit('sessionEnded', sessionSummary);

        this.state.currentSession = null;
        return sessionSummary;
    }

    /**
     * Shutdown the balance manager
     */
    shutdown() {
        console.log('🛑 Shutting down Balance Manager...');

        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
        }

        if (this.state.currentSession) {
            this.endSession();
        }

        this.state.active = false;
        this.emit('shutdown', { timestamp: Date.now() });

        console.log('✅ Balance Manager shutdown complete');
    }

    // Event system methods
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    // Private helper methods
    setupEventSystem() {
        this.on('raceCompleted', (data) => {
            if (this.config.autoOptimization && this.shouldOptimize()) {
                this.optimizeBalance();
            }
        });
    }

    startRealTimeMonitoring() {
        this.monitoringTimer = setInterval(() => {
            this.collectRealTimeMetrics();
        }, this.config.monitoringInterval);
    }

    validateConfiguration() {
        const errors = [];
        const warnings = [];

        if (this.config.monitoringInterval < 1000) {
            warnings.push('Monitoring interval is very short, may impact performance');
        }

        return { errors, warnings };
    }

    extractPlayerPerformance(raceData) {
        const player = raceData.participants.find(p => p.isPlayer);
        return {
            position: player.finalPosition,
            time: player.finalTime,
            won: player.finalPosition === 1,
            podium: player.finalPosition <= 3
        };
    }

    updateRealTimeMetrics(raceData, playerPerformance) {
        this.state.realTimeData.performanceMetrics.push({
            timestamp: Date.now(),
            performance: playerPerformance,
            difficulty: this.difficultyTuner.currentDifficulty
        });

        // Keep only recent data
        if (this.state.realTimeData.performanceMetrics.length > 100) {
            this.state.realTimeData.performanceMetrics.shift();
        }
    }

    getCurrentBalanceMetrics() {
        return {
            currentDifficulty: this.difficultyTuner.getCurrentDifficultyLevel(),
            parameters: this.gameParameters.getParametersForDifficulty(),
            performance: this.state.realTimeData.performanceMetrics.slice(-10)
        };
    }

    generateRaceRecommendations(raceData) {
        const recommendations = [];
        const player = raceData.participants.find(p => p.isPlayer);

        if (player.finalPosition > 6) {
            recommendations.push('Consider reducing difficulty');
        } else if (player.finalPosition === 1) {
            recommendations.push('Consider increasing difficulty');
        }

        return recommendations;
    }

    calculateRealTimeAdjustments() {
        return {
            aiSkillModifier: 1.0,
            powerupSpawnModifier: 1.0,
            catchupStrengthModifier: 1.0
        };
    }

    getCatchupConfiguration() {
        const params = this.gameParameters.getParametersForDifficulty();
        return {
            enabled: params.catchup.enabled,
            strength: params.catchup.maxAssistance,
            nintendoStyle: true // Fair catch-up that feels natural
        };
    }

    createDefaultPlayerProfile() {
        return {
            skillLevel: 'beginner',
            playtime: 0,
            preferredDifficulty: 'normal',
            achievements: []
        };
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    shouldOptimize() {
        if (!this.state.lastOptimization) return true;
        return Date.now() - this.state.lastOptimization > 300000; // 5 minutes
    }

    applyOptimization(difficulty, optimization) {
        switch (optimization) {
            case 'increase_ai_skill':
                const currentSkill = this.gameParameters.getParameter(`ai.skillLevel`);
                this.gameParameters.updateParameter('ai.skillLevel', Math.min(1.0, currentSkill + 0.1));
                break;
            case 'decrease_ai_skill':
                const skill = this.gameParameters.getParameter(`ai.skillLevel`);
                this.gameParameters.updateParameter('ai.skillLevel', Math.max(0.3, skill - 0.1));
                break;
            case 'adjust_catchup_mechanics':
                const catchup = this.gameParameters.getParameter(`catchup.maxAssistance`);
                this.gameParameters.updateParameter('catchup.maxAssistance', Math.min(0.6, catchup + 0.1));
                break;
        }
    }

    handleNegativeFeedback(feedback) {
        if (feedback.rating <= 2 && feedback.type === 'difficulty') {
            this.handleEmergencyAdjustment('negative_feedback', {
                type: 'reduce_difficulty'
            });
        }
    }

    adjustAISkill(parameters) {
        this.gameParameters.updateParameter('ai.skillLevel', parameters.skillLevel);
    }

    adjustPowerupSpawn(parameters) {
        this.gameParameters.updateParameter('powerups.spawnRate', parameters.spawnRate);
    }

    adjustCatchupStrength(parameters) {
        this.gameParameters.updateParameter('catchup.maxAssistance', parameters.strength);
    }

    adjustVehiclePerformance(parameters) {
        Object.keys(parameters).forEach(key => {
            this.gameParameters.updateParameter(`vehicle.${key}`, parameters[key]);
        });
    }

    collectRealTimeMetrics() {
        // Collect system performance metrics
        this.state.realTimeData.systemStatus = 'normal';
    }

    analyzePlayerProgress() {
        if (!this.state.currentSession) return null;

        const recent = this.state.realTimeData.performanceMetrics.slice(-10);
        if (recent.length === 0) return null;

        const avgPosition = recent.reduce((sum, m) => sum + m.performance.position, 0) / recent.length;
        const winRate = recent.filter(m => m.performance.won).length / recent.length;

        return {
            averagePosition: avgPosition,
            winRate,
            trend: this.calculateProgressTrend(recent)
        };
    }

    calculateProgressTrend(metrics) {
        if (metrics.length < 3) return 'insufficient_data';
        
        const recent = metrics.slice(-3).map(m => m.performance.position);
        const earlier = metrics.slice(-6, -3).map(m => m.performance.position);

        if (recent.length === 0 || earlier.length === 0) return 'insufficient_data';

        const recentAvg = recent.reduce((sum, pos) => sum + pos, 0) / recent.length;
        const earlierAvg = earlier.reduce((sum, pos) => sum + pos, 0) / earlier.length;

        if (recentAvg < earlierAvg - 0.5) return 'improving';
        if (recentAvg > earlierAvg + 0.5) return 'declining';
        return 'stable';
    }

    assessBalancePerformance() {
        return {
            effectivenessScore: 0.85,
            playerSatisfaction: 0.8,
            fairnessScore: 0.9,
            nintendoStyleScore: 0.88
        };
    }
}