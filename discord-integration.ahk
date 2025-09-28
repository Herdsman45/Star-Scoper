#Requires AutoHotkey v2.0
; Discord Auto-Paste Integration Script for Star Scoper (AutoHotkey v2)
; This script watches for the Discord call file and automatically pastes it into Discord
;
; Instructions:
; 1. Enable "Text File Output for Automations" in the Star Scoper app settings
; 2. Run this script (it will run in the background)
; 3. Use Star Scoper as normal - when a call is processed, it will be auto-pasted into Discord
;
; Requirements:
; - Discord window must be named "Discord" (works with regular Discord client)
; - The script will focus Discord and paste the call automatically
;
; Press Ctrl+Alt+Q to exit this script

#SingleInstance Force

; Configuration
FileToWatch := A_Temp . "\star-scoper-discord-call.txt"
DiscordWindowTitle := "ahk_exe Discord.exe"  ; Works with Discord app
RequiredChannel := "#📜next-wave-list"  ; Only paste in this channel

; Initialize LastModified with current file timestamp to prevent triggering on startup
try {
    LastModified := FileGetTime(FileToWatch, "M")
} catch {
    LastModified := ""
}

; Show tray notification that script is running
TrayTip("Star Scoper Discord integration is running!", "Discord Integration", 0x1)

; Main loop - check file every 100ms
SetTimer(CheckFile, 100)

CheckFile() {
    global FileToWatch, DiscordWindowTitle, LastModified

    ; Check if file exists and get modification time
    try {
        CurrentModified := FileGetTime(FileToWatch, "M")
    } catch {
        CurrentModified := ""
    }

    ; If file was modified since last check
    if (CurrentModified != LastModified && CurrentModified != "") {
        LastModified := CurrentModified

        ; Read the Discord call from the file
        try {
            DiscordCall := FileRead(FileToWatch)
        } catch {
            return
        }

        ; Only proceed if there's content and it looks like a Discord call
        if (StrLen(DiscordCall) > 0 && InStr(DiscordCall, "/call")) {
            ; Store the currently active window before switching to Discord
            try {
                PreviousWindow := WinGetID("A")  ; Get ID of currently active window
            } catch {
                PreviousWindow := ""
            }

            ; Find and activate Discord window
            try {
                WinActivate(DiscordWindowTitle)

                ; Wait a bit for window to become active
                Sleep(100)

                ; Check if Discord window is now active
                if (WinWaitActive(DiscordWindowTitle, , 2)) {
                    ; Check if we're in the correct channel
                    CurrentWindowTitle := WinGetTitle("A")

                    if (InStr(CurrentWindowTitle, RequiredChannel)) {
                        ; We're in the correct channel, paste the call
                        A_Clipboard := DiscordCall
                        Send("^v{Enter}")

                        ; Wait a moment for the message to send
                        Sleep(200)

                        ; Show success notification
                        TrayTip(DiscordCall, "Discord Call Sent to " . RequiredChannel, 0x1)
                    } else {
                        ; Wrong channel - show warning and don't paste
                        TrayTip("Currently in wrong channel. Please switch to " . RequiredChannel,
                            "Wrong Discord Channel", 0x2)
                    }

                    ; Restore focus to the previous window (regardless of whether we pasted or not)
                    if (PreviousWindow != "") {
                        try {
                            WinActivate("ahk_id " . PreviousWindow)
                        } catch {
                            ; If we can't restore the previous window, that's okay
                        }
                    }
                } else {
                    ; Could not activate Discord
                    TrayTip("Could not find or activate Discord window!", "Discord Not Found", 0x2)
                }
            } catch {
                TrayTip("Error activating Discord window!", "Discord Error", 0x2)
            }
        }
    }
}

; Hotkey to exit script
^!q:: {
    TrayTip("Script exiting...", "Discord Integration", 0x1)
    Sleep(1000)
    ExitApp()
}

; Right-click tray menu
A_TrayMenu.Add("Exit", MenuExit)

MenuExit(ItemName, ItemPos, MyMenu) {
    ExitApp()
}
