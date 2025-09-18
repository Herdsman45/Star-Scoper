// Keybind recording functionality

// Use secure API bridge from preload script
if (!window.electronAPI) {
  alert("Error: Secure API not available. Please restart the application.");
  throw new Error("electronAPI not available");
}

// Check if dark mode should be enabled
if (window.electronAPI && window.electronAPI.ipc) {
  window.electronAPI.ipc.send("get-theme-preference");
  window.electronAPI.ipc.once("theme-preference", (isDarkTheme) => {
    if (isDarkTheme) {
      document.body.classList.add("dark-theme");
    }
  });
}

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", function () {
  let shortcut = "";
  const keyElement = document.getElementById("key");
  const saveButton = document.getElementById("save");
  const cancelButton = document.getElementById("cancel");

  function getModifiers(e) {
    const modifiers = [];
    if (e.ctrlKey) modifiers.push("Ctrl");
    if (e.altKey) modifiers.push("Alt");
    if (e.shiftKey) modifiers.push("Shift");
    if (e.metaKey) modifiers.push("Command");
    return modifiers;
  }

  // Handle key presses for shortcut recording
  document.addEventListener("keydown", (e) => {
    e.preventDefault();

    const modifiers = getModifiers(e);
    let keyName = e.key;

    // Format special keys nicely
    if (keyName === " ") keyName = "Space";
    else if (keyName === "Control") keyName = "";
    else if (keyName === "Alt") keyName = "";
    else if (keyName === "Shift") keyName = "";
    else if (keyName === "Meta") keyName = "";

    // Convert key name to format compatible with Electron's globalShortcut
    if (keyName === "ArrowUp") keyName = "Up";
    else if (keyName === "ArrowDown") keyName = "Down";
    else if (keyName === "ArrowLeft") keyName = "Left";
    else if (keyName === "ArrowRight") keyName = "Right";

    // Only include the key name if it's not a modifier key alone
    const displayKeyName =
      keyName && !["", "Control", "Alt", "Shift", "Meta"].includes(keyName)
        ? keyName
        : "";

    // Convert to Electron-compatible format
    const electronKey =
      modifiers.join("+") +
      (displayKeyName && modifiers.length > 0 ? "+" : "") +
      displayKeyName;

    if (electronKey) {
      shortcut = electronKey;
      keyElement.textContent = shortcut;
    }
  });

  // Save button handler
  if (saveButton) {
    saveButton.onclick = function () {
      if (!shortcut) {
        alert("Please record a keyboard shortcut first!");
        return;
      }

      if (window.electronAPI && window.electronAPI.ipc) {
        window.electronAPI.ipc.send("keybind-save", shortcut);
        setTimeout(() => window.close(), 100);
      } else {
        alert("Error: Cannot save keybind. API not available.");
      }
    };
  }

  // Cancel button handler
  if (cancelButton) {
    cancelButton.onclick = function () {
      if (window.electronAPI && window.electronAPI.ipc) {
        window.electronAPI.ipc.send("keybind-cancel");
      }
      setTimeout(() => window.close(), 100);
    };
  }
});
