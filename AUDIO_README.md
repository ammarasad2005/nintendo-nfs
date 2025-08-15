# 🎵 Nintendo NFS Audio System

A comprehensive audio management system for the Nintendo-styled Need for Speed game, featuring retro-style sound processing, spatial audio, and performance-optimized sound pooling.

## 🚀 Features

### 🎛️ AudioManager.js
- **Sound Effect Management**: Centralized control of all audio assets
- **Background Music System**: Seamless music playback with loop support
- **Dynamic Audio Mixing**: Real-time audio processing and effects
- **Audio Pooling**: Performance-optimized sound reuse system
- **Volume Control**: Independent master, music, and effects volume
- **Mute/Unmute**: Quick audio toggling functionality

### 🎵 BackgroundMusic.js
- **Music Track Loading**: Support for various audio formats
- **Smooth Transitions**: Seamless track switching with crossfading
- **Loop Point Management**: Precise control over music looping
- **Dynamic Volume Control**: Real-time volume adjustments
- **Nintendo-Style Presets**: Built-in configurations for different game modes

### 🔊 SoundEffects.js
- **Sound Effect Loading**: Efficient audio asset management
- **Sound Pooling**: Performance optimization through object reuse
- **Spatial Audio Support**: 3D positioned sound effects
- **Priority-Based Management**: Intelligent sound prioritization
- **Effect Categories**: Organized sound types (engine, collision, UI, etc.)

### 🎚️ AudioMixer.js
- **Channel Management**: Separate channels for different audio types
- **Dynamic Mixing**: Real-time audio processing
- **Effect Processing**: Built-in audio effects (filters, reverb, compression)
- **Volume Envelopes**: Smooth volume transitions
- **Nintendo-Style Processing**: Retro audio characteristics

## 📁 File Structure

```
src/audio/
├── AudioManager.js     # Main audio coordinator
├── BackgroundMusic.js  # Music playback system
├── SoundEffects.js     # Sound effects manager
└── AudioMixer.js       # Audio mixing and effects

src/
├── index.js           # Demo application
└── examples/          # Usage examples

tests/
└── audio-test.js      # Comprehensive test suite

demo.html              # Interactive browser demo
```

## 🎮 Usage Examples

### Basic Setup

```javascript
import AudioManager from './src/audio/AudioManager.js';

// Initialize the audio system
const audioManager = new AudioManager();

// Wait for initialization
await new Promise(resolve => {
    const checkInit = () => {
        if (audioManager.isInitialized) {
            resolve();
        } else {
            setTimeout(checkInit, 100);
        }
    };
    checkInit();
});
```

### Playing Background Music

```javascript
// Load and play menu music
await audioManager.playMusic('menu-track', {
    loop: true,
    fadeIn: 2.0
});

// Crossfade to race music
await audioManager.crossfadeMusic('race-track', 3.0);
```

### Playing Sound Effects

```javascript
// Play engine sound with looping
audioManager.playSound('engine-idle', {
    loop: true,
    volume: 0.8,
    category: 'engine'
});

// Play collision effect with spatial audio
audioManager.playSound('collision', {
    volume: 1.0,
    position: { x: 10, y: 0, z: 5 },
    category: 'collision'
});
```

### Volume Control

```javascript
// Set individual volume levels
audioManager.setMasterVolume(0.8);
audioManager.setMusicVolume(0.7);
audioManager.setEffectsVolume(0.9);

// Mute/unmute
audioManager.toggleMute();
audioManager.setMute(true);
```

### Audio Presets

```javascript
// Apply Nintendo-style presets
audioManager.audioMixer.applyPreset('retro');   // Classic 8-bit style
audioManager.audioMixer.applyPreset('arcade');  // Arcade racing
audioManager.audioMixer.applyPreset('modern');  // Contemporary sound
```

## 🎯 Nintendo-Style Features

### Sound Categories
- **Engine**: Vehicle engine sounds with RPM variation
- **Collision**: Impact and crash effects
- **UI**: Menu navigation and selection sounds
- **Powerup**: Special item activation effects
- **Environment**: Ambient track sounds
- **Ambient**: Background atmosphere

### Audio Processing
- **Retro Filter**: Lowpass filtering for authentic 8-bit sound
- **Dynamic Compression**: Nintendo-style audio dynamics
- **Spatial Audio**: 3D positioned sound effects
- **Reverb**: Spatial enhancement for immersion

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm test
# or
node tests/audio-test.js
```

Tests cover:
- AudioManager initialization and controls
- BackgroundMusic loading and playback
- SoundEffects management and spatial audio
- AudioMixer channel management and effects
- Integration testing

## 🌐 Browser Demo

Open `demo.html` in a web browser to try the interactive audio demo:

1. Click "Initialize Audio" to start the system
2. Test different game states (Menu, Race, Victory)
3. Try various sound effects
4. Adjust volume controls
5. Apply different audio presets

## 🔧 Technical Details

### Web Audio API
The system is built on the Web Audio API for maximum compatibility and performance:
- **AudioContext**: Main audio processing context
- **GainNode**: Volume control and mixing
- **PannerNode**: 3D spatial audio positioning
- **BiquadFilterNode**: Audio filtering and EQ
- **DynamicsCompressorNode**: Audio compression
- **ConvolverNode**: Reverb and spatial effects

### Performance Optimization
- **Object Pooling**: Reuse audio nodes to reduce garbage collection
- **Priority System**: Intelligent sound management under load
- **Concurrent Limits**: Prevent audio system overload
- **Efficient Loading**: Optimized audio asset management

### Browser Compatibility
- Chrome 66+
- Firefox 60+
- Safari 11.1+
- Edge 79+

## 🎨 Customization

### Adding New Sound Categories

```javascript
// In SoundEffects.js
this.soundCategories.set('custom', {
    priority: this.priorityLevels.EFFECT,
    maxConcurrent: 4,
    volume: 0.8,
    loop: false,
    spatial: true
});
```

### Creating Custom Audio Effects

```javascript
// In AudioMixer.js
const customEffect = {
    type: 'filter',
    filterType: 'bandpass',
    frequency: 2000,
    Q: 5
};

mixer.applyEffectChain('music', [customEffect]);
```

## 📄 License

This audio system is part of the Nintendo-styled Need for Speed project and is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 🙋‍♂️ Support

For issues or questions about the audio system:
1. Check the test suite for usage examples
2. Review the demo.html for interactive examples
3. Open an issue in the repository