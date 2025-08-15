# Nintendo NFS Particle System

A high-performance particle system designed for the Nintendo-style Need for Speed racing game. Features object pooling, multiple effect types, and Nintendo-inspired visual aesthetics.

## Features

### Core System
- **Object Pooling**: Efficient memory management with particle reuse
- **High Performance**: Optimized for 60+ FPS with hundreds of particles
- **Nintendo Aesthetics**: Bright, vibrant colors and clean pixel-style rendering
- **Modular Design**: Easy to extend with new particle effects

### Particle Effects

#### 🌫️ Drift Smoke (`DriftSmoke.js`)
- Realistic smoke trail effects for drifting cars
- Multiple color variations (light gray, medium gray, warm gray)
- Dynamic emission based on car velocity and drift intensity
- Upward-rising smoke with gravity simulation

#### ⚡ Boost Trail (`BoostTrail.js`)
- Dynamic speed lines and glowing particles
- Bright Nintendo-style colors (yellow, orange, electric blue)
- Multi-layered effects (speed lines, glow particles, energy core)
- Speed-based particle generation and behavior

#### ✨ Collision Sparks (`CollisionSparks.js`)
- Multiple collision types (wall, car, object, normal)
- Bright spark colors with size and color variations
- Realistic physics with gravity and bounce behavior
- Explosive patterns for dramatic impacts

## Usage

### Basic Setup

```javascript
// Initialize the particle system
const particleSystem = new ParticleSystem(1000); // Max 1000 particles

// Create effect managers
const driftSmoke = new DriftSmoke(particleSystem);
const boostTrail = new BoostTrail(particleSystem);
const collisionSparks = new CollisionSparks(particleSystem);

// Game loop
function gameLoop(deltaTime) {
    particleSystem.update(deltaTime);
    particleSystem.render(ctx);
}
```

### Using ParticleManager (Recommended)

```javascript
// Initialize with integrated manager
const particleManager = new ParticleManager(canvas);

// Start drift smoke
particleManager.startDriftSmoke(carId, x, y, velocity, intensity);

// Start boost trail
particleManager.startBoostTrail(carId, x, y, velocity, intensity);

// Create collision sparks
particleManager.createCollisionSparks(x, y, velocity, intensity, 'car');
```

### Individual Effects

#### Drift Smoke
```javascript
// Start drift smoke
driftSmoke.start(x, y, velocity, intensity);

// Update position (call every frame while drifting)
driftSmoke.update(x, y, velocity, intensity);

// Stop smoke
driftSmoke.stop();

// Create smoke burst (for sudden direction changes)
driftSmoke.burst(x, y, intensity);
```

#### Boost Trail
```javascript
// Start boost trail
boostTrail.start(x, y, velocity, boostIntensity);

// Update position (call every frame while boosting)
boostTrail.update(x, y, velocity, boostIntensity);

// Stop boost trail
boostTrail.stop();
```

#### Collision Sparks
```javascript
// Standard collision
collisionSparks.createCollision(x, y, velocity, intensity);

// Specific collision types
collisionSparks.createCollision(x, y, velocity, intensity, 'wall');
collisionSparks.createCollision(x, y, velocity, intensity, 'car');
collisionSparks.createCollision(x, y, velocity, intensity, 'object');

// Spark shower effect
collisionSparks.createSparkShower(x, y, intensity, duration);
```

## Configuration

### Particle Properties
- `x, y`: Position
- `vx, vy`: Velocity
- `life, maxLife`: Lifetime in seconds
- `size`: Particle size in pixels
- `color`: RGBA color object
- `gravity`: Gravity acceleration
- `friction`: Velocity dampening factor
- `rotation, rotationSpeed`: Rotation properties

### Performance Tuning
- Adjust `maxParticles` based on target device performance
- Use lower emission rates for mobile devices
- Monitor particle count with `getStats()`

## File Structure

```
src/particles/
├── ParticleSystem.js       # Core particle system with object pooling
├── ParticleEmitter.js      # Emission controls and particle management
├── ParticleManager.js      # High-level integration class
└── ParticleEffects/
    ├── DriftSmoke.js       # Drift smoke trail effects
    ├── BoostTrail.js       # Boost speed line effects
    └── CollisionSparks.js  # Collision spark effects
```

## Performance Stats

The system maintains 60 FPS with:
- 100+ active particles simultaneously
- Multiple effect types running concurrently
- Object pooling preventing garbage collection spikes
- Optimized rendering with batch operations

## Nintendo Visual Style

The particle system follows Nintendo's design principles:
- **Bright, Vibrant Colors**: High contrast, saturated colors that pop
- **Clean Shapes**: Simple, pixelated particle rendering
- **Smooth Animation**: 60 FPS with fluid motion
- **Visual Clarity**: Effects enhance gameplay without obscuring it
- **Consistent Aesthetic**: All effects match the retro pixel art style

## Integration Example

See `index.html` for a complete working demo of all particle effects.

## Browser Compatibility

- Modern browsers with Canvas 2D support
- Works in both Node.js and browser environments
- No external dependencies required