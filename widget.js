// Widget window logic for Star Scoper OCR
// Use secure API bridge from preload script
// electronAPI is provided by preload.js through contextBridge
console.log("Widget.js loading...");
console.log("window.electronAPI available:", !!window.electronAPI);

if (!window.electronAPI) {
  throw new Error(
    "electronAPI not available - preload script may have failed to load"
  );
}
console.log("electronAPI loaded successfully in widget");

// Update output call
window.electronAPI.ipc.on("widget-call-update", (callText) => {
  console.log("Widget received call update:", callText);
  document.getElementById("widgetOutput").textContent =
    callText || "Waiting for call...";
});

document.getElementById("capture1").addEventListener("click", () => {
  console.log("Widget capture 1 button clicked");
  window.electronAPI.ipc.send("widget-capture", 1);
});
document.getElementById("capture2").addEventListener("click", () => {
  console.log("Widget capture 2 button clicked");
  window.electronAPI.ipc.send("widget-capture", 2);
});
