// main.js - Game initialization and scene setup
let game;

// Initialize the game when the page loads
window.addEventListener('load', () => {
    console.log('Initializing Nintendo NFS...');
    
    // Create game instance
    game = new Game();
    
    // Create and add all scenes
    const introScreen = new IntroScreen(game);
    const mainMenu = new MainMenu(game);
    const gamePlay = new GamePlay(game);
    const endScreen = new EndScreen(game);
    
    game.sceneManager.addScene('intro', introScreen);
    game.sceneManager.addScene('mainMenu', mainMenu);
    game.sceneManager.addScene('gamePlay', gamePlay);
    game.sceneManager.addScene('endScreen', endScreen);
    
    // Start the game
    game.start();
    
    console.log('Nintendo NFS initialized successfully!');
});

// Handle window resize
window.addEventListener('resize', () => {
    if (game) {
        // Keep the canvas centered
        const container = document.getElementById('gameContainer');
        container.style.minHeight = window.innerHeight + 'px';
    }
});

// Handle visibility change (pause when tab not active)
document.addEventListener('visibilitychange', () => {
    if (game) {
        if (document.hidden) {
            // Page is hidden, pause if in gameplay
            if (game.sceneManager.currentScene instanceof GamePlay) {
                game.sceneManager.currentScene.isPaused = true;
                game.sceneManager.currentScene.showPauseMenu = true;
            }
        }
        // Resume is handled by the scene itself
    }
});

// Prevent context menu on right click
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Handle fullscreen toggle (F11 alternative)
document.addEventListener('keydown', (e) => {
    if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
    }
});

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Error attempting to enable fullscreen:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// Utility functions for development/debugging
window.gameDebug = {
    // Quick scene switching for development
    switchScene: (sceneName) => {
        if (game && game.sceneManager) {
            game.sceneManager.changeScene(sceneName, 'none');
        }
    },
    
    // Get current scene info
    getCurrentScene: () => {
        if (game && game.sceneManager && game.sceneManager.currentScene) {
            return game.sceneManager.currentScene.constructor.name;
        }
        return 'None';
    },
    
    // Toggle debug info
    toggleDebug: () => {
        // This could show FPS, scene info, etc.
        console.log('Debug mode not implemented yet');
    },
    
    // Quick access to game objects
    game: () => game,
    sceneManager: () => game?.sceneManager,
    inputManager: () => game?.inputManager,
    audioManager: () => game?.audioManager
};

// Console welcome message
console.log(`
🏎️ Nintendo NFS - Racing Game
=====================================
Welcome to the developer console!

Quick commands:
- gameDebug.switchScene('intro') - Switch scenes
- gameDebug.getCurrentScene() - Check current scene
- gameDebug.game() - Access game object

Controls:
- Arrow Keys: Navigate/Steer
- Z/Space: Accelerate/Select
- X: Brake
- C: Drift
- ESC: Pause/Back
- Enter: Start/Confirm

Enjoy the retro racing experience!
=====================================
`);