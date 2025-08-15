import Game from './core/Game.js';

// Initialize and start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.start();
    
    // Make game globally accessible for debugging
    window.game = game;
});