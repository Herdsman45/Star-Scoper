// Widget window logic for Star Scoper
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
  const outputElement = document.getElementById("widgetOutput");
  outputElement.textContent = callText || "Waiting for call...";

  // Check if call contains "Unknown" values and change background accordingly
  const hasUnknown = callText && callText.toLowerCase().includes("unknown");
  if (hasUnknown) {
    document.body.style.background = "#4a2c2c"; // Dark red background
    console.log("Widget background set to red due to Unknown values");
  } else {
    document.body.style.background = "var(--background, #23272e)"; // Normal background
    console.log("Widget background set to normal");
  }
});

document.getElementById("capture1").addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  console.log("Widget capture 1 button clicked");
  window.electronAPI.ipc.send("widget-capture", 1);
  // Request focus restoration after button click
  window.electronAPI.ipc.send("widget-button-clicked");
});
document.getElementById("capture2").addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  console.log("Widget capture 2 button clicked");
  window.electronAPI.ipc.send("widget-capture", 2);
  // Request focus restoration after button click
  window.electronAPI.ipc.send("widget-button-clicked");
});
