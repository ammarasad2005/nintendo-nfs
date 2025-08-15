# Build and Deployment Guide

This guide explains how to build and deploy the Nintendo-styled Need for Speed game.

## 🛠️ Build System

The build system is configured to support multiple environments and platforms with optimized asset bundling and deployment automation.

### Build Configuration (`build.config.js`)

The build configuration handles:
- **Environment-specific settings** (development, staging, production)
- **Platform-specific builds** (web, desktop, mobile)
- **Asset bundling and optimization**
- **Version management**
- **Build manifests**

#### Available Environments

- **Development**: No minification, source maps enabled, debugging on
- **Staging**: Basic optimization, source maps enabled, debugging on
- **Production**: Full optimization, no source maps, debugging off

#### Supported Platforms

- **Web**: Browser-based deployment with static assets
- **Desktop**: Electron-based desktop application
- **Mobile**: Mobile app deployment with optimized assets

### Deployment Configuration (`deploy.config.js`)

The deployment configuration manages:
- **Environment-specific URLs and settings**
- **Release channels** (alpha, beta, stable)
- **Platform-specific deployment strategies**
- **Update management**
- **Rollback capabilities**

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Development Build

```bash
npm run build:dev
```

### 3. Production Build

```bash
npm run build:prod
```

### 4. Deploy to Staging

```bash
npm run deploy:staging
```

### 5. Deploy to Production

```bash
npm run deploy:production
```

## 📋 Available Scripts

### Build Scripts

- `npm run build` - Default build (development)
- `npm run build:dev` - Development build with debugging
- `npm run build:prod` - Production build with full optimization
- `npm run build:all` - Build for all environments

### Deployment Scripts

- `npm run deploy` - Deploy to development environment
- `npm run deploy:staging` - Deploy to staging environment
- `npm run deploy:production` - Deploy to production environment

### Version Management

- `npm run version:info` - Show current version information
- `npm run version:patch` - Bump patch version (0.1.0 → 0.1.1)
- `npm run version:minor` - Bump minor version (0.1.0 → 0.2.0)
- `npm run version:major` - Bump major version (0.1.0 → 1.0.0)

### Release Scripts

- `npm run release:patch` - Version bump + production build (patch)
- `npm run release:minor` - Version bump + production build (minor)
- `npm run release:major` - Version bump + production build (major)

### Development Scripts

- `npm start` - Start the game in development mode
- `npm run dev` - Start with file watching (Node.js 18+ only)

## 🏗️ Build Output Structure

```
dist/
├── manifest.json          # Build manifest with metadata
├── web/                   # Web platform build
│   ├── assets/           # Web-optimized assets
│   └── build-info.json   # Platform-specific build info
├── desktop/              # Desktop platform build
│   ├── resources/        # Desktop app resources
│   └── build-info.json   # Platform-specific build info
└── mobile/               # Mobile platform build
    ├── assets/           # Mobile-optimized assets
    └── build-info.json   # Platform-specific build info

deploy/
├── deployment-manifest.json  # Deployment metadata
└── packages/                # Platform-specific packages
    ├── web/                 # Web deployment package
    ├── desktop/             # Desktop deployment package
    └── mobile/              # Mobile deployment package
```

## 🔧 Configuration Details

### Environment Variables

The build and deployment systems recognize these environment variables:

- `NODE_ENV` - Sets the environment (development, staging, production)
- `DEPLOY_KEY` - Deployment authentication key (production only)
- `SIGNING_CERT` - Code signing certificate (production only)

### Asset Optimization

The build system automatically optimizes assets based on the target environment:

- **Images**: Compression, format conversion, sprite generation
- **Audio**: Bitrate optimization, format conversion
- **Fonts**: Subsetting, format optimization

### Platform-Specific Features

#### Web Platform
- Static file deployment
- CDN optimization
- Gzip/Brotli compression
- Cache headers

#### Desktop Platform
- Executable packaging
- Auto-update support
- Code signing (production)
- Installer generation

#### Mobile Platform
- App store packaging
- Device-specific optimization
- Push notification support
- In-app update system

## 🚢 Release Process

### 1. Development Phase
```bash
# Regular development builds
npm run build:dev
npm run deploy:staging
```

### 2. Pre-Release
```bash
# Create release candidate
npm run version:minor
npm run build:prod
npm run deploy:staging
```

### 3. Production Release
```bash
# Deploy to production
npm run deploy:production
```

### 4. Rollback (if needed)
```bash
# Use deploy config to rollback
node deploy.config.js rollback 1.0.0
```

## 🔍 Troubleshooting

### Build Issues

1. **Missing dependencies**: Run `npm install`
2. **Build directory permissions**: Check write permissions for `dist/` folder
3. **Asset loading errors**: Ensure `assets/` directory structure is correct

### Deployment Issues

1. **Environment variables**: Verify all required env vars are set
2. **Network connectivity**: Check deployment target accessibility
3. **Authentication**: Verify deployment keys and certificates

### Version Management

1. **Git repository**: Ensure you're in a git repository for version tagging
2. **Changelog**: Review CHANGELOG.md for proper formatting
3. **Package.json**: Verify version format matches semantic versioning

## 📚 Additional Resources

- [Semantic Versioning](https://semver.org/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
- [Asset Optimization Guide](docs/asset-optimization.md)
- [Deployment Security](docs/deployment-security.md)

## 🤝 Contributing

When contributing to the build system:

1. Test all build configurations before submitting
2. Update documentation for new features
3. Follow the existing code style
4. Add appropriate error handling
5. Include version compatibility notes

## 📄 License

This build configuration is part of the Nintendo NFS project and follows the same MIT license terms.