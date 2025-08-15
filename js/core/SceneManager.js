// SceneManager.js - Manages scene transitions and rendering
class SceneManager {
    constructor(game) {
        this.game = game;
        this.scenes = {};
        this.currentScene = null;
        this.transitionState = null;
        this.transitionTime = 0;
        this.transitionDuration = 0.5; // 500ms transitions
    }
    
    addScene(name, scene) {
        this.scenes[name] = scene;
        scene.sceneManager = this;
        console.log(`Scene added: ${name}`);
    }
    
    changeScene(sceneName, transition = 'fade') {
        if (!this.scenes[sceneName]) {
            console.error(`Scene not found: ${sceneName}`);
            return;
        }
        
        console.log(`Changing to scene: ${sceneName}`);
        
        // Start transition
        if (this.currentScene && transition !== 'none') {
            this.transitionState = {
                type: transition,
                from: this.currentScene,
                to: this.scenes[sceneName],
                progress: 0
            };
            this.transitionTime = 0;
        } else {
            // Immediate transition
            if (this.currentScene && this.currentScene.exit) {
                this.currentScene.exit();
            }
            this.currentScene = this.scenes[sceneName];
            if (this.currentScene.enter) {
                this.currentScene.enter();
            }
        }
    }
    
    update(deltaTime) {
        if (this.transitionState) {
            this.transitionTime += deltaTime;
            this.transitionState.progress = Math.min(this.transitionTime / this.transitionDuration, 1);
            
            // Update both scenes during transition
            if (this.transitionState.from && this.transitionState.from.update) {
                this.transitionState.from.update(deltaTime);
            }
            if (this.transitionState.to && this.transitionState.to.update) {
                this.transitionState.to.update(deltaTime);
            }
            
            // Transition complete
            if (this.transitionState.progress >= 1) {
                if (this.transitionState.from && this.transitionState.from.exit) {
                    this.transitionState.from.exit();
                }
                this.currentScene = this.transitionState.to;
                if (this.currentScene.enter) {
                    this.currentScene.enter();
                }
                this.transitionState = null;
            }
        } else if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(deltaTime);
        }
    }
    
    render(ctx) {
        if (this.transitionState) {
            this.renderTransition(ctx);
        } else if (this.currentScene && this.currentScene.render) {
            this.currentScene.render(ctx);
        }
    }
    
    renderTransition(ctx) {
        const { type, from, to, progress } = this.transitionState;
        
        switch (type) {
            case 'fade':
                // Render old scene
                if (from && from.render) {
                    from.render(ctx);
                }
                
                // Fade overlay
                ctx.fillStyle = `rgba(0, 0, 0, ${progress})`;
                ctx.fillRect(0, 0, this.game.width, this.game.height);
                
                // Render new scene if fade is more than 50%
                if (progress > 0.5) {
                    if (to && to.render) {
                        to.render(ctx);
                    }
                    ctx.fillStyle = `rgba(0, 0, 0, ${1 - progress})`;
                    ctx.fillRect(0, 0, this.game.width, this.game.height);
                }
                break;
                
            case 'slide':
                // Slide transition (left to right)
                const offset = this.game.width * progress;
                
                ctx.save();
                if (from && from.render) {
                    ctx.translate(-offset, 0);
                    from.render(ctx);
                }
                
                if (to && to.render) {
                    ctx.translate(this.game.width, 0);
                    to.render(ctx);
                }
                ctx.restore();
                break;
                
            default:
                // Default to current scene
                if (to && to.render) {
                    to.render(ctx);
                }
        }
    }
}