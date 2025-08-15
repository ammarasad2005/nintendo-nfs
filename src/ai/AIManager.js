/**
 * AIManager.js - AI Opponent Management System
 * Handles AI opponent spawning, difficulty levels, and performance optimization
 */

class AIManager {
    constructor() {
        this.opponents = new Map();
        this.maxOpponents = 7; // Nintendo-style racing typically has 8 total racers
        this.difficultySettings = {
            easy: {
                reactionTime: 0.5,
                maxSpeed: 0.85,
                aggressiveness: 0.3,
                mistakeFrequency: 0.4,
                rubberbandStrength: 0.2
            },
            medium: {
                reactionTime: 0.3,
                maxSpeed: 0.95,
                aggressiveness: 0.6,
                mistakeFrequency: 0.2,
                rubberbandStrength: 0.4
            },
            hard: {
                reactionTime: 0.1,
                maxSpeed: 1.0,
                aggressiveness: 0.8,
                mistakeFrequency: 0.1,
                rubberbandStrength: 0.6
            }
        };
        this.performanceOptimization = {
            updateFrequency: 60, // AI updates per second
            cullingDistance: 1000, // Distance beyond which AI simplifies
            maxActiveAI: 4 // Maximum AI with full processing
        };
    }

    /**
     * Initialize AI opponents for a race
     * @param {number} numOpponents - Number of AI opponents to spawn
     * @param {string} difficulty - Overall difficulty level
     * @param {Object} trackData - Track information for pathfinding
     */
    initializeRace(numOpponents, difficulty, trackData) {
        this.clearOpponents();
        
        for (let i = 0; i < Math.min(numOpponents, this.maxOpponents); i++) {
            const opponentId = `ai_${i}`;
            const opponentDifficulty = this.getVariedDifficulty(difficulty, i);
            
            const opponent = {
                id: opponentId,
                difficulty: opponentDifficulty,
                settings: this.difficultySettings[opponentDifficulty],
                position: { x: 0, y: 0, z: 0 },
                velocity: { x: 0, y: 0, z: 0 },
                currentLap: 1,
                racePosition: i + 2, // Player starts at position 1
                isActive: true,
                lastUpdateTime: Date.now(),
                behavior: null, // Will be set by AIBehavior
                controller: null, // Will be set by AIController
                pathfinder: null // Will be set by PathFinding
            };
            
            this.opponents.set(opponentId, opponent);
        }
        
        console.log(`Initialized ${numOpponents} AI opponents with ${difficulty} difficulty`);
        return Array.from(this.opponents.values());
    }

    /**
     * Get varied difficulty for different opponents to create diverse racing
     * @param {string} baseDifficulty - Base difficulty level
     * @param {number} opponentIndex - Index of the opponent
     * @returns {string} Adjusted difficulty level
     */
    getVariedDifficulty(baseDifficulty, opponentIndex) {
        const difficulties = ['easy', 'medium', 'hard'];
        const baseIndex = difficulties.indexOf(baseDifficulty);
        
        // Add some variation: 60% base difficulty, 20% easier, 20% harder
        const random = Math.random();
        if (random < 0.2 && baseIndex > 0) {
            return difficulties[baseIndex - 1]; // Easier
        } else if (random < 0.4 && baseIndex < difficulties.length - 1) {
            return difficulties[baseIndex + 1]; // Harder
        }
        return baseDifficulty; // Same as base
    }

    /**
     * Update all AI opponents
     * @param {number} deltaTime - Time since last update
     * @param {Object} gameState - Current game state
     * @param {Object} playerState - Player's current state
     */
    update(deltaTime, gameState, playerState) {
        const currentTime = Date.now();
        const activeOpponents = this.getActiveOpponents();
        
        // Performance optimization: limit concurrent AI processing
        let processedCount = 0;
        
        for (const [id, opponent] of this.opponents) {
            if (!opponent.isActive) continue;
            
            // Distance-based optimization
            const distanceToPlayer = this.calculateDistance(opponent.position, playerState.position);
            const shouldFullProcess = processedCount < this.performanceOptimization.maxActiveAI && 
                                    distanceToPlayer < this.performanceOptimization.cullingDistance;
            
            if (shouldFullProcess) {
                this.updateOpponent(opponent, deltaTime, gameState, playerState);
                processedCount++;
            } else {
                // Simplified update for distant AI
                this.updateOpponentSimplified(opponent, deltaTime, gameState);
            }
            
            opponent.lastUpdateTime = currentTime;
        }
        
        // Update race positions
        this.updateRacePositions(playerState);
    }

    /**
     * Full AI opponent update
     * @param {Object} opponent - AI opponent to update
     * @param {number} deltaTime - Time since last update
     * @param {Object} gameState - Current game state
     * @param {Object} playerState - Player's current state
     */
    updateOpponent(opponent, deltaTime, gameState, playerState) {
        // This will be called by the respective AI components
        if (opponent.behavior && typeof opponent.behavior.update === 'function') {
            opponent.behavior.update(deltaTime, gameState, playerState);
        }
        if (opponent.controller && typeof opponent.controller.update === 'function') {
            opponent.controller.update(deltaTime, gameState);
        }
        if (opponent.pathfinder && typeof opponent.pathfinder.updateDynamicObstacles === 'function') {
            // PathFinding doesn't have an update method, but has updateDynamicObstacles
            opponent.pathfinder.updateDynamicObstacles(
                gameState.racers || [], 
                gameState.powerUps || [], 
                gameState.debris || []
            );
        }
    }

    /**
     * Simplified AI opponent update for performance optimization
     * @param {Object} opponent - AI opponent to update
     * @param {number} deltaTime - Time since last update
     * @param {Object} gameState - Current game state
     */
    updateOpponentSimplified(opponent, deltaTime, gameState) {
        // Basic position interpolation without complex AI logic
        // This maintains visual continuity while reducing CPU load
        const basicSpeed = opponent.settings.maxSpeed * 50; // Simplified constant speed
        opponent.position.x += Math.cos(opponent.heading || 0) * basicSpeed * deltaTime;
        opponent.position.z += Math.sin(opponent.heading || 0) * basicSpeed * deltaTime;
    }

    /**
     * Update race positions based on track progress
     * @param {Object} playerState - Player's current state
     */
    updateRacePositions(playerState) {
        const allRacers = [
            { id: 'player', ...playerState },
            ...Array.from(this.opponents.values())
        ];
        
        // Sort by lap and track progress
        allRacers.sort((a, b) => {
            if (a.currentLap !== b.currentLap) {
                return b.currentLap - a.currentLap;
            }
            return (b.trackProgress || 0) - (a.trackProgress || 0);
        });
        
        // Update positions
        allRacers.forEach((racer, index) => {
            if (racer.id === 'player') {
                playerState.racePosition = index + 1;
            } else {
                racer.racePosition = index + 1;
            }
        });
    }

    /**
     * Get opponent by ID
     * @param {string} opponentId - ID of the opponent
     * @returns {Object|null} Opponent object or null if not found
     */
    getOpponent(opponentId) {
        return this.opponents.get(opponentId) || null;
    }

    /**
     * Get all active opponents
     * @returns {Array} Array of active opponent objects
     */
    getActiveOpponents() {
        return Array.from(this.opponents.values()).filter(opponent => opponent.isActive);
    }

    /**
     * Remove an opponent from the race
     * @param {string} opponentId - ID of the opponent to remove
     */
    removeOpponent(opponentId) {
        if (this.opponents.has(opponentId)) {
            this.opponents.get(opponentId).isActive = false;
            this.opponents.delete(opponentId);
        }
    }

    /**
     * Clear all opponents
     */
    clearOpponents() {
        this.opponents.clear();
    }

    /**
     * Calculate distance between two positions
     * @param {Object} pos1 - First position {x, y, z}
     * @param {Object} pos2 - Second position {x, y, z}
     * @returns {number} Distance between positions
     */
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Apply rubber banding effect to keep races competitive
     * @param {Object} opponent - AI opponent
     * @param {Object} playerState - Player's current state
     */
    applyRubberBanding(opponent, playerState) {
        const speedModifier = opponent.settings.rubberbandStrength;
        const playerPosition = playerState.racePosition || 1;
        const opponentPosition = opponent.racePosition || 1;
        
        if (playerPosition > opponentPosition) {
            // Player is behind, slow down AI slightly
            opponent.speedMultiplier = 1 - (speedModifier * 0.5);
        } else if (playerPosition < opponentPosition) {
            // Player is ahead, speed up AI slightly
            opponent.speedMultiplier = 1 + speedModifier;
        } else {
            opponent.speedMultiplier = 1;
        }
    }

    /**
     * Get AI statistics for debugging/monitoring
     * @returns {Object} AI performance statistics
     */
    getStatistics() {
        const activeCount = this.getActiveOpponents().length;
        const totalCount = this.opponents.size;
        
        return {
            activeOpponents: activeCount,
            totalOpponents: totalCount,
            averageUpdateTime: this.calculateAverageUpdateTime(),
            performanceOptimization: this.performanceOptimization
        };
    }

    /**
     * Calculate average update time for performance monitoring
     * @returns {number} Average update time in milliseconds
     */
    calculateAverageUpdateTime() {
        // This would be implemented with actual timing data
        return 16.67; // Target: 60 FPS = ~16.67ms per frame
    }
}

module.exports = AIManager;