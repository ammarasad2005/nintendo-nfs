/**
 * PerformanceManager.js
 * 
 * Main performance optimization coordinator for Nintendo-styled Need for Speed game.
 * Manages frame rate optimization, memory management, and performance monitoring.
 */

const performanceNow = require('performance-now');
const ResourceOptimizer = require('./ResourceOptimizer');
const RenderOptimizer = require('./RenderOptimizer');
const MemoryManager = require('./MemoryManager');

class PerformanceManager {
    constructor(config = {}) {
        this.config = {
            targetFPS: 60,
            adaptiveQuality: true,
            enableProfiling: true,
            enableDebugTools: false,
            memoryThreshold: 100 * 1024 * 1024, // 100MB
            frameTimeThreshold: 16.67, // ~60 FPS in ms
            ...config
        };

        // Initialize performance metrics
        this.metrics = {
            frameTime: 0,
            fps: 0,
            memoryUsage: 0,
            drawCalls: 0,
            activeObjects: 0,
            frameCount: 0,
            lastFrameTime: performanceNow(),
            frameTimes: new Array(60).fill(16.67), // Rolling average buffer
            frameTimeIndex: 0
        };

        // Initialize optimization modules
        this.resourceOptimizer = new ResourceOptimizer(this);
        this.renderOptimizer = new RenderOptimizer(this);
        this.memoryManager = new MemoryManager(this);

        // Performance monitoring
        this.performanceMonitors = [];
        this.debugEnabled = this.config.enableDebugTools;
        
        // Quality settings
        this.qualitySettings = {
            renderScale: 1.0,
            particleDensity: 1.0,
            shadowQuality: 'high',
            textureQuality: 'high',
            effectsQuality: 'high',
            lodDistance: 1.0
        };

        this.initialize();
    }

    /**
     * Initialize the performance management system
     */
    initialize() {
        console.log('🚀 Initializing Performance Manager...');
        
        // Initialize sub-systems
        this.resourceOptimizer.initialize();
        this.renderOptimizer.initialize();
        this.memoryManager.initialize();

        // Start performance monitoring
        if (this.config.enableProfiling) {
            this.startProfiling();
        }

        console.log('✅ Performance Manager initialized successfully');
    }

    /**
     * Main performance update loop - should be called every frame
     */
    update() {
        const currentTime = performanceNow();
        this.metrics.frameTime = currentTime - this.metrics.lastFrameTime;
        this.metrics.lastFrameTime = currentTime;

        // Update rolling frame time average
        this.metrics.frameTimes[this.metrics.frameTimeIndex] = this.metrics.frameTime;
        this.metrics.frameTimeIndex = (this.metrics.frameTimeIndex + 1) % this.metrics.frameTimes.length;

        // Calculate FPS
        const avgFrameTime = this.metrics.frameTimes.reduce((a, b) => a + b) / this.metrics.frameTimes.length;
        this.metrics.fps = 1000 / avgFrameTime;

        // Update frame counter
        this.metrics.frameCount++;

        // Update sub-systems
        this.resourceOptimizer.update();
        this.renderOptimizer.update();
        this.memoryManager.update();

        // Adaptive quality adjustment
        if (this.config.adaptiveQuality) {
            this.adjustQualitySettings();
        }

        // Memory monitoring
        this.updateMemoryMetrics();

        // Debug visualization
        if (this.debugEnabled) {
            this.updateDebugDisplay();
        }
    }

    /**
     * Adjust quality settings based on performance metrics
     */
    adjustQualitySettings() {
        const targetFrameTime = 1000 / this.config.targetFPS;
        const avgFrameTime = this.metrics.frameTimes.reduce((a, b) => a + b) / this.metrics.frameTimes.length;

        // If performance is poor, reduce quality
        if (avgFrameTime > targetFrameTime * 1.2) {
            this.reduceQuality();
        }
        // If performance is good, try to increase quality
        else if (avgFrameTime < targetFrameTime * 0.8 && this.canIncreaseQuality()) {
            this.increaseQuality();
        }
    }

    /**
     * Reduce quality settings to improve performance
     */
    reduceQuality() {
        if (this.qualitySettings.renderScale > 0.5) {
            this.qualitySettings.renderScale = Math.max(0.5, this.qualitySettings.renderScale - 0.1);
            this.renderOptimizer.setRenderScale(this.qualitySettings.renderScale);
        } else if (this.qualitySettings.particleDensity > 0.3) {
            this.qualitySettings.particleDensity = Math.max(0.3, this.qualitySettings.particleDensity - 0.2);
            this.renderOptimizer.setParticleDensity(this.qualitySettings.particleDensity);
        } else if (this.qualitySettings.shadowQuality !== 'low') {
            this.qualitySettings.shadowQuality = this.qualitySettings.shadowQuality === 'high' ? 'medium' : 'low';
            this.renderOptimizer.setShadowQuality(this.qualitySettings.shadowQuality);
        }
    }

    /**
     * Increase quality settings when performance allows
     */
    increaseQuality() {
        if (this.qualitySettings.renderScale < 1.0) {
            this.qualitySettings.renderScale = Math.min(1.0, this.qualitySettings.renderScale + 0.1);
            this.renderOptimizer.setRenderScale(this.qualitySettings.renderScale);
        } else if (this.qualitySettings.particleDensity < 1.0) {
            this.qualitySettings.particleDensity = Math.min(1.0, this.qualitySettings.particleDensity + 0.1);
            this.renderOptimizer.setParticleDensity(this.qualitySettings.particleDensity);
        } else if (this.qualitySettings.shadowQuality !== 'high') {
            this.qualitySettings.shadowQuality = this.qualitySettings.shadowQuality === 'low' ? 'medium' : 'high';
            this.renderOptimizer.setShadowQuality(this.qualitySettings.shadowQuality);
        }
    }

    /**
     * Check if quality can be increased
     */
    canIncreaseQuality() {
        return this.qualitySettings.renderScale < 1.0 ||
               this.qualitySettings.particleDensity < 1.0 ||
               this.qualitySettings.shadowQuality !== 'high';
    }

    /**
     * Update memory usage metrics
     */
    updateMemoryMetrics() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const memUsage = process.memoryUsage();
            this.metrics.memoryUsage = memUsage.heapUsed;

            // Trigger garbage collection if memory usage is high
            if (this.metrics.memoryUsage > this.config.memoryThreshold) {
                this.memoryManager.forceGarbageCollection();
            }
        }
    }

    /**
     * Start performance profiling
     */
    startProfiling() {
        this.profilingStartTime = performanceNow();
        console.log('📊 Performance profiling started');
    }

    /**
     * Stop performance profiling and return results
     */
    stopProfiling() {
        const profilingTime = performanceNow() - this.profilingStartTime;
        const avgFPS = this.metrics.frameCount / (profilingTime / 1000);
        
        const profilingResults = {
            totalTime: profilingTime,
            frameCount: this.metrics.frameCount,
            averageFPS: avgFPS,
            averageFrameTime: profilingTime / this.metrics.frameCount,
            memoryPeak: this.metrics.memoryUsage,
            qualitySettings: { ...this.qualitySettings }
        };

        console.log('📊 Performance profiling completed:', profilingResults);
        return profilingResults;
    }

    /**
     * Get current performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            qualitySettings: { ...this.qualitySettings }
        };
    }

    /**
     * Set quality preset
     */
    setQualityPreset(preset) {
        const presets = {
            low: {
                renderScale: 0.5,
                particleDensity: 0.3,
                shadowQuality: 'low',
                textureQuality: 'low',
                effectsQuality: 'low',
                lodDistance: 0.5
            },
            medium: {
                renderScale: 0.75,
                particleDensity: 0.7,
                shadowQuality: 'medium',
                textureQuality: 'medium',
                effectsQuality: 'medium',
                lodDistance: 0.75
            },
            high: {
                renderScale: 1.0,
                particleDensity: 1.0,
                shadowQuality: 'high',
                textureQuality: 'high',
                effectsQuality: 'high',
                lodDistance: 1.0
            }
        };

        if (presets[preset]) {
            this.qualitySettings = { ...presets[preset] };
            this.applyQualitySettings();
            console.log(`🎮 Quality preset set to: ${preset}`);
        }
    }

    /**
     * Apply current quality settings to all systems
     */
    applyQualitySettings() {
        this.renderOptimizer.setRenderScale(this.qualitySettings.renderScale);
        this.renderOptimizer.setParticleDensity(this.qualitySettings.particleDensity);
        this.renderOptimizer.setShadowQuality(this.qualitySettings.shadowQuality);
        this.renderOptimizer.setLODDistance(this.qualitySettings.lodDistance);
        this.resourceOptimizer.setTextureQuality(this.qualitySettings.textureQuality);
    }

    /**
     * Enable/disable debug tools
     */
    setDebugMode(enabled) {
        this.debugEnabled = enabled;
        console.log(`🔧 Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Update debug display (override in specific implementations)
     */
    updateDebugDisplay() {
        // This would be implemented based on the specific rendering system
        // For now, we'll just log metrics periodically
        if (this.metrics.frameCount % 60 === 0) {
            console.log(`🔧 DEBUG - FPS: ${this.metrics.fps.toFixed(1)}, Frame Time: ${this.metrics.frameTime.toFixed(2)}ms, Memory: ${(this.metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        console.log('🧹 Cleaning up Performance Manager...');
        
        this.resourceOptimizer.destroy();
        this.renderOptimizer.destroy();
        this.memoryManager.destroy();

        this.performanceMonitors = [];
        
        console.log('✅ Performance Manager cleaned up');
    }
}

module.exports = PerformanceManager;