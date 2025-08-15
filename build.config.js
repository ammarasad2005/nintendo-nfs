const fs = require('fs-extra');
const path = require('path');

/**
 * Nintendo NFS Build Configuration
 * Handles asset bundling, optimization, and platform-specific builds
 */

class BuildConfig {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.version = require('./package.json').version;
    this.buildTimestamp = new Date().toISOString();
    
    // Build directories
    this.paths = {
      src: path.resolve(__dirname, 'src'),
      assets: path.resolve(__dirname, 'assets'),
      dist: path.resolve(__dirname, 'dist'),
      build: path.resolve(__dirname, 'build'),
      temp: path.resolve(__dirname, '.tmp')
    };
    
    // Platform configurations
    this.platforms = {
      web: {
        target: 'web',
        format: 'iife',
        optimization: true,
        assetPath: 'assets/',
        outputDir: 'dist/web'
      },
      desktop: {
        target: 'node',
        format: 'cjs',
        optimization: true,
        assetPath: 'resources/',
        outputDir: 'dist/desktop'
      },
      mobile: {
        target: 'mobile',
        format: 'esm',
        optimization: true,
        assetPath: 'assets/',
        outputDir: 'dist/mobile'
      }
    };
    
    // Environment-specific settings
    this.envConfig = {
      development: {
        minify: false,
        sourceMaps: true,
        compression: false,
        optimization: 'none',
        debugging: true
      },
      staging: {
        minify: true,
        sourceMaps: true,
        compression: true,
        optimization: 'basic',
        debugging: true
      },
      production: {
        minify: true,
        sourceMaps: false,
        compression: true,
        optimization: 'aggressive',
        debugging: false
      }
    };
    
    // Asset bundling configuration
    this.assetConfig = {
      images: {
        formats: ['png', 'jpg', 'gif', 'webp'],
        optimization: {
          quality: this.environment === 'production' ? 85 : 95,
          progressive: true,
          mozjpeg: true
        },
        sprites: {
          enabled: true,
          maxSize: 2048,
          padding: 2
        }
      },
      audio: {
        formats: ['mp3', 'ogg', 'wav'],
        compression: this.environment === 'production' ? 'high' : 'medium',
        bitrate: this.environment === 'production' ? 128 : 192
      },
      fonts: {
        formats: ['woff2', 'woff', 'ttf'],
        subsetting: true,
        unicodeRange: 'latin'
      }
    };
  }
  
  /**
   * Get current build configuration
   */
  getConfig() {
    return {
      environment: this.environment,
      version: this.version,
      buildTimestamp: this.buildTimestamp,
      paths: this.paths,
      platforms: this.platforms,
      envConfig: this.envConfig[this.environment],
      assetConfig: this.assetConfig
    };
  }
  
  /**
   * Initialize build directories
   */
  async initDirectories() {
    console.log('🚀 Initializing build directories...');
    
    try {
      // Create necessary directories
      await fs.ensureDir(this.paths.dist);
      await fs.ensureDir(this.paths.build);
      await fs.ensureDir(this.paths.temp);
      await fs.ensureDir(this.paths.src);
      await fs.ensureDir(this.paths.assets);
      
      // Create platform-specific directories
      for (const [platform, config] of Object.entries(this.platforms)) {
        await fs.ensureDir(path.resolve(this.paths.dist, platform));
      }
      
      console.log('✅ Build directories initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize directories:', error.message);
      throw error;
    }
  }
  
  /**
   * Generate build manifest
   */
  async generateManifest() {
    console.log('📋 Generating build manifest...');
    
    const manifest = {
      name: 'Nintendo NFS',
      version: this.version,
      environment: this.environment,
      buildTimestamp: this.buildTimestamp,
      platforms: Object.keys(this.platforms),
      assets: {
        total: 0,
        images: 0,
        audio: 0,
        fonts: 0
      },
      buildConfig: this.envConfig[this.environment]
    };
    
    try {
      // Write manifest file
      const manifestPath = path.join(this.paths.dist, 'manifest.json');
      await fs.writeJson(manifestPath, manifest, { spaces: 2 });
      
      console.log('✅ Build manifest generated successfully');
      return manifest;
    } catch (error) {
      console.error('❌ Failed to generate manifest:', error.message);
      throw error;
    }
  }
  
  /**
   * Bundle assets for all platforms
   */
  async bundleAssets() {
    console.log('📦 Bundling assets...');
    
    try {
      // Check if assets directory exists
      const assetsExist = await fs.pathExists(this.paths.assets);
      if (!assetsExist) {
        console.log('⚠️  Assets directory not found, creating placeholder structure...');
        await this.createAssetStructure();
      }
      
      // Process assets for each platform
      for (const [platform, config] of Object.entries(this.platforms)) {
        console.log(`🎯 Processing assets for ${platform}...`);
        await this.bundlePlatformAssets(platform, config);
      }
      
      console.log('✅ Asset bundling completed successfully');
    } catch (error) {
      console.error('❌ Asset bundling failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Bundle assets for specific platform
   */
  async bundlePlatformAssets(platform, config) {
    const outputDir = path.resolve(this.paths.dist, platform);
    const assetOutputDir = path.join(outputDir, config.assetPath);
    
    await fs.ensureDir(assetOutputDir);
    
    // Copy and optimize assets based on platform requirements
    // This is a placeholder - in a real implementation, you'd use actual asset processing tools
    console.log(`  📁 Created asset directory for ${platform}: ${assetOutputDir}`);
  }
  
  /**
   * Create basic asset directory structure
   */
  async createAssetStructure() {
    const structure = [
      'images/cars',
      'images/tracks',
      'images/ui',
      'images/effects',
      'audio/music',
      'audio/sfx',
      'fonts',
      'data'
    ];
    
    for (const dir of structure) {
      await fs.ensureDir(path.join(this.paths.assets, dir));
    }
    
    // Create placeholder files
    const placeholders = {
      'images/banner.png': '# Placeholder for game banner',
      'audio/music/README.md': '# Music files directory',
      'audio/sfx/README.md': '# Sound effects directory',
      'fonts/README.md': '# Game fonts directory',
      'data/README.md': '# Game data and configuration files'
    };
    
    for (const [file, content] of Object.entries(placeholders)) {
      const filePath = path.join(this.paths.assets, file);
      if (!await fs.pathExists(filePath)) {
        await fs.writeFile(filePath, content);
      }
    }
  }
  
  /**
   * Build for specific platform
   */
  async buildPlatform(platformName) {
    const platform = this.platforms[platformName];
    if (!platform) {
      throw new Error(`Unknown platform: ${platformName}`);
    }
    
    console.log(`🔨 Building for ${platformName}...`);
    
    const outputDir = path.resolve(this.paths.dist, platformName);
    await fs.ensureDir(outputDir);
    
    // Platform-specific build logic would go here
    // For now, we'll create a basic structure
    
    const buildInfo = {
      platform: platformName,
      version: this.version,
      environment: this.environment,
      buildTimestamp: this.buildTimestamp,
      config: platform
    };
    
    await fs.writeJson(path.join(outputDir, 'build-info.json'), buildInfo, { spaces: 2 });
    
    console.log(`✅ ${platformName} build completed`);
  }
  
  /**
   * Run complete build process
   */
  async build() {
    console.log(`🎮 Starting Nintendo NFS build process (${this.environment})...`);
    console.log(`📦 Version: ${this.version}`);
    console.log(`⏰ Build time: ${this.buildTimestamp}`);
    
    try {
      await this.initDirectories();
      await this.bundleAssets();
      await this.generateManifest();
      
      // Build for all platforms
      for (const platformName of Object.keys(this.platforms)) {
        await this.buildPlatform(platformName);
      }
      
      console.log('🎉 Build process completed successfully!');
      console.log(`📂 Output directory: ${this.paths.dist}`);
      
    } catch (error) {
      console.error('💥 Build process failed:', error.message);
      process.exit(1);
    }
  }
}

// Export configuration and run build if called directly
const buildConfig = new BuildConfig();

if (require.main === module) {
  buildConfig.build();
}

module.exports = buildConfig;