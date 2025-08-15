/**
 * AIController.js - Vehicle Control Implementation
 * Handles physics integration, speed/steering management, collision avoidance, and power-up usage
 */

class AIController {
    constructor(opponent, vehicle, difficultySettings) {
        this.opponent = opponent;
        this.vehicle = vehicle;
        this.settings = difficultySettings;
        
        // Control parameters
        this.controls = {
            throttle: 0,      // 0-1 throttle input
            brake: 0,         // 0-1 brake input
            steering: 0,      // -1 to 1 steering input
            drift: false,     // Drift mode active
            powerUp: false    // Power-up activation
        };
        
        // Physics integration
        this.physics = {
            maxSpeed: this.settings.maxSpeed * 100, // Convert to game units
            acceleration: 50,
            deceleration: 80,
            brakeForce: 120,
            steeringSpeed: 2.0,
            driftThreshold: 0.8,
            frictionCoefficient: 0.7
        };
        
        // Collision avoidance
        this.collisionAvoidance = {
            enabled: true,
            detectionRadius: 25,
            avoidanceStrength: 1.0,
            emergencyBrakeDistance: 15,
            sideStepDistance: 10
        };
        
        // Power-up management
        this.powerUpSystem = {
            currentPowerUp: null,
            usageStrategy: 'optimal', // 'aggressive', 'defensive', 'optimal'
            cooldownTime: 0,
            inventory: []
        };
        
        // Nintendo-style mechanics
        this.nintendoMechanics = {
            driftBoost: {
                enabled: true,
                chargeLevel: 0,    // 0-3 (blue, orange, purple)
                boostMultiplier: [1.0, 1.2, 1.4, 1.6],
                chargingRate: 0.5
            },
            miniTurbo: {
                enabled: true,
                duration: 0,
                speedBoost: 1.3
            },
            slipstream: {
                enabled: true,
                detectionDistance: 30,
                speedBoost: 1.1,
                currentBoost: 1.0
            }
        };
        
        // Control smoothing
        this.smoothing = {
            steeringSmooth: 0.2,
            throttleSmooth: 0.15,
            brakeSmooth: 0.25
        };
        
        // AI reaction system
        this.reactionSystem = {
            reactionTime: this.settings.reactionTime,
            pendingInputs: [],
            inputDelay: 0
        };
        
        // Performance tracking
        this.performanceMetrics = {
            averageSpeed: 0,
            corneringSpeed: 0,
            driftEfficiency: 0,
            collisionCount: 0,
            powerUpEfficiency: 0
        };
    }

    /**
     * Update AI vehicle control
     * @param {number} deltaTime - Time since last update
     * @param {Object} gameState - Current game state
     */
    update(deltaTime, gameState) {
        // Process behavioral decisions from AIBehavior
        this.processDecisions(deltaTime);
        
        // Update physics state
        this.updatePhysics(deltaTime);
        
        // Handle collision avoidance
        this.updateCollisionAvoidance(deltaTime, gameState);
        
        // Manage power-ups
        this.updatePowerUpSystem(deltaTime, gameState);
        
        // Apply Nintendo-style mechanics
        this.updateNintendoMechanics(deltaTime, gameState);
        
        // Apply reaction time delays
        this.updateReactionSystem(deltaTime);
        
        // Smooth control inputs
        this.smoothControls(deltaTime);
        
        // Apply final controls to vehicle
        this.applyControlsToVehicle(deltaTime);
        
        // Update performance metrics
        this.updatePerformanceMetrics(deltaTime);
    }

    /**
     * Process decisions from AIBehavior component
     * @param {number} deltaTime - Time since last update
     */
    processDecisions(deltaTime) {
        const decisions = this.opponent.behaviorDecisions;
        if (!decisions) return;
        
        // Target speed control
        if (decisions.targetSpeed !== undefined) {
            this.setTargetSpeed(decisions.targetSpeed);
        }
        
        // Steering control
        if (decisions.steeringDirection !== undefined) {
            this.setTargetSteering(decisions.steeringDirection);
        }
        
        // Braking
        if (decisions.shouldBrake) {
            this.setBraking(true);
        }
        
        // Drifting
        if (decisions.shouldDrift) {
            this.startDrift();
        }
        
        // Power-up usage
        if (decisions.powerUpUsage) {
            this.handlePowerUpDecision(decisions.powerUpUsage);
        }
        
        // Apply mistake effects
        this.applyMistakeEffects(decisions);
    }

    /**
     * Set target speed for the AI
     * @param {number} targetSpeed - Target speed in game units
     */
    setTargetSpeed(targetSpeed) {
        const currentSpeed = this.getCurrentSpeed();
        const speedDifference = targetSpeed - currentSpeed;
        
        if (speedDifference > 5) {
            // Need to accelerate
            this.controls.throttle = Math.min(1.0, speedDifference / 50);
            this.controls.brake = 0;
        } else if (speedDifference < -5) {
            // Need to slow down
            this.controls.throttle = 0;
            this.controls.brake = Math.min(1.0, Math.abs(speedDifference) / 30);
        } else {
            // Maintain speed
            this.controls.throttle = 0.3;
            this.controls.brake = 0;
        }
    }

    /**
     * Set target steering direction
     * @param {number} steeringDirection - Target steering (-1 to 1)
     */
    setTargetSteering(steeringDirection) {
        this.targetSteering = Math.max(-1, Math.min(1, steeringDirection));
    }

    /**
     * Set braking state
     * @param {boolean} shouldBrake - Whether to brake
     */
    setBraking(shouldBrake) {
        if (shouldBrake) {
            this.controls.brake = 0.8;
            this.controls.throttle = 0;
        }
    }

    /**
     * Start drift mode
     */
    startDrift() {
        if (this.nintendoMechanics.driftBoost.enabled) {
            this.controls.drift = true;
            this.nintendoMechanics.driftBoost.chargeLevel = 0;
        }
    }

    /**
     * Handle power-up usage decisions
     * @param {string} decision - Power-up usage decision
     */
    handlePowerUpDecision(decision) {
        switch (decision) {
            case 'immediate':
                this.usePowerUpImmediate();
                break;
            case 'strategic':
                this.usePowerUpStrategic();
                break;
            case 'defensive':
                this.usePowerUpDefensive();
                break;
        }
    }

    /**
     * Apply mistake effects to controls
     * @param {Object} decisions - Behavioral decisions with mistake data
     */
    applyMistakeEffects(decisions) {
        // Steering error
        if (decisions.steeringError) {
            this.targetSteering += (Math.random() - 0.5) * decisions.steeringError;
        }
        
        // Braking delay
        if (decisions.brakingDelay) {
            setTimeout(() => {
                this.controls.brake = Math.max(this.controls.brake, 0.6);
            }, decisions.brakingDelay * 1000);
        }
        
        // Suboptimal path following
        if (decisions.suboptimalPath) {
            this.targetSteering += (Math.random() - 0.5) * 0.2;
        }
    }

    /**
     * Update physics simulation
     * @param {number} deltaTime - Time since last update
     */
    updatePhysics(deltaTime) {
        // Calculate current vehicle state
        const currentSpeed = this.getCurrentSpeed();
        const speedRatio = currentSpeed / this.physics.maxSpeed;
        
        // Acceleration/deceleration
        if (this.controls.throttle > 0) {
            const acceleration = this.physics.acceleration * this.controls.throttle;
            this.addForce('forward', acceleration * deltaTime);
        }
        
        if (this.controls.brake > 0) {
            const brakeForce = this.physics.brakeForce * this.controls.brake;
            this.addForce('backward', brakeForce * deltaTime);
        }
        
        // Steering
        if (Math.abs(this.controls.steering) > 0.1) {
            const steeringForce = this.physics.steeringSpeed * this.controls.steering;
            this.addRotation(steeringForce * deltaTime * speedRatio);
        }
        
        // Friction and air resistance
        this.applyFriction(deltaTime);
        this.applyAirResistance(deltaTime, speedRatio);
    }

    /**
     * Update collision avoidance system
     * @param {number} deltaTime - Time since last update
     * @param {Object} gameState - Current game state
     */
    updateCollisionAvoidance(deltaTime, gameState) {
        if (!this.collisionAvoidance.enabled) return;
        
        const threats = this.detectCollisionThreats(gameState);
        
        if (threats.length > 0) {
            const primaryThreat = threats[0]; // Handle most immediate threat
            
            // Emergency braking for imminent collisions
            if (primaryThreat.distance < this.collisionAvoidance.emergencyBrakeDistance) {
                this.controls.brake = 1.0;
                this.controls.throttle = 0;
            }
            
            // Steering avoidance
            if (primaryThreat.distance < this.collisionAvoidance.detectionRadius) {
                const avoidanceDirection = this.calculateAvoidanceDirection(primaryThreat);
                const avoidanceStrength = this.collisionAvoidance.avoidanceStrength;
                
                this.controls.steering += avoidanceDirection * avoidanceStrength * deltaTime;
                this.controls.steering = Math.max(-1, Math.min(1, this.controls.steering));
            }
        }
    }

    /**
     * Detect collision threats in the environment
     * @param {Object} gameState - Current game state
     * @returns {Array} Array of threat objects
     */
    detectCollisionThreats(gameState) {
        const threats = [];
        const myPosition = this.opponent.position;
        const myVelocity = this.opponent.velocity;
        const detectionRadius = this.collisionAvoidance.detectionRadius;
        
        // Check other racers
        if (gameState.racers) {
            gameState.racers.forEach(racer => {
                if (racer.id === this.opponent.id) return;
                
                const distance = this.calculateDistance(myPosition, racer.position);
                if (distance < detectionRadius) {
                    const relativeVelocity = this.calculateRelativeVelocity(myVelocity, racer.velocity);
                    const timeToCollision = this.calculateTimeToCollision(
                        myPosition, racer.position, relativeVelocity
                    );
                    
                    if (timeToCollision > 0 && timeToCollision < 2.0) {
                        threats.push({
                            type: 'racer',
                            position: racer.position,
                            distance: distance,
                            timeToCollision: timeToCollision,
                            severity: 1.0 / Math.max(timeToCollision, 0.1)
                        });
                    }
                }
            });
        }
        
        // Check static obstacles
        if (gameState.obstacles) {
            gameState.obstacles.forEach(obstacle => {
                const distance = this.calculateDistance(myPosition, obstacle.position);
                if (distance < detectionRadius) {
                    threats.push({
                        type: 'obstacle',
                        position: obstacle.position,
                        distance: distance,
                        timeToCollision: distance / this.getCurrentSpeed(),
                        severity: 1.0
                    });
                }
            });
        }
        
        // Sort by severity (most threatening first)
        threats.sort((a, b) => b.severity - a.severity);
        
        return threats;
    }

    /**
     * Calculate avoidance direction for a threat
     * @param {Object} threat - Threat object
     * @returns {number} Avoidance direction (-1 to 1)
     */
    calculateAvoidanceDirection(threat) {
        const myPosition = this.opponent.position;
        const threatPosition = threat.position;
        
        // Calculate relative position
        const relativeX = threatPosition.x - myPosition.x;
        
        // Avoid by steering away from the threat
        return relativeX > 0 ? -1 : 1;
    }

    /**
     * Update power-up system
     * @param {number} deltaTime - Time since last update
     * @param {Object} gameState - Current game state
     */
    updatePowerUpSystem(deltaTime, gameState) {
        // Update cooldown
        if (this.powerUpSystem.cooldownTime > 0) {
            this.powerUpSystem.cooldownTime -= deltaTime;
        }
        
        // Check for available power-ups to collect
        this.checkPowerUpCollection(gameState);
        
        // Manage current power-up usage
        this.managePowerUpUsage(deltaTime, gameState);
    }

    /**
     * Check for power-ups to collect
     * @param {Object} gameState - Current game state
     */
    checkPowerUpCollection(gameState) {
        if (!gameState.powerUps) return;
        
        const myPosition = this.opponent.position;
        const collectionRadius = 8;
        
        gameState.powerUps.forEach(powerUp => {
            const distance = this.calculateDistance(myPosition, powerUp.position);
            if (distance < collectionRadius) {
                this.collectPowerUp(powerUp);
            }
        });
    }

    /**
     * Collect a power-up
     * @param {Object} powerUp - Power-up object
     */
    collectPowerUp(powerUp) {
        this.powerUpSystem.inventory.push({
            type: powerUp.type,
            collected: Date.now()
        });
        
        // Remove from game state (this would be handled by game engine)
        console.log(`AI ${this.opponent.id} collected power-up: ${powerUp.type}`);
    }

    /**
     * Use power-up immediately
     */
    usePowerUpImmediate() {
        if (this.powerUpSystem.inventory.length > 0) {
            const powerUp = this.powerUpSystem.inventory.shift();
            this.activatePowerUp(powerUp);
        }
    }

    /**
     * Use power-up strategically
     */
    usePowerUpStrategic() {
        // Wait for optimal moment based on race situation
        if (this.shouldUsePowerUpNow()) {
            this.usePowerUpImmediate();
        }
    }

    /**
     * Use power-up defensively
     */
    usePowerUpDefensive() {
        // Use power-up to counter threats
        if (this.isUnderThreat()) {
            this.usePowerUpImmediate();
        }
    }

    /**
     * Activate a specific power-up
     * @param {Object} powerUp - Power-up to activate
     */
    activatePowerUp(powerUp) {
        this.powerUpSystem.currentPowerUp = powerUp;
        
        switch (powerUp.type) {
            case 'speed_boost':
                this.applySpeedBoost(2.0, 3.0); // 2x speed for 3 seconds
                break;
            case 'invincibility':
                this.applyInvincibility(5.0); // 5 seconds of invincibility
                break;
            case 'turbo':
                this.applyTurboBoost(1.5, 4.0); // 1.5x speed for 4 seconds
                break;
        }
        
        this.powerUpSystem.cooldownTime = 1.0; // 1 second cooldown
    }

    /**
     * Update Nintendo-style mechanics
     * @param {number} deltaTime - Time since last update
     * @param {Object} gameState - Current game state
     */
    updateNintendoMechanics(deltaTime, gameState) {
        this.updateDriftBoost(deltaTime);
        this.updateMiniTurbo(deltaTime);
        this.updateSlipstream(deltaTime, gameState);
    }

    /**
     * Update drift boost system
     * @param {number} deltaTime - Time since last update
     */
    updateDriftBoost(deltaTime) {
        const driftBoost = this.nintendoMechanics.driftBoost;
        
        if (this.controls.drift && this.isDrifting()) {
            // Charge drift boost
            driftBoost.chargeLevel += driftBoost.chargingRate * deltaTime;
            driftBoost.chargeLevel = Math.min(3, driftBoost.chargeLevel);
        } else if (driftBoost.chargeLevel > 0) {
            // Release drift boost
            const boostLevel = Math.floor(driftBoost.chargeLevel);
            const boostMultiplier = driftBoost.boostMultiplier[boostLevel];
            
            this.applySpeedBoost(boostMultiplier, 1.0);
            driftBoost.chargeLevel = 0;
        }
    }

    /**
     * Update mini turbo system
     * @param {number} deltaTime - Time since last update
     */
    updateMiniTurbo(deltaTime) {
        const miniTurbo = this.nintendoMechanics.miniTurbo;
        
        if (miniTurbo.duration > 0) {
            miniTurbo.duration -= deltaTime;
            // Apply speed boost
            this.physics.speedMultiplier = miniTurbo.speedBoost;
        } else {
            this.physics.speedMultiplier = 1.0;
        }
    }

    /**
     * Update slipstream system
     * @param {number} deltaTime - Time since last update
     * @param {Object} gameState - Current game state
     */
    updateSlipstream(deltaTime, gameState) {
        const slipstream = this.nintendoMechanics.slipstream;
        const myPosition = this.opponent.position;
        let inSlipstream = false;
        
        if (gameState.racers) {
            gameState.racers.forEach(racer => {
                if (racer.id === this.opponent.id) return;
                
                const distance = this.calculateDistance(myPosition, racer.position);
                const isInFront = this.isRacerInFront(racer);
                
                if (distance < slipstream.detectionDistance && isInFront) {
                    inSlipstream = true;
                }
            });
        }
        
        if (inSlipstream) {
            slipstream.currentBoost = slipstream.speedBoost;
        } else {
            slipstream.currentBoost = Math.max(1.0, slipstream.currentBoost - deltaTime);
        }
        
        this.physics.slipstreamMultiplier = slipstream.currentBoost;
    }

    /**
     * Update reaction system to simulate AI reaction time
     * @param {number} deltaTime - Time since last update
     */
    updateReactionSystem(deltaTime) {
        this.reactionSystem.inputDelay -= deltaTime;
        
        if (this.reactionSystem.inputDelay <= 0 && this.reactionSystem.pendingInputs.length > 0) {
            const input = this.reactionSystem.pendingInputs.shift();
            this.processDelayedInput(input);
            
            if (this.reactionSystem.pendingInputs.length > 0) {
                this.reactionSystem.inputDelay = this.reactionSystem.reactionTime;
            }
        }
    }

    /**
     * Smooth control inputs for more realistic AI behavior
     * @param {number} deltaTime - Time since last update
     */
    smoothControls(deltaTime) {
        // Smooth steering
        if (this.targetSteering !== undefined) {
            const steeringDiff = this.targetSteering - this.controls.steering;
            this.controls.steering += steeringDiff * this.smoothing.steeringSmooth;
        }
        
        // Apply control limits
        this.controls.steering = Math.max(-1, Math.min(1, this.controls.steering));
        this.controls.throttle = Math.max(0, Math.min(1, this.controls.throttle));
        this.controls.brake = Math.max(0, Math.min(1, this.controls.brake));
    }

    /**
     * Apply final controls to vehicle
     * @param {number} deltaTime - Time since last update
     */
    applyControlsToVehicle(deltaTime) {
        // This would interface with the actual game engine's vehicle system
        if (this.vehicle) {
            this.vehicle.throttle = this.controls.throttle;
            this.vehicle.brake = this.controls.brake;
            this.vehicle.steering = this.controls.steering;
            this.vehicle.drift = this.controls.drift;
        }
        
        // Update opponent data structure
        this.updateOpponentState(deltaTime);
    }

    /**
     * Update opponent state based on controls
     * @param {number} deltaTime - Time since last update
     */
    updateOpponentState(deltaTime) {
        // Update velocity based on controls
        const currentSpeed = this.getCurrentSpeed();
        const acceleration = (this.controls.throttle - this.controls.brake) * 50;
        
        const newSpeed = Math.max(0, currentSpeed + acceleration * deltaTime);
        const direction = this.opponent.heading || 0;
        
        this.opponent.velocity = {
            x: Math.cos(direction) * newSpeed,
            y: 0,
            z: Math.sin(direction) * newSpeed
        };
        
        // Update position
        this.opponent.position.x += this.opponent.velocity.x * deltaTime;
        this.opponent.position.z += this.opponent.velocity.z * deltaTime;
        
        // Update heading based on steering
        this.opponent.heading = (this.opponent.heading || 0) + this.controls.steering * deltaTime;
    }

    // Helper methods
    getCurrentSpeed() {
        if (!this.opponent.velocity) return 0;
        const vel = this.opponent.velocity;
        return Math.sqrt((vel.x || 0) * (vel.x || 0) + (vel.z || 0) * (vel.z || 0));
    }

    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    calculateRelativeVelocity(vel1, vel2) {
        return {
            x: vel1.x - vel2.x,
            z: vel1.z - vel2.z
        };
    }

    calculateTimeToCollision(pos1, pos2, relVel) {
        const relPos = { x: pos2.x - pos1.x, z: pos2.z - pos1.z };
        const relSpeed = Math.sqrt(relVel.x * relVel.x + relVel.z * relVel.z);
        const distance = Math.sqrt(relPos.x * relPos.x + relPos.z * relPos.z);
        
        return relSpeed > 0 ? distance / relSpeed : -1;
    }

    addForce(direction, magnitude) {
        // Physics simulation placeholder
    }

    addRotation(angle) {
        // Physics simulation placeholder
    }

    applyFriction(deltaTime) {
        // Apply friction forces
        const friction = this.physics.frictionCoefficient;
        this.opponent.velocity.x *= (1 - friction * deltaTime);
        this.opponent.velocity.z *= (1 - friction * deltaTime);
    }

    applyAirResistance(deltaTime, speedRatio) {
        // Apply air resistance (increases with speed)
        const resistance = speedRatio * speedRatio * 0.1;
        this.opponent.velocity.x *= (1 - resistance * deltaTime);
        this.opponent.velocity.z *= (1 - resistance * deltaTime);
    }

    isDrifting() { return this.controls.drift && this.getCurrentSpeed() > 20; }
    shouldUsePowerUpNow() { return Math.random() < 0.3; }
    isUnderThreat() { return Math.random() < 0.2; }
    isRacerInFront(racer) { return true; } // Placeholder
    processDelayedInput(input) { /* Process delayed input */ }
    applySpeedBoost(multiplier, duration) { /* Apply speed boost */ }
    applyInvincibility(duration) { /* Apply invincibility */ }
    applyTurboBoost(multiplier, duration) { /* Apply turbo boost */ }
    managePowerUpUsage(deltaTime, gameState) { /* Manage power-up usage */ }
    updatePerformanceMetrics(deltaTime) { /* Update metrics */ }
}

module.exports = AIController;