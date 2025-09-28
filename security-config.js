/**
 * Security Configuration for Star Scoper
 * Centralized security settings and validation functions
 */

const os = require("os");
const path = require("path");

// Security Constants
const SECURITY_CONFIG = {
  // Allowed IPC channels (must match preload.js whitelist)
  ALLOWED_SEND_CHANNELS: [
    "region-selected",
    "regions-selected",
    "cancel-region-selection",
    "widget-capture",
    "open-debug-folder",
    "save-settings",
    "toggle-widget",
    "toggle-theme",
    "open-widget",
    "keybind-save",
    "keybind-cancel",
    "get-theme-preference",
  ],

  ALLOWED_INVOKE_CHANNELS: [
    "get-settings",
    "get-display-info",
    "get-debug-dir",
    "get-keyboard-shortcut",
    "set-debug-mode",
    "save-settings",
    "get-regions",
    "set-regions",
    "capture-slot",
  ],

  ALLOWED_LISTENER_CHANNELS: [
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
  ],

  // Content Security Policy
  CSP_POLICY:
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none';",

  // Allowed file paths for debug operations
  ALLOWED_DEBUG_PATHS: [
    path.join(os.homedir(), "Documents", "Star-Scoper-OCR-Debug"),
    os.tmpdir(),
  ],

  // Window security preferences
  WINDOW_SECURITY_PREFS: {
    nodeIntegration: false,
    contextIsolation: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    experimentalFeatures: false,
    enableBlinkFeatures: "",
    disableBlinkFeatures: "Auxclick",
  },
};

// Security validation functions
const SecurityValidators = {
  /**
   * Validate slot number input
   * @param {*} slot - Slot number to validate
   * @returns {boolean} - True if valid
   */
  validateSlotNumber(slot) {
    return typeof slot === "number" && slot >= 1 && slot <= 2;
  },

  /**
   * Validate file path for debug operations
   * @param {string} filePath - Path to validate
   * @returns {boolean} - True if path is safe
   */
  validateDebugPath(filePath) {
    if (!filePath || typeof filePath !== "string") {
      return false;
    }

    const normalizedPath = path.normalize(filePath);
    return SECURITY_CONFIG.ALLOWED_DEBUG_PATHS.some((allowedPath) =>
      normalizedPath.startsWith(allowedPath)
    );
  },

  /**
   * Validate IPC channel name
   * @param {string} channel - Channel name to validate
   * @param {string} type - Channel type ('send', 'invoke', 'listen')
   * @returns {boolean} - True if channel is whitelisted
   */
  validateIPCChannel(channel, type) {
    switch (type) {
      case "send":
        return SECURITY_CONFIG.ALLOWED_SEND_CHANNELS.includes(channel);
      case "invoke":
        return SECURITY_CONFIG.ALLOWED_INVOKE_CHANNELS.includes(channel);
      case "listen":
        return SECURITY_CONFIG.ALLOWED_LISTENER_CHANNELS.includes(channel);
      default:
        return false;
    }
  },

  /**
   * Sanitize string input to prevent injection attacks
   * @param {string} input - Input to sanitize
   * @returns {string} - Sanitized input
   */
  sanitizeStringInput(input) {
    if (typeof input !== "string") {
      return "";
    }
    // Remove potentially dangerous characters
    return input.replace(/[<>'"&]/g, "").trim();
  },
};

module.exports = {
  SECURITY_CONFIG,
  SecurityValidators,
};
