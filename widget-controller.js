// Widget controller script
// Handles the widget toggle button functionality

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Use secure API bridge from preload script
  const electronAPI = window.electronAPI;

  function showWidgetButton() {
    const widgetButton = document.getElementById("open-widget-btn");
    if (widgetButton) widgetButton.style.display = "";
  }

  if (electronAPI) {
    electronAPI.ipc.on("show-widget-button", showWidgetButton);

    // Widget button handler
    const widgetButton = document.getElementById("open-widget-btn");
    if (widgetButton) {
      widgetButton.addEventListener("click", () => {
        electronAPI.ipc.send("open-widget");
      });
    }

    // Session Log button handler
    const sessionLogButton = document.getElementById("open-session-log-btn");
    if (sessionLogButton) {
      sessionLogButton.addEventListener("click", () => {
        electronAPI.ipc.send("open-session-log");
      });
    }

    // Evil Tree Log button handler
    const treeLogButton = document.getElementById("open-tree-log-btn");
    if (treeLogButton) {
      treeLogButton.addEventListener("click", () => {
        electronAPI.ipc.send("open-tree-log");
      });
    }
  } else {
    // Fallback: always show button in browser
    showWidgetButton();
  }
});
