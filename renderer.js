const { ipcRenderer } = require("electron");

// DOM elements
const rawTextElement = document.getElementById("raw-text");
const processedTextElement = document.getElementById("processed-text");
const copyRawBtn = document.getElementById("copy-raw");
const copyProcessedBtn = document.getElementById("copy-processed");
const setSlot1Btn = document.getElementById("set-slot1");
const setSlot2Btn = document.getElementById("set-slot2");
const captureSlot1Btn = document.getElementById("capture-slot1");
const captureSlot2Btn = document.getElementById("capture-slot2");
const statusSlot1 = document.getElementById("status-slot1");
const statusSlot2 = document.getElementById("status-slot2");
const hotkeySlot1Input = document.getElementById("hotkey-slot1");
const hotkeySlot2Input = document.getElementById("hotkey-slot2");
const saveSettingsBtn = document.getElementById("save-settings");
const regionSelectionOverlay = document.getElementById(
  "region-selection-overlay"
);
const selectionSlotNumber = document.getElementById("selection-slot-number");
const cancelSelectionBtn = document.getElementById("cancel-selection");
const saveRegionsBtn = document.getElementById("save-regions");
const debugModeCheckbox = document.getElementById("debug-mode");
const debugStatusText = document.getElementById("debug-status");

// Current state
let currentSlot = null;
let currentRegions = { regionA: null, regionB: null };
let mainContainer;
let resizableBoxes = [];

// Theme toggle
const darkModeToggle = document.getElementById("dark-mode-toggle");

// Check for saved theme preference or use preferred color scheme
const savedTheme = localStorage.getItem("theme");
if (
  savedTheme === "dark" ||
  (!savedTheme &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.body.classList.add("dark-theme");
  darkModeToggle.checked = true;
}

// Event listeners
setSlot1Btn.addEventListener("click", () => setRegions(1));
setSlot2Btn.addEventListener("click", () => setRegions(2));
captureSlot1Btn.addEventListener("click", () => captureSlot(1));
captureSlot2Btn.addEventListener("click", () => captureSlot(2));
copyRawBtn.addEventListener("click", () =>
  copyText(rawTextElement.textContent)
);
copyProcessedBtn.addEventListener("click", () =>
  copyText(processedTextElement.textContent)
);
saveSettingsBtn.addEventListener("click", saveSettings);
cancelSelectionBtn.addEventListener("click", cancelRegionSelection);
saveRegionsBtn.addEventListener("click", saveSelectedRegions);

// Dark mode toggle
darkModeToggle.addEventListener("change", async () => {
  if (darkModeToggle.checked) {
    document.body.classList.add("dark-theme");
    localStorage.setItem("theme", "dark");
    await ipcRenderer.invoke("set-theme", true);
  } else {
    document.body.classList.remove("dark-theme");
    localStorage.setItem("theme", "light");
    await ipcRenderer.invoke("set-theme", false);
  }
});

// Debug mode toggle
debugModeCheckbox.addEventListener("change", async () => {
  const debugEnabled = debugModeCheckbox.checked;
  await ipcRenderer.invoke("set-debug-mode", debugEnabled);

  // Update the status text
  if (debugEnabled) {
    debugStatusText.textContent =
      "Debug mode is enabled - debug images will be saved";
    showToast("Debug mode enabled");
  } else {
    debugStatusText.textContent =
      "Debug mode is disabled - no debug images will be saved";
    showToast("Debug mode disabled");
  }
});

// Load settings on startup
document.addEventListener("DOMContentLoaded", async () => {
  loadSettings();

  // Initialize debug mode toggle
  const settings = await ipcRenderer.invoke("get-settings");
  debugModeCheckbox.checked = settings.debugMode || false;

  // Set initial status text
  if (debugModeCheckbox.checked) {
    debugStatusText.textContent =
      "Debug mode is enabled - debug images will be saved";
  } else {
    debugStatusText.textContent =
      "Debug mode is disabled - no debug images will be saved";
  }
});

// Set regions for a slot
async function setRegions(slotNumber) {
  currentSlot = slotNumber;
  selectionSlotNumber.textContent = slotNumber;

  // Get existing regions if available
  const existingRegions = await ipcRenderer.invoke("get-regions", slotNumber);

  // Start region selection with existing regions
  const result = await ipcRenderer.invoke(
    "set-regions",
    slotNumber,
    existingRegions
  );

  // After regions are set
  if (result.success) {
    updateStatus(slotNumber, "Regions set successfully!", "success");
  } else {
    updateStatus(slotNumber, "Failed to set regions", "error");
  }
}

// Capture a slot
async function captureSlot(slotNumber) {
  updateStatus(slotNumber, "Capturing...", "pending");
  await ipcRenderer.invoke("capture-slot", slotNumber);
}

// Copy text to clipboard
function copyText(text) {
  navigator.clipboard.writeText(text);
  showToast("Copied to clipboard!");
}

// Save settings
async function saveSettings() {
  const settings = {
    hotkey1: hotkeySlot1Input.value,
    hotkey2: hotkeySlot2Input.value,
    darkTheme: darkModeToggle.checked,
  };

  await ipcRenderer.invoke("save-settings", settings);
  showToast("Settings saved!");
}

// Load settings
async function loadSettings() {
  const settings = await ipcRenderer.invoke("get-settings");

  hotkeySlot1Input.value = settings.hotkey1;
  hotkeySlot2Input.value = settings.hotkey2;

  // Set theme based on stored preference (this runs after the initial check)
  if (settings.darkTheme) {
    document.body.classList.add("dark-theme");
    if (darkModeToggle) darkModeToggle.checked = true;
  }
}

// Update status for a slot
function updateStatus(slotNumber, message, type = "info") {
  const statusElement = slotNumber === 1 ? statusSlot1 : statusSlot2;
  statusElement.textContent = message;
  statusElement.className = "status " + type;

  // Clear status after 3 seconds
  setTimeout(() => {
    statusElement.textContent = "";
    statusElement.className = "status";
  }, 3000);
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.className = "toast visible";
  }, 10);

  setTimeout(() => {
    toast.className = "toast";
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Cancel region selection
function cancelRegionSelection() {
  cleanupSelectionMode();
  ipcRenderer.send("cancel-region-selection");
}

// Clean up selection mode
function cleanupSelectionMode() {
  regionSelectionOverlay.classList.add("hidden");
  regionSelectionOverlay.style.backgroundImage = "";
  regionSelectionOverlay.style.backgroundSize = "";
  regionSelectionOverlay.style.backgroundPosition = "";
  mainContainer.style.opacity = "1";

  // Remove any resizable boxes
  resizableBoxes.forEach((box) => {
    if (box && box.element && box.element.parentNode) {
      box.element.parentNode.removeChild(box.element);
    }
  });
  resizableBoxes = [];
}

// Save the selected regions
async function saveSelectedRegions() {
  if (resizableBoxes.length !== 2) {
    showToast("Please create both regions first");
    return;
  }

  // Show processing indicator
  showToast("Processing regions...");

  try {
    // Get coordinates from boxes (now async)
    currentRegions.regionA = await resizableBoxes[0].getCoordinates();
    currentRegions.regionB = await resizableBoxes[1].getCoordinates();

    console.log(
      "[DEBUG] Saving regionA:",
      JSON.stringify(currentRegions.regionA)
    );
    console.log(
      "[DEBUG] Saving regionB:",
      JSON.stringify(currentRegions.regionB)
    );

    // Send regions back to main process
    ipcRenderer.send("regions-selected", {
      regionA: currentRegions.regionA,
      regionB: currentRegions.regionB,
    });

    // Clean up
    cleanupSelectionMode();
    showToast("Regions saved successfully!");
  } catch (error) {
    console.error("Error saving regions:", error);
    showToast("Error saving regions. Please try again.");
  }
}

// IPC events
ipcRenderer.on("ocr-result", (event, data) => {
  console.log("[DEBUG] OCR result received:", data);

  // Update text display
  if (data.raw) rawTextElement.textContent = data.raw;
  if (data.processed) processedTextElement.textContent = data.processed;
  updateStatus(data.slot, "OCR completed!", "success");

  // If we have debug images, show a button to open the folder
  if (data.debugDir) {
    const debugBtn = document.createElement("button");
    debugBtn.textContent = "🔍 Open Debug Images";
    debugBtn.className = "btn debug-btn";
    debugBtn.style.backgroundColor = "#ff5722"; // Bright orange color
    debugBtn.style.color = "white";
    debugBtn.style.fontWeight = "bold";
    debugBtn.style.padding = "10px 20px";
    debugBtn.style.margin = "10px 0";
    debugBtn.style.border = "none";
    debugBtn.style.borderRadius = "4px";
    debugBtn.style.cursor = "pointer";
    debugBtn.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
    debugBtn.onclick = () => {
      ipcRenderer.send("open-debug-folder", data.debugDir);
    }; // Remove any existing debug button first
    const existingBtn = document.getElementById("open-debug-btn");
    if (existingBtn) {
      existingBtn.parentNode.removeChild(existingBtn);
    }

    // Add the new button
    debugBtn.id = "open-debug-btn";

    // Create a dedicated container for the debug button at the top of the page
    const container = document.querySelector(".container");

    if (container) {
      // Check if debug section already exists
      let debugSection = document.querySelector(".debug-section");

      // Only create a new section if one doesn't already exist
      if (!debugSection) {
        debugSection = document.createElement("div");
        debugSection.className = "section debug-section";
        debugSection.id = "debug-section";
        debugSection.style.backgroundColor = "#fff3e0";
        debugSection.style.padding = "10px";
        debugSection.style.margin = "10px 0";
        debugSection.style.border = "2px solid #ff5722";
        debugSection.style.borderRadius = "4px";

        // Add title
        const debugTitle = document.createElement("h3");
        debugTitle.textContent = "Debug Tools";
        debugTitle.style.margin = "0 0 10px 0";
        debugSection.appendChild(debugTitle);

        // Insert at the beginning of the container
        container.insertBefore(debugSection, container.firstChild);
      } else {
        // Clear any existing buttons with same ID
        const existingBtns = debugSection.querySelectorAll("#open-debug-btn");
        existingBtns.forEach((btn) => btn.parentNode.removeChild(btn));
      }

      // Add the button to the section
      debugSection.appendChild(debugBtn);
    } else {
      // Fallback - just add to document body if container not found
      document.body.insertBefore(debugBtn, document.body.firstChild);
      console.warn("Could not find container, added debug button to body");
    }
  }
});

ipcRenderer.on("status-update", (event, message) => {
  showToast(message);
});

// Region selection handling with resizable boxes
ipcRenderer.on(
  "start-region-selection",
  (event, slotNumber, screenshotDataUrl, existingRegions) => {
    currentSlot = slotNumber;
    mainContainer = document.querySelector(".container");
    mainContainer.style.opacity = "0"; // Hide main content

    // Show the overlay with screenshot
    regionSelectionOverlay.classList.remove("hidden");
    regionSelectionOverlay.style.backgroundImage = `url(${screenshotDataUrl})`;
    regionSelectionOverlay.style.backgroundSize = "100% 100%";
    regionSelectionOverlay.style.backgroundPosition = "0 0";

    // Get display information for coordinate scaling
    ipcRenderer.invoke("get-display-info").then((displayInfo) => {
      // Calculate reverse scaling to convert real coordinates to UI coordinates
      const overlayRect = regionSelectionOverlay.getBoundingClientRect();
      const scaleX = displayInfo.width / overlayRect.width;
      const scaleY = displayInfo.height / overlayRect.height;

      // Create two resizable boxes
      if (existingRegions && existingRegions.regionA) {
        // Convert real coordinates back to UI coordinates
        const uiX = Math.round(existingRegions.regionA.x / scaleX);
        const uiY = Math.round(existingRegions.regionA.y / scaleY);
        const uiWidth = Math.round(existingRegions.regionA.width / scaleX);
        const uiHeight = Math.round(existingRegions.regionA.height / scaleY);

        createResizableBox(
          "Main Dialog Region",
          "regionA",
          uiX,
          uiY,
          uiWidth,
          uiHeight
        );
      } else {
        createResizableBox("Main Dialog Region", "regionA");
      }

      if (existingRegions && existingRegions.regionB) {
        // Convert real coordinates back to UI coordinates
        const uiX = Math.round(existingRegions.regionB.x / scaleX);
        const uiY = Math.round(existingRegions.regionB.y / scaleY);
        const uiWidth = Math.round(existingRegions.regionB.width / scaleX);
        const uiHeight = Math.round(existingRegions.regionB.height / scaleY);

        createResizableBox(
          "World Line Region",
          "regionB",
          uiX,
          uiY,
          uiWidth,
          uiHeight
        );
      } else {
        createResizableBox("World Line Region", "regionB");
      }
    });
  }
);

// Create a resizable and movable box
function createResizableBox(label, regionType, x, y, width, height) {
  // Create the box element
  const box = document.createElement("div");
  box.className = "resizable-box";
  // Add data attribute for CSS targeting
  box.setAttribute("data-region-type", regionType);

  // Use provided coordinates or defaults
  const offsetX = x !== undefined ? x : regionType === "regionA" ? 100 : 200;
  const offsetY = y !== undefined ? y : regionType === "regionA" ? 100 : 200;

  // Set different default sizes for the two region types if not provided
  const defaultWidth =
    width !== undefined ? width : regionType === "regionA" ? 200 : 150;
  const defaultHeight =
    height !== undefined ? height : regionType === "regionA" ? 100 : 15;

  box.style.left = offsetX + "px";
  box.style.top = offsetY + "px";
  box.style.width = defaultWidth + "px";
  box.style.height = defaultHeight + "px"; // Add label
  const labelElement = document.createElement("div");
  labelElement.className = "box-label";
  labelElement.textContent = label;
  box.appendChild(labelElement);

  // Add resize handles
  const handles = ["tl", "tr", "bl", "br"];
  handles.forEach((handlePos) => {
    const handle = document.createElement("div");
    handle.className = `resize-handle ${handlePos}`;
    box.appendChild(handle);

    // Add resize functionality to each handle
    handle.addEventListener("mousedown", (e) => {
      e.stopPropagation(); // Prevent box move
      startResize(e, box, handlePos);
    });
  });

  // Add move functionality
  box.addEventListener("mousedown", (e) => {
    // Don't move if clicking on a handle
    if (e.target.classList.contains("resize-handle")) return;
    startMove(e, box);
  });

  // Add to the overlay
  regionSelectionOverlay.appendChild(box);

  // Create box object with methods
  const boxObj = {
    element: box,
    type: regionType,
    getCoordinates: async () => {
      // Get the overlay's dimensions
      const overlay = document.getElementById("region-selection-overlay");
      const overlayRect = overlay.getBoundingClientRect();

      // Get the box position relative to overlay
      const boxLeft = parseInt(box.style.left);
      const boxTop = parseInt(box.style.top);
      const boxWidth = parseInt(box.style.width);
      const boxHeight = parseInt(box.style.height);

      // Get the actual display dimensions from main process
      const displayInfo = await ipcRenderer.invoke("get-display-info");

      console.log("[DEBUG] Display info from main:", displayInfo);

      // Calculate scaling factors - use the full display dimensions
      const scaleX = displayInfo.width / overlayRect.width;
      const scaleY = displayInfo.height / overlayRect.height; // Scale the coordinates
      const scaledX = Math.round(boxLeft * scaleX);
      const scaledY = Math.round(boxTop * scaleY);
      const scaledWidth = Math.round(boxWidth * scaleX);
      const scaledHeight = Math.round(boxHeight * scaleY);

      console.log(
        `[DEBUG] Box UI coordinates: left=${boxLeft}, top=${boxTop}, width=${boxWidth}, height=${boxHeight}`
      );
      console.log(
        `[DEBUG] Overlay dimensions: width=${overlayRect.width}, height=${overlayRect.height}`
      );
      console.log(
        `[DEBUG] Display dimensions: width=${displayInfo.width}, height=${displayInfo.height}`
      );
      console.log(
        `[DEBUG] Scaling factors: X=${scaleX.toFixed(2)}, Y=${scaleY.toFixed(
          2
        )}`
      );
      console.log(
        `[DEBUG] Scaled coordinates: X=${scaledX}, Y=${scaledY}, width=${scaledWidth}, height=${scaledHeight}`
      );

      return {
        x: scaledX,
        y: scaledY,
        width: scaledWidth,
        height: scaledHeight,
        // Include original UI coordinates and scaling for debugging
        uiX: boxLeft,
        uiY: boxTop,
        uiWidth: boxWidth,
        uiHeight: boxHeight,
        scaleX: scaleX,
        scaleY: scaleY,
      };
    },
  };

  // Add to the array
  resizableBoxes.push(boxObj);

  // Make this box active
  setActiveBox(box);

  return boxObj;
}

// Set a box as the active one (visual indicator)
function setActiveBox(activeBox) {
  // Remove active class from all boxes
  document.querySelectorAll(".resizable-box").forEach((box) => {
    box.classList.remove("active");
  });

  // Add active class to the clicked box
  activeBox.classList.add("active");
}

// Start moving a box
function startMove(e, box) {
  e.preventDefault();
  setActiveBox(box);

  // Starting positions
  const startX = e.clientX;
  const startY = e.clientY;
  const boxLeft = parseInt(box.style.left) || 0;
  const boxTop = parseInt(box.style.top) || 0;

  // Mouse move handler for dragging
  function moveHandler(e) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    box.style.left = boxLeft + dx + "px";
    box.style.top = boxTop + dy + "px";
  }

  // Mouse up handler to stop dragging
  function upHandler() {
    document.removeEventListener("mousemove", moveHandler);
    document.removeEventListener("mouseup", upHandler);
  }

  // Add listeners
  document.addEventListener("mousemove", moveHandler);
  document.addEventListener("mouseup", upHandler);
}

// Start resizing a box
function startResize(e, box, handlePos) {
  e.preventDefault();
  setActiveBox(box);

  // Starting positions
  const startX = e.clientX;
  const startY = e.clientY;
  const boxLeft = parseInt(box.style.left) || 0;
  const boxTop = parseInt(box.style.top) || 0;
  const boxWidth = parseInt(box.style.width) || 200;
  const boxHeight = parseInt(box.style.height) || 100;

  // Get the box type (World Line region can be smaller)
  const isWorldLineRegion = box
    .querySelector(".box-label")
    ?.textContent.includes("World Line");
  // Allow World Line box to be MUCH smaller - even 1x1 pixels
  const minWidth = isWorldLineRegion ? 1 : 50;
  const minHeight = isWorldLineRegion ? 1 : 40;

  // Mouse move handler for resizing
  function moveHandler(e) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // Resize based on which handle was dragged
    if (handlePos.includes("t")) {
      // Top handles
      box.style.top = boxTop + dy + "px";
      box.style.height = Math.max(minHeight, boxHeight - dy) + "px";
    }
    if (handlePos.includes("b")) {
      // Bottom handles
      box.style.height = Math.max(minHeight, boxHeight + dy) + "px";
    }
    if (handlePos.includes("l")) {
      // Left handles
      box.style.left = boxLeft + dx + "px";
      box.style.width = Math.max(minWidth, boxWidth - dx) + "px";
    }
    if (handlePos.includes("r")) {
      // Right handles
      box.style.width = Math.max(minWidth, boxWidth + dx) + "px";
    }
  }

  // Mouse up handler to stop resizing
  function upHandler() {
    document.removeEventListener("mousemove", moveHandler);
    document.removeEventListener("mouseup", upHandler);
  }

  // Add listeners
  document.addEventListener("mousemove", moveHandler);
  document.addEventListener("mouseup", upHandler);
}
