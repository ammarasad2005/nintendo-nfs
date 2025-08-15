const fs = require('fs');
const path = require('path');

/**
 * Nintendo-Style Leaderboard System
 * Handles high score management, ranking, and verification
 */
class Leaderboard {
    constructor() {
        this.leaderboards = this.loadLeaderboards();
        this.personalBests = this.loadPersonalBests();
        this.categories = [
            'overall',
            'time_trial',
            'championship',
            'drift_mode',
            'stunt_mode',
            'quick_race'
        ];
        this.verificationEnabled = true;
    }

    /**
     * Submit a score to the leaderboard
     */
    submitScore(scoreData) {
        const {
            playerName,
            trackId,
            gameMode,
            score,
            completionTime,
            breakdown,
            timestamp,
            sessionId,
            verificationData
        } = scoreData;

        // Verify score if verification is enabled
        if (this.verificationEnabled && !this.verifyScore(scoreData)) {
            return {
                success: false,
                reason: 'Score verification failed',
                score: null
            };
        }

        // Create score entry
        const scoreEntry = {
            id: this.generateScoreId(),
            playerName: this.sanitizePlayerName(playerName),
            trackId,
            gameMode,
            score,
            completionTime,
            breakdown: breakdown || {},
            timestamp: timestamp || new Date().toISOString(),
            sessionId,
            verified: this.verificationEnabled,
            rank: 0 // Will be calculated
        };

        // Add to appropriate leaderboards
        this.addToGlobalLeaderboard(scoreEntry);
        this.addToTrackLeaderboard(scoreEntry);
        this.addToModeLeaderboard(scoreEntry);
        this.updatePersonalBest(scoreEntry);

        // Calculate ranks
        this.recalculateRanks();

        // Save data
        this.saveLeaderboards();
        this.savePersonalBests();

        return {
            success: true,
            score: scoreEntry,
            rank: this.getPlayerRank(scoreEntry),
            personalBest: this.isPersonalBest(scoreEntry)
        };
    }

    /**
     * Add score to global leaderboard
     */
    addToGlobalLeaderboard(scoreEntry) {
        if (!this.leaderboards.global) {
            this.leaderboards.global = [];
        }

        this.leaderboards.global.push(scoreEntry);
        this.leaderboards.global.sort((a, b) => b.score - a.score);
        
        // Keep only top 100 global scores
        this.leaderboards.global = this.leaderboards.global.slice(0, 100);
    }

    /**
     * Add score to track-specific leaderboard
     */
    addToTrackLeaderboard(scoreEntry) {
        const { trackId } = scoreEntry;
        
        if (!this.leaderboards.tracks) {
            this.leaderboards.tracks = {};
        }
        
        if (!this.leaderboards.tracks[trackId]) {
            this.leaderboards.tracks[trackId] = [];
        }

        this.leaderboards.tracks[trackId].push(scoreEntry);
        this.leaderboards.tracks[trackId].sort((a, b) => b.score - a.score);
        
        // Keep only top 50 scores per track
        this.leaderboards.tracks[trackId] = this.leaderboards.tracks[trackId].slice(0, 50);
    }

    /**
     * Add score to game mode leaderboard
     */
    addToModeLeaderboard(scoreEntry) {
        const { gameMode } = scoreEntry;
        
        if (!this.leaderboards.modes) {
            this.leaderboards.modes = {};
        }
        
        if (!this.leaderboards.modes[gameMode]) {
            this.leaderboards.modes[gameMode] = [];
        }

        this.leaderboards.modes[gameMode].push(scoreEntry);
        this.leaderboards.modes[gameMode].sort((a, b) => b.score - a.score);
        
        // Keep only top 50 scores per mode
        this.leaderboards.modes[gameMode] = this.leaderboards.modes[gameMode].slice(0, 50);
    }

    /**
     * Update personal best scores
     */
    updatePersonalBest(scoreEntry) {
        const { playerName, trackId, gameMode } = scoreEntry;
        const playerKey = this.getPlayerKey(playerName);
        
        if (!this.personalBests[playerKey]) {
            this.personalBests[playerKey] = {};
        }
        
        if (!this.personalBests[playerKey][trackId]) {
            this.personalBests[playerKey][trackId] = {};
        }

        const currentBest = this.personalBests[playerKey][trackId][gameMode];
        
        if (!currentBest || scoreEntry.score > currentBest.score) {
            this.personalBests[playerKey][trackId][gameMode] = { ...scoreEntry };
        }
    }

    /**
     * Get global leaderboard
     */
    getGlobalLeaderboard(limit = 10) {
        return this.leaderboards.global ? this.leaderboards.global.slice(0, limit) : [];
    }

    /**
     * Get track leaderboard
     */
    getTrackLeaderboard(trackId, limit = 10) {
        if (!this.leaderboards.tracks || !this.leaderboards.tracks[trackId]) {
            return [];
        }
        return this.leaderboards.tracks[trackId].slice(0, limit);
    }

    /**
     * Get game mode leaderboard
     */
    getModeLeaderboard(gameMode, limit = 10) {
        if (!this.leaderboards.modes || !this.leaderboards.modes[gameMode]) {
            return [];
        }
        return this.leaderboards.modes[gameMode].slice(0, limit);
    }

    /**
     * Get player's personal bests
     */
    getPersonalBests(playerName) {
        const playerKey = this.getPlayerKey(playerName);
        return this.personalBests[playerKey] || {};
    }

    /**
     * Get player rank on specific leaderboard
     */
    getPlayerRank(scoreEntry, leaderboardType = 'global', trackId = null, gameMode = null) {
        let leaderboard;
        
        switch (leaderboardType) {
            case 'global':
                leaderboard = this.leaderboards.global || [];
                break;
            case 'track':
                leaderboard = this.leaderboards.tracks?.[trackId] || [];
                break;
            case 'mode':
                leaderboard = this.leaderboards.modes?.[gameMode] || [];
                break;
            default:
                return -1;
        }

        const rank = leaderboard.findIndex(entry => 
            entry.id === scoreEntry.id || 
            (entry.playerName === scoreEntry.playerName && entry.score === scoreEntry.score)
        );
        
        return rank >= 0 ? rank + 1 : -1;
    }

    /**
     * Check if score is a personal best
     */
    isPersonalBest(scoreEntry) {
        const { playerName, trackId, gameMode } = scoreEntry;
        const playerKey = this.getPlayerKey(playerName);
        
        const currentBest = this.personalBests[playerKey]?.[trackId]?.[gameMode];
        return !currentBest || scoreEntry.score > currentBest.score;
    }

    /**
     * Get leaderboard statistics
     */
    getLeaderboardStats() {
        const globalCount = this.leaderboards.global?.length || 0;
        const trackCounts = {};
        const modeCounts = {};

        // Count track leaderboard entries
        if (this.leaderboards.tracks) {
            Object.keys(this.leaderboards.tracks).forEach(trackId => {
                trackCounts[trackId] = this.leaderboards.tracks[trackId].length;
            });
        }

        // Count mode leaderboard entries
        if (this.leaderboards.modes) {
            Object.keys(this.leaderboards.modes).forEach(gameMode => {
                modeCounts[gameMode] = this.leaderboards.modes[gameMode].length;
            });
        }

        // Get unique players
        const uniquePlayers = new Set();
        if (this.leaderboards.global) {
            this.leaderboards.global.forEach(entry => uniquePlayers.add(entry.playerName));
        }

        return {
            totalScores: globalCount,
            uniquePlayers: uniquePlayers.size,
            trackLeaderboards: Object.keys(trackCounts).length,
            modeLeaderboards: Object.keys(modeCounts).length,
            trackCounts,
            modeCounts,
            averageScore: this.calculateAverageScore(),
            topScore: globalCount > 0 ? this.leaderboards.global[0].score : 0
        };
    }

    /**
     * Search leaderboards
     */
    searchLeaderboards(query, options = {}) {
        const { trackId, gameMode, playerName, minScore, maxScore } = options;
        let results = [];

        // Search global leaderboard
        if (this.leaderboards.global) {
            results = results.concat(this.leaderboards.global);
        }

        // Filter by criteria
        if (trackId) {
            results = results.filter(entry => entry.trackId === trackId);
        }
        
        if (gameMode) {
            results = results.filter(entry => entry.gameMode === gameMode);
        }
        
        if (playerName) {
            const searchName = playerName.toLowerCase();
            results = results.filter(entry => 
                entry.playerName.toLowerCase().includes(searchName)
            );
        }
        
        if (minScore !== undefined) {
            results = results.filter(entry => entry.score >= minScore);
        }
        
        if (maxScore !== undefined) {
            results = results.filter(entry => entry.score <= maxScore);
        }

        // Remove duplicates and sort
        const seen = new Set();
        results = results.filter(entry => {
            const key = `${entry.playerName}-${entry.trackId}-${entry.gameMode}-${entry.score}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        results.sort((a, b) => b.score - a.score);
        
        return results;
    }

    /**
     * Get players near a specific score/rank
     */
    getPlayersNearRank(playerName, trackId = null, gameMode = null, range = 5) {
        let leaderboard;
        
        if (trackId) {
            leaderboard = this.leaderboards.tracks?.[trackId] || [];
        } else if (gameMode) {
            leaderboard = this.leaderboards.modes?.[gameMode] || [];
        } else {
            leaderboard = this.leaderboards.global || [];
        }

        const playerIndex = leaderboard.findIndex(entry => entry.playerName === playerName);
        
        if (playerIndex === -1) return [];

        const start = Math.max(0, playerIndex - range);
        const end = Math.min(leaderboard.length, playerIndex + range + 1);
        
        return leaderboard.slice(start, end).map((entry, index) => ({
            ...entry,
            rank: start + index + 1,
            isPlayer: entry.playerName === playerName
        }));
    }

    /**
     * Export leaderboard data
     */
    exportLeaderboard(format = 'json', leaderboardType = 'global', options = {}) {
        let data;
        
        switch (leaderboardType) {
            case 'global':
                data = this.leaderboards.global || [];
                break;
            case 'track':
                data = this.leaderboards.tracks?.[options.trackId] || [];
                break;
            case 'mode':
                data = this.leaderboards.modes?.[options.gameMode] || [];
                break;
            default:
                data = this.leaderboards;
        }

        switch (format) {
            case 'csv':
                return this.convertToCSV(data);
            case 'json':
            default:
                return JSON.stringify(data, null, 2);
        }
    }

    /**
     * Verify score integrity
     */
    verifyScore(scoreData) {
        // Basic verification checks
        if (!scoreData.playerName || !scoreData.score || !scoreData.trackId) {
            return false;
        }

        // Score bounds check
        if (scoreData.score < 0 || scoreData.score > 1000000) {
            return false;
        }

        // Time bounds check (minimum 30 seconds, maximum 10 minutes)
        if (scoreData.completionTime < 30 || scoreData.completionTime > 600) {
            return false;
        }

        // Breakdown verification
        if (scoreData.breakdown) {
            const totalBreakdown = Object.values(scoreData.breakdown).reduce((sum, val) => sum + val, 0);
            const scoreDifference = Math.abs(scoreData.score - totalBreakdown);
            
            // Allow for multiplier differences (multipliers can be up to 3x)
            if (scoreDifference > totalBreakdown * 2.5) {
                return false;
            }
        }

        return true;
    }

    /**
     * Calculate average score
     */
    calculateAverageScore() {
        if (!this.leaderboards.global || this.leaderboards.global.length === 0) {
            return 0;
        }

        const total = this.leaderboards.global.reduce((sum, entry) => sum + entry.score, 0);
        return Math.round(total / this.leaderboards.global.length);
    }

    /**
     * Recalculate all ranks
     */
    recalculateRanks() {
        // Update global ranks
        if (this.leaderboards.global) {
            this.leaderboards.global.forEach((entry, index) => {
                entry.rank = index + 1;
            });
        }

        // Update track ranks
        if (this.leaderboards.tracks) {
            Object.values(this.leaderboards.tracks).forEach(trackLeaderboard => {
                trackLeaderboard.forEach((entry, index) => {
                    entry.trackRank = index + 1;
                });
            });
        }

        // Update mode ranks
        if (this.leaderboards.modes) {
            Object.values(this.leaderboards.modes).forEach(modeLeaderboard => {
                modeLeaderboard.forEach((entry, index) => {
                    entry.modeRank = index + 1;
                });
            });
        }
    }

    /**
     * Utility methods
     */
    generateScoreId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    sanitizePlayerName(name) {
        return name.trim().substring(0, 20).replace(/[<>\"'&]/g, '');
    }

    getPlayerKey(playerName) {
        return playerName.toLowerCase().replace(/\s+/g, '_');
    }

    convertToCSV(data) {
        if (!Array.isArray(data) || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
        ].join('\n');
        
        return csvContent;
    }

    /**
     * Load leaderboards from file
     */
    loadLeaderboards() {
        try {
            const dataPath = path.join(__dirname, '../..', 'data', 'leaderboards.json');
            if (fs.existsSync(dataPath)) {
                const data = fs.readFileSync(dataPath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.warn('Could not load leaderboards:', error.message);
        }
        return {
            global: [],
            tracks: {},
            modes: {}
        };
    }

    /**
     * Load personal bests from file
     */
    loadPersonalBests() {
        try {
            const dataPath = path.join(__dirname, '../..', 'data', 'personal_bests.json');
            if (fs.existsSync(dataPath)) {
                const data = fs.readFileSync(dataPath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.warn('Could not load personal bests:', error.message);
        }
        return {};
    }

    /**
     * Save leaderboards to file
     */
    saveLeaderboards() {
        try {
            const dataPath = path.join(__dirname, '../..', 'data', 'leaderboards.json');
            const dataDir = path.dirname(dataPath);
            
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            fs.writeFileSync(dataPath, JSON.stringify(this.leaderboards, null, 2));
        } catch (error) {
            console.error('Could not save leaderboards:', error.message);
        }
    }

    /**
     * Save personal bests to file
     */
    savePersonalBests() {
        try {
            const dataPath = path.join(__dirname, '../..', 'data', 'personal_bests.json');
            const dataDir = path.dirname(dataPath);
            
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            fs.writeFileSync(dataPath, JSON.stringify(this.personalBests, null, 2));
        } catch (error) {
            console.error('Could not save personal bests:', error.message);
        }
    }

    /**
     * Clear all leaderboard data (for testing)
     */
    clearLeaderboards() {
        this.leaderboards = {
            global: [],
            tracks: {},
            modes: {}
        };
        this.personalBests = {};
        this.saveLeaderboards();
        this.savePersonalBests();
    }
}

module.exports = Leaderboard;