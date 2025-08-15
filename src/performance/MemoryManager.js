/**
 * MemoryManager.js
 * 
 * Handles object pooling, garbage collection optimization, asset unloading,
 * cache management, and memory profiling.
 */

class MemoryManager {
    constructor(performanceManager) {
        this.performanceManager = performanceManager;
        
        // Object pools
        this.objectPools = new Map();
        this.poolConfigs = new Map();
        
        // Cache management
        this.caches = new Map();
        this.cacheStats = new Map();
        
        // Memory tracking
        this.memoryUsage = {
            heap: 0,
            used: 0,
            external: 0,
            rss: 0
        };
        
        this.memoryHistory = [];
        this.maxHistorySize = 300; // 5 minutes at 60fps
        
        // Garbage collection
        this.gcStats = {
            collections: 0,
            lastCollection: 0,
            totalPause: 0,
            avgPause: 0
        };
        
        // Configuration
        this.config = {
            enableProfiling: true,
            enableAutoGC: true,
            gcThreshold: 80, // Percentage of memory usage to trigger GC
            maxCacheSize: 50 * 1024 * 1024, // 50MB
            poolGrowthFactor: 1.5,
            cacheEvictionPolicy: 'LRU', // LRU, LFU, or FIFO
            memoryWarningThreshold: 100 * 1024 * 1024, // 100MB
            memoryCriticalThreshold: 200 * 1024 * 1024 // 200MB
        };

        // Pool presets for common game objects
        this.initializeCommonPools();
    }

    /**
     * Initialize the memory manager
     */
    initialize() {
        console.log('🧠 Initializing Memory Manager...');
        
        this.setupMemoryProfiling();
        this.setupCacheSystem();
        this.startMemoryMonitoring();
        
        console.log('✅ Memory Manager initialized');
    }

    /**
     * Initialize common object pools
     */
    initializeCommonPools() {
        // Car objects pool
        this.createPool('cars', {
            createFn: () => this.createCarObject(),
            resetFn: (obj) => this.resetCarObject(obj),
            initialSize: 10,
            maxSize: 50,
            growthFactor: 1.5
        });

        // Particle objects pool
        this.createPool('particles', {
            createFn: () => this.createParticleObject(),
            resetFn: (obj) => this.resetParticleObject(obj),
            initialSize: 1000,
            maxSize: 10000,
            growthFactor: 2.0
        });

        // Sound objects pool
        this.createPool('sounds', {
            createFn: () => this.createSoundObject(),
            resetFn: (obj) => this.resetSoundObject(obj),
            initialSize: 20,
            maxSize: 100,
            growthFactor: 1.5
        });

        // UI elements pool
        this.createPool('ui-elements', {
            createFn: () => this.createUIElement(),
            resetFn: (obj) => this.resetUIElement(obj),
            initialSize: 50,
            maxSize: 200,
            growthFactor: 1.3
        });

        // Projectile/power-up objects pool
        this.createPool('projectiles', {
            createFn: () => this.createProjectileObject(),
            resetFn: (obj) => this.resetProjectileObject(obj),
            initialSize: 30,
            maxSize: 150,
            growthFactor: 1.5
        });
    }

    /**
     * Create an object pool
     */
    createPool(name, config) {
        const pool = {
            available: [],
            inUse: new Set(),
            config: config,
            stats: {
                created: 0,
                reused: 0,
                totalRequests: 0,
                peakUsage: 0
            }
        };

        // Pre-populate the pool
        for (let i = 0; i < config.initialSize; i++) {
            const obj = config.createFn();
            obj._poolId = this.generateObjectId();
            pool.available.push(obj);
            pool.stats.created++;
        }

        this.objectPools.set(name, pool);
        this.poolConfigs.set(name, config);
        
        console.log(`🏊 Created object pool '${name}' with ${config.initialSize} objects`);
    }

    /**
     * Get object from pool
     */
    getFromPool(poolName) {
        const pool = this.objectPools.get(poolName);
        if (!pool) {
            console.warn(`⚠️ Pool '${poolName}' not found`);
            return null;
        }

        pool.stats.totalRequests++;

        let obj;
        if (pool.available.length > 0) {
            // Reuse existing object
            obj = pool.available.pop();
            pool.stats.reused++;
        } else {
            // Create new object if pool can grow
            if (pool.inUse.size < pool.config.maxSize) {
                obj = pool.config.createFn();
                obj._poolId = this.generateObjectId();
                pool.stats.created++;
            } else {
                console.warn(`⚠️ Pool '${poolName}' exhausted (${pool.config.maxSize} objects)`);
                return null;
            }
        }

        pool.inUse.add(obj);
        pool.stats.peakUsage = Math.max(pool.stats.peakUsage, pool.inUse.size);
        
        return obj;
    }

    /**
     * Return object to pool
     */
    returnToPool(poolName, obj) {
        const pool = this.objectPools.get(poolName);
        if (!pool || !obj) return;

        if (pool.inUse.has(obj)) {
            pool.inUse.delete(obj);
            
            // Reset object state
            if (pool.config.resetFn) {
                pool.config.resetFn(obj);
            }
            
            pool.available.push(obj);
        }
    }

    /**
     * Update memory manager (called every frame)
     */
    update() {
        this.updateMemoryUsage();
        this.updateCacheStats();
        this.checkMemoryThresholds();
        this.optimizePools();
        
        // Periodic garbage collection
        if (this.config.enableAutoGC && this.shouldTriggerGC()) {
            this.forceGarbageCollection();
        }
    }

    /**
     * Update memory usage statistics
     */
    updateMemoryUsage() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const memUsage = process.memoryUsage();
            this.memoryUsage = {
                heap: memUsage.heapTotal,
                used: memUsage.heapUsed,
                external: memUsage.external,
                rss: memUsage.rss
            };

            // Add to history
            this.memoryHistory.push({
                timestamp: Date.now(),
                ...this.memoryUsage
            });

            // Maintain history size
            if (this.memoryHistory.length > this.maxHistorySize) {
                this.memoryHistory.shift();
            }
        } else {
            // Mock memory usage for non-Node environments
            this.memoryUsage = {
                heap: 50 * 1024 * 1024,
                used: 30 * 1024 * 1024,
                external: 5 * 1024 * 1024,
                rss: 60 * 1024 * 1024
            };
        }
    }

    /**
     * Check memory thresholds and take action
     */
    checkMemoryThresholds() {
        const usedMemory = this.memoryUsage.used;
        
        if (usedMemory > this.config.memoryCriticalThreshold) {
            console.warn('🚨 Critical memory usage detected! Performing emergency cleanup...');
            this.performEmergencyCleanup();
        } else if (usedMemory > this.config.memoryWarningThreshold) {
            console.warn('⚠️ High memory usage detected. Triggering cleanup...');
            this.performMemoryCleanup();
        }
    }

    /**
     * Perform memory cleanup
     */
    performMemoryCleanup() {
        console.log('🧹 Performing memory cleanup...');
        
        // Clean up caches
        this.cleanupCaches();
        
        // Optimize object pools
        this.optimizePools();
        
        // Force garbage collection
        this.forceGarbageCollection();
        
        console.log('✅ Memory cleanup completed');
    }

    /**
     * Perform emergency memory cleanup
     */
    performEmergencyCleanup() {
        console.log('🚨 Performing emergency memory cleanup...');
        
        // Aggressive cache clearing
        this.clearAllCaches();
        
        // Shrink object pools
        this.shrinkPools();
        
        // Multiple GC cycles
        for (let i = 0; i < 3; i++) {
            this.forceGarbageCollection();
        }
        
        console.log('✅ Emergency cleanup completed');
    }

    /**
     * Setup cache system
     */
    setupCacheSystem() {
        this.createCache('textures', {
            maxSize: 20 * 1024 * 1024, // 20MB
            evictionPolicy: 'LRU',
            maxItems: 100
        });

        this.createCache('audio', {
            maxSize: 10 * 1024 * 1024, // 10MB
            evictionPolicy: 'LRU',
            maxItems: 50
        });

        this.createCache('meshes', {
            maxSize: 15 * 1024 * 1024, // 15MB
            evictionPolicy: 'LFU',
            maxItems: 75
        });
    }

    /**
     * Create a cache
     */
    createCache(name, config) {
        const cache = {
            items: new Map(),
            accessOrder: [],
            accessCount: new Map(),
            totalSize: 0,
            config: config
        };

        this.caches.set(name, cache);
        this.cacheStats.set(name, {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalRequests: 0
        });
    }

    /**
     * Get item from cache
     */
    getFromCache(cacheName, key) {
        const cache = this.caches.get(cacheName);
        const stats = this.cacheStats.get(cacheName);
        
        if (!cache || !stats) return null;

        stats.totalRequests++;

        if (cache.items.has(key)) {
            stats.hits++;
            const item = cache.items.get(key);
            
            // Update access tracking
            this.updateCacheAccess(cache, key);
            
            return item.data;
        } else {
            stats.misses++;
            return null;
        }
    }

    /**
     * Put item in cache
     */
    putInCache(cacheName, key, data, size = 1024) {
        const cache = this.caches.get(cacheName);
        if (!cache) return;

        // Check if eviction is needed
        while (cache.totalSize + size > cache.config.maxSize || 
               cache.items.size >= cache.config.maxItems) {
            this.evictFromCache(cache, cacheName);
        }

        const item = {
            data: data,
            size: size,
            timestamp: Date.now(),
            accessCount: 1
        };

        cache.items.set(key, item);
        cache.totalSize += size;
        cache.accessOrder.push(key);
        cache.accessCount.set(key, 1);
    }

    /**
     * Update cache access statistics
     */
    updateCacheAccess(cache, key) {
        const currentCount = cache.accessCount.get(key) || 0;
        cache.accessCount.set(key, currentCount + 1);

        // Move to end for LRU
        const index = cache.accessOrder.indexOf(key);
        if (index !== -1) {
            cache.accessOrder.splice(index, 1);
            cache.accessOrder.push(key);
        }
    }

    /**
     * Evict item from cache based on policy
     */
    evictFromCache(cache, cacheName) {
        let keyToEvict;
        
        switch (cache.config.evictionPolicy) {
            case 'LRU':
                keyToEvict = cache.accessOrder[0];
                break;
            case 'LFU':
                keyToEvict = this.findLFUKey(cache);
                break;
            case 'FIFO':
                keyToEvict = cache.accessOrder[0];
                break;
            default:
                keyToEvict = cache.accessOrder[0];
        }

        if (keyToEvict && cache.items.has(keyToEvict)) {
            const item = cache.items.get(keyToEvict);
            cache.totalSize -= item.size;
            cache.items.delete(keyToEvict);
            cache.accessCount.delete(keyToEvict);
            
            const orderIndex = cache.accessOrder.indexOf(keyToEvict);
            if (orderIndex !== -1) {
                cache.accessOrder.splice(orderIndex, 1);
            }

            // Update stats
            const stats = this.cacheStats.get(cacheName);
            if (stats) {
                stats.evictions++;
            }
        }
    }

    /**
     * Find least frequently used key
     */
    findLFUKey(cache) {
        let minCount = Infinity;
        let lfuKey = null;

        for (const [key, count] of cache.accessCount.entries()) {
            if (count < minCount) {
                minCount = count;
                lfuKey = key;
            }
        }

        return lfuKey;
    }

    /**
     * Clean up caches
     */
    cleanupCaches() {
        for (const [name, cache] of this.caches.entries()) {
            const targetSize = cache.config.maxSize * 0.7; // Reduce to 70%
            
            while (cache.totalSize > targetSize && cache.items.size > 0) {
                this.evictFromCache(cache, name);
            }
        }
    }

    /**
     * Clear all caches
     */
    clearAllCaches() {
        for (const [name, cache] of this.caches.entries()) {
            cache.items.clear();
            cache.accessOrder = [];
            cache.accessCount.clear();
            cache.totalSize = 0;
            
            const stats = this.cacheStats.get(name);
            if (stats) {
                stats.evictions += cache.items.size;
            }
        }
    }

    /**
     * Optimize object pools
     */
    optimizePools() {
        for (const [name, pool] of this.objectPools.entries()) {
            // Remove excess objects if pool is over-allocated
            const inUseCount = pool.inUse.size;
            const availableCount = pool.available.length;
            const optimalSize = Math.max(
                pool.config.initialSize,
                Math.ceil(inUseCount * 1.2) // 20% buffer
            );

            if (availableCount > optimalSize) {
                const excessCount = availableCount - optimalSize;
                pool.available.splice(0, excessCount);
            }
        }
    }

    /**
     * Shrink object pools
     */
    shrinkPools() {
        for (const [name, pool] of this.objectPools.entries()) {
            // Aggressively reduce available objects
            const minSize = Math.ceil(pool.config.initialSize * 0.5);
            if (pool.available.length > minSize) {
                pool.available.splice(minSize);
            }
        }
    }

    /**
     * Check if garbage collection should be triggered
     */
    shouldTriggerGC() {
        const memoryUsagePercent = (this.memoryUsage.used / this.memoryUsage.heap) * 100;
        const timeSinceLastGC = Date.now() - this.gcStats.lastCollection;
        
        return memoryUsagePercent > this.config.gcThreshold || timeSinceLastGC > 30000; // 30 seconds
    }

    /**
     * Force garbage collection
     */
    forceGarbageCollection() {
        if (typeof global !== 'undefined' && global.gc) {
            const startTime = Date.now();
            global.gc();
            const pauseTime = Date.now() - startTime;
            
            this.gcStats.collections++;
            this.gcStats.lastCollection = Date.now();
            this.gcStats.totalPause += pauseTime;
            this.gcStats.avgPause = this.gcStats.totalPause / this.gcStats.collections;
            
            console.log(`🗑️ Garbage collection completed in ${pauseTime}ms`);
        }
    }

    /**
     * Setup memory profiling
     */
    setupMemoryProfiling() {
        if (!this.config.enableProfiling) return;
        
        console.log('📊 Memory profiling enabled');
    }

    /**
     * Start memory monitoring
     */
    startMemoryMonitoring() {
        setInterval(() => {
            this.updateMemoryUsage();
        }, 1000); // Update every second
    }

    /**
     * Update cache statistics
     */
    updateCacheStats() {
        // This runs every frame but we only need periodic updates
        if (this.performanceManager.metrics.frameCount % 60 !== 0) return;
        
        for (const [name, cache] of this.caches.entries()) {
            const stats = this.cacheStats.get(name);
            if (stats && stats.totalRequests > 0) {
                stats.hitRate = (stats.hits / stats.totalRequests) * 100;
            }
        }
    }

    // Object creation functions for pools
    createCarObject() {
        return {
            position: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            rotation: 0,
            speed: 0,
            health: 100,
            active: false
        };
    }

    resetCarObject(obj) {
        obj.position = { x: 0, y: 0, z: 0 };
        obj.velocity = { x: 0, y: 0, z: 0 };
        obj.rotation = 0;
        obj.speed = 0;
        obj.health = 100;
        obj.active = false;
    }

    createParticleObject() {
        return {
            position: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            life: 0,
            maxLife: 1,
            color: { r: 1, g: 1, b: 1, a: 1 },
            size: 1,
            active: false
        };
    }

    resetParticleObject(obj) {
        obj.position = { x: 0, y: 0, z: 0 };
        obj.velocity = { x: 0, y: 0, z: 0 };
        obj.life = 0;
        obj.maxLife = 1;
        obj.color = { r: 1, g: 1, b: 1, a: 1 };
        obj.size = 1;
        obj.active = false;
    }

    createSoundObject() {
        return {
            source: null,
            volume: 1.0,
            pitch: 1.0,
            loop: false,
            playing: false,
            position: { x: 0, y: 0, z: 0 }
        };
    }

    resetSoundObject(obj) {
        obj.source = null;
        obj.volume = 1.0;
        obj.pitch = 1.0;
        obj.loop = false;
        obj.playing = false;
        obj.position = { x: 0, y: 0, z: 0 };
    }

    createUIElement() {
        return {
            x: 0, y: 0,
            width: 100, height: 50,
            visible: true,
            text: '',
            color: '#FFFFFF',
            type: 'button'
        };
    }

    resetUIElement(obj) {
        obj.x = 0;
        obj.y = 0;
        obj.width = 100;
        obj.height = 50;
        obj.visible = true;
        obj.text = '';
        obj.color = '#FFFFFF';
        obj.type = 'button';
    }

    createProjectileObject() {
        return {
            position: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            damage: 10,
            life: 5.0,
            type: 'shell',
            active: false
        };
    }

    resetProjectileObject(obj) {
        obj.position = { x: 0, y: 0, z: 0 };
        obj.velocity = { x: 0, y: 0, z: 0 };
        obj.damage = 10;
        obj.life = 5.0;
        obj.type = 'shell';
        obj.active = false;
    }

    /**
     * Generate unique object ID
     */
    generateObjectId() {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get memory statistics
     */
    getMemoryStats() {
        const poolStats = {};
        for (const [name, pool] of this.objectPools.entries()) {
            poolStats[name] = {
                available: pool.available.length,
                inUse: pool.inUse.size,
                created: pool.stats.created,
                reused: pool.stats.reused,
                totalRequests: pool.stats.totalRequests,
                peakUsage: pool.stats.peakUsage,
                reuseRate: pool.stats.totalRequests > 0 ? 
                    (pool.stats.reused / pool.stats.totalRequests) * 100 : 0
            };
        }

        const cacheStatsObj = {};
        for (const [name, stats] of this.cacheStats.entries()) {
            cacheStatsObj[name] = { ...stats };
        }

        return {
            memory: this.memoryUsage,
            gc: this.gcStats,
            pools: poolStats,
            caches: cacheStatsObj,
            memoryHistory: this.memoryHistory.slice(-60) // Last 60 entries
        };
    }

    /**
     * Clean up resources
     */
    destroy() {
        console.log('🧹 Cleaning up Memory Manager...');
        
        // Clear all pools
        for (const [name, pool] of this.objectPools.entries()) {
            pool.available = [];
            pool.inUse.clear();
        }
        this.objectPools.clear();
        
        // Clear all caches
        this.clearAllCaches();
        this.caches.clear();
        this.cacheStats.clear();
        
        // Clear history
        this.memoryHistory = [];
        
        console.log('✅ Memory Manager cleaned up');
    }
}

module.exports = MemoryManager;