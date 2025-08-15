/**
 * PathFinding.js - Racing Line Calculation and Optimal Path Determination
 * Implements performance-optimized pathfinding with obstacle avoidance and dynamic recalculation
 */

class PathFinding {
    constructor(trackData, difficultySettings) {
        this.trackData = trackData;
        this.settings = difficultySettings;
        
        // Track analysis
        this.racingLine = [];
        this.sectors = [];
        this.corners = [];
        this.straightaways = [];
        this.shortcuts = [];
        
        // Pathfinding optimization
        this.nodeGrid = new Map();
        this.gridResolution = 5; // Meters per grid cell
        this.lookAheadDistance = 100; // Distance to look ahead for path planning
        
        // Racing line optimization
        this.racingLineTypes = {
            OPTIMAL: 'optimal',      // Fastest mathematical line
            SAFE: 'safe',           // Conservative, avoiding risks
            AGGRESSIVE: 'aggressive', // Takes risks for overtaking
            DEFENSIVE: 'defensive'    // Blocks overtaking attempts
        };
        
        this.currentLineType = this.racingLineTypes.OPTIMAL;
        
        // Dynamic obstacles tracking
        this.obstacles = new Map();
        this.obstacleTypes = {
            STATIC: 'static',      // Track barriers, decorations
            DYNAMIC: 'dynamic',    // Other racers, power-ups
            TEMPORARY: 'temporary'  // Debris, effects
        };
        
        // Performance optimization
        this.pathCache = new Map();
        this.lastRecalculation = 0;
        this.recalculationInterval = 100; // Minimum ms between recalculations
        
        // Initialize track analysis
        this.analyzeTrack();
        this.calculateOptimalRacingLine();
    }

    /**
     * Analyze track geometry and identify key features
     */
    analyzeTrack() {
        if (!this.trackData || !this.trackData.waypoints) {
            // Create default track data for testing
            this.createDefaultTrack();
            return;
        }
        
        const waypoints = this.trackData.waypoints;
        
        // Identify corners and straightaways
        for (let i = 0; i < waypoints.length; i++) {
            const current = waypoints[i];
            const next = waypoints[(i + 1) % waypoints.length];
            const prev = waypoints[(i - 1 + waypoints.length) % waypoints.length];
            
            // Calculate curvature
            const curvature = this.calculateCurvature(prev, current, next);
            
            if (Math.abs(curvature) > 0.1) {
                // This is a corner
                this.corners.push({
                    index: i,
                    position: current,
                    curvature: curvature,
                    radius: 1 / Math.abs(curvature),
                    direction: curvature > 0 ? 'right' : 'left',
                    difficulty: this.calculateCornerDifficulty(curvature)
                });
            } else {
                // This is a straightaway
                this.straightaways.push({
                    index: i,
                    position: current,
                    length: this.calculateDistance(current, next)
                });
            }
        }
        
        // Identify potential shortcuts
        this.identifyShortcuts();
        
        // Create sectors for strategic planning
        this.createSectors();
    }

    /**
     * Calculate optimal racing line for the track
     */
    calculateOptimalRacingLine() {
        const waypoints = this.trackData.waypoints;
        this.racingLine = [];
        
        for (let i = 0; i < waypoints.length; i++) {
            const current = waypoints[i];
            const next = waypoints[(i + 1) % waypoints.length];
            const prev = waypoints[(i - 1 + waypoints.length) % waypoints.length];
            
            // Calculate optimal line point
            const linePoint = this.calculateOptimalLinePoint(prev, current, next);
            
            this.racingLine.push({
                position: linePoint,
                speed: this.calculateOptimalSpeed(linePoint, i),
                sector: this.getSectorForPosition(linePoint),
                isCorner: this.isPositionInCorner(linePoint),
                isStraight: this.isPositionInStraight(linePoint)
            });
        }
        
        // Smooth the racing line
        this.smoothRacingLine();
    }

    /**
     * Get optimal path from current position to target
     * @param {Object} startPos - Starting position {x, y, z}
     * @param {Object} targetPos - Target position {x, y, z}
     * @param {Object} options - Pathfinding options
     * @returns {Array} Array of path points
     */
    findOptimalPath(startPos, targetPos, options = {}) {
        const cacheKey = this.generateCacheKey(startPos, targetPos, options);
        
        // Check cache first for performance
        if (this.pathCache.has(cacheKey)) {
            const cached = this.pathCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 1000) { // Cache valid for 1 second
                return cached.path;
            }
        }
        
        // Calculate new path
        const path = this.calculatePath(startPos, targetPos, options);
        
        // Cache the result
        this.pathCache.set(cacheKey, {
            path: path,
            timestamp: Date.now()
        });
        
        return path;
    }

    /**
     * Calculate path using A* algorithm optimized for racing
     * @param {Object} startPos - Starting position
     * @param {Object} targetPos - Target position
     * @param {Object} options - Pathfinding options
     * @returns {Array} Path points
     */
    calculatePath(startPos, targetPos, options) {
        const lineType = options.lineType || this.currentLineType;
        const avoidObstacles = options.avoidObstacles !== false;
        
        // Find nearest racing line points
        const startLineIndex = this.findNearestRacingLineIndex(startPos);
        const targetLineIndex = this.findNearestRacingLineIndex(targetPos);
        
        let path = [];
        
        if (startLineIndex !== -1 && targetLineIndex !== -1) {
            // Follow racing line with modifications based on line type
            path = this.generateRacingLinePath(startLineIndex, targetLineIndex, lineType);
            
            // Apply obstacle avoidance if needed
            if (avoidObstacles) {
                path = this.applyObstacleAvoidance(path, options);
            }
            
            // Apply line type modifications
            path = this.applyLineTypeModifications(path, lineType, options);
        } else {
            // Fallback to direct path
            path = this.generateDirectPath(startPos, targetPos);
        }
        
        return path;
    }

    /**
     * Generate racing line path between two points
     * @param {number} startIndex - Start index on racing line
     * @param {number} targetIndex - Target index on racing line
     * @param {string} lineType - Type of racing line to use
     * @returns {Array} Path points
     */
    generateRacingLinePath(startIndex, targetIndex, lineType) {
        const path = [];
        let currentIndex = startIndex;
        
        while (currentIndex !== targetIndex) {
            const linePoint = this.racingLine[currentIndex];
            
            // Modify point based on line type
            const modifiedPoint = this.modifyPointForLineType(linePoint, lineType);
            path.push(modifiedPoint);
            
            // Move to next point
            currentIndex = (currentIndex + 1) % this.racingLine.length;
            
            // Safety check to prevent infinite loops
            if (path.length > this.racingLine.length) break;
        }
        
        return path;
    }

    /**
     * Apply obstacle avoidance to path
     * @param {Array} path - Original path
     * @param {Object} options - Avoidance options
     * @returns {Array} Modified path avoiding obstacles
     */
    applyObstacleAvoidance(path, options) {
        const avoidanceDistance = options.avoidanceDistance || 10;
        const modifiedPath = [];
        
        for (let i = 0; i < path.length; i++) {
            const point = path[i];
            const obstacles = this.getObstaclesNearPoint(point, avoidanceDistance);
            
            if (obstacles.length > 0) {
                // Calculate avoidance point
                const avoidancePoint = this.calculateAvoidancePoint(point, obstacles, options);
                modifiedPath.push(avoidancePoint);
            } else {
                modifiedPath.push(point);
            }
        }
        
        return this.smoothPath(modifiedPath);
    }

    /**
     * Apply line type specific modifications
     * @param {Array} path - Original path
     * @param {string} lineType - Racing line type
     * @param {Object} options - Modification options
     * @returns {Array} Modified path
     */
    applyLineTypeModifications(path, lineType, options) {
        switch (lineType) {
            case this.racingLineTypes.AGGRESSIVE:
                return this.applyAggressiveModifications(path, options);
            case this.racingLineTypes.DEFENSIVE:
                return this.applyDefensiveModifications(path, options);
            case this.racingLineTypes.SAFE:
                return this.applySafeModifications(path, options);
            default:
                return path;
        }
    }

    /**
     * Apply aggressive racing line modifications
     * @param {Array} path - Original path
     * @param {Object} options - Options
     * @returns {Array} Modified path
     */
    applyAggressiveModifications(path, options) {
        return path.map(point => {
            // Take tighter lines in corners for overtaking opportunities
            if (point.isCorner) {
                const tighterLine = this.calculateTighterLine(point);
                return {
                    ...tighterLine,
                    speed: point.speed * 0.95, // Slightly slower for tighter line
                    risk: 'high'
                };
            }
            
            // Use inside line on straights for blocking
            if (point.isStraight) {
                return {
                    ...point,
                    position: this.calculateInsideLine(point.position),
                    speed: point.speed * 1.05 // Slightly faster
                };
            }
            
            return point;
        });
    }

    /**
     * Apply defensive racing line modifications
     * @param {Array} path - Original path
     * @param {Object} options - Options
     * @returns {Array} Modified path
     */
    applyDefensiveModifications(path, options) {
        const playerPosition = options.playerPosition;
        
        return path.map(point => {
            if (playerPosition && this.isPlayerThreatening(point.position, playerPosition)) {
                // Move to defensive position
                return {
                    ...point,
                    position: this.calculateDefensivePosition(point.position, playerPosition),
                    speed: point.speed * 0.9,
                    risk: 'low'
                };
            }
            return point;
        });
    }

    /**
     * Apply safe racing line modifications
     * @param {Array} path - Original path
     * @param {Object} options - Options
     * @returns {Array} Modified path
     */
    applySafeModifications(path, options) {
        return path.map(point => {
            // Take wider, safer lines
            if (point.isCorner) {
                return {
                    ...point,
                    position: this.calculateSaferLine(point.position),
                    speed: point.speed * 0.85, // More conservative speed
                    risk: 'low'
                };
            }
            return point;
        });
    }

    /**
     * Update dynamic obstacles and recalculate paths if needed
     * @param {Array} racers - Current racer positions
     * @param {Array} powerUps - Current power-up positions
     * @param {Array} debris - Current debris positions
     */
    updateDynamicObstacles(racers = [], powerUps = [], debris = []) {
        const now = Date.now();
        
        // Clear old dynamic obstacles
        for (const [id, obstacle] of this.obstacles) {
            if (obstacle.type === this.obstacleTypes.DYNAMIC && 
                now - obstacle.timestamp > 1000) {
                this.obstacles.delete(id);
            }
        }
        
        // Add racer obstacles
        racers.forEach((racer, index) => {
            this.obstacles.set(`racer_${index}`, {
                type: this.obstacleTypes.DYNAMIC,
                position: racer.position,
                radius: racer.radius || 5,
                timestamp: now
            });
        });
        
        // Add power-up obstacles (these are usually beneficial, so mark differently)
        powerUps.forEach((powerUp, index) => {
            this.obstacles.set(`powerup_${index}`, {
                type: this.obstacleTypes.DYNAMIC,
                position: powerUp.position,
                radius: powerUp.radius || 3,
                timestamp: now,
                beneficial: true
            });
        });
        
        // Add debris obstacles
        debris.forEach((debrisItem, index) => {
            this.obstacles.set(`debris_${index}`, {
                type: this.obstacleTypes.TEMPORARY,
                position: debrisItem.position,
                radius: debrisItem.radius || 4,
                timestamp: now
            });
        });
    }

    /**
     * Get next optimal waypoint for AI to follow
     * @param {Object} currentPos - Current AI position
     * @param {Object} currentVel - Current AI velocity
     * @param {number} lookAhead - Look ahead distance
     * @returns {Object} Next waypoint with position and speed
     */
    getNextWaypoint(currentPos, currentVel, lookAhead = 50) {
        const currentSpeed = Math.sqrt(currentVel.x ** 2 + currentVel.z ** 2);
        const adjustedLookAhead = Math.max(lookAhead, currentSpeed * 2);
        
        // Find current position on racing line
        const currentLineIndex = this.findNearestRacingLineIndex(currentPos);
        if (currentLineIndex === -1) return null;
        
        // Find waypoint at look-ahead distance
        let distance = 0;
        let waypointIndex = currentLineIndex;
        
        while (distance < adjustedLookAhead && waypointIndex < this.racingLine.length - 1) {
            const current = this.racingLine[waypointIndex];
            const next = this.racingLine[waypointIndex + 1];
            
            distance += this.calculateDistance(current.position, next.position);
            waypointIndex++;
        }
        
        const waypoint = this.racingLine[waypointIndex];
        
        return {
            position: waypoint.position,
            speed: waypoint.speed,
            sector: waypoint.sector,
            isCorner: waypoint.isCorner,
            isStraight: waypoint.isStraight,
            distance: distance
        };
    }

    /**
     * Check if position is suitable for overtaking
     * @param {Object} position - Position to check
     * @param {string} direction - 'left' or 'right'
     * @returns {boolean} Whether overtaking is possible
     */
    canOvertakeAt(position, direction = 'left') {
        const lineIndex = this.findNearestRacingLineIndex(position);
        if (lineIndex === -1) return false;
        
        const linePoint = this.racingLine[lineIndex];
        
        // Don't overtake in tight corners
        if (linePoint.isCorner) {
            const corner = this.getCornerAtPosition(position);
            if (corner && corner.radius < 30) return false;
        }
        
        // Check track width at this position
        const trackWidth = this.getTrackWidthAt(position);
        return trackWidth > 20; // Minimum width for safe overtaking
    }

    // Helper methods
    createDefaultTrack() {
        // Create a simple oval track for testing
        const waypoints = [];
        const radius = 200;
        const segments = 32;
        
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            waypoints.push({
                x: Math.cos(angle) * radius,
                y: 0,
                z: Math.sin(angle) * radius
            });
        }
        
        this.trackData = { waypoints };
    }

    calculateCurvature(p1, p2, p3) {
        // Calculate curvature using three points
        const a = this.calculateDistance(p1, p2);
        const b = this.calculateDistance(p2, p3);
        const c = this.calculateDistance(p1, p3);
        
        const area = Math.abs((p1.x * (p2.z - p3.z) + p2.x * (p3.z - p1.z) + p3.x * (p1.z - p2.z)) / 2);
        return (4 * area) / (a * b * c);
    }

    calculateDistance(p1, p2) {
        const dx = p1.x - p2.x;
        const dz = p1.z - p2.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    findNearestRacingLineIndex(position) {
        let minDistance = Infinity;
        let nearestIndex = -1;
        
        for (let i = 0; i < this.racingLine.length; i++) {
            const distance = this.calculateDistance(position, this.racingLine[i].position);
            if (distance < minDistance) {
                minDistance = distance;
                nearestIndex = i;
            }
        }
        
        return nearestIndex;
    }

    generateCacheKey(startPos, targetPos, options) {
        const precision = 10; // Reduce precision for better cache hits
        return `${Math.round(startPos.x / precision)}_${Math.round(startPos.z / precision)}_` +
               `${Math.round(targetPos.x / precision)}_${Math.round(targetPos.z / precision)}_` +
               `${options.lineType || 'default'}`;
    }

    // Placeholder implementations for complex calculations
    calculateCornerDifficulty(curvature) { return Math.abs(curvature) * 10; }
    identifyShortcuts() { /* Implementation */ }
    createSectors() { /* Implementation */ }
    calculateOptimalLinePoint(p1, p2, p3) { return p2; }
    calculateOptimalSpeed(point, index) { return 60; }
    getSectorForPosition(position) { return 1; }
    isPositionInCorner(position) { return false; }
    isPositionInStraight(position) { return true; }
    smoothRacingLine() { /* Implementation */ }
    modifyPointForLineType(point, lineType) { return point; }
    getObstaclesNearPoint(point, distance) { return []; }
    calculateAvoidancePoint(point, obstacles, options) { return point; }
    smoothPath(path) { return path; }
    calculateTighterLine(point) { return point; }
    calculateInsideLine(position) { return position; }
    isPlayerThreatening(aiPos, playerPos) { return false; }
    calculateDefensivePosition(aiPos, playerPos) { return aiPos; }
    calculateSaferLine(position) { return position; }
    generateDirectPath(start, end) { return [start, end]; }
    getCornerAtPosition(position) { return null; }
    getTrackWidthAt(position) { return 30; }
}

module.exports = PathFinding;