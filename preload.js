const { ipcRenderer, contextBridge } = require("electron");

// Make sure ipcRenderer is available in the window object
window.ipcRenderer = ipcRenderer;

// Since we're using nodeIntegration without contextIsolation in most windows,
// the renderer process has direct access to ipcRenderer. However, we'll still
// expose the API through contextBridge for more secure windows or future changes.
try {
  contextBridge.exposeInMainWorld("electron", {
    ipcRenderer: {
      send: (channel, data) => {
        ipcRenderer.send(channel, data);
      },
      invoke: (channel, ...args) => {
        return ipcRenderer.invoke(channel, ...args);
      },
      on: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      },
      once: (channel, func) => {
        ipcRenderer.once(channel, (event, ...args) => func(...args));
      },
      removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
      },
    },
  });
  console.log("Successfully exposed electron APIs through contextBridge");
} catch (error) {
  console.log("Using direct ipcRenderer access mode");
  // Ignore errors - contextBridge might not be available if contextIsolation is disabled
}
