# OCR Tool Project Summary

This project aims to create a cross-platform Electron application that replaces the functionality of the AutoHotkey OCR script (`ocr_slots.ahk`). The application provides screen capture, OCR processing, text post-processing, and clipboard integration.

## Core Features

1. **Region Selection and Storage**

   - Users can define regions to capture once and reuse them
   - Regions are stored persistently using electron-store

2. **One-Click Workflow**

   - Global hotkeys trigger the entire process
   - Capture selected regions from the screen
   - Process through OCR
   - Post-process text
   - Copy to clipboard or send to Discord

3. **Text Processing**

   - OCR using Tesseract.js
   - Custom text processing (ported from the web processor)
   - Results visible in the application UI

4. **Configuration Options**
   - Customizable hotkeys
   - Configurable Tesseract path
   - Trigger key settings
   - Discord integration settings

## Project Structure

```
electron-ocr-tool/
├── main.js               # Main process code
├── index.html            # Main UI
├── styles.css            # CSS styling
├── renderer.js           # UI logic
├── lib/
│   ├── capture.js        # Screen capture functions
│   ├── ocr.js            # OCR processing with Tesseract
│   ├── processing.js     # Text processing logic
│   └── discord.js        # Discord integration
├── assets/               # Icons and images
├── package.json          # Project configuration
└── README.md             # Project documentation
```

## Technical Details

The application uses:

- Electron for the cross-platform framework
- Tesseract.js for OCR processing
- robotjs for screen capture and automation
- electron-store for persistent storage
- sharp for image processing

## Development Plan

1. **Basic App Structure**

   - Set up Electron boilerplate
   - Create basic UI

2. **Core Functionality**

   - Implement screen capture
   - Integrate Tesseract.js
   - Set up region selection

3. **Advanced Features**

   - Add hotkey support
   - Implement text processing
   - Add Discord integration

4. **Polish & Distribution**
   - Refine UI
   - Add error handling
   - Set up build process

## Original AHK vs Electron Comparison

The original AutoHotkey script had several platform-specific features:

- Windows-specific window management
- Direct screen capture using GDI+
- External Tesseract OCR process

The new Electron version makes these features cross-platform:

- Uses Electron's native APIs for consistent behavior
- Integrates Tesseract.js directly
- Uses web technologies for UI

## Simplified Design

The new design focuses on the core workflow:

1. Select regions (one-time setup)
2. Press hotkey
3. Automatic capture, OCR, and processing
4. Results ready for Discord

This simplification makes the application more maintainable while preserving the efficiency of the workflow.
