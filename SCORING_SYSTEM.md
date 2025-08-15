# Nintendo-Style NFS Scoring and Achievement System

## Overview

This comprehensive scoring and achievement system provides a Nintendo-style gaming experience with:

- **Multi-category scoring** with real-time feedback
- **Achievement tracking** with unlock notifications
- **Persistent leaderboards** with score verification
- **Detailed statistics** and performance analytics
- **Player progression** with levels and ranks

## Quick Start

```bash
# Install dependencies
npm install

# Run a single race
npm start

# Run demo mode (5 races)
npm start --demo

# View player statistics
npm start --stats

# View leaderboard
npm start --leaderboard

# Run tests
npm test
```

## System Components

### 1. ScoreManager (`src/scoring/ScoreManager.js`)

The core scoring engine that calculates race scores using Nintendo-style mechanics.

#### Features:
- **Multiple scoring categories:**
  - Time Bonus (faster completion = more points)
  - Drift Points (combo multipliers)
  - Stunt Points (variety bonuses)
  - Perfect Run Bonus (5000 base points)
  - Overtake Points (100 per overtake)
  - Powerup Bonus (50 per use)

- **Position-based multipliers:**
  - 1st place: 2.0x
  - 2nd place: 1.5x
  - 3rd place: 1.2x
  - 4th place: 1.0x
  - 5th+ place: 0.8x

- **Real-time scoring** for in-race actions
- **Score persistence** to file system
- **Performance statistics** tracking

#### Example Usage:
```javascript
const ScoreManager = require('./src/scoring/ScoreManager');
const scoreManager = new ScoreManager();

const raceData = {
    completionTime: 120,
    bestTime: 130,
    driftsPerformed: 15,
    stuntsCompleted: 5,
    overtakeCount: 8,
    powerupsUsed: 3,
    isPerfectRun: true,
    averageSpeed: 200,
    position: 1
};

const result = scoreManager.calculateRaceScore(raceData);
console.log(`Total Score: ${result.totalScore}`);
```

### 2. Achievement System (`src/components/Achievement.js`)

Nintendo-style achievement tracking with unlock notifications and rewards.

#### Achievement Categories:
- **Speed Achievements** (Speed Demon, Sonic Boom)
- **Drift Achievements** (Drift King, Combo Master)
- **Racing Achievements** (Perfect Victory, Champion)
- **Time Achievements** (Time Trial Ace, Lightning Fast)
- **Stunt Achievements** (Stunt Performer, Aerial Ace)
- **Collection Achievements** (Collector, Completionist)

#### Features:
- **Progress monitoring** with real-time checks
- **Reward system** (points, multipliers, unlocks, titles)
- **Achievement notifications** with Nintendo-style display
- **Persistent progress** tracking
- **Meta achievements** (achievements about achievements)

#### Example Usage:
```javascript
const Achievement = require('./src/components/Achievement');
const achievements = new Achievement();

// Check for achievement unlocks after race
const newAchievements = achievements.updateProgress('race_completed', {
    maxSpeed: 280,
    driftsPerformed: 25,
    isPerfectRun: true
});

console.log(`Unlocked ${newAchievements.length} new achievements!`);
```

### 3. Leaderboard System (`src/components/Leaderboard.js`)

Comprehensive leaderboard management with score verification and ranking.

#### Features:
- **Multiple leaderboard types:**
  - Global leaderboard (top 100)
  - Track-specific leaderboards (top 50 per track)
  - Game mode leaderboards (top 50 per mode)
  - Personal best tracking

- **Score verification** to prevent cheating
- **Ranking system** with automatic rank calculation
- **Search and filtering** capabilities
- **Data export** (JSON/CSV formats)

#### Example Usage:
```javascript
const Leaderboard = require('./src/components/Leaderboard');
const leaderboard = new Leaderboard();

const result = leaderboard.submitScore({
    playerName: 'Player1',
    trackId: 'rainbow_road',
    gameMode: 'time_trial',
    score: 15000,
    completionTime: 95.5,
    breakdown: { /* score breakdown */ }
});

const topScores = leaderboard.getGlobalLeaderboard(10);
```

### 4. Statistics Manager (`src/components/Statistics.js`)

Comprehensive player statistics and performance analytics.

#### Tracked Statistics:
- **Lifetime Stats:** Total races, wins, score, perfect runs, top speed
- **Track-specific Stats:** Best times, win rates, average scores per track
- **Game Mode Stats:** Performance across different game modes
- **Performance Trends:** Score improvement over time
- **Player Progression:** Level calculation, rank assignment

#### Features:
- **Session tracking** for current play session
- **Performance metrics** with trend analysis
- **Player level system** based on total score
- **Rank calculation** (S, A, B, C, D, E)
- **Milestone detection** and goal suggestions

#### Example Usage:
```javascript
const Statistics = require('./src/components/Statistics');
const stats = new Statistics();

const raceStats = stats.recordRaceCompletion({
    trackId: 'mario_speedway',
    gameMode: 'quick_race',
    completionTime: 95,
    position: 1,
    score: 8500,
    // ... other race data
});

const playerStats = stats.getPlayerStatistics();
console.log(`Player Level: ${playerStats.summary.level.level}`);
```

## Nintendo-Style Features

### Scoring System
- **Arcade-style scoring** with generous point values
- **Combo multipliers** for consecutive actions
- **Perfect run bonuses** for flawless performance
- **Position-based rewards** encouraging competitive play

### Achievement Design
- **Clear, achievable goals** with descriptive names and icons
- **Rarity tiers** (Common, Uncommon, Rare, Epic, Legendary)
- **Progressive difficulty** from beginner to master level
- **Unlock animations** with visual feedback

### Visual Presentation
- **Colorful emoji-based** display
- **Celebratory notifications** for achievements
- **Structured data presentation** with clear categories
- **Progress indicators** showing advancement

## Data Persistence

All player data is automatically saved to JSON files in the `data/` directory:
- `scores.json` - High scores and score history
- `achievements.json` - Achievement progress and unlock timestamps
- `leaderboards.json` - Global and category-specific leaderboards
- `personal_bests.json` - Individual player best scores
- `player_stats.json` - Comprehensive player statistics
- `performance_metrics.json` - Performance trends and analytics

## Testing

The system includes comprehensive tests covering:
- Score calculation accuracy
- Achievement unlock conditions
- Leaderboard functionality
- Statistics tracking
- Integration between all components

```bash
npm test
```

## Example Race Flow

1. **Race Start** - Systems initialize for new race
2. **Real-time Scoring** - Points awarded for drifts, stunts, overtakes
3. **Race Completion** - Final score calculated with multipliers
4. **Achievement Check** - System checks for newly unlocked achievements
5. **Leaderboard Update** - Score submitted and ranked
6. **Statistics Update** - Player stats and performance metrics updated
7. **Results Display** - Comprehensive results with Nintendo-style formatting

## Customization

The system is designed to be easily customizable:

- **Scoring constants** can be adjusted in `ScoreManager.js`
- **Achievement definitions** can be modified in `Achievement.js`
- **Leaderboard limits** and verification rules in `Leaderboard.js`
- **Statistics categories** and calculations in `Statistics.js`

## Architecture Benefits

- **Modular design** - Each component is independent and reusable
- **Event-driven** - Components communicate through events and callbacks
- **Persistent data** - All progress is automatically saved
- **Scalable** - Easy to add new achievements, scoring categories, and statistics
- **Nintendo-authentic** - Captures the feel of classic Nintendo racing games

This scoring and achievement system provides the foundation for an engaging, replay-worthy Nintendo-style racing experience that encourages players to improve their performance and unlock new content.