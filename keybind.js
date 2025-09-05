// Debug
console.log("Keybinding script loaded");

// Try different methods to get ipcRenderer
let ipcRenderer;
if (window.ipcRenderer) {
  console.log("Found ipcRenderer on window");
  ipcRenderer = window.ipcRenderer;
} else if (window.electron && window.electron.ipcRenderer) {
  console.log("Found ipcRenderer in electron bridge");
  ipcRenderer = window.electron.ipcRenderer;
} else if (window.require) {
  console.log("Using require to get ipcRenderer");
  try {
    const electron = window.require("electron");
    ipcRenderer = electron.ipcRenderer;
  } catch (e) {
    console.error("Error requiring electron:", e);
  }
} else {
  console.error("No ipcRenderer found!");
}

// Show debug info
console.log("ipcRenderer:", ipcRenderer);

// Check if dark mode should be enabled
if (ipcRenderer) {
  console.log("Sending theme preference request");
  ipcRenderer.send("get-theme-preference");
  ipcRenderer.once("theme-preference", (event, isDarkTheme) => {
    console.log("Received theme preference:", isDarkTheme);
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

  console.log("Elements:", { keyElement, saveButton, cancelButton });

  function getModifiers(e) {
    const modifiers = [];
    if (e.ctrlKey) modifiers.push("Ctrl");
    if (e.altKey) modifiers.push("Alt");
    if (e.shiftKey) modifiers.push("Shift");
    if (e.metaKey) modifiers.push("Command");
    return modifiers;
  }

  // Log key presses to debug
  document.addEventListener("keydown", (e) => {
    console.log("Key pressed:", e.key, e);

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
    console.log("Electron key:", electronKey);

    if (electronKey) {
      shortcut = electronKey;
      keyElement.textContent = shortcut;
    }
  });

  // Use direct DOM method to ensure listeners are attached
  if (saveButton) {
    console.log("Adding save button listener");
    saveButton.onclick = function () {
      console.log("Save button clicked, shortcut:", shortcut);
      if (shortcut && ipcRenderer) {
        console.log("Sending keybind-save with:", shortcut);
        ipcRenderer.send("keybind-save", shortcut);

        // Try to close the window directly as well
        setTimeout(() => {
          console.log("Attempting to close window directly");
          window.close();
        }, 100);
      } else {
        console.error("Cannot save - missing shortcut or ipcRenderer");
      }
    };
  }

  if (cancelButton) {
    console.log("Adding cancel button listener");
    cancelButton.onclick = function () {
      console.log("Cancel button clicked");
      if (ipcRenderer) {
        ipcRenderer.send("keybind-cancel");

        // Try to close the window directly as well
        setTimeout(() => {
          console.log("Attempting to close window directly after cancel");
          window.close();
        }, 100);
      }
    };
  }
});
