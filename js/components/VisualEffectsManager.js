/**
 * VisualEffectsManager.js
 * Handles particle effects, lighting, post-processing, weather effects, and camera effects
 * Nintendo-style visual polish with vibrant colors and smooth animations
 */

class VisualEffectsManager {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = null;
        this.effects = [];
        this.isRunning = false;
        this.lastTime = 0;
        
        // Nintendo-style color palettes
        this.colorPalettes = {
            mario: ['#ff0000', '#ffff00', '#0000ff', '#00ff00'],
            rainbow: ['#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80', '#00ffff', '#0080ff'],
            neon: ['#ff00ff', '#00ffff', '#ffff00', '#ff0040'],
            fire: ['#ff4500', '#ff6347', '#ffd700', '#ff1493'],
            ice: ['#00bfff', '#87ceeb', '#e0ffff', '#add8e6']
        };
        
        this.setupCanvas();
        this.initializeEffects();
        
        console.log('✨ VisualEffectsManager initialized with Nintendo-style effects');
    }
    
    setupCanvas() {
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        if (!this.canvas || !this.ctx) return;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    initializeEffects() {
        this.effectTypes = {
            sparkle: this.createSparkle.bind(this),
            star: this.createStar.bind(this),
            bubble: this.createBubble.bind(this),
            trail: this.createTrail.bind(this),
            explosion: this.createExplosion.bind(this),
            floating: this.createFloating.bind(this)
        };
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animationLoop();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    animationLoop() {
        if (!this.isRunning || !this.ctx) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Clear canvas with slight fade for trail effects
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and render effects
        this.updateEffects(deltaTime);
        this.renderEffects();
        
        // Remove dead effects
        this.effects = this.effects.filter(effect => effect.life > 0);
        
        requestAnimationFrame(() => this.animationLoop());
    }
    
    updateEffects(deltaTime) {
        this.effects.forEach(effect => {
            effect.update(deltaTime);
        });
    }
    
    renderEffects() {
        this.effects.forEach(effect => {
            effect.render(this.ctx);
        });
    }
    
    // Menu particle effects
    createMenuParticles(options = {}) {
        const config = {
            count: 50,
            type: 'sparkle',
            area: null,
            color: '#ffdd00',
            ...options
        };
        
        this.start();
        
        for (let i = 0; i < config.count; i++) {
            setTimeout(() => {
                this.addEffect(config.type, {
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    color: this.getRandomColor(this.colorPalettes.rainbow)
                });
            }, i * 100);
        }
    }
    
    createLoadingParticles() {
        this.start();
        
        const createWave = () => {
            for (let i = 0; i < 10; i++) {
                this.addEffect('star', {
                    x: (this.canvas.width / 10) * i,
                    y: this.canvas.height * 0.7,
                    color: this.getRandomColor(this.colorPalettes.neon),
                    velocity: { x: 0, y: -2 }
                });
            }
            
            setTimeout(createWave, 1000);
        };
        
        createWave();
    }
    
    createLoadingBurst() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            this.addEffect('sparkle', {
                x: centerX,
                y: centerY,
                velocity: {
                    x: Math.cos(angle) * 5,
                    y: Math.sin(angle) * 5
                },
                color: this.getRandomColor(this.colorPalettes.fire)
            });
        }
    }
    
    // Game effect creators
    createSpeedLines() {
        for (let i = 0; i < 15; i++) {
            this.addEffect('trail', {
                x: this.canvas.width + 50,
                y: Math.random() * this.canvas.height,
                velocity: { x: -10 - Math.random() * 5, y: 0 },
                color: '#00ffff',
                length: 50 + Math.random() * 100
            });
        }
    }
    
    createBoostEffect() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Central explosion
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 7;
            
            this.addEffect('explosion', {
                x: centerX,
                y: centerY,
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                color: this.getRandomColor(this.colorPalettes.fire)
            });
        }
    }
    
    createPowerUpEffect(x, y, type = 'star') {
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            this.addEffect(type, {
                x: x,
                y: y,
                velocity: {
                    x: Math.cos(angle) * 3,
                    y: Math.sin(angle) * 3
                },
                color: this.getRandomColor(this.colorPalettes.mario)
            });
        }
    }
    
    // Weather effects
    createRainEffect() {
        const createRaindrop = () => {
            this.addEffect('trail', {
                x: Math.random() * this.canvas.width,
                y: -10,
                velocity: { x: -1, y: 8 },
                color: '#87ceeb',
                length: 20,
                width: 1
            });
        };
        
        // Create multiple raindrops
        for (let i = 0; i < 5; i++) {
            setTimeout(createRaindrop, i * 50);
        }
    }
    
    createSnowEffect() {
        const createSnowflake = () => {
            this.addEffect('floating', {
                x: Math.random() * this.canvas.width,
                y: -10,
                velocity: { x: (Math.random() - 0.5) * 2, y: 2 + Math.random() * 3 },
                color: '#ffffff',
                size: 2 + Math.random() * 4
            });
        };
        
        for (let i = 0; i < 3; i++) {
            setTimeout(createSnowflake, i * 200);
        }
    }
    
    // Effect creators (individual particle types)
    createSparkle(config) {
        return {
            x: config.x || 0,
            y: config.y || 0,
            velocity: config.velocity || { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 },
            color: config.color || '#ffdd00',
            size: config.size || 3 + Math.random() * 3,
            life: 1.0,
            maxLife: 1.0,
            gravity: -0.1,
            
            update(dt) {
                this.x += this.velocity.x;
                this.y += this.velocity.y;
                this.velocity.y += this.gravity;
                this.life -= dt * 0.001;
                this.size *= 0.998;
            },
            
            render(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                
                // Draw sparkle as a star
                ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    const angle = (i * Math.PI) / 2;
                    const x = this.x + Math.cos(angle) * this.size;
                    const y = this.y + Math.sin(angle) * this.size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.fill();
                ctx.restore();
            }
        };
    }
    
    createStar(config) {
        return {
            x: config.x || 0,
            y: config.y || 0,
            velocity: config.velocity || { x: 0, y: -1 },
            color: config.color || '#ffff00',
            size: config.size || 5,
            life: 1.0,
            maxLife: 1.0,
            rotation: 0,
            rotationSpeed: Math.random() * 0.2,
            
            update(dt) {
                this.x += this.velocity.x;
                this.y += this.velocity.y;
                this.rotation += this.rotationSpeed;
                this.life -= dt * 0.0008;
            },
            
            render(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.color;
                
                // Draw 5-pointed star
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                    const x = Math.cos(angle) * this.size;
                    const y = Math.sin(angle) * this.size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        };
    }
    
    createBubble(config) {
        return {
            x: config.x || 0,
            y: config.y || 0,
            velocity: config.velocity || { x: 0, y: -2 },
            color: config.color || '#00ffff',
            size: config.size || 10 + Math.random() * 20,
            life: 1.0,
            maxLife: 1.0,
            
            update(dt) {
                this.x += this.velocity.x;
                this.y += this.velocity.y;
                this.velocity.x += (Math.random() - 0.5) * 0.1;
                this.life -= dt * 0.0005;
            },
            
            render(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha * 0.7;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.stroke();
                
                // Add highlight
                ctx.globalAlpha = alpha * 0.3;
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.restore();
            }
        };
    }
    
    createTrail(config) {
        return {
            x: config.x || 0,
            y: config.y || 0,
            velocity: config.velocity || { x: -5, y: 0 },
            color: config.color || '#ffffff',
            length: config.length || 30,
            width: config.width || 2,
            life: 1.0,
            maxLife: 1.0,
            
            update(dt) {
                this.x += this.velocity.x;
                this.y += this.velocity.y;
                this.life -= dt * 0.002;
                this.length *= 0.995;
            },
            
            render(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.width;
                ctx.shadowBlur = 5;
                ctx.shadowColor = this.color;
                
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x - this.length, this.y);
                ctx.stroke();
                ctx.restore();
            }
        };
    }
    
    createExplosion(config) {
        return {
            x: config.x || 0,
            y: config.y || 0,
            velocity: config.velocity || { x: 0, y: 0 },
            color: config.color || '#ff4500',
            size: config.size || 5,
            life: 1.0,
            maxLife: 1.0,
            
            update(dt) {
                this.x += this.velocity.x;
                this.y += this.velocity.y;
                this.velocity.x *= 0.98;
                this.velocity.y *= 0.98;
                this.life -= dt * 0.003;
                this.size *= 0.99;
            },
            
            render(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 20;
                ctx.shadowColor = this.color;
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        };
    }
    
    createFloating(config) {
        return {
            x: config.x || 0,
            y: config.y || 0,
            velocity: config.velocity || { x: 0, y: 1 },
            color: config.color || '#ffffff',
            size: config.size || 3,
            life: 1.0,
            maxLife: 1.0,
            sway: Math.random() * Math.PI * 2,
            swaySpeed: 0.02,
            
            update(dt) {
                this.x += this.velocity.x + Math.sin(this.sway) * 0.5;
                this.y += this.velocity.y;
                this.sway += this.swaySpeed;
                this.life -= dt * 0.0003;
            },
            
            render(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 8;
                ctx.shadowColor = this.color;
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        };
    }
    
    // Utility methods
    addEffect(type, config) {
        if (this.effectTypes[type]) {
            this.effects.push(this.effectTypes[type](config));
        }
    }
    
    getRandomColor(palette) {
        return palette[Math.floor(Math.random() * palette.length)];
    }
    
    clearAllEffects() {
        this.effects = [];
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    // Screen effects
    createScreenFlash(color = '#ffffff', intensity = 0.5) {
        if (!this.ctx) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = intensity;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        
        // Fade out the flash
        let alpha = intensity;
        const fadeOut = () => {
            alpha *= 0.9;
            if (alpha > 0.01) {
                this.ctx.save();
                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = color;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.restore();
                requestAnimationFrame(fadeOut);
            }
        };
        requestAnimationFrame(fadeOut);
    }
    
    createCameraShake(intensity = 10, duration = 500) {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        
        const startTime = performance.now();
        const originalTransform = canvas.style.transform || '';
        
        const shake = () => {
            const elapsed = performance.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                const currentIntensity = intensity * (1 - progress);
                const x = (Math.random() - 0.5) * currentIntensity;
                const y = (Math.random() - 0.5) * currentIntensity;
                
                canvas.style.transform = `${originalTransform} translate(${x}px, ${y}px)`;
                requestAnimationFrame(shake);
            } else {
                canvas.style.transform = originalTransform;
            }
        };
        
        shake();
    }
    
    // Performance optimization
    setQuality(level) {
        switch (level) {
            case 'low':
                this.maxEffects = 50;
                break;
            case 'medium':
                this.maxEffects = 100;
                break;
            case 'high':
                this.maxEffects = 200;
                break;
        }
        
        // Limit active effects
        if (this.effects.length > this.maxEffects) {
            this.effects = this.effects.slice(-this.maxEffects);
        }
    }
}

// Export for use in other modules
window.VisualEffectsManager = VisualEffectsManager;