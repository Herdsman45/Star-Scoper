const { ipcRenderer } = require("electron");

// Since we're using nodeIntegration and not contextIsolation,
// we don't need to use contextBridge or set up additional APIs
// The renderer process has direct access to ipcRenderer
