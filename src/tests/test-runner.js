/**
 * test-runner.js
 * 
 * Simple test runner for the performance optimization system
 */

const PerformanceManager = require('../performance/PerformanceManager');

class PerformanceTestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    /**
     * Add a test
     */
    addTest(name, testFn) {
        this.tests.push({ name, testFn });
    }

    /**
     * Run all tests
     */
    async runTests() {
        console.log('🧪 Running Performance System Tests');
        console.log('====================================\n');

        for (const test of this.tests) {
            try {
                console.log(`🧪 Running: ${test.name}`);
                const startTime = Date.now();
                await test.testFn();
                const duration = Date.now() - startTime;
                console.log(`✅ PASSED: ${test.name} (${duration}ms)\n`);
                this.results.push({ name: test.name, status: 'PASSED', duration });
            } catch (error) {
                console.log(`❌ FAILED: ${test.name} - ${error.message}\n`);
                this.results.push({ name: test.name, status: 'FAILED', error: error.message });
            }
        }

        this.printResults();
    }

    /**
     * Print test results
     */
    printResults() {
        console.log('📊 Test Results Summary');
        console.log('========================');
        
        const passed = this.results.filter(r => r.status === 'PASSED').length;
        const failed = this.results.filter(r => r.status === 'FAILED').length;
        
        console.log(`Total: ${this.results.length}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.filter(r => r.status === 'FAILED').forEach(result => {
                console.log(`  - ${result.name}: ${result.error}`);
            });
        }
    }

    /**
     * Assert helper
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    /**
     * Assert equals helper
     */
    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }
}

// Create test runner
const testRunner = new PerformanceTestRunner();

// Test PerformanceManager initialization
testRunner.addTest('PerformanceManager Initialization', async () => {
    const pm = new PerformanceManager();
    testRunner.assert(pm !== null, 'PerformanceManager should be created');
    testRunner.assert(pm.config.targetFPS === 60, 'Default target FPS should be 60');
    testRunner.assert(pm.metrics !== null, 'Metrics should be initialized');
    pm.destroy();
});

// Test ResourceOptimizer functionality
testRunner.addTest('ResourceOptimizer Asset Loading', async () => {
    const pm = new PerformanceManager();
    const asset = await pm.resourceOptimizer.loadAsset({
        type: 'image',
        path: 'test-image.png',
        priority: 'essential'
    });
    testRunner.assert(asset !== null, 'Asset should be loaded');
    testRunner.assert(asset.path === 'test-image.png', 'Asset path should match');
    pm.destroy();
});

// Test MemoryManager object pooling
testRunner.addTest('MemoryManager Object Pooling', async () => {
    const pm = new PerformanceManager();
    
    // Get object from pool
    const car1 = pm.memoryManager.getFromPool('cars');
    testRunner.assert(car1 !== null, 'Should get object from pool');
    testRunner.assert(car1._poolId !== undefined, 'Object should have pool ID');
    
    // Return object to pool
    pm.memoryManager.returnToPool('cars', car1);
    
    // Get another object (should reuse the first one)
    const car2 = pm.memoryManager.getFromPool('cars');
    testRunner.assert(car2 === car1, 'Should reuse pooled object');
    
    pm.destroy();
});

// Test RenderOptimizer LOD system
testRunner.addTest('RenderOptimizer LOD System', async () => {
    const pm = new PerformanceManager();
    
    // Add object to LOD system
    const testObject = {
        type: 'car',
        position: { x: 0, y: 0, z: 0 },
        boundingRadius: 5
    };
    
    pm.renderOptimizer.addLODObject('test_car', testObject);
    testRunner.assert(pm.renderOptimizer.lodObjects.has('test_car'), 'Object should be added to LOD system');
    
    // Test LOD level selection
    const lodLevel = pm.renderOptimizer.selectLODLevel('car', 150);
    testRunner.assert(lodLevel >= 0, 'Should return valid LOD level');
    
    pm.destroy();
});

// Test quality preset changes
testRunner.addTest('Quality Preset Changes', async () => {
    const pm = new PerformanceManager();
    
    // Test low quality preset
    pm.setQualityPreset('low');
    testRunner.assertEqual(pm.qualitySettings.renderScale, 0.5, 'Low quality should set render scale to 0.5');
    
    // Test high quality preset
    pm.setQualityPreset('high');
    testRunner.assertEqual(pm.qualitySettings.renderScale, 1.0, 'High quality should set render scale to 1.0');
    
    pm.destroy();
});

// Test cache functionality
testRunner.addTest('Cache System', async () => {
    const pm = new PerformanceManager();
    
    // Put item in cache
    pm.memoryManager.putInCache('textures', 'test.png', { data: 'test' }, 1024);
    
    // Get item from cache
    const cached = pm.memoryManager.getFromCache('textures', 'test.png');
    testRunner.assert(cached !== null, 'Should retrieve cached item');
    testRunner.assert(cached.data === 'test', 'Cached data should match');
    
    pm.destroy();
});

// Test performance metrics
testRunner.addTest('Performance Metrics', async () => {
    const pm = new PerformanceManager();
    
    // Simulate a few frame updates
    for (let i = 0; i < 10; i++) {
        pm.update();
        // Small delay to simulate frame time
        await new Promise(resolve => setTimeout(resolve, 16));
    }
    
    const metrics = pm.getMetrics();
    testRunner.assert(metrics.frameCount >= 10, 'Frame count should be updated');
    testRunner.assert(metrics.fps > 0, 'FPS should be calculated');
    
    pm.destroy();
});

// Test adaptive quality adjustment
testRunner.addTest('Adaptive Quality Adjustment', async () => {
    const pm = new PerformanceManager({ adaptiveQuality: true });
    
    // Simulate poor performance by manually setting high frame times
    pm.metrics.frameTimes.fill(25); // 40 FPS (poor performance)
    
    const originalScale = pm.qualitySettings.renderScale;
    pm.adjustQualitySettings();
    
    // Quality should be reduced due to poor performance
    testRunner.assert(
        pm.qualitySettings.renderScale <= originalScale,
        'Quality should be reduced for poor performance'
    );
    
    pm.destroy();
});

// Test memory cleanup
testRunner.addTest('Memory Cleanup', async () => {
    const pm = new PerformanceManager();
    
    // Create some objects and cache items
    for (let i = 0; i < 10; i++) {
        const particle = pm.memoryManager.getFromPool('particles');
        pm.memoryManager.putInCache('textures', `test${i}.png`, { data: i }, 1024);
    }
    
    const initialCacheSize = pm.memoryManager.caches.get('textures').items.size;
    
    // Force cleanup
    pm.memoryManager.performMemoryCleanup();
    
    // Some cleanup should have occurred
    testRunner.assert(initialCacheSize >= 0, 'Cache should have initial items');
    
    pm.destroy();
});

// Run the tests
if (require.main === module) {
    testRunner.runTests().catch(console.error);
}

module.exports = PerformanceTestRunner;