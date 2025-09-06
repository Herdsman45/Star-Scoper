// Widget window logic for Star Scoper OCR
const { ipcRenderer } = require("electron");

// Update output call
ipcRenderer.on("widget-call-update", (event, callText) => {
  document.getElementById("widgetOutput").textContent =
    callText || "Waiting for call...";
});

document.getElementById("capture1").addEventListener("click", () => {
  ipcRenderer.send("widget-capture", 1);
});
document.getElementById("capture2").addEventListener("click", () => {
  ipcRenderer.send("widget-capture", 2);
});
