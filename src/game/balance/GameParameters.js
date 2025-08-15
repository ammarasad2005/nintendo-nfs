/**
 * GameParameters.js
 * 
 * Manages all game parameter configurations for balancing
 * Provides vehicle physics, track difficulty, power-ups, and scoring parameters
 */

export class GameParameters {
    constructor() {
        this.parameters = this.getDefaultParameters();
        this.difficultyModifiers = this.getDifficultyModifiers();
    }

    /**
     * Get default game parameters
     */
    getDefaultParameters() {
        return {
            // Vehicle Physics Parameters
            vehicle: {
                acceleration: {
                    min: 0.5,
                    normal: 1.0,
                    max: 2.0
                },
                topSpeed: {
                    min: 80,
                    normal: 120,
                    max: 180
                },
                handling: {
                    min: 0.3,
                    normal: 0.7,
                    max: 1.0
                },
                drift: {
                    effectiveness: 0.8,
                    speedRetention: 0.85,
                    controlFactor: 0.9
                },
                boost: {
                    acceleration: 1.5,
                    duration: 3000, // milliseconds
                    cooldown: 2000
                }
            },

            // Track Difficulty Settings
            track: {
                curves: {
                    sharpness: 1.0,
                    frequency: 1.0
                },
                obstacles: {
                    density: 1.0,
                    damage: 0.1
                },
                shortcuts: {
                    difficulty: 1.0,
                    timeAdvantage: 0.15
                }
            },

            // AI Opponent Parameters
            ai: {
                skillLevel: 0.7,
                aggressiveness: 0.5,
                mistakeFrequency: 0.1,
                rubberBanding: 0.3, // Catch-up assistance
                reactionTime: 0.2 // seconds
            },

            // Power-up System
            powerups: {
                spawnRate: 0.8, // per lap section
                effectiveness: {
                    speedBoost: 1.3,
                    invincibility: 3000, // milliseconds
                    shield: 5000,
                    missile: 1.0
                },
                distribution: {
                    speedBoost: 0.35,
                    invincibility: 0.15,
                    shield: 0.25,
                    missile: 0.15,
                    special: 0.10
                }
            },

            // Scoring and Progression
            scoring: {
                positionMultipliers: [2.0, 1.5, 1.2, 1.0, 0.8, 0.6, 0.4, 0.2],
                timeBonus: 1.0,
                driftBonus: 50,
                overtakeBonus: 100,
                powerupBonus: 25
            },

            // Catch-up Mechanics
            catchup: {
                enabled: true,
                maxAssistance: 0.4,
                distanceThreshold: 100, // meters
                assistanceRamp: 0.1
            }
        };
    }

    /**
     * Get difficulty-specific modifiers
     */
    getDifficultyModifiers() {
        return {
            easy: {
                vehicle: {
                    acceleration: 1.2,
                    topSpeed: 1.1,
                    handling: 1.3
                },
                ai: {
                    skillLevel: 0.5,
                    aggressiveness: 0.3,
                    mistakeFrequency: 0.2,
                    rubberBanding: 0.1
                },
                powerups: {
                    spawnRate: 1.3,
                    effectiveness: 1.2
                },
                scoring: {
                    multiplier: 0.8
                },
                catchup: {
                    maxAssistance: 0.6
                }
            },
            normal: {
                vehicle: {
                    acceleration: 1.0,
                    topSpeed: 1.0,
                    handling: 1.0
                },
                ai: {
                    skillLevel: 0.7,
                    aggressiveness: 0.5,
                    mistakeFrequency: 0.1,
                    rubberBanding: 0.3
                },
                powerups: {
                    spawnRate: 1.0,
                    effectiveness: 1.0
                },
                scoring: {
                    multiplier: 1.0
                },
                catchup: {
                    maxAssistance: 0.4
                }
            },
            hard: {
                vehicle: {
                    acceleration: 0.9,
                    topSpeed: 0.95,
                    handling: 0.8
                },
                ai: {
                    skillLevel: 0.9,
                    aggressiveness: 0.8,
                    mistakeFrequency: 0.05,
                    rubberBanding: 0.5
                },
                powerups: {
                    spawnRate: 0.7,
                    effectiveness: 0.9
                },
                scoring: {
                    multiplier: 1.5
                },
                catchup: {
                    maxAssistance: 0.2
                }
            }
        };
    }

    /**
     * Get parameters for specific difficulty level
     */
    getParametersForDifficulty(difficulty = 'normal') {
        const baseParams = JSON.parse(JSON.stringify(this.parameters));
        const modifiers = this.difficultyModifiers[difficulty] || this.difficultyModifiers.normal;

        return this.applyModifiers(baseParams, modifiers);
    }

    /**
     * Apply modifiers to base parameters
     */
    applyModifiers(params, modifiers) {
        const result = JSON.parse(JSON.stringify(params));

        // Apply vehicle modifiers
        if (modifiers.vehicle) {
            Object.keys(modifiers.vehicle).forEach(key => {
                if (result.vehicle[key]) {
                    if (typeof result.vehicle[key] === 'object' && !Array.isArray(result.vehicle[key])) {
                        Object.keys(result.vehicle[key]).forEach(subKey => {
                            result.vehicle[key][subKey] *= modifiers.vehicle[key];
                        });
                    } else {
                        result.vehicle[key] *= modifiers.vehicle[key];
                    }
                }
            });
        }

        // Apply AI modifiers
        if (modifiers.ai) {
            Object.keys(modifiers.ai).forEach(key => {
                if (result.ai[key] !== undefined) {
                    result.ai[key] = modifiers.ai[key];
                }
            });
        }

        // Apply power-up modifiers
        if (modifiers.powerups) {
            Object.keys(modifiers.powerups).forEach(key => {
                if (result.powerups[key] !== undefined) {
                    if (typeof result.powerups[key] === 'object') {
                        Object.keys(result.powerups[key]).forEach(subKey => {
                            result.powerups[key][subKey] *= modifiers.powerups[key];
                        });
                    } else {
                        result.powerups[key] *= modifiers.powerups[key];
                    }
                }
            });
        }

        // Apply scoring modifiers
        if (modifiers.scoring) {
            result.scoring.positionMultipliers = result.scoring.positionMultipliers.map(
                multiplier => multiplier * (modifiers.scoring.multiplier || 1.0)
            );
        }

        // Apply catch-up modifiers
        if (modifiers.catchup) {
            Object.keys(modifiers.catchup).forEach(key => {
                if (result.catchup[key] !== undefined) {
                    result.catchup[key] = modifiers.catchup[key];
                }
            });
        }

        return result;
    }

    /**
     * Update a specific parameter
     */
    updateParameter(path, value) {
        const keys = path.split('.');
        let current = this.parameters;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
    }

    /**
     * Get a specific parameter value
     */
    getParameter(path) {
        const keys = path.split('.');
        let current = this.parameters;

        for (const key of keys) {
            if (current[key] === undefined) {
                return null;
            }
            current = current[key];
        }

        return current;
    }

    /**
     * Reset parameters to default values
     */
    resetToDefaults() {
        this.parameters = this.getDefaultParameters();
    }

    /**
     * Validate parameter values are within acceptable ranges
     */
    validateParameters() {
        const validationRules = {
            'vehicle.acceleration.normal': { min: 0.1, max: 5.0 },
            'vehicle.topSpeed.normal': { min: 50, max: 300 },
            'vehicle.handling.normal': { min: 0.1, max: 2.0 },
            'ai.skillLevel': { min: 0.0, max: 1.0 },
            'ai.aggressiveness': { min: 0.0, max: 1.0 },
            'powerups.spawnRate': { min: 0.0, max: 3.0 }
        };

        const violations = [];

        Object.keys(validationRules).forEach(path => {
            const value = this.getParameter(path);
            const rule = validationRules[path];

            if (value !== null) {
                if (value < rule.min || value > rule.max) {
                    violations.push({
                        path,
                        value,
                        expected: `${rule.min} - ${rule.max}`
                    });
                }
            }
        });

        return violations;
    }
}