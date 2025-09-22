const { ipcRenderer, contextBridge } = require("electron");

console.log("[PRELOAD] Preload script starting...");

// Security configuration (embedded for preload compatibility)
const ALLOWED_SEND_CHANNELS = [
  "region-selected",
  "regions-selected",
  "cancel-region-selection",
  "widget-capture",
  "widget-button-clicked",
  "open-debug-folder",
  "save-settings",
  "toggle-widget",
  "toggle-theme",
  "open-widget",
  "keybind-save",
  "keybind-cancel",
  "get-theme-preference",
];

const ALLOWED_INVOKE_CHANNELS = [
  "get-settings",
  "get-display-info",
  "get-debug-dir",
  "get-keyboard-shortcut",
  "set-debug-mode",
  "set-ahk-integration",
  "save-settings",
  "get-regions",
  "set-regions",
  "capture-slot",
];

const ALLOWED_LISTENER_CHANNELS = [
  "settings-loaded",
  "debug-images-saved",
  "capture-result",
  "theme-changed",
  "ocr-result",
  "status-update",
  "start-region-selection",
  "widget-call-update",
  "show-widget-button",
  "theme-preference",
];

// Secure API bridge for renderer processes
const electronAPI = {
  // IPC Communication
  ipc: {
    send: (channel, data) => {
      // Use embedded security configuration
      const allowedChannels = ALLOWED_SEND_CHANNELS;
      if (allowedChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    invoke: (channel, ...args) => {
      // Use embedded security configuration
      const allowedChannels = ALLOWED_INVOKE_CHANNELS;
      if (allowedChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
    },
    on: (channel, func) => {
      // Use embedded security configuration
      const allowedChannels = ALLOWED_LISTENER_CHANNELS;
      if (allowedChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    once: (channel, func) => {
      const allowedChannels = ALLOWED_LISTENER_CHANNELS;
      if (allowedChannels.includes(channel)) {
        ipcRenderer.once(channel, (event, ...args) => func(...args));
      }
    },
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    },
  },
};

// Expose secure API
try {
  contextBridge.exposeInMainWorld("electronAPI", electronAPI);
  console.log(
    "[PRELOAD] Successfully exposed secure electron APIs through contextBridge"
  );
} catch (error) {
  console.warn(
    "[PRELOAD] contextBridge failed, falling back to window object:",
    error.message
  );
  // Fallback for when contextIsolation is disabled
  window.electronAPI = electronAPI;
  // Keep backward compatibility
  window.ipcRenderer = ipcRenderer;
}

console.log("[PRELOAD] Preload script completed");
