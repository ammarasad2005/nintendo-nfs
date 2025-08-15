import AudioManager from './AudioManager.js';
import InputManager from './Input.js';
import IntroScreen from '../scenes/IntroScreen.js';
import MainMenu from '../scenes/MainMenu.js';
import GamePlay from '../scenes/GamePlay.js';
import EndScreen from '../scenes/EndScreen.js';

class Game {
    constructor() {
        this.currentScene = null;
        this.scenes = new Map();
        this.audioManager = null;
        this.inputManager = null;
        this.isRunning = false;
        this.lastTimestamp = 0;
        
        this.init();
    }

    init() {
        // Initialize canvas
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Initialize core systems
        this.audioManager = new AudioManager();
        this.inputManager = new InputManager();
        
        // Register scenes
        this.registerScenes();
        
        // Start with intro screen
        this.setScene('intro');
    }

    registerScenes() {
        this.scenes.set('intro', new IntroScreen(this));
        this.scenes.set('menu', new MainMenu(this));
        this.scenes.set('gameplay', new GamePlay(this));
        this.scenes.set('endscreen', new EndScreen(this));
    }

    setScene(sceneName) {
        if (this.currentScene) {
            this.currentScene.cleanup();
        }
        this.currentScene = this.scenes.get(sceneName);
        if (this.currentScene) {
            this.currentScene.init();
        }
    }

    start() {
        this.isRunning = true;
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        // Update input manager
        this.inputManager.update();

        // Update current scene
        if (this.currentScene) {
            this.currentScene.update(deltaTime);
            this.currentScene.render();
        }

        if (this.isRunning) {
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    stop() {
        this.isRunning = false;
    }
}

export default Game;