// Widget controller script
// Handles the widget toggle button functionality

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Show/hide widget button if main process says so (for future-proofing)
  const { ipcRenderer } = window.require ? window.require("electron") : {};

  function showWidgetButton() {
    const widgetButton = document.getElementById("open-widget-btn");
    if (widgetButton) widgetButton.style.display = "";
  }

  if (ipcRenderer) {
    ipcRenderer.on("show-widget-button", showWidgetButton);

    const widgetButton = document.getElementById("open-widget-btn");
    if (widgetButton) {
      widgetButton.addEventListener("click", () => {
        ipcRenderer.send("open-widget");
      });
    }
  } else {
    // Fallback: always show button in browser
    showWidgetButton();
  }
});
