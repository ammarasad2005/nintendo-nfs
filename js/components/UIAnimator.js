/**
 * UIAnimator.js
 * Handles all UI animations with Nintendo-style polish
 * Menu transitions, button animations, loading animations, HUD animations, screen transitions
 */

class UIAnimator {
    constructor() {
        this.activeAnimations = new Map();
        this.animationId = 0;
        this.easingFunctions = this.createEasingFunctions();
        
        // Nintendo-style animation settings
        this.settings = {
            defaultDuration: 300,
            bounceIntensity: 0.8,
            elasticIntensity: 0.7,
            sparkleCount: 20
        };
        
        console.log('✨ UIAnimator initialized with Nintendo-style animations');
    }
    
    createEasingFunctions() {
        return {
            easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeOut: (t) => 1 - Math.pow(1 - t, 3),
            easeIn: (t) => t * t * t,
            bounce: (t) => {
                if (t < 1 / 2.75) return 7.5625 * t * t;
                if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
                if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
                return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
            },
            elastic: (t) => {
                if (t === 0) return 0;
                if (t === 1) return 1;
                return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * (2 * Math.PI) / 0.4) + 1;
            }
        };
    }
    
    // Core animation method
    animate(element, properties, duration = this.settings.defaultDuration, easing = 'easeOut') {
        return new Promise((resolve) => {
            const animId = ++this.animationId;
            const startTime = performance.now();
            const initialValues = {};
            const targetValues = {};
            
            // Parse initial and target values
            for (const prop in properties) {
                if (prop === 'transform') {
                    initialValues[prop] = this.parseTransform(element.style.transform || '');
                    targetValues[prop] = this.parseTransform(properties[prop]);
                } else {
                    initialValues[prop] = parseFloat(getComputedStyle(element)[prop]) || 0;
                    targetValues[prop] = parseFloat(properties[prop]);
                }
            }
            
            const step = (currentTime) => {
                if (!this.activeAnimations.has(animId)) {
                    resolve();
                    return;
                }
                
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = this.easingFunctions[easing](progress);
                
                // Apply animated values
                for (const prop in properties) {
                    if (prop === 'transform') {
                        element.style.transform = this.interpolateTransform(
                            initialValues[prop],
                            targetValues[prop],
                            easedProgress
                        );
                    } else {
                        const currentValue = initialValues[prop] + 
                            (targetValues[prop] - initialValues[prop]) * easedProgress;
                        element.style[prop] = currentValue + (prop.includes('opacity') ? '' : 'px');
                    }
                }
                
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    this.activeAnimations.delete(animId);
                    resolve();
                }
            };
            
            this.activeAnimations.set(animId, true);
            requestAnimationFrame(step);
        });
    }
    
    parseTransform(transformString) {
        const values = {
            translateX: 0,
            translateY: 0,
            scale: 1,
            rotate: 0
        };
        
        if (!transformString) return values;
        
        const translateXMatch = transformString.match(/translateX\(([^)]+)\)/);
        const translateYMatch = transformString.match(/translateY\(([^)]+)\)/);
        const scaleMatch = transformString.match(/scale\(([^)]+)\)/);
        const rotateMatch = transformString.match(/rotate\(([^)]+)\)/);
        
        if (translateXMatch) values.translateX = parseFloat(translateXMatch[1]);
        if (translateYMatch) values.translateY = parseFloat(translateYMatch[1]);
        if (scaleMatch) values.scale = parseFloat(scaleMatch[1]);
        if (rotateMatch) values.rotate = parseFloat(rotateMatch[1]);
        
        return values;
    }
    
    interpolateTransform(initial, target, progress) {
        const translateX = initial.translateX + (target.translateX - initial.translateX) * progress;
        const translateY = initial.translateY + (target.translateY - initial.translateY) * progress;
        const scale = initial.scale + (target.scale - initial.scale) * progress;
        const rotate = initial.rotate + (target.rotate - initial.rotate) * progress;
        
        return `translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) rotate(${rotate}deg)`;
    }
    
    // Menu transition animations
    async slideInFromBottom(element, duration = 500) {
        element.style.transform = 'translateY(100px)';
        element.style.opacity = '0';
        
        await this.animate(element, {
            transform: 'translateY(0px)',
            opacity: '1'
        }, duration, 'bounce');
    }
    
    async slideInFromTop(element, duration = 300) {
        element.style.transform = 'translateY(-50px)';
        element.style.opacity = '0';
        
        await this.animate(element, {
            transform: 'translateY(0px)',
            opacity: '1'
        }, duration, 'easeOut');
    }
    
    async fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        await this.animate(element, { opacity: '1' }, duration, 'easeOut');
    }
    
    async fadeOut(element, duration = 300) {
        await this.animate(element, { opacity: '0' }, duration, 'easeIn');
    }
    
    // Button animations
    async buttonHoverIn(button) {
        const originalTransform = button.style.transform || '';
        
        // Add sparkle effect
        this.createSparkleEffect(button);
        
        await this.animate(button, {
            transform: originalTransform + ' scale(1.05)'
        }, 200, 'easeOut');
    }
    
    async buttonHoverOut(button) {
        await this.animate(button, {
            transform: 'scale(1)'
        }, 200, 'easeOut');
    }
    
    async buttonClick(button) {
        const originalTransform = button.style.transform || '';
        
        // Quick scale down and back up
        await this.animate(button, {
            transform: originalTransform + ' scale(0.95)'
        }, 100, 'easeOut');
        
        await this.animate(button, {
            transform: originalTransform + ' scale(1)'
        }, 200, 'bounce');
    }
    
    createSparkleEffect(element) {
        const rect = element.getBoundingClientRect();
        const sparkleCount = 8;
        
        for (let i = 0; i < sparkleCount; i++) {
            const sparkle = document.createElement('div');
            sparkle.style.cssText = `
                position: fixed;
                width: 4px;
                height: 4px;
                background: #ffdd00;
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                left: ${rect.left + rect.width * Math.random()}px;
                top: ${rect.top + rect.height * Math.random()}px;
            `;
            
            document.body.appendChild(sparkle);
            
            // Animate sparkle
            this.animate(sparkle, {
                transform: `translate(${(Math.random() - 0.5) * 50}px, ${(Math.random() - 0.5) * 50}px) scale(0)`,
                opacity: '0'
            }, 800, 'easeOut').then(() => {
                document.body.removeChild(sparkle);
            });
        }
    }
    
    // Loading animations
    enhanceSpinner(spinner) {
        // Add rainbow effect to spinner
        spinner.style.background = `conic-gradient(
            #ff0000, #ff8000, #ffff00, #80ff00, 
            #00ff00, #00ff80, #00ffff, #0080ff,
            #0000ff, #8000ff, #ff00ff, #ff0080, #ff0000
        )`;
        spinner.style.borderRadius = '50%';
        
        // Add pulsing glow
        this.createPulsingGlow(spinner);
    }
    
    createLoadingParticles() {
        const container = document.getElementById('loadingScreen');
        if (!container) return;
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.createFloatingParticle(container);
            }, i * 200);
        }
    }
    
    createFloatingParticle(container) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 6px;
            height: 6px;
            background: #ffdd00;
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: 100%;
            pointer-events: none;
            box-shadow: 0 0 10px #ffdd00;
        `;
        
        container.appendChild(particle);
        
        // Float up and fade
        this.animate(particle, {
            transform: `translateY(-${window.innerHeight + 100}px)`,
            opacity: '0'
        }, 3000 + Math.random() * 2000, 'easeOut').then(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        });
        
        // Continuous creation
        setTimeout(() => {
            if (container.style.display !== 'none') {
                this.createFloatingParticle(container);
            }
        }, 1000 + Math.random() * 1000);
    }
    
    // HUD animations
    createPulsingText(element) {
        let growing = true;
        
        const pulse = () => {
            const scale = growing ? 1.1 : 1.0;
            growing = !growing;
            
            this.animate(element, {
                transform: `scale(${scale})`
            }, 1000, 'easeInOut').then(() => {
                if (element.isConnected) {
                    pulse();
                }
            });
        };
        
        pulse();
    }
    
    createPulsingGlow(element) {
        let intensity = 0;
        let increasing = true;
        
        const updateGlow = () => {
            intensity += increasing ? 0.02 : -0.02;
            if (intensity >= 1) increasing = false;
            if (intensity <= 0) increasing = true;
            
            const glowIntensity = intensity * 20;
            element.style.boxShadow = `0 0 ${glowIntensity}px rgba(255, 221, 0, ${intensity * 0.8})`;
            
            if (element.isConnected) {
                requestAnimationFrame(updateGlow);
            }
        };
        
        updateGlow();
    }
    
    flashElement(element) {
        const originalBg = element.style.backgroundColor;
        element.style.backgroundColor = '#ffdd00';
        element.style.color = '#000';
        
        setTimeout(() => {
            element.style.backgroundColor = originalBg;
            element.style.color = '';
        }, 200);
    }
    
    // Special Nintendo-style effects
    createRainbowText(element) {
        const text = element.textContent;
        element.innerHTML = '';
        
        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char;
            span.style.color = this.getRainbowColor(index * 0.1);
            element.appendChild(span);
        });
        
        // Animate colors
        let offset = 0;
        const animateColors = () => {
            const spans = element.querySelectorAll('span');
            spans.forEach((span, index) => {
                span.style.color = this.getRainbowColor((index * 0.1) + offset);
            });
            offset += 0.02;
            
            if (element.isConnected) {
                requestAnimationFrame(animateColors);
            }
        };
        
        animateColors();
    }
    
    getRainbowColor(position) {
        const hue = (position * 360) % 360;
        return `hsl(${hue}, 100%, 60%)`;
    }
    
    // Screen transition effects
    async slideTransition(fromElement, toElement, direction = 'left') {
        const translateValue = direction === 'left' ? '-100%' : '100%';
        
        // Slide out current element
        await this.animate(fromElement, {
            transform: `translateX(${translateValue})`
        }, 400, 'easeInOut');
        
        fromElement.style.display = 'none';
        
        // Set up and slide in new element
        toElement.style.display = 'block';
        toElement.style.transform = `translateX(${direction === 'left' ? '100%' : '-100%'})`;
        
        await this.animate(toElement, {
            transform: 'translateX(0%)'
        }, 400, 'easeInOut');
    }
    
    async scaleTransition(fromElement, toElement) {
        // Scale down current element
        await this.animate(fromElement, {
            transform: 'scale(0)',
            opacity: '0'
        }, 300, 'easeIn');
        
        fromElement.style.display = 'none';
        
        // Scale up new element
        toElement.style.display = 'block';
        toElement.style.transform = 'scale(0)';
        toElement.style.opacity = '0';
        
        await this.animate(toElement, {
            transform: 'scale(1)',
            opacity: '1'
        }, 400, 'bounce');
    }
    
    // Utility methods
    stopAnimation(animationId) {
        this.activeAnimations.delete(animationId);
    }
    
    stopAllAnimations() {
        this.activeAnimations.clear();
    }
    
    // Chain multiple animations
    async sequence(...animations) {
        for (const animation of animations) {
            await animation();
        }
    }
    
    async parallel(...animations) {
        await Promise.all(animations.map(animation => animation()));
    }
}

// Export for use in other modules
window.UIAnimator = UIAnimator;