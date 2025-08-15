/**
 * DifficultyTuner.js
 * 
 * Manages difficulty level adjustments and AI behavior tuning
 * Provides dynamic difficulty scaling and challenge progression
 */

export class DifficultyTuner {
    constructor(gameParameters) {
        this.gameParameters = gameParameters;
        this.currentDifficulty = 'normal';
        this.dynamicAdjustment = {
            enabled: true,
            adjustmentRate: 0.1,
            performanceWindow: 10, // races
            targetWinRate: 0.4 // 40% player win rate target
        };
        this.performanceHistory = [];
        this.difficultyLevels = ['easy', 'normal', 'hard'];
        this.customDifficultyFactors = {};
    }

    /**
     * Set the current difficulty level
     */
    setDifficulty(difficulty) {
        if (!this.difficultyLevels.includes(difficulty)) {
            console.warn(`Invalid difficulty level: ${difficulty}. Using 'normal' instead.`);
            difficulty = 'normal';
        }
        
        this.currentDifficulty = difficulty;
        return this.getCurrentDifficultyParams();
    }

    /**
     * Get current difficulty parameters
     */
    getCurrentDifficultyParams() {
        return this.gameParameters.getParametersForDifficulty(this.currentDifficulty);
    }

    /**
     * Adjust AI behavior based on difficulty
     */
    adjustAIBehavior(difficulty = this.currentDifficulty) {
        const params = this.gameParameters.getParametersForDifficulty(difficulty);
        const aiConfig = params.ai;

        return {
            // Speed and acceleration adjustments
            speedMultiplier: this.calculateSpeedMultiplier(aiConfig.skillLevel),
            
            // Reaction time and decision making
            reactionDelay: aiConfig.reactionTime * 1000, // Convert to milliseconds
            
            // Mistake probability
            mistakeProbability: aiConfig.mistakeFrequency,
            
            // Aggressiveness in overtaking and blocking
            aggressiveness: aiConfig.aggressiveness,
            
            // Rubber-banding assistance
            rubberBanding: {
                enabled: aiConfig.rubberBanding > 0,
                strength: aiConfig.rubberBanding,
                activationDistance: 50 + (aiConfig.rubberBanding * 100)
            },
            
            // Power-up usage strategy
            powerupStrategy: this.getPowerupStrategy(aiConfig.skillLevel, aiConfig.aggressiveness)
        };
    }

    /**
     * Calculate speed multiplier based on skill level
     */
    calculateSpeedMultiplier(skillLevel) {
        // Skill level 0.0 = 85% speed, 1.0 = 105% speed
        return 0.85 + (skillLevel * 0.20);
    }

    /**
     * Get power-up usage strategy for AI
     */
    getPowerupStrategy(skillLevel, aggressiveness) {
        return {
            // How likely AI is to use power-ups immediately vs. saving them
            immediateUse: 0.3 + (aggressiveness * 0.4),
            
            // How strategically AI uses defensive vs. offensive power-ups
            defensivePreference: Math.max(0.1, 0.8 - aggressiveness),
            
            // How well AI times power-up usage
            timingAccuracy: skillLevel,
            
            // How likely AI is to collect power-ups
            collectionPriority: 0.5 + (skillLevel * 0.4)
        };
    }

    /**
     * Adjust speed and handling curves based on difficulty
     */
    adjustSpeedHandlingCurves(difficulty = this.currentDifficulty) {
        const params = this.gameParameters.getParametersForDifficulty(difficulty);
        
        return {
            // Acceleration curve (how quickly vehicles reach top speed)
            accelerationCurve: this.createAccelerationCurve(params.vehicle.acceleration),
            
            // Top speed scaling
            topSpeedMultiplier: params.vehicle.topSpeed.normal / 120, // normalized to base 120
            
            // Handling responsiveness
            handlingCurve: this.createHandlingCurve(params.vehicle.handling),
            
            // Drift effectiveness
            driftConfig: {
                effectiveness: params.vehicle.drift.effectiveness,
                speedRetention: params.vehicle.drift.speedRetention,
                controlFactor: params.vehicle.drift.controlFactor
            }
        };
    }

    /**
     * Create acceleration curve based on parameters
     */
    createAccelerationCurve(accelerationParams) {
        const baseAccel = accelerationParams.normal;
        
        return {
            // Initial acceleration (0-25% speed)
            initial: baseAccel * 1.2,
            
            // Mid-range acceleration (25-75% speed)
            midRange: baseAccel * 1.0,
            
            // High-speed acceleration (75-100% speed)
            highSpeed: baseAccel * 0.6,
            
            // Boost acceleration
            boost: baseAccel * 1.5
        };
    }

    /**
     * Create handling curve based on parameters
     */
    createHandlingCurve(handlingParams) {
        const baseHandling = handlingParams.normal;
        
        return {
            // Low speed handling (high responsiveness)
            lowSpeed: baseHandling * 1.3,
            
            // Medium speed handling
            mediumSpeed: baseHandling * 1.0,
            
            // High speed handling (reduced for realism)
            highSpeed: baseHandling * 0.7,
            
            // Drift handling
            drift: baseHandling * 0.9
        };
    }

    /**
     * Scale power-up effectiveness based on difficulty
     */
    scalePowerupEffectiveness(difficulty = this.currentDifficulty) {
        const params = this.gameParameters.getParametersForDifficulty(difficulty);
        const powerupConfig = params.powerups;
        
        return {
            // Speed boost power and duration
            speedBoost: {
                multiplier: powerupConfig.effectiveness.speedBoost,
                duration: 3000 * powerupConfig.effectiveness.speedBoost
            },
            
            // Invincibility duration
            invincibility: {
                duration: powerupConfig.effectiveness.invincibility
            },
            
            // Shield strength and duration
            shield: {
                duration: powerupConfig.effectiveness.shield,
                strength: 1.0
            },
            
            // Missile accuracy and damage
            missile: {
                accuracy: 0.7 + (powerupConfig.effectiveness.missile * 0.2),
                damage: powerupConfig.effectiveness.missile
            },
            
            // Spawn rate modification
            spawnRate: powerupConfig.spawnRate
        };
    }

    /**
     * Implement challenge progression system
     */
    progressChallenge(raceNumber, totalRaces) {
        const progressRatio = raceNumber / totalRaces;
        
        // Gradually increase difficulty as player progresses
        const difficultyProgression = {
            // AI skill increases slightly over time
            aiSkillBonus: progressRatio * 0.2,
            
            // Track complexity increases
            trackComplexity: 1.0 + (progressRatio * 0.5),
            
            // Power-up availability decreases slightly
            powerupAvailability: 1.0 - (progressRatio * 0.2),
            
            // Score requirements increase
            scoreMultiplier: 1.0 + (progressRatio * 0.3)
        };
        
        return difficultyProgression;
    }

    /**
     * Dynamic difficulty adjustment based on player performance
     */
    adjustDifficultyDynamically(playerPerformance) {
        if (!this.dynamicAdjustment.enabled) {
            return this.currentDifficulty;
        }

        this.performanceHistory.push(playerPerformance);
        
        // Keep only recent performance data
        if (this.performanceHistory.length > this.dynamicAdjustment.performanceWindow) {
            this.performanceHistory.shift();
        }

        // Calculate recent win rate
        const recentWins = this.performanceHistory.filter(p => p.won).length;
        const winRate = recentWins / this.performanceHistory.length;

        // Adjust difficulty if win rate is too far from target
        const targetWinRate = this.dynamicAdjustment.targetWinRate;
        const adjustmentThreshold = 0.15;

        if (winRate > targetWinRate + adjustmentThreshold) {
            // Player is winning too much, increase difficulty
            this.adjustDifficultyFactor('increase');
        } else if (winRate < targetWinRate - adjustmentThreshold) {
            // Player is losing too much, decrease difficulty
            this.adjustDifficultyFactor('decrease');
        }

        return this.getCurrentDifficultyLevel();
    }

    /**
     * Adjust difficulty factor dynamically
     */
    adjustDifficultyFactor(direction) {
        const adjustment = this.dynamicAdjustment.adjustmentRate;
        
        if (!this.customDifficultyFactors[this.currentDifficulty]) {
            this.customDifficultyFactors[this.currentDifficulty] = 1.0;
        }

        if (direction === 'increase') {
            this.customDifficultyFactors[this.currentDifficulty] = 
                Math.min(1.5, this.customDifficultyFactors[this.currentDifficulty] + adjustment);
        } else if (direction === 'decrease') {
            this.customDifficultyFactors[this.currentDifficulty] = 
                Math.max(0.5, this.customDifficultyFactors[this.currentDifficulty] - adjustment);
        }
    }

    /**
     * Get current effective difficulty level accounting for dynamic adjustments
     */
    getCurrentDifficultyLevel() {
        const baseFactor = this.customDifficultyFactors[this.currentDifficulty] || 1.0;
        
        return {
            level: this.currentDifficulty,
            factor: baseFactor,
            effective: this.currentDifficulty + (baseFactor > 1.0 ? '+' : baseFactor < 1.0 ? '-' : '')
        };
    }

    /**
     * Reset dynamic difficulty adjustments
     */
    resetDynamicAdjustments() {
        this.performanceHistory = [];
        this.customDifficultyFactors = {};
    }

    /**
     * Configure dynamic difficulty settings
     */
    configureDynamicAdjustment(config) {
        this.dynamicAdjustment = {
            ...this.dynamicAdjustment,
            ...config
        };
    }

    /**
     * Get comprehensive difficulty configuration for current settings
     */
    getDifficultyConfiguration() {
        const params = this.getCurrentDifficultyParams();
        const aiConfig = this.adjustAIBehavior();
        const curveConfig = this.adjustSpeedHandlingCurves();
        const powerupConfig = this.scalePowerupEffectiveness();

        return {
            level: this.getCurrentDifficultyLevel(),
            parameters: params,
            ai: aiConfig,
            curves: curveConfig,
            powerups: powerupConfig,
            dynamicAdjustment: this.dynamicAdjustment
        };
    }
}