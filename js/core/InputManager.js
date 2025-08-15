// InputManager.js - Handles all input for Nintendo-style controls
class InputManager {
    constructor() {
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        this.mouseButtons = {};
        
        this.setupEventListeners();
        console.log('Input Manager initialized');
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });
        
        // Mouse events
        document.addEventListener('mousemove', (e) => {
            const canvas = document.getElementById('gameCanvas');
            const rect = canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });
        
        document.addEventListener('mousedown', (e) => {
            this.mouseButtons[e.button] = true;
            e.preventDefault();
        });
        
        document.addEventListener('mouseup', (e) => {
            this.mouseButtons[e.button] = false;
            e.preventDefault();
        });
        
        // Prevent context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    // Nintendo-style control mappings
    isPressed(action) {
        switch (action) {
            case 'up': return this.keys['ArrowUp'] || this.keys['KeyW'];
            case 'down': return this.keys['ArrowDown'] || this.keys['KeyS'];
            case 'left': return this.keys['ArrowLeft'] || this.keys['KeyA'];
            case 'right': return this.keys['ArrowRight'] || this.keys['KeyD'];
            case 'accelerate': return this.keys['KeyZ'] || this.keys['Space'];
            case 'brake': return this.keys['KeyX'] || this.keys['ShiftLeft'];
            case 'drift': return this.keys['KeyC'] || this.keys['ControlLeft'];
            case 'powerup': return this.keys['Space'];
            case 'pause': return this.keys['Escape'] || this.keys['KeyP'];
            case 'select': return this.keys['Enter'] || this.keys['Space'];
            case 'back': return this.keys['Escape'] || this.keys['Backspace'];
            case 'start': return this.keys['Enter'];
            default: return this.keys[action];
        }
    }
    
    // Check if key was just pressed (not held)
    isJustPressed(action) {
        // This would need frame-by-frame tracking for proper implementation
        // For now, using simple check
        return this.isPressed(action);
    }
    
    // Mouse helpers
    getMousePosition() {
        return { ...this.mousePos };
    }
    
    isMousePressed(button = 0) {
        return this.mouseButtons[button] || false;
    }
    
    // Reset input state (useful for scene transitions)
    reset() {
        this.keys = {};
        this.mouseButtons = {};
    }
}