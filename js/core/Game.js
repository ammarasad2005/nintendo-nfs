// Game.js - Core game engine
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.lastTime = 0;
        this.isRunning = false;
        
        // Initialize managers
        this.sceneManager = new SceneManager(this);
        this.inputManager = new InputManager();
        this.audioManager = new AudioManager();
        
        // Set up canvas for pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        console.log('Nintendo NFS Game Engine Initialized');
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        
        // Start with intro screen
        this.sceneManager.changeScene('intro');
        console.log('Game started');
    }
    
    stop() {
        this.isRunning = false;
        console.log('Game stopped');
    }
    
    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Update and render current scene
        this.sceneManager.update(deltaTime);
        this.sceneManager.render(this.ctx);
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    // Utility methods for Nintendo-style graphics
    drawPixelText(text, x, y, color = '#fff', size = 16) {
        this.ctx.font = `${size}px 'Press Start 2P', monospace`;
        this.ctx.fillStyle = '#000';
        // Shadow effect
        this.ctx.fillText(text, x + 2, y + 2);
        // Main text
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
    }
    
    drawNintendoBox(x, y, width, height, color = '#fff') {
        // Nintendo-style bordered box
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x - 2, y - 2, width + 4, height + 4);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
    }
}