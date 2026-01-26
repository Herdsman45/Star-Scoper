# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Feature ideas and planned improvements go here

## [0.3.0] - 2025-09-28

### Added

- Discord auto-paste integration with AutoHotkey and Hammerspoon scripts
- Window position and size persistence across sessions
- Cross-platform support for Discord integration (Windows/macOS)
- Enhanced OCR error handling for missing time ranges (e.g., "6 to minutes")
- Comprehensive branding consistency across all files
- Channel verification for Discord auto-paste safety

### Changed

- **BREAKING**: App name changed from "Star Scoper OCR" to "Star Scoper"
- **BREAKING**: Default hotkeys changed from Alt+Shift+1/2 to F1/F2 (Windows)
- **BREAKING**: Config location changed from `electron-ocr-tool` to `star-scoper`
- Dark mode is now the default theme for new installations
- Keybind boxes now have consistent shaded styling and fixed dimensions
- Toggle switches use blue color scheme instead of orange
- Improved button naming clarity (Capture 1/2 instead of A/B)

### Fixed

- OCR time parsing now handles missing second number in ranges
- Keybind button styling consistency between light and dark themes
- CSS specificity issues with button styling overrides
- Layout alignment issues in Quick Capture section

## [0.2.0] - 2025-09-23

### Added

- Text file output for automation integration
- Discord call formatting with `/call` command structure
- File-based communication system for external automation tools
- Debug mode with image saving for troubleshooting
- Settings persistence and automatic saving

### Changed

- Enhanced UI with better button organization
- Improved error handling for OCR processing
- Better status feedback for user actions

### Fixed

- Region selection accuracy improvements
- Memory management optimizations

## [0.1.0] - 2025-09-20

### Added

- Initial release of Star Scoper
- Screen capture functionality with customizable hotkeys
- OCR processing using Tesseract.js
- Dual-region capture system for telescope data
- Cross-platform support for Windows and macOS
- Dark/light theme toggle
- Widget window for quick access
- Content Security Policy implementation
- Automated build process with GitHub Actions
- Basic text formatting and clipboard integration
