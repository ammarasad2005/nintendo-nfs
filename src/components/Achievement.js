const fs = require('fs');
const path = require('path');

/**
 * Nintendo-Style Achievement System
 * Handles achievement definitions, tracking, and unlocking
 */
class Achievement {
    constructor() {
        this.achievements = this.initializeAchievements();
        this.playerProgress = this.loadPlayerProgress();
        this.unlockedAchievements = new Set(this.playerProgress.unlocked || []);
        this.listeners = [];
    }

    /**
     * Initialize all achievements with Nintendo-style design
     */
    initializeAchievements() {
        return {
            // Speed Achievements
            'speed_demon': {
                id: 'speed_demon',
                name: '🏁 Speed Demon',
                description: 'Reach 250 km/h in a single race',
                category: 'speed',
                requirement: { type: 'max_speed', value: 250 },
                reward: { type: 'multiplier', value: 1.1 },
                rarity: 'common',
                points: 100
            },
            'sonic_boom': {
                id: 'sonic_boom',
                name: '💨 Sonic Boom',
                description: 'Reach 300 km/h in a single race',
                category: 'speed',
                requirement: { type: 'max_speed', value: 300 },
                reward: { type: 'multiplier', value: 1.2 },
                rarity: 'rare',
                points: 250
            },

            // Drift Achievements
            'drift_king': {
                id: 'drift_king',
                name: '🌪️ Drift King',
                description: 'Perform 50 drifts in a single race',
                category: 'drift',
                requirement: { type: 'drift_count', value: 50 },
                reward: { type: 'unlock', value: 'drift_car' },
                rarity: 'uncommon',
                points: 200
            },
            'combo_master': {
                id: 'combo_master',
                name: '🔥 Combo Master',
                description: 'Achieve a 20x drift combo',
                category: 'drift',
                requirement: { type: 'drift_combo', value: 20 },
                reward: { type: 'multiplier', value: 1.5 },
                rarity: 'epic',
                points: 500
            },

            // Racing Achievements
            'perfect_victory': {
                id: 'perfect_victory',
                name: '⭐ Perfect Victory',
                description: 'Win a race without taking damage',
                category: 'racing',
                requirement: { type: 'perfect_run', value: true },
                reward: { type: 'points', value: 1000 },
                rarity: 'rare',
                points: 300
            },
            'champion': {
                id: 'champion',
                name: '👑 Champion',
                description: 'Win 10 races in a row',
                category: 'racing',
                requirement: { type: 'consecutive_wins', value: 10 },
                reward: { type: 'unlock', value: 'champion_car' },
                rarity: 'legendary',
                points: 1000
            },

            // Time Achievements
            'time_trial_ace': {
                id: 'time_trial_ace',
                name: '⏱️ Time Trial Ace',
                description: 'Complete any track in under 2 minutes',
                category: 'time',
                requirement: { type: 'lap_time', value: 120 },
                reward: { type: 'multiplier', value: 1.3 },
                rarity: 'rare',
                points: 400
            },
            'lightning_fast': {
                id: 'lightning_fast',
                name: '⚡ Lightning Fast',
                description: 'Complete any track in under 1 minute 30 seconds',
                category: 'time',
                requirement: { type: 'lap_time', value: 90 },
                reward: { type: 'unlock', value: 'lightning_track' },
                rarity: 'legendary',
                points: 800
            },

            // Stunt Achievements
            'stunt_performer': {
                id: 'stunt_performer',
                name: '🎭 Stunt Performer',
                description: 'Perform 5 different stunts in one race',
                category: 'stunts',
                requirement: { type: 'stunt_variety', value: 5 },
                reward: { type: 'points', value: 500 },
                rarity: 'uncommon',
                points: 150
            },
            'aerial_ace': {
                id: 'aerial_ace',
                name: '🛩️ Aerial Ace',
                description: 'Spend 10 seconds airborne in a single race',
                category: 'stunts',
                requirement: { type: 'airtime', value: 10 },
                reward: { type: 'multiplier', value: 1.4 },
                rarity: 'epic',
                points: 600
            },

            // Powerup Achievements
            'powerup_master': {
                id: 'powerup_master',
                name: '🎆 Powerup Master',
                description: 'Use 15 powerups in a single race',
                category: 'powerups',
                requirement: { type: 'powerup_count', value: 15 },
                reward: { type: 'unlock', value: 'special_powerups' },
                rarity: 'rare',
                points: 350
            },

            // Collection Achievements
            'collector': {
                id: 'collector',
                name: '🏆 Collector',
                description: 'Unlock 5 different achievements',
                category: 'meta',
                requirement: { type: 'achievement_count', value: 5 },
                reward: { type: 'title', value: 'Collector' },
                rarity: 'uncommon',
                points: 200
            },
            'completionist': {
                id: 'completionist',
                name: '💎 Completionist',
                description: 'Unlock all achievements',
                category: 'meta',
                requirement: { type: 'achievement_count', value: 'all' },
                reward: { type: 'title', value: 'Master Racer' },
                rarity: 'legendary',
                points: 2000
            }
        };
    }

    /**
     * Check and update achievement progress
     */
    updateProgress(eventType, data) {
        const newlyUnlocked = [];

        Object.values(this.achievements).forEach(achievement => {
            if (this.unlockedAchievements.has(achievement.id)) {
                return; // Already unlocked
            }

            if (this.checkRequirement(achievement.requirement, eventType, data)) {
                this.unlockAchievement(achievement.id);
                newlyUnlocked.push(achievement);
            }
        });

        // Check meta achievements
        this.checkMetaAchievements();

        if (newlyUnlocked.length > 0) {
            this.savePlayerProgress();
            this.notifyListeners('achievements_unlocked', newlyUnlocked);
        }

        return newlyUnlocked;
    }

    /**
     * Check if achievement requirement is met
     */
    checkRequirement(requirement, eventType, data) {
        switch (requirement.type) {
            case 'max_speed':
                return eventType === 'race_completed' && data.maxSpeed >= requirement.value;
            
            case 'drift_count':
                return eventType === 'race_completed' && data.driftsPerformed >= requirement.value;
            
            case 'drift_combo':
                return eventType === 'drift_combo' && data.comboCount >= requirement.value;
            
            case 'perfect_run':
                return eventType === 'race_completed' && data.isPerfectRun === requirement.value;
            
            case 'consecutive_wins':
                return eventType === 'race_won' && this.getConsecutiveWins() >= requirement.value;
            
            case 'lap_time':
                return eventType === 'race_completed' && data.completionTime <= requirement.value;
            
            case 'stunt_variety':
                return eventType === 'race_completed' && data.stuntTypes && data.stuntTypes.length >= requirement.value;
            
            case 'airtime':
                return eventType === 'race_completed' && data.totalAirtime >= requirement.value;
            
            case 'powerup_count':
                return eventType === 'race_completed' && data.powerupsUsed >= requirement.value;
            
            case 'achievement_count':
                if (requirement.value === 'all') {
                    return this.unlockedAchievements.size >= Object.keys(this.achievements).length - 1; // -1 for this achievement itself
                }
                return this.unlockedAchievements.size >= requirement.value;
            
            default:
                return false;
        }
    }

    /**
     * Check meta achievements (achievements about achievements)
     */
    checkMetaAchievements() {
        const achievementCount = this.unlockedAchievements.size;
        
        // Check collector achievement
        if (!this.unlockedAchievements.has('collector') && achievementCount >= 5) {
            this.unlockAchievement('collector');
        }
        
        // Check completionist achievement
        const totalAchievements = Object.keys(this.achievements).length;
        if (!this.unlockedAchievements.has('completionist') && achievementCount >= totalAchievements - 1) {
            this.unlockAchievement('completionist');
        }
    }

    /**
     * Unlock an achievement
     */
    unlockAchievement(achievementId) {
        if (this.unlockedAchievements.has(achievementId)) {
            return false;
        }

        const achievement = this.achievements[achievementId];
        if (!achievement) {
            return false;
        }

        this.unlockedAchievements.add(achievementId);
        
        // Update player progress
        if (!this.playerProgress.unlocked) {
            this.playerProgress.unlocked = [];
        }
        this.playerProgress.unlocked.push(achievementId);
        
        // Record unlock timestamp
        if (!this.playerProgress.unlockTimestamps) {
            this.playerProgress.unlockTimestamps = {};
        }
        this.playerProgress.unlockTimestamps[achievementId] = new Date().toISOString();

        // Apply reward
        this.applyReward(achievement.reward);

        // Show unlock notification
        this.showUnlockNotification(achievement);

        return true;
    }

    /**
     * Apply achievement reward
     */
    applyReward(reward) {
        switch (reward.type) {
            case 'points':
                this.notifyListeners('reward_points', reward.value);
                break;
            case 'multiplier':
                this.notifyListeners('reward_multiplier', reward.value);
                break;
            case 'unlock':
                this.notifyListeners('reward_unlock', reward.value);
                break;
            case 'title':
                this.notifyListeners('reward_title', reward.value);
                break;
        }
    }

    /**
     * Show Nintendo-style unlock notification
     */
    showUnlockNotification(achievement) {
        const notification = {
            type: 'achievement_unlock',
            achievement: achievement,
            message: `🎉 Achievement Unlocked! ${achievement.name}`,
            description: achievement.description,
            rarity: achievement.rarity,
            points: achievement.points,
            timestamp: Date.now()
        };

        this.notifyListeners('notification', notification);
        
        // Console output for demo
        console.log(`\n🎮 ACHIEVEMENT UNLOCKED! 🎮`);
        console.log(`${achievement.name}`);
        console.log(`${achievement.description}`);
        console.log(`Rarity: ${achievement.rarity.toUpperCase()}`);
        console.log(`Points: ${achievement.points}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    }

    /**
     * Get achievement by ID
     */
    getAchievement(achievementId) {
        return this.achievements[achievementId];
    }

    /**
     * Get all achievements
     */
    getAllAchievements() {
        return { ...this.achievements };
    }

    /**
     * Get unlocked achievements
     */
    getUnlockedAchievements() {
        return Array.from(this.unlockedAchievements).map(id => this.achievements[id]);
    }

    /**
     * Get achievements by category
     */
    getAchievementsByCategory(category) {
        return Object.values(this.achievements).filter(achievement => achievement.category === category);
    }

    /**
     * Get achievement progress percentage
     */
    getProgressPercentage() {
        const total = Object.keys(this.achievements).length;
        const unlocked = this.unlockedAchievements.size;
        return Math.round((unlocked / total) * 100);
    }

    /**
     * Get total achievement points earned
     */
    getTotalPoints() {
        return Array.from(this.unlockedAchievements)
            .reduce((total, id) => total + (this.achievements[id]?.points || 0), 0);
    }

    /**
     * Get consecutive wins from player progress
     */
    getConsecutiveWins() {
        return this.playerProgress.consecutiveWins || 0;
    }

    /**
     * Update consecutive wins
     */
    updateConsecutiveWins(won) {
        if (!this.playerProgress.consecutiveWins) {
            this.playerProgress.consecutiveWins = 0;
        }
        
        if (won) {
            this.playerProgress.consecutiveWins++;
        } else {
            this.playerProgress.consecutiveWins = 0;
        }
        
        this.savePlayerProgress();
    }

    /**
     * Add event listener for achievement events
     */
    addEventListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Remove event listener
     */
    removeEventListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Notify all listeners of an event
     */
    notifyListeners(eventType, data) {
        this.listeners.forEach(callback => {
            try {
                callback(eventType, data);
            } catch (error) {
                console.error('Achievement listener error:', error);
            }
        });
    }

    /**
     * Load player progress from file
     */
    loadPlayerProgress() {
        try {
            const dataPath = path.join(__dirname, '../..', 'data', 'achievements.json');
            if (fs.existsSync(dataPath)) {
                const data = fs.readFileSync(dataPath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.warn('Could not load achievement progress:', error.message);
        }
        return {
            unlocked: [],
            unlockTimestamps: {},
            consecutiveWins: 0
        };
    }

    /**
     * Save player progress to file
     */
    savePlayerProgress() {
        try {
            const dataPath = path.join(__dirname, '../..', 'data', 'achievements.json');
            const dataDir = path.dirname(dataPath);
            
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            fs.writeFileSync(dataPath, JSON.stringify(this.playerProgress, null, 2));
        } catch (error) {
            console.error('Could not save achievement progress:', error.message);
        }
    }

    /**
     * Reset all achievements (for testing)
     */
    resetAchievements() {
        this.unlockedAchievements.clear();
        this.playerProgress = {
            unlocked: [],
            unlockTimestamps: {},
            consecutiveWins: 0
        };
        this.savePlayerProgress();
    }

    /**
     * Get achievement statistics
     */
    getAchievementStats() {
        const total = Object.keys(this.achievements).length;
        const unlocked = this.unlockedAchievements.size;
        const categories = {};
        
        // Count by category
        Object.values(this.achievements).forEach(achievement => {
            if (!categories[achievement.category]) {
                categories[achievement.category] = { total: 0, unlocked: 0 };
            }
            categories[achievement.category].total++;
            if (this.unlockedAchievements.has(achievement.id)) {
                categories[achievement.category].unlocked++;
            }
        });

        return {
            total,
            unlocked,
            percentage: this.getProgressPercentage(),
            totalPoints: this.getTotalPoints(),
            categories,
            recentUnlocks: this.getRecentUnlocks(5)
        };
    }

    /**
     * Get recent unlocks
     */
    getRecentUnlocks(limit = 5) {
        if (!this.playerProgress.unlockTimestamps) {
            return [];
        }

        return Object.entries(this.playerProgress.unlockTimestamps)
            .sort(([,a], [,b]) => new Date(b) - new Date(a))
            .slice(0, limit)
            .map(([id, timestamp]) => ({
                achievement: this.achievements[id],
                timestamp
            }));
    }
}

module.exports = Achievement;