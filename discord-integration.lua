-- Discord Auto-Paste Integration Script for Star Scoper (Hammerspoon for macOS)
-- This script watches for the Discord call file and automatically pastes it into Discord
--
-- Instructions:
-- 1. Install Hammerspoon from https://www.hammerspoon.org/
-- 2. Place this file in ~/.hammerspoon/discord-integration.lua
-- 3. Add `require("discord-integration")` to your ~/.hammerspoon/init.lua
-- 4. Reload Hammerspoon configuration
-- 5. Enable "Text File Output for Automations" in the Star Scoper app settings
-- 6. Use Star Scoper as normal - when a call is processed, it will be auto-pasted into Discord
--
-- Requirements:
-- - Discord app must be running (works with Discord desktop app)
-- - The script will focus Discord and paste the call automatically
--
-- Press Cmd+Alt+Q to disable/enable this script

local obj = {}
obj.__index = obj

-- Configuration
local fileToWatch = os.getenv("TMPDIR") .. "star-scoper-discord-call.txt"
local discordBundleID = "com.hnc.Discord"  -- Discord desktop app bundle ID
local requiredChannel = "#📜next-wave-list"  -- Only paste in this channel
local checkInterval = 0.1  -- Check every 100ms

-- State variables
local lastModified = 0
local watcher = nil
local isEnabled = true

-- Initialize the module
function obj:init()
    -- Try to get initial file modification time to prevent triggering on startup
    local attrs = hs.fs.attributes(fileToWatch)
    if attrs then
        lastModified = attrs.modification
    end
    
    -- Show notification that script is running
    hs.notify.new({
        title = "Star Scoper",
        informativeText = "Discord integration is running!",
        autoWithdraw = true,
        withdrawAfter = 3
    }):send()
    
    -- Start the file watcher
    self:startWatching()
    
    -- Set up hotkey to toggle script
    hs.hotkey.bind({"cmd", "alt"}, "q", function()
        self:toggle()
    end)
    
    return self
end

-- Start watching the file
function obj:startWatching()
    if watcher then
        watcher:stop()
    end
    
    watcher = hs.timer.doEvery(checkInterval, function()
        self:checkFile()
    end)
end

-- Stop watching the file
function obj:stopWatching()
    if watcher then
        watcher:stop()
        watcher = nil
    end
end

-- Check if file has been modified
function obj:checkFile()
    if not isEnabled then
        return
    end
    
    -- Check if file exists and get modification time
    local attrs = hs.fs.attributes(fileToWatch)
    if not attrs then
        return
    end
    
    local currentModified = attrs.modification
    
    -- If file was modified since last check
    if currentModified ~= lastModified and currentModified > 0 then
        lastModified = currentModified
        
        -- Read the Discord call from the file
        local file = io.open(fileToWatch, "r")
        if not file then
            return
        end
        
        local discordCall = file:read("*all")
        file:close()
        
        -- Only proceed if there's content and it looks like a Discord call
        if string.len(discordCall) > 0 and string.find(discordCall, "/call") then
            self:sendToDiscord(discordCall)
        end
    end
end

-- Send the call to Discord
function obj:sendToDiscord(discordCall)
    -- Store the currently focused application
    local previousApp = hs.application.frontmostApplication()
    
    -- Find and activate Discord
    local discord = hs.application.get(discordBundleID)
    if not discord then
        hs.notify.new({
            title = "Discord Not Found",
            informativeText = "Could not find Discord app!",
            autoWithdraw = true,
            withdrawAfter = 5
        }):send()
        return
    end
    
    -- Activate Discord
    discord:activate()
    
    -- Wait a bit for Discord to become active
    hs.timer.usleep(100000) -- 100ms
    
    -- Check if Discord is now the frontmost application
    if hs.application.frontmostApplication():bundleID() == discordBundleID then
        -- Get the current window title to check channel
        local focusedWindow = hs.window.focusedWindow()
        if focusedWindow then
            local windowTitle = focusedWindow:title()
            
            if string.find(windowTitle, requiredChannel, 1, true) then
                -- We're in the correct channel, paste the call
                hs.pasteboard.setContents(discordCall)
                
                -- Paste and send (Cmd+V then Enter)
                hs.eventtaps.keyStroke({"cmd"}, "v")
                hs.timer.usleep(50000) -- 50ms delay
                hs.eventtaps.keyStroke({}, "return")
                
                -- Wait a moment for the message to send
                hs.timer.usleep(200000) -- 200ms
                
                -- Show success notification
                hs.notify.new({
                    title = "Discord Call Sent",
                    informativeText = "Sent to " .. requiredChannel,
                    autoWithdraw = true,
                    withdrawAfter = 3
                }):send()
            else
                -- Wrong channel - show warning and don't paste
                hs.notify.new({
                    title = "Wrong Discord Channel",
                    informativeText = "Please switch to " .. requiredChannel,
                    autoWithdraw = true,
                    withdrawAfter = 5
                }):send()
            end
            
            -- Restore focus to the previous application
            if previousApp then
                hs.timer.doAfter(0.3, function()
                    previousApp:activate()
                end)
            end
        else
            hs.notify.new({
                title = "Discord Error",
                informativeText = "Could not get Discord window information!",
                autoWithdraw = true,
                withdrawAfter = 5
            }):send()
        end
    else
        hs.notify.new({
            title = "Discord Activation Failed",
            informativeText = "Could not activate Discord window!",
            autoWithdraw = true,
            withdrawAfter = 5
        }):send()
    end
end

-- Toggle script enabled/disabled
function obj:toggle()
    isEnabled = not isEnabled
    
    local status = isEnabled and "enabled" or "disabled"
    hs.notify.new({
        title = "Star Scoper",
        informativeText = "Discord integration " .. status,
        autoWithdraw = true,
        withdrawAfter = 3
    }):send()
end

-- Clean up when module is unloaded
function obj:stop()
    self:stopWatching()
    if hs.hotkey then
        hs.hotkey.deleteAll()
    end
end

-- Create and return the module instance
local instance = obj:init()

-- Return the module for require() calls
return instance