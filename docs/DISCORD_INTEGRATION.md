# Discord Auto-Paste Integration

This feature allows Star Scoper to automatically send Discord calls to your Discord client using automation scripts.

**Platform Support:**

- **Windows**: AutoHotkey script (`discord-integration.ahk`)
- **macOS**: Hammerspoon script (`discord-integration.lua`)

## How It Works

1. **Star Scoper** processes your star call and formats it for Discord
2. When "Text File Output for Automations" is enabled, the formatted call is written to a temporary file
3. **Automation script** monitors this file and automatically pastes the call into Discord

## Setup Instructions

### Windows Setup (AutoHotkey)

#### 1. Enable Text File Output for Automations in Star Scoper

- Open Star Scoper
- Go to Settings section
- Enable the "Text File Output for Automations" toggle
- You'll see a notification when it's enabled

#### 2. Install AutoHotkey (if not already installed)

- Download from: https://www.autohotkey.com/
- Install the program

#### 3. Run the Discord Integration Script

- Use the provided `discord-integration.ahk` script
- Double-click it to run, or right-click and select "Compile Script" to create an executable
- The script will show a tray notification when it's running

### macOS Setup (Hammerspoon)

#### 1. Enable Text File Output for Automations in Star Scoper

- Open Star Scoper
- Go to Settings section
- Enable the "Text File Output for Automations" toggle
- You'll see a notification when it's enabled

#### 2. Install Hammerspoon

- Download from: https://www.hammerspoon.org/
- Install the application
- Launch Hammerspoon and grant it Accessibility permissions when prompted

#### 3. Set up the Discord Integration Script

- Copy the provided `discord-integration.lua` script to `~/.hammerspoon/discord-integration.lua`
- Edit (or create) `~/.hammerspoon/init.lua` and add: `require("discord-integration")`
- Click the Hammerspoon menu bar icon and select "Reload Config"
- You'll see a notification when the integration is running

## Usage

1. **Start the automation script**:
   - **Windows**: Run `discord-integration.ahk`
   - **macOS**: Hammerspoon will auto-start the script after config reload
2. **Open Discord** in your web browser or Discord app
3. **Use Star Scoper** as normal:
   - Click capture button
   - App processes the star call
   - **If all fields are recognized (no "Unknown" values), Discord will automatically be focused and the call will be pasted**
   - **If any field contains "Unknown", auto-paste is skipped.**

## Workflow Example

1. Open message box in RuneScape
2. Click capture in Star Scoper
3. App captures and processes: `/call world: 123 region: A size: Large relative-time: 10-15min`
4. Discord automatically becomes focused
5. Call is automatically pasted and sent
6. You can immediately go back to RuneScape

**Note**: If the call contains "Unknown" values (like `region: Unknown`), auto-paste will be skipped and you'll need to manually paste from clipboard.

## Script Controls

### Windows (AutoHotkey)

- **Exit Script**: Press `Ctrl+Alt+Q`
- **Tray Icon**: Right-click the tray icon and select "Exit"

### macOS (Hammerspoon)

- **Toggle Script**: Press `Cmd+Alt+Q` to enable/disable
- **Reload Config**: Use Hammerspoon menu bar icon → "Reload Config"
- **Console/Logs**: Hammerspoon menu bar icon → "Console"

## Troubleshooting

### Discord Not Found

**Windows:**

- Make sure Discord is running
- The script looks for Discord app (`Discord.exe`)
- If using Discord in browser, you may need to modify the script

**macOS:**

- Make sure Discord desktop app is running (not browser version)
- The script looks for Discord app bundle ID `com.hnc.Discord`
- Check Hammerspoon has Accessibility permissions in System Preferences → Security & Privacy → Privacy → Accessibility

### Calls Not Being Pasted

- Check that "Text File Output for Automations" is enabled in Star Scoper
- Verify the automation script is running:
  - **Windows**: Check for AHK tray icon
  - **macOS**: Check Hammerspoon console for error messages
- Make sure Discord is not in full-screen mode
- **Check for "Unknown" values**: Auto-paste is skipped when the call contains "Unknown" fields
- **Widget background turns red**: This indicates Unknown values were detected

### Security Warnings

**Windows:**

- Windows/antivirus may warn about AutoHotkey scripts
- This is normal for automation scripts
- The script only monitors a text file and sends keypresses

**macOS:**

- macOS may prompt for Accessibility permissions for Hammerspoon
- Grant these permissions in System Preferences → Security & Privacy → Privacy → Accessibility
- You may need to restart Hammerspoon after granting permissions

## File Locations

**Windows:**

- **Temp File**: `%TEMP%\star-scoper-discord-call.txt`
- **AHK Script**: `discord-integration.ahk`

**macOS:**

- **Temp File**: `$TMPDIR/star-scoper-discord-call.txt`
- **Hammerspoon Script**: `~/.hammerspoon/discord-integration.lua`
- **Hammerspoon Config**: `~/.hammerspoon/init.lua`

## Customization

### Windows (AutoHotkey)

You can modify the AHK script to:

- Change Discord window detection
- Add delays for timing
- Modify notification settings
- Add additional hotkeys

### macOS (Hammerspoon)

You can modify the Lua script to:

- Change Discord bundle ID detection
- Adjust timing intervals
- Customize notifications
- Add additional keybindings
- Use Hammerspoon's extensive API for more features

## Alternative: Manual Copy-Paste

If you prefer not to use the auto-paste feature:

1. Keep "AHK Integration" disabled
2. Star Scoper will still copy the formatted call to your clipboard
3. Manually paste with `Ctrl+V` in Discord

This gives you the same formatted output with full manual control.
