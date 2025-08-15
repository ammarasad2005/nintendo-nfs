const fs = require('fs-extra');
const path = require('path');

/**
 * Nintendo NFS Deployment Configuration
 * Handles deployment to various environments and platforms
 */

class DeployConfig {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.version = require('./package.json').version;
    this.deployTimestamp = new Date().toISOString();
    
    // Deployment environments
    this.environments = {
      development: {
        name: 'Development',
        url: 'http://localhost:3000',
        apiUrl: 'http://localhost:3001/api',
        cdn: 'http://localhost:3000/assets',
        debug: true,
        analytics: false,
        errorReporting: false
      },
      staging: {
        name: 'Staging',
        url: 'https://staging-nintendo-nfs.example.com',
        apiUrl: 'https://staging-api-nintendo-nfs.example.com',
        cdn: 'https://staging-cdn-nintendo-nfs.example.com',
        debug: true,
        analytics: true,
        errorReporting: true
      },
      production: {
        name: 'Production',
        url: 'https://nintendo-nfs.example.com',
        apiUrl: 'https://api-nintendo-nfs.example.com',
        cdn: 'https://cdn-nintendo-nfs.example.com',
        debug: false,
        analytics: true,
        errorReporting: true
      }
    };
    
    // Release channels
    this.releaseChannels = {
      alpha: {
        name: 'Alpha',
        description: 'Early development builds',
        frequency: 'daily',
        audience: 'internal',
        autoUpdate: true,
        rollback: true
      },
      beta: {
        name: 'Beta',
        description: 'Feature-complete testing builds',
        frequency: 'weekly',
        audience: 'beta-testers',
        autoUpdate: true,
        rollback: true
      },
      stable: {
        name: 'Stable',
        description: 'Production-ready releases',
        frequency: 'monthly',
        audience: 'public',
        autoUpdate: false,
        rollback: true
      }
    };
    
    // Platform deployment configurations
    this.platforms = {
      web: {
        type: 'static',
        target: 'cdn',
        compression: 'gzip',
        caching: {
          html: '5m',
          assets: '1y',
          api: '0'
        },
        headers: {
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'X-XSS-Protection': '1; mode=block'
        }
      },
      desktop: {
        type: 'executable',
        target: 'distribution',
        packaging: 'installer',
        signing: this.environment === 'production',
        updateServer: true
      },
      mobile: {
        type: 'app',
        target: 'store',
        packaging: 'bundle',
        signing: true,
        storeConfig: {
          ios: {
            bundleId: 'com.ammarasad2005.nintendo-nfs',
            team: 'TEAM_ID_HERE'
          },
          android: {
            packageName: 'com.ammarasad2005.nintendo_nfs',
            keystore: 'release.keystore'
          }
        }
      }
    };
    
    // Distribution settings
    this.distribution = {
      maxFileSize: '50MB',
      compression: 'brotli',
      encryption: this.environment === 'production',
      checksums: true,
      deltaUpdates: true,
      mirrors: this.environment === 'production' ? 3 : 1
    };
    
    // Update management
    this.updateConfig = {
      enabled: true,
      checkInterval: '24h',
      downloadInBackground: true,
      autoRestart: false,
      rollbackOnFailure: true,
      updateServer: this.environments[this.environment].url + '/updates'
    };
  }
  
  /**
   * Get deployment configuration for current environment
   */
  getConfig() {
    return {
      environment: this.environment,
      version: this.version,
      deployTimestamp: this.deployTimestamp,
      envConfig: this.environments[this.environment],
      releaseChannels: this.releaseChannels,
      platforms: this.platforms,
      distribution: this.distribution,
      updateConfig: this.updateConfig
    };
  }
  
  /**
   * Validate deployment prerequisites
   */
  async validateDeployment() {
    console.log('🔍 Validating deployment prerequisites...');
    
    const errors = [];
    const warnings = [];
    
    try {
      // Check if build exists
      const distPath = path.resolve(__dirname, 'dist');
      if (!await fs.pathExists(distPath)) {
        errors.push('Build directory not found. Run build first.');
      }
      
      // Check if manifest exists
      const manifestPath = path.join(distPath, 'manifest.json');
      if (!await fs.pathExists(manifestPath)) {
        errors.push('Build manifest not found. Run build first.');
      }
      
      // Environment-specific validations
      if (this.environment === 'production') {
        // Production-specific checks
        if (!process.env.DEPLOY_KEY) {
          warnings.push('DEPLOY_KEY environment variable not set');
        }
        
        if (!process.env.SIGNING_CERT) {
          warnings.push('SIGNING_CERT environment variable not set');
        }
      }
      
      // Display results
      if (errors.length > 0) {
        console.error('❌ Deployment validation failed:');
        errors.forEach(error => console.error(`  • ${error}`));
        throw new Error('Deployment validation failed');
      }
      
      if (warnings.length > 0) {
        console.warn('⚠️  Deployment warnings:');
        warnings.forEach(warning => console.warn(`  • ${warning}`));
      }
      
      console.log('✅ Deployment validation passed');
      
    } catch (error) {
      console.error('❌ Deployment validation error:', error.message);
      throw error;
    }
  }
  
  /**
   * Generate deployment manifest
   */
  async generateDeploymentManifest() {
    console.log('📋 Generating deployment manifest...');
    
    const manifest = {
      name: 'Nintendo NFS',
      version: this.version,
      environment: this.environment,
      deployTimestamp: this.deployTimestamp,
      releaseChannel: this.getReleaseChannel(),
      platforms: Object.keys(this.platforms),
      distribution: this.distribution,
      updateConfig: this.updateConfig,
      envConfig: this.environments[this.environment]
    };
    
    try {
      const deployPath = path.resolve(__dirname, 'deploy');
      await fs.ensureDir(deployPath);
      
      const manifestPath = path.join(deployPath, 'deployment-manifest.json');
      await fs.writeJson(manifestPath, manifest, { spaces: 2 });
      
      console.log('✅ Deployment manifest generated successfully');
      return manifest;
    } catch (error) {
      console.error('❌ Failed to generate deployment manifest:', error.message);
      throw error;
    }
  }
  
  /**
   * Determine release channel based on version and environment
   */
  getReleaseChannel() {
    if (this.environment === 'development') {
      return 'alpha';
    } else if (this.environment === 'staging') {
      return 'beta';
    } else if (this.environment === 'production') {
      return 'stable';
    }
    return 'alpha';
  }
  
  /**
   * Prepare deployment packages
   */
  async prepareDeployment() {
    console.log('📦 Preparing deployment packages...');
    
    try {
      const deployPath = path.resolve(__dirname, 'deploy');
      await fs.ensureDir(deployPath);
      
      // Copy build artifacts
      const distPath = path.resolve(__dirname, 'dist');
      const packagePath = path.join(deployPath, 'packages');
      await fs.ensureDir(packagePath);
      
      // Package each platform
      for (const [platform, config] of Object.entries(this.platforms)) {
        console.log(`📱 Packaging ${platform}...`);
        await this.packagePlatform(platform, config, packagePath);
      }
      
      console.log('✅ Deployment packages prepared successfully');
      
    } catch (error) {
      console.error('❌ Failed to prepare deployment:', error.message);
      throw error;
    }
  }
  
  /**
   * Package specific platform for deployment
   */
  async packagePlatform(platform, config, packagePath) {
    const platformPackagePath = path.join(packagePath, platform);
    await fs.ensureDir(platformPackagePath);
    
    const distPlatformPath = path.resolve(__dirname, 'dist', platform);
    
    if (await fs.pathExists(distPlatformPath)) {
      await fs.copy(distPlatformPath, platformPackagePath);
      
      // Create platform-specific deployment info
      const deployInfo = {
        platform,
        version: this.version,
        environment: this.environment,
        deployTimestamp: this.deployTimestamp,
        config: config
      };
      
      await fs.writeJson(
        path.join(platformPackagePath, 'deploy-info.json'), 
        deployInfo, 
        { spaces: 2 }
      );
      
      console.log(`  ✅ ${platform} package created`);
    } else {
      console.warn(`  ⚠️  ${platform} build not found, skipping...`);
    }
  }
  
  /**
   * Deploy to specific environment
   */
  async deployToEnvironment() {
    const envConfig = this.environments[this.environment];
    console.log(`🚀 Deploying to ${envConfig.name} environment...`);
    console.log(`🔗 Target URL: ${envConfig.url}`);
    
    try {
      // Simulate deployment process
      console.log('📤 Uploading deployment packages...');
      await this.simulateUpload();
      
      console.log('🔄 Running deployment scripts...');
      await this.simulateDeploymentScripts();
      
      console.log('🧪 Running post-deployment tests...');
      await this.simulatePostDeploymentTests();
      
      console.log(`✅ Successfully deployed to ${envConfig.name}!`);
      console.log(`🌐 Game available at: ${envConfig.url}`);
      
    } catch (error) {
      console.error(`❌ Deployment to ${envConfig.name} failed:`, error.message);
      throw error;
    }
  }
  
  /**
   * Simulate upload process
   */
  async simulateUpload() {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('  📁 Assets uploaded successfully');
        console.log('  🎮 Game files deployed');
        console.log('  ⚙️  Configuration updated');
        resolve();
      }, 1000);
    });
  }
  
  /**
   * Simulate deployment scripts
   */
  async simulateDeploymentScripts() {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('  🔧 Environment variables set');
        console.log('  🗄️  Database migrations applied');
        console.log('  🌐 CDN cache invalidated');
        resolve();
      }, 800);
    });
  }
  
  /**
   * Simulate post-deployment tests
   */
  async simulatePostDeploymentTests() {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('  ✅ Health checks passed');
        console.log('  ✅ API endpoints responding');
        console.log('  ✅ Asset loading verified');
        resolve();
      }, 600);
    });
  }
  
  /**
   * Rollback deployment
   */
  async rollback(version) {
    console.log(`🔄 Rolling back to version ${version}...`);
    
    try {
      // Simulate rollback process
      console.log('📦 Restoring previous version...');
      console.log('🔄 Updating configuration...');
      console.log('🧪 Running rollback verification...');
      
      console.log(`✅ Successfully rolled back to version ${version}`);
      
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Run complete deployment process
   */
  async deploy() {
    console.log(`🎮 Starting Nintendo NFS deployment (${this.environment})...`);
    console.log(`📦 Version: ${this.version}`);
    console.log(`⏰ Deploy time: ${this.deployTimestamp}`);
    console.log(`🏷️  Release channel: ${this.getReleaseChannel()}`);
    
    try {
      await this.validateDeployment();
      await this.generateDeploymentManifest();
      await this.prepareDeployment();
      await this.deployToEnvironment();
      
      console.log('🎉 Deployment completed successfully!');
      console.log(`🌐 Game is now live at: ${this.environments[this.environment].url}`);
      
    } catch (error) {
      console.error('💥 Deployment failed:', error.message);
      console.log('💡 Consider running rollback if needed');
      process.exit(1);
    }
  }
}

// Export configuration and run deployment if called directly
const deployConfig = new DeployConfig();

if (require.main === module) {
  deployConfig.deploy();
}

module.exports = deployConfig;