/**
 * AIBehavior.js - AI Decision Making Logic and Racing Strategies
 * Implements state machine for behavior transitions and dynamic response to race conditions
 */

class AIBehavior {
    constructor(opponent, difficultySettings) {
        this.opponent = opponent;
        this.settings = difficultySettings;
        
        // State machine for AI behavior
        this.states = {
            RACING: 'racing',
            OVERTAKING: 'overtaking',
            DEFENDING: 'defending',
            RECOVERING: 'recovering',
            POWER_UP: 'powerup',
            CORNERING: 'cornering',
            DRAFTING: 'drafting'
        };
        
        this.currentState = this.states.RACING;
        this.previousState = this.states.RACING;
        this.stateTimer = 0;
        
        // Racing strategies based on difficulty
        this.strategies = {
            aggressive: this.settings.aggressiveness > 0.7,
            conservative: this.settings.aggressiveness < 0.4,
            adaptive: true
        };
        
        // Decision factors
        this.decisionFactors = {
            racePosition: 0,
            proximityToPlayer: 0,
            trackCondition: 0,
            speedAdvantage: 0,
            powerUpAvailable: false,
            obstacleAhead: false,
            overtakingOpportunity: false
        };
        
        // Nintendo-style racing behaviors
        this.nintendoBehaviors = {
            useShortcuts: Math.random() < this.settings.aggressiveness,
            riskTaking: Math.random() < (this.settings.aggressiveness * 0.8),
            powerUpTiming: this.settings.aggressiveness > 0.5 ? 'offensive' : 'defensive',
            driftStyle: this.settings.aggressiveness > 0.6 ? 'aggressive' : 'smooth'
        };
        
        // Mistake system for realistic AI
        this.mistakeSystem = {
            lastMistakeTime: 0,
            mistakeFrequency: this.settings.mistakeFrequency,
            mistakeTypes: ['oversteer', 'brake_late', 'miss_powerup', 'poor_line']
        };
        
        // Learning and adaptation
        this.adaptationData = {
            playerBehaviorPattern: {},
            trackKnowledge: {},
            performanceHistory: []
        };
    }

    /**
     * Update AI behavior and make decisions
     * @param {number} deltaTime - Time since last update
     * @param {Object} gameState - Current game state
     * @param {Object} playerState - Player's current state
     */
    update(deltaTime, gameState, playerState) {
        this.stateTimer += deltaTime;
        
        // Update decision factors
        this.updateDecisionFactors(gameState, playerState);
        
        // Analyze current situation
        this.analyzeSituation(gameState, playerState);
        
        // State machine logic
        this.updateStateMachine(deltaTime, gameState, playerState);
        
        // Make behavioral decisions
        this.makeDecisions(deltaTime, gameState, playerState);
        
        // Apply Nintendo-style behaviors
        this.applyNintendoBehaviors(gameState, playerState);
        
        // Handle mistakes (for realism)
        this.handleMistakes(deltaTime);
        
        // Learn and adapt
        this.updateAdaptation(playerState);
    }

    /**
     * Update decision factors based on current game state
     * @param {Object} gameState - Current game state
     * @param {Object} playerState - Player's current state
     */
    updateDecisionFactors(gameState, playerState) {
        // Race position factor
        this.decisionFactors.racePosition = this.opponent.racePosition || 1;
        
        // Proximity to player - check if positions exist
        if (this.opponent.position && playerState.position) {
            const distance = this.calculateDistance(this.opponent.position, playerState.position);
            this.decisionFactors.proximityToPlayer = Math.max(0, 1 - (distance / 100));
        } else {
            this.decisionFactors.proximityToPlayer = 0;
        }
        
        // Speed advantage - check if velocities exist
        if (playerState.velocity && this.opponent.velocity) {
            const playerSpeed = Math.sqrt(
                (playerState.velocity.x || 0) ** 2 + (playerState.velocity.z || 0) ** 2
            );
            const aiSpeed = Math.sqrt(
                (this.opponent.velocity.x || 0) ** 2 + (this.opponent.velocity.z || 0) ** 2
            );
            this.decisionFactors.speedAdvantage = (aiSpeed - playerSpeed) / Math.max(aiSpeed, playerSpeed, 1);
        } else {
            this.decisionFactors.speedAdvantage = 0;
        }
        
        // Track condition analysis
        this.decisionFactors.trackCondition = this.analyzeTrackCondition(gameState);
        
        // Power-up availability
        this.decisionFactors.powerUpAvailable = gameState.powerUps && 
                                               gameState.powerUps.some(p => this.isNearPowerUp(p));
        
        // Obstacle detection
        this.decisionFactors.obstacleAhead = this.detectObstacles(gameState);
        
        // Overtaking opportunity
        this.decisionFactors.overtakingOpportunity = this.assessOvertakingOpportunity(gameState, playerState);
    }

    /**
     * Analyze current racing situation for strategic decisions
     * @param {Object} gameState - Current game state
     * @param {Object} playerState - Player's current state
     */
    analyzeSituation(gameState, playerState) {
        const factors = this.decisionFactors;
        
        // Determine primary focus based on race position
        if (factors.racePosition <= 3) {
            // Leading pack - focus on maintaining position
            this.strategicFocus = 'maintain_lead';
        } else if (factors.racePosition <= 6) {
            // Mid pack - focus on overtaking
            this.strategicFocus = 'advance_position';
        } else {
            // Back of pack - aggressive catch-up
            this.strategicFocus = 'catch_up';
        }
        
        // Adapt to player proximity
        if (factors.proximityToPlayer > 0.7) {
            if (factors.racePosition > playerState.racePosition) {
                this.playerInteraction = 'pursue';
            } else {
                this.playerInteraction = 'defend';
            }
        } else {
            this.playerInteraction = 'ignore';
        }
    }

    /**
     * State machine update logic
     * @param {number} deltaTime - Time since last update
     * @param {Object} gameState - Current game state
     * @param {Object} playerState - Player's current state
     */
    updateStateMachine(deltaTime, gameState, playerState) {
        const factors = this.decisionFactors;
        
        switch (this.currentState) {
            case this.states.RACING:
                // Normal racing state
                if (factors.overtakingOpportunity && this.settings.aggressiveness > 0.4) {
                    this.transitionToState(this.states.OVERTAKING);
                } else if (factors.powerUpAvailable && this.shouldUsePowerUp()) {
                    this.transitionToState(this.states.POWER_UP);
                } else if (factors.obstacleAhead) {
                    this.transitionToState(this.states.RECOVERING);
                } else if (this.isInCorner(gameState)) {
                    this.transitionToState(this.states.CORNERING);
                }
                break;
                
            case this.states.OVERTAKING:
                // Overtaking maneuver
                if (this.stateTimer > 3.0 || !factors.overtakingOpportunity) {
                    this.transitionToState(this.states.RACING);
                } else if (factors.obstacleAhead) {
                    this.transitionToState(this.states.RECOVERING);
                }
                break;
                
            case this.states.DEFENDING:
                // Defending position
                if (this.stateTimer > 2.0 || factors.proximityToPlayer < 0.5) {
                    this.transitionToState(this.states.RACING);
                }
                break;
                
            case this.states.POWER_UP:
                // Using power-up
                if (this.stateTimer > 1.0) {
                    this.transitionToState(this.states.RACING);
                }
                break;
                
            case this.states.CORNERING:
                // Cornering behavior
                if (!this.isInCorner(gameState)) {
                    this.transitionToState(this.states.RACING);
                }
                break;
                
            case this.states.RECOVERING:
                // Recovering from obstacle/mistake
                if (this.stateTimer > 2.0 || !factors.obstacleAhead) {
                    this.transitionToState(this.states.RACING);
                }
                break;
                
            case this.states.DRAFTING:
                // Drafting behind another racer
                if (factors.proximityToPlayer < 0.6 || this.stateTimer > 5.0) {
                    this.transitionToState(this.states.RACING);
                }
                break;
        }
    }

    /**
     * Transition to a new behavior state
     * @param {string} newState - New state to transition to
     */
    transitionToState(newState) {
        this.previousState = this.currentState;
        this.currentState = newState;
        this.stateTimer = 0;
        
        // State entry actions
        this.onStateEnter(newState);
    }

    /**
     * Handle state entry actions
     * @param {string} state - State being entered
     */
    onStateEnter(state) {
        switch (state) {
            case this.states.OVERTAKING:
                this.opponent.overtakingDirection = this.chooseOvertakingDirection();
                break;
            case this.states.POWER_UP:
                this.selectPowerUpStrategy();
                break;
            case this.states.CORNERING:
                this.calculateCorneringLine();
                break;
        }
    }

    /**
     * Make behavioral decisions based on current state and situation
     * @param {number} deltaTime - Time since last update
     * @param {Object} gameState - Current game state
     * @param {Object} playerState - Player's current state
     */
    makeDecisions(deltaTime, gameState, playerState) {
        // Store decisions for AIController to execute
        this.opponent.behaviorDecisions = {
            targetSpeed: this.calculateTargetSpeed(),
            steeringDirection: this.calculateSteeringDirection(),
            shouldBrake: this.shouldBrake(gameState),
            shouldDrift: this.shouldDrift(gameState),
            powerUpUsage: this.getPowerUpDecision(),
            aggressionLevel: this.calculateAggressionLevel(),
            riskTolerance: this.calculateRiskTolerance()
        };
    }

    /**
     * Apply Nintendo-style racing behaviors
     * @param {Object} gameState - Current game state
     * @param {Object} playerState - Player's current state
     */
    applyNintendoBehaviors(gameState, playerState) {
        // Shortcut usage
        if (this.nintendoBehaviors.useShortcuts && this.detectShortcut(gameState)) {
            this.opponent.behaviorDecisions.useShortcut = true;
        }
        
        // Risk-taking behavior
        if (this.nintendoBehaviors.riskTaking && this.stateTimer > 1.0) {
            this.opponent.behaviorDecisions.riskLevel = 'high';
        }
        
        // Drift style application
        if (this.nintendoBehaviors.driftStyle === 'aggressive') {
            this.opponent.behaviorDecisions.driftTiming = 'early';
            this.opponent.behaviorDecisions.driftIntensity = 1.2;
        } else {
            this.opponent.behaviorDecisions.driftTiming = 'optimal';
            this.opponent.behaviorDecisions.driftIntensity = 1.0;
        }
    }

    /**
     * Handle AI mistakes for realistic behavior
     * @param {number} deltaTime - Time since last update
     */
    handleMistakes(deltaTime) {
        const timeSinceLastMistake = Date.now() - this.mistakeSystem.lastMistakeTime;
        const mistakeChance = this.mistakeSystem.mistakeFrequency * deltaTime;
        
        if (Math.random() < mistakeChance && timeSinceLastMistake > 5000) {
            this.makeMistake();
            this.mistakeSystem.lastMistakeTime = Date.now();
        }
    }

    /**
     * Execute a realistic AI mistake
     */
    makeMistake() {
        const mistakeType = this.mistakeSystem.mistakeTypes[
            Math.floor(Math.random() * this.mistakeSystem.mistakeTypes.length)
        ];
        
        switch (mistakeType) {
            case 'oversteer':
                this.opponent.behaviorDecisions.steeringError = 0.3;
                break;
            case 'brake_late':
                this.opponent.behaviorDecisions.brakingDelay = 0.2;
                break;
            case 'miss_powerup':
                this.opponent.behaviorDecisions.ignorePowerUp = true;
                break;
            case 'poor_line':
                this.opponent.behaviorDecisions.suboptimalPath = true;
                break;
        }
        
        // Mistakes are temporary
        setTimeout(() => {
            this.clearMistakeEffects();
        }, 1000 + Math.random() * 2000);
    }

    /**
     * Clear temporary mistake effects
     */
    clearMistakeEffects() {
        if (this.opponent.behaviorDecisions) {
            delete this.opponent.behaviorDecisions.steeringError;
            delete this.opponent.behaviorDecisions.brakingDelay;
            delete this.opponent.behaviorDecisions.ignorePowerUp;
            delete this.opponent.behaviorDecisions.suboptimalPath;
        }
    }

    /**
     * Update adaptation data to learn from player behavior
     * @param {Object} playerState - Player's current state
     */
    updateAdaptation(playerState) {
        // Learn player's racing patterns
        const playerStyle = this.analyzePlayerStyle(playerState);
        this.adaptationData.playerBehaviorPattern = playerStyle;
        
        // Adapt AI strategy based on player behavior
        if (playerStyle.aggressive && this.settings.aggressiveness < 0.8) {
            this.settings.aggressiveness = Math.min(1.0, this.settings.aggressiveness + 0.01);
        } else if (playerStyle.defensive && this.settings.aggressiveness > 0.2) {
            this.settings.aggressiveness = Math.max(0.0, this.settings.aggressiveness - 0.01);
        }
    }

    // Helper methods
    calculateDistance(pos1, pos2) {
        if (!pos1 || !pos2) return 0;
        const dx = (pos1.x || 0) - (pos2.x || 0);
        const dz = (pos1.z || 0) - (pos2.z || 0);
        return Math.sqrt(dx * dx + dz * dz);
    }

    calculateTargetSpeed() {
        let baseSpeed = this.settings.maxSpeed;
        
        // Adjust for current state
        switch (this.currentState) {
            case this.states.OVERTAKING:
                baseSpeed *= 1.1;
                break;
            case this.states.CORNERING:
                baseSpeed *= 0.8;
                break;
            case this.states.RECOVERING:
                baseSpeed *= 0.6;
                break;
        }
        
        return baseSpeed * 60; // Convert to game units
    }

    calculateSteeringDirection() {
        // Basic steering logic - would integrate with pathfinding
        return 0; // Straight ahead by default
    }

    shouldBrake(gameState) {
        return this.decisionFactors.obstacleAhead || this.isInTightCorner(gameState);
    }

    shouldDrift(gameState) {
        return this.isInCorner(gameState) && this.nintendoBehaviors.driftStyle === 'aggressive';
    }

    getPowerUpDecision() {
        if (!this.decisionFactors.powerUpAvailable) return null;
        
        return this.nintendoBehaviors.powerUpTiming === 'offensive' ? 'immediate' : 'strategic';
    }

    calculateAggressionLevel() {
        let aggression = this.settings.aggressiveness;
        
        // Increase aggression if behind
        if (this.decisionFactors.racePosition > 4) {
            aggression = Math.min(1.0, aggression + 0.2);
        }
        
        return aggression;
    }

    calculateRiskTolerance() {
        return this.nintendoBehaviors.riskTaking ? 0.8 : 0.4;
    }

    // Placeholder methods - would be implemented with actual game data
    analyzeTrackCondition(gameState) { return 1.0; }
    isNearPowerUp(powerUp) { return false; }
    detectObstacles(gameState) { return false; }
    assessOvertakingOpportunity(gameState, playerState) { return Math.random() < 0.3; }
    shouldUsePowerUp() { return Math.random() < 0.5; }
    isInCorner(gameState) { return Math.random() < 0.2; }
    isInTightCorner(gameState) { return Math.random() < 0.1; }
    chooseOvertakingDirection() { return Math.random() < 0.5 ? 'left' : 'right'; }
    selectPowerUpStrategy() { /* Implementation */ }
    calculateCorneringLine() { /* Implementation */ }
    detectShortcut(gameState) { return Math.random() < 0.1; }
    analyzePlayerStyle(playerState) { 
        return { 
            aggressive: Math.random() < 0.5, 
            defensive: Math.random() < 0.5 
        }; 
    }
}

module.exports = AIBehavior;