# Star Scoper OCR - Packaging & Release Guide

This document explains how to package and release Star Scoper OCR using GitHub Actions.

## GitHub Actions Workflow

The repository is set up with a GitHub Actions workflow that automatically builds and packages the application when:

1. You push to the `main` branch (builds but doesn't create a release)
2. You push a tag starting with `v` (builds and creates a draft release)

### Workflow Details

The workflow defined in `.github/workflows/build.yml` performs the following steps:

1. Builds the application for Windows and macOS
2. Packages the application using Electron Builder
3. Uploads the packaged artifacts
4. Creates a draft release when you push a tag

## How to Create a Release

To create a new release of Star Scoper OCR:

1. Update the version in `package.json`
2. Commit your changes
   ```bash
   git commit -am "Bump version to x.y.z"
   ```
3. Tag the commit
   ```bash
   git tag vx.y.z
   ```
4. Push commits and tags
   ```bash
   git push && git push --tags
   ```
5. Wait for the GitHub Actions workflow to complete
6. Go to the "Releases" section on your GitHub repository
7. Find the draft release, review it, and publish it

### Helper Script

You can use the included dev helper script to assist with the release process:

```bash
# Run pre-flight checks before building
node scripts/dev-helper.js check

# Clean build artifacts
node scripts/dev-helper.js clean

# Prepare for release
node scripts/dev-helper.js prepare-release
```

## Version Numbers

Version numbers should follow semantic versioning:

- MAJOR version when you make incompatible API changes
- MINOR version when you add functionality in a backwards compatible manner
- PATCH version when you make backwards compatible bug fixes

Example: 1.0.0, 1.0.1, 1.1.0, 2.0.0

## App Icons

The application requires icons in the following formats:

- Windows: `build/icon.ico` (containing multiple sizes: 16x16 to 256x256 pixels)
- macOS: `build/icon.icns` (containing multiple sizes: 16x16 to 1024x1024 pixels)
- Linux: `build/icon.png` (1024x1024 pixels)

These icon files are included in the repository. If you want to change the app icon, you can:

1. Replace `build/icon.png` with your own 1024x1024 PNG image
2. Run the icon generation script: `node scripts/generate-icons.js`
3. The script will create all necessary icon formats and sizes in the `build/icons` directory and copy them to the appropriate locations

This ensures that all platforms have properly sized icons for different display contexts (taskbar, title bar, file explorer, etc.).
