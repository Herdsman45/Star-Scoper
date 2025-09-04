# Star Scoper OCR

A specialized OCR (Optical Character Recognition) tool for RuneScape players to capture shooting star telescope information and format it for Discord sharing.

![Star Scoper OCR](build/screenshot.png)

## Disclaimer

**USE AT YOUR OWN RISK**: This application is provided "as is", without warranty of any kind. While the developers have taken steps to make this software secure and reliable, users assume all risk associated with its use.

## Features

- **Screenshot OCR**: Capture and process text from selected screen regions
- **Automatic Formatting**: Formats telescope information into a standardized `/call` command
- **Dark Mode**: Toggle between light and dark themes for comfortable use day or night
- **Customizable Hotkeys**: Set your own keyboard shortcuts for quick captures
- **Debug Mode**: Save debug images to help troubleshoot OCR issues
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Privacy & Security

**No data collection or transmission**: Star Scoper OCR:

- Does not collect any user data
- Does not transmit any information over the internet
- All processing happens locally on your computer
- No analytics, telemetry, or user tracking

## Installation

### From Releases (Recommended)

1. Download the latest release for your platform from the [Releases page](https://github.com/yourusername/Star-Scoper-OCR/releases)
2. Install or extract the application
3. Run Star Scoper OCR

### Building from Source

1. Clone this repository
2. Install dependencies: `npm install`
3. Start the application: `npm start`
4. Build for your platform: `npm run build`

## Requirements

- For pre-built releases: No additional requirements
- For development: Node.js and npm

## How to Use

### Setting Up Capture Regions

1. Start the application
2. Click "Set Regions" for Slot 1:
   - **Region A**: Select the area containing the telescope text (with region, size, and time info)
   - **Region B**: Select the area containing the world number
3. Click "Save Regions" when done

### Capturing and Processing Text

1. Use the assigned hotkey (default: F13 for Slot 1, F14 for Slot 2) or click the "Capture" button
2. The OCR tool will:
   - Take a screenshot of your selected regions
   - Process the text through OCR
   - Format the result as a Discord `/call` command
   - Copy the formatted text to your clipboard

### Using the Formatted Output

1. The formatted text is automatically copied to your clipboard in this format:
   ```
   /call world: 59 region: Asgarnia size: 5 relative-time: 21
   ```
2. Paste directly into your Discord server

### Advanced Features

- **Dark Mode**: Toggle the theme switch in the top right corner
- **Debug Mode**: Enable to save debug images for troubleshooting OCR issues
- **Custom Hotkeys**: Change the default hotkeys in the Settings section
- **Multi-Monitor Support**: Works across multiple monitors, but must be on the same monitor as the game window
- **Background Operation**: Can run minimized while capturing screenshots

## Troubleshooting

### OCR Quality Issues

- Ensure the capture regions are accurately positioned
- Try running in debug mode to see the captured images
- For poor recognition, try adjusting your game's font settings

### Hotkey Not Working

- Check if another application is using the same hotkey
- Try setting a different hotkey in the Settings section

### Multi-Monitor Issues

- Make sure the application window is on the same monitor as your game
- The app can be minimized during capture
- If using multiple monitors with different scaling settings, check your display settings

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Electron](https://www.electronjs.org/) for the framework
- [Tesseract.js](https://tesseract.projectnaptha.com/) for OCR functionality
- [Sharp](https://sharp.pixelplumbing.com/) for image processing
