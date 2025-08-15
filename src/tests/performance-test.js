/**
 * performance-test.js
 * 
 * Performance testing and benchmarking for the optimization system
 */

const PerformanceManager = require('../performance/PerformanceManager');

class PerformanceBenchmark {
    constructor() {
        this.benchmarks = [];
        this.results = [];
    }

    /**
     * Add a benchmark test
     */
    addBenchmark(name, setupFn, testFn, cleanupFn) {
        this.benchmarks.push({ name, setupFn, testFn, cleanupFn });
    }

    /**
     * Run all benchmarks
     */
    async runBenchmarks() {
        console.log('⚡ Running Performance Benchmarks');
        console.log('=================================\n');

        for (const benchmark of this.benchmarks) {
            console.log(`⚡ Benchmarking: ${benchmark.name}`);
            
            try {
                // Setup
                const context = benchmark.setupFn ? await benchmark.setupFn() : {};
                
                // Warm up
                for (let i = 0; i < 10; i++) {
                    await benchmark.testFn(context);
                }
                
                // Run benchmark
                const iterations = 1000;
                const startTime = process.hrtime.bigint();
                
                for (let i = 0; i < iterations; i++) {
                    await benchmark.testFn(context);
                }
                
                const endTime = process.hrtime.bigint();
                const totalTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
                const avgTime = totalTime / iterations;
                const opsPerSecond = 1000 / avgTime;
                
                // Cleanup
                if (benchmark.cleanupFn) {
                    await benchmark.cleanupFn(context);
                }
                
                const result = {
                    name: benchmark.name,
                    totalTime,
                    avgTime,
                    opsPerSecond,
                    iterations
                };
                
                this.results.push(result);
                
                console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
                console.log(`  Average time: ${avgTime.toFixed(4)}ms per operation`);
                console.log(`  Operations/sec: ${opsPerSecond.toFixed(0)}`);
                console.log('');
                
            } catch (error) {
                console.log(`❌ Benchmark failed: ${error.message}\n`);
            }
        }
        
        this.printBenchmarkSummary();
    }

    /**
     * Print benchmark summary
     */
    printBenchmarkSummary() {
        console.log('📊 Benchmark Summary');
        console.log('====================');
        
        this.results.sort((a, b) => b.opsPerSecond - a.opsPerSecond);
        
        this.results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.name}: ${result.opsPerSecond.toFixed(0)} ops/sec`);
        });
    }
}

// Create benchmark runner
const benchmark = new PerformanceBenchmark();

// Benchmark object pooling vs new object creation
benchmark.addBenchmark(
    'Object Pooling vs New Creation',
    // Setup
    () => {
        const pm = new PerformanceManager();
        return { pm };
    },
    // Test
    async (context) => {
        // Pool version
        const pooled = context.pm.memoryManager.getFromPool('particles');
        if (pooled) {
            context.pm.memoryManager.returnToPool('particles', pooled);
        }
        
        // New object version (for comparison)
        const newObj = {
            position: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            life: 0,
            active: false
        };
    },
    // Cleanup
    (context) => {
        context.pm.destroy();
    }
);

// Benchmark cache operations
benchmark.addBenchmark(
    'Cache Get/Set Operations',
    // Setup
    () => {
        const pm = new PerformanceManager();
        // Pre-populate cache
        for (let i = 0; i < 50; i++) {
            pm.memoryManager.putInCache('textures', `texture${i}.png`, { data: `data${i}` }, 1024);
        }
        return { pm };
    },
    // Test
    async (context) => {
        const key = `texture${Math.floor(Math.random() * 50)}.png`;
        context.pm.memoryManager.getFromCache('textures', key);
    },
    // Cleanup
    (context) => {
        context.pm.destroy();
    }
);

// Benchmark LOD calculations
benchmark.addBenchmark(
    'LOD Level Calculations',
    // Setup
    () => {
        const pm = new PerformanceManager();
        // Add some objects to LOD system
        for (let i = 0; i < 100; i++) {
            pm.renderOptimizer.addLODObject(`obj_${i}`, {
                type: 'car',
                position: { x: i * 10, y: 0, z: 0 },
                boundingRadius: 5
            });
        }
        return { pm };
    },
    // Test
    async (context) => {
        const distance = Math.random() * 1000;
        context.pm.renderOptimizer.selectLODLevel('car', distance);
    },
    // Cleanup
    (context) => {
        context.pm.destroy();
    }
);

// Benchmark frustum culling
benchmark.addBenchmark(
    'Frustum Culling',
    // Setup
    () => {
        const pm = new PerformanceManager();
        // Add objects for culling
        for (let i = 0; i < 200; i++) {
            pm.renderOptimizer.addLODObject(`obj_${i}`, {
                type: 'building',
                position: { 
                    x: Math.random() * 2000 - 1000, 
                    y: Math.random() * 2000 - 1000, 
                    z: Math.random() * 100 
                },
                boundingRadius: 10
            });
        }
        return { pm };
    },
    // Test
    async (context) => {
        context.pm.renderOptimizer.performFrustumCulling();
    },
    // Cleanup
    (context) => {
        context.pm.destroy();
    }
);

// Benchmark asset loading simulation
benchmark.addBenchmark(
    'Asset Loading Simulation',
    // Setup
    () => {
        const pm = new PerformanceManager();
        return { pm };
    },
    // Test
    async (context) => {
        await context.pm.resourceOptimizer.loadAsset({
            type: 'image',
            path: `benchmark-texture-${Math.random()}.png`,
            priority: 'background'
        });
    },
    // Cleanup
    (context) => {
        context.pm.destroy();
    }
);

// Benchmark performance manager update cycle
benchmark.addBenchmark(
    'Performance Manager Update Cycle',
    // Setup
    () => {
        const pm = new PerformanceManager();
        // Add some load to the system
        for (let i = 0; i < 50; i++) {
            const particle = pm.memoryManager.getFromPool('particles');
            const car = pm.memoryManager.getFromPool('cars');
            pm.renderOptimizer.addLODObject(`test_${i}`, {
                type: 'car',
                position: { x: i * 5, y: 0, z: 0 },
                boundingRadius: 3
            });
        }
        return { pm };
    },
    // Test
    async (context) => {
        context.pm.update();
    },
    // Cleanup
    (context) => {
        context.pm.destroy();
    }
);

// Benchmark memory cleanup operations
benchmark.addBenchmark(
    'Memory Cleanup Operations',
    // Setup
    () => {
        const pm = new PerformanceManager();
        // Create memory pressure
        for (let i = 0; i < 100; i++) {
            pm.memoryManager.putInCache('textures', `texture${i}.png`, { data: new Array(1000).fill(i) }, 4096);
            pm.memoryManager.getFromPool('particles');
        }
        return { pm };
    },
    // Test
    async (context) => {
        context.pm.memoryManager.performMemoryCleanup();
    },
    // Cleanup
    (context) => {
        context.pm.destroy();
    }
);

// Memory stress test
async function runMemoryStressTest() {
    console.log('\n🧠 Memory Stress Test');
    console.log('====================');
    
    const pm = new PerformanceManager();
    const startMemory = process.memoryUsage();
    
    console.log('Creating 10,000 objects...');
    const objects = [];
    
    // Create many objects to stress memory
    for (let i = 0; i < 10000; i++) {
        const particle = pm.memoryManager.getFromPool('particles');
        if (particle) {
            particle.position = { x: Math.random() * 1000, y: Math.random() * 1000, z: 0 };
            objects.push(particle);
        }
        
        // Add cache pressure
        if (i % 10 === 0) {
            pm.memoryManager.putInCache('textures', `stress-texture-${i}.png`, 
                { data: new Array(100).fill(i) }, 1024);
        }
    }
    
    const midMemory = process.memoryUsage();
    console.log(`Memory after object creation: ${(midMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    
    // Return objects to pool
    console.log('Returning objects to pool...');
    objects.forEach(obj => {
        pm.memoryManager.returnToPool('particles', obj);
    });
    
    // Force cleanup
    pm.memoryManager.performMemoryCleanup();
    pm.memoryManager.forceGarbageCollection();
    
    const endMemory = process.memoryUsage();
    console.log(`Memory after cleanup: ${(endMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Memory difference: ${((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2)}MB`);
    
    // Print memory stats
    const memoryStats = pm.memoryManager.getMemoryStats();
    console.log('\nMemory Statistics:');
    Object.entries(memoryStats.pools).forEach(([name, stats]) => {
        console.log(`  ${name}: ${stats.reused}/${stats.totalRequests} reused (${stats.reuseRate.toFixed(1)}%)`);
    });
    
    pm.destroy();
}

// Frame rate stability test
async function runFrameRateTest() {
    console.log('\n🎯 Frame Rate Stability Test');
    console.log('============================');
    
    const pm = new PerformanceManager({ targetFPS: 60, adaptiveQuality: true });
    const frameTimes = [];
    
    console.log('Running 300 frames...');
    
    for (let frame = 0; frame < 300; frame++) {
        const frameStart = process.hrtime.bigint();
        
        // Simulate game logic
        pm.update();
        
        // Simulate varying load
        if (frame % 60 === 0) {
            // Add periodic stress
            for (let i = 0; i < 50; i++) {
                pm.memoryManager.getFromPool('particles');
            }
        }
        
        const frameEnd = process.hrtime.bigint();
        const frameTime = Number(frameEnd - frameStart) / 1000000; // Convert to ms
        frameTimes.push(frameTime);
        
        // Simulate 60 FPS target
        await new Promise(resolve => setTimeout(resolve, Math.max(0, 16.67 - frameTime)));
    }
    
    // Analyze frame times
    const avgFrameTime = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
    const maxFrameTime = Math.max(...frameTimes);
    const minFrameTime = Math.min(...frameTimes);
    const frameTimeVariance = frameTimes.reduce((acc, time) => acc + Math.pow(time - avgFrameTime, 2), 0) / frameTimes.length;
    const frameTimeStdDev = Math.sqrt(frameTimeVariance);
    
    console.log(`Average frame time: ${avgFrameTime.toFixed(2)}ms (${(1000/avgFrameTime).toFixed(1)} FPS)`);
    console.log(`Min frame time: ${minFrameTime.toFixed(2)}ms`);
    console.log(`Max frame time: ${maxFrameTime.toFixed(2)}ms`);
    console.log(`Standard deviation: ${frameTimeStdDev.toFixed(2)}ms`);
    
    const metrics = pm.getMetrics();
    console.log(`Final quality settings:`, metrics.qualitySettings);
    
    pm.destroy();
}

// Run benchmarks
if (require.main === module) {
    async function runAllTests() {
        try {
            await benchmark.runBenchmarks();
            await runMemoryStressTest();
            await runFrameRateTest();
        } catch (error) {
            console.error('Error running performance tests:', error);
        }
    }
    
    runAllTests();
}

module.exports = PerformanceBenchmark;