# Discord Auto-Paste Integration

This feature allows Star Scoper OCR to automatically send Discord calls to your Discord client using AutoHotkey integration.

## How It Works

1. **Star Scoper OCR** processes your star call and formats it for Discord
2. When "AHK Integration" is enabled, the formatted call is written to a temporary file
3. **AutoHotkey script** monitors this file and automatically pastes the call into Discord

## Setup Instructions

### 1. Enable AHK Integration in Star Scoper OCR

- Open Star Scoper OCR
- Go to Settings section
- Enable the "AHK Integration" toggle
- You'll see a notification when it's enabled

### 2. Install AutoHotkey (if not already installed)

- Download from: https://www.autohotkey.com/
- Install the program

### 3. Run the Discord Integration Script

- Use the provided `discord-integration.ahk` script
- Double-click it to run, or right-click and select "Compile Script" to create an executable
- The script will show a tray notification when it's running

## Usage

1. **Start the AHK script** (discord-integration.ahk)
2. **Open Discord** in your web browser or Discord app
3. **Use Star Scoper OCR** as normal:
   - Click capture button
   - App processes the star call
   - **If all fields are recognized (no "Unknown" values), Discord will automatically be focused and the call will be pasted**
   - **If any field contains "Unknown", auto-paste is skipped for safety**

## Workflow Example

1. Open message box in RuneScape
2. Click capture in Star Scoper OCR
3. App captures and processes: `/call world: 123 region: A size: Large relative-time: 10-15min`
4. Discord automatically becomes focused
5. Call is automatically pasted and sent
6. You can immediately go back to RuneScape

**Note**: If the call contains "Unknown" values (like `region: Unknown`), auto-paste will be skipped and you'll need to manually paste from clipboard.

## Script Controls

- **Exit Script**: Press `Ctrl+Alt+Q`
- **Tray Icon**: Right-click the tray icon and select "Exit"

## Troubleshooting

### Discord Not Found

- Make sure Discord is running
- The script looks for Discord app (`Discord.exe`)
- If using Discord in browser, you may need to modify the script

### Calls Not Being Pasted

- Check that "AHK Integration" is enabled in Star Scoper OCR
- Verify the AHK script is running (should see tray icon)
- Make sure Discord is not in full-screen mode
- **Check for "Unknown" values**: Auto-paste is skipped when the call contains "Unknown" fields
- **Widget background turns red**: This indicates Unknown values were detected

### Security Warnings

- Windows/antivirus may warn about AutoHotkey scripts
- This is normal for automation scripts
- The script only monitors a text file and sends keypresses

## File Locations

- **Temp File**: `%TEMP%\star-scoper-discord-call.txt`
- **AHK Script**: `discord-integration.ahk` (in Star Scoper OCR folder)

## Customization

You can modify the AHK script to:

- Change Discord window detection
- Add delays for timing
- Modify notification settings
- Add additional hotkeys

## Alternative: Manual Copy-Paste

If you prefer not to use the auto-paste feature:

1. Keep "AHK Integration" disabled
2. Star Scoper OCR will still copy the formatted call to your clipboard
3. Manually paste with `Ctrl+V` in Discord

This gives you the same formatted output with full manual control.
