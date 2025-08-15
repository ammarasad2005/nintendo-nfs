#!/usr/bin/env node

/**
 * Nintendo NFS Version Management Script
 * Handles version bumping and release preparation
 */

const fs = require('fs-extra');
const path = require('path');

class VersionManager {
  constructor() {
    this.packagePath = path.resolve(__dirname, 'package.json');
    this.package = require(this.packagePath);
    this.currentVersion = this.package.version;
  }
  
  /**
   * Parse version string
   */
  parseVersion(version) {
    const parts = version.split('.');
    return {
      major: parseInt(parts[0]),
      minor: parseInt(parts[1]),
      patch: parseInt(parts[2])
    };
  }
  
  /**
   * Format version object to string
   */
  formatVersion(versionObj) {
    return `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`;
  }
  
  /**
   * Bump version
   */
  bump(type) {
    const version = this.parseVersion(this.currentVersion);
    
    switch (type) {
      case 'major':
        version.major++;
        version.minor = 0;
        version.patch = 0;
        break;
      case 'minor':
        version.minor++;
        version.patch = 0;
        break;
      case 'patch':
        version.patch++;
        break;
      default:
        throw new Error(`Invalid bump type: ${type}. Use major, minor, or patch.`);
    }
    
    return this.formatVersion(version);
  }
  
  /**
   * Update package.json version
   */
  async updatePackageVersion(newVersion) {
    this.package.version = newVersion;
    await fs.writeJson(this.packagePath, this.package, { spaces: 2 });
    console.log(`✅ Updated package.json version to ${newVersion}`);
  }
  
  /**
   * Create version tag
   */
  createVersionTag(version) {
    const tagName = `v${version}`;
    const tagMessage = `Release version ${version}`;
    
    console.log(`🏷️  Creating version tag: ${tagName}`);
    console.log(`📝 Tag message: ${tagMessage}`);
    
    // In a real implementation, you'd use git commands here
    // For now, just log the action
    console.log(`✅ Version tag ${tagName} created (simulated)`);
  }
  
  /**
   * Generate changelog entry
   */
  generateChangelogEntry(version, type) {
    const date = new Date().toISOString().split('T')[0];
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    
    const entry = `
## [${version}] - ${date}

### ${typeLabel} Release
- ${typeLabel} version bump
- Build configuration improvements
- Deployment pipeline updates

`;
    
    return entry;
  }
  
  /**
   * Update changelog
   */
  async updateChangelog(version, type) {
    const changelogPath = path.resolve(__dirname, 'CHANGELOG.md');
    const entry = this.generateChangelogEntry(version, type);
    
    let changelog = '';
    if (await fs.pathExists(changelogPath)) {
      changelog = await fs.readFile(changelogPath, 'utf8');
    } else {
      changelog = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n';
    }
    
    // Insert new entry after the header
    const lines = changelog.split('\n');
    const headerEnd = lines.findIndex(line => line.startsWith('## '));
    if (headerEnd > -1) {
      lines.splice(headerEnd, 0, entry);
    } else {
      lines.push(entry);
    }
    
    const updatedChangelog = lines.join('\n');
    await fs.writeFile(changelogPath, updatedChangelog);
    
    console.log(`✅ Updated CHANGELOG.md with version ${version}`);
  }
  
  /**
   * Main version bump function
   */
  async bumpVersion(type) {
    console.log(`🚀 Bumping ${type} version from ${this.currentVersion}...`);
    
    try {
      const newVersion = this.bump(type);
      
      console.log(`📦 New version: ${newVersion}`);
      
      await this.updatePackageVersion(newVersion);
      await this.updateChangelog(newVersion, type);
      this.createVersionTag(newVersion);
      
      console.log(`🎉 Version bump complete!`);
      console.log(`📝 Next steps:`);
      console.log(`   1. Review changes: git diff`);
      console.log(`   2. Commit changes: git commit -am "Release version ${newVersion}"`);
      console.log(`   3. Build release: npm run build:prod`);
      console.log(`   4. Deploy: npm run deploy:production`);
      
    } catch (error) {
      console.error('❌ Version bump failed:', error.message);
      process.exit(1);
    }
  }
  
  /**
   * Show current version info
   */
  showVersionInfo() {
    console.log('📋 Version Information:');
    console.log(`   Current Version: ${this.currentVersion}`);
    console.log(`   Next Patch: ${this.bump('patch')}`);
    console.log(`   Next Minor: ${this.bump('minor')}`);
    console.log(`   Next Major: ${this.bump('major')}`);
  }
}

// CLI interface
if (require.main === module) {
  const versionManager = new VersionManager();
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'patch':
    case 'minor':
    case 'major':
      versionManager.bumpVersion(command);
      break;
    case 'info':
    case 'show':
      versionManager.showVersionInfo();
      break;
    default:
      console.log('🎮 Nintendo NFS Version Manager');
      console.log('');
      console.log('Usage:');
      console.log('  node version.js patch   - Bump patch version (0.1.0 -> 0.1.1)');
      console.log('  node version.js minor   - Bump minor version (0.1.1 -> 0.2.0)');
      console.log('  node version.js major   - Bump major version (0.2.0 -> 1.0.0)');
      console.log('  node version.js info    - Show current version information');
      console.log('');
      versionManager.showVersionInfo();
  }
}

module.exports = VersionManager;