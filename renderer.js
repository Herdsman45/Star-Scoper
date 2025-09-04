const { ipcRenderer } = require("electron");

// DOM elements
const rawTextElement = document.getElementById("raw-text");
const processedTextElement = document.getElementById("processed-text");
const copyRawBtn = document.getElementById("copy-raw");
const copyProcessedBtn = document.getElementById("copy-processed");
const sendDiscordBtn = document.getElementById("send-discord");
const setSlot1Btn = document.getElementById("set-slot1");
const setSlot2Btn = document.getElementById("set-slot2");
const captureSlot1Btn = document.getElementById("capture-slot1");
const captureSlot2Btn = document.getElementById("capture-slot2");
const statusSlot1 = document.getElementById("status-slot1");
const statusSlot2 = document.getElementById("status-slot2");
const tesseractPathInput = document.getElementById("tesseract-path");
const triggerKeyInput = document.getElementById("trigger-key");
const hotkeySlot1Input = document.getElementById("hotkey-slot1");
const hotkeySlot2Input = document.getElementById("hotkey-slot2");
const autoDiscordCheckbox = document.getElementById("auto-discord");
const saveSettingsBtn = document.getElementById("save-settings");
const browseBtn = document.getElementById("browse-tesseract");
const regionSelectionOverlay = document.getElementById(
  "region-selection-overlay"
);
const selectionSlotNumber = document.getElementById("selection-slot-number");
const cancelSelectionBtn = document.getElementById("cancel-selection");

// Current state
let currentSlot = null;
let currentRegions = { regionA: null, regionB: null };
let selectionStep = 0; // 0: not selecting, 1: selecting regionA, 2: selecting regionB

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
sendDiscordBtn.addEventListener("click", sendToDiscord);
saveSettingsBtn.addEventListener("click", saveSettings);
browseBtn.addEventListener("click", browseTesseract);
cancelSelectionBtn.addEventListener("click", cancelRegionSelection);

// Load settings on startup
document.addEventListener("DOMContentLoaded", loadSettings);

// Set regions for a slot
async function setRegions(slotNumber) {
  currentSlot = slotNumber;
  selectionSlotNumber.textContent = slotNumber;

  // Show overlay with instructions
  regionSelectionOverlay.classList.remove("hidden");

  // Start region selection
  const result = await ipcRenderer.invoke("set-regions", slotNumber);

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
  // Show toast notification
  showToast("Copied to clipboard!");
}

// Send to Discord
async function sendToDiscord() {
  await ipcRenderer.invoke("send-to-discord");
  showToast("Sent to Discord!");
}

// Save settings
async function saveSettings() {
  const settings = {
    hotkey1: hotkeySlot1Input.value,
    hotkey2: hotkeySlot2Input.value,
    tesseractPath: tesseractPathInput.value,
    autoActivateDiscord: autoDiscordCheckbox.checked,
    triggerKey: triggerKeyInput.value,
  };

  await ipcRenderer.invoke("save-settings", settings);
  showToast("Settings saved!");
}

// Load settings
async function loadSettings() {
  const settings = await ipcRenderer.invoke("get-settings");

  hotkeySlot1Input.value = settings.hotkey1;
  hotkeySlot2Input.value = settings.hotkey2;
  tesseractPathInput.value = settings.tesseractPath;
  autoDiscordCheckbox.checked = settings.autoActivateDiscord;
  triggerKeyInput.value = settings.triggerKey;
}

// Browse for Tesseract path
async function browseTesseract() {
  const result = await ipcRenderer.invoke("browse-tesseract");
  if (result.path) {
    tesseractPathInput.value = result.path;
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
  regionSelectionOverlay.classList.add("hidden");
  ipcRenderer.send("cancel-region-selection");
}

// IPC events
ipcRenderer.on("ocr-result", (event, data) => {
  rawTextElement.textContent = data.raw;
  processedTextElement.textContent = data.processed;
  updateStatus(data.slot, "OCR completed!", "success");
});

ipcRenderer.on("status-update", (event, message) => {
  showToast(message);
});

// Region selection handling
ipcRenderer.on("start-region-selection", (event, slotNumber) => {
  currentSlot = slotNumber;
  selectionStep = 1; // Start with regionA
  document.addEventListener("mousedown", handleMouseDown);
  document.addEventListener("mouseup", handleMouseUp);
});

// Mouse events for region selection
let selectionStart = { x: 0, y: 0 };
let selectionActive = false;
let selectionBox = null;

function handleMouseDown(e) {
  if (selectionStep === 0) return;

  selectionStart = { x: e.clientX, y: e.clientY };
  selectionActive = true;

  // Create selection box
  selectionBox = document.createElement("div");
  selectionBox.className = "selection-box";
  document.body.appendChild(selectionBox);

  // Update selection box on mouse move
  document.addEventListener("mousemove", handleMouseMove);
}

function handleMouseMove(e) {
  if (!selectionActive || !selectionBox) return;

  const x = Math.min(e.clientX, selectionStart.x);
  const y = Math.min(e.clientY, selectionStart.y);
  const width = Math.abs(e.clientX - selectionStart.x);
  const height = Math.abs(e.clientY - selectionStart.y);

  selectionBox.style.left = x + "px";
  selectionBox.style.top = y + "px";
  selectionBox.style.width = width + "px";
  selectionBox.style.height = height + "px";
}

function handleMouseUp(e) {
  if (!selectionActive) return;

  document.removeEventListener("mousemove", handleMouseMove);
  selectionActive = false;

  // Get selection coordinates
  const x = Math.min(e.clientX, selectionStart.x);
  const y = Math.min(e.clientY, selectionStart.y);
  const width = Math.abs(e.clientX - selectionStart.x);
  const height = Math.abs(e.clientY - selectionStart.y);

  // Clean up selection box
  if (selectionBox) {
    document.body.removeChild(selectionBox);
    selectionBox = null;
  }

  // Store selected region
  if (selectionStep === 1) {
    currentRegions.regionA = { x, y, width, height };
    showToast("Main dialog region selected! Now select the world line region.");
    selectionStep = 2;
  } else if (selectionStep === 2) {
    currentRegions.regionB = { x, y, width, height };

    // Send regions back to main process
    ipcRenderer.send("regions-selected", {
      regionA: currentRegions.regionA,
      regionB: currentRegions.regionB,
    });

    // Reset selection state
    selectionStep = 0;
    document.removeEventListener("mousedown", handleMouseDown);
    document.removeEventListener("mouseup", handleMouseUp);
    regionSelectionOverlay.classList.add("hidden");

    showToast("Both regions selected and saved!");
  }
}
