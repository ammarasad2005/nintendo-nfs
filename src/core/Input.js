class InputManager {
    constructor() {
        this.keys = new Map();
        this.prevKeys = new Map();
        this.gamepad = null;
        
        this.initKeyboardListeners();
        this.initGamepadSupport();
    }

    initKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys.set(e.code, true);
        });

        window.addEventListener('keyup', (e) => {
            this.keys.set(e.code, false);
        });
    }

    initGamepadSupport() {
        window.addEventListener('gamepadconnected', (e) => {
            this.gamepad = e.gamepad;
        });

        window.addEventListener('gamepaddisconnected', () => {
            this.gamepad = null;
        });
    }

    update() {
        // Update previous frame key states
        this.prevKeys = new Map(this.keys);
    }

    isKeyPressed(keyCode) {
        return this.keys.get(keyCode) || false;
    }

    isKeyJustPressed(keyCode) {
        return (this.keys.get(keyCode) || false) && !(this.prevKeys.get(keyCode) || false);
    }

    getGamepadState() {
        if (this.gamepad) {
            return navigator.getGamepads()[this.gamepad.index];
        }
        return null;
    }
}

export default InputManager;