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

    const widgetButton = document.getElementById("open-widget-btn");
    if (widgetButton) {
      widgetButton.addEventListener("click", () => {
        electronAPI.ipc.send("open-widget");
      });
    }
  } else {
    // Fallback: always show button in browser
    showWidgetButton();
  }
});
