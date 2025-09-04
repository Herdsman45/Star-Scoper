const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  clipboard,
} = require("electron");
const path = require("path");
const fs = require("fs");
const { createWorker } = require("tesseract.js");
const Store = require("electron-store");

// Storage for saved regions and settings
const store = new Store();

// Global state
let mainWindow;
let ocrWorker;
let isCapturing = false;

// Initialize app
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Load the UI
  mainWindow.loadFile("index.html");

  // Initialize OCR engine
  try {
    ocrWorker = await createWorker("eng");
    console.log("OCR worker initialized");
  } catch (error) {
    console.error("OCR initialization failed:", error);
  }

  // Register global capture hotkeys
  const hotkey1 = store.get("hotkey1", "F13");
  const hotkey2 = store.get("hotkey2", "F14");

  globalShortcut.register(hotkey1, () => {
    if (!isCapturing) captureAndProcess(1);
  });

  globalShortcut.register(hotkey2, () => {
    if (!isCapturing) captureAndProcess(2);
  });
}

// Capture regions and process for a specific slot
async function captureAndProcess(slotNumber) {
  try {
    isCapturing = true;

    // Load saved regions for this slot
    const regionsKey = `slot${slotNumber}_regions`;
    const regions = store.get(regionsKey);

    if (!regions || !regions.regionA || !regions.regionB) {
      mainWindow.webContents.send(
        "status-update",
        `Slot ${slotNumber} regions not set. Please set regions first.`
      );
      isCapturing = false;
      return;
    }

    // Show visual feedback
    mainWindow.webContents.send(
      "status-update",
      `Capturing slot ${slotNumber}...`
    );

    // TODO: Implement screen capture with robotjs

    // Placeholder for actual capture implementation
    // In the actual implementation, you would:
    // 1. Capture the screen
    // 2. Crop regions
    // 3. Process with OCR
    // 4. Process text
    // 5. Return results

    // Simulate OCR result for now
    setTimeout(() => {
      const simulatedText = `This is simulated OCR text for slot ${slotNumber}\nRegion A text would be here\nRegion B text would be here`;
      const processedText = processText(simulatedText);

      // Set to clipboard
      clipboard.writeText(processedText);

      // Send back to renderer
      mainWindow.webContents.send("ocr-result", {
        raw: simulatedText,
        processed: processedText,
        slot: slotNumber,
      });

      isCapturing = false;
    }, 1000);
  } catch (error) {
    console.error("Capture error:", error);
    mainWindow.webContents.send("status-update", `Error: ${error.message}`);
    isCapturing = false;
  }
}

// Set regions for a slot
ipcMain.handle("set-regions", async (event, slotNumber) => {
  const regionsKey = `slot${slotNumber}_regions`;

  // Tell renderer we're in region selection mode
  mainWindow.webContents.send("start-region-selection", slotNumber);

  // Minimize our window to make selection easier
  mainWindow.minimize();

  // Wait for regions from renderer
  return new Promise((resolve) => {
    ipcMain.once("regions-selected", (event, data) => {
      if (data && data.regionA && data.regionB) {
        // Save regions
        store.set(regionsKey, data);
        resolve({
          success: true,
          message: `Regions for slot ${slotNumber} saved successfully!`,
        });
      } else {
        resolve({
          success: false,
          message: "Region selection cancelled or invalid",
        });
      }
    });
  });
});

// Capture slot
ipcMain.handle("capture-slot", async (event, slotNumber) => {
  if (!isCapturing) {
    captureAndProcess(slotNumber);
    return { success: true };
  } else {
    return { success: false, message: "Capture already in progress" };
  }
});

// Save settings
ipcMain.handle("save-settings", async (event, settings) => {
  for (const [key, value] of Object.entries(settings)) {
    store.set(key, value);
  }

  // Re-register hotkeys if they changed
  if (settings.hotkey1 || settings.hotkey2) {
    globalShortcut.unregisterAll();

    const hotkey1 = settings.hotkey1 || store.get("hotkey1", "F13");
    const hotkey2 = settings.hotkey2 || store.get("hotkey2", "F14");

    globalShortcut.register(hotkey1, () => {
      if (!isCapturing) captureAndProcess(1);
    });

    globalShortcut.register(hotkey2, () => {
      if (!isCapturing) captureAndProcess(2);
    });
  }

  return { success: true };
});

// Get settings
ipcMain.handle("get-settings", async (event) => {
  return {
    hotkey1: store.get("hotkey1", "F13"),
    hotkey2: store.get("hotkey2", "F14"),
    tesseractPath: store.get("tesseractPath", ""),
    autoActivateDiscord: store.get("autoActivateDiscord", true),
    triggerKey: store.get("triggerKey", "w"),
  };
});

// Browse for Tesseract path
ipcMain.handle("browse-tesseract", async (event) => {
  const { dialog } = require("electron");
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Executables", extensions: ["exe"] }],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return { path: result.filePaths[0] };
  } else {
    return { path: null };
  }
});

// Send to Discord
ipcMain.handle("send-to-discord", async (event) => {
  // TODO: Implement Discord activation and pasting
  // For now, just return success
  return { success: true };
});

// Text processing function (placeholder for your actual processor)
function processText(text) {
  // This would be your existing JS text processor code
  // For now, just a simple example:
  return text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\x20-\x7E]/g, ""); // Remove non-printable chars
}

// App lifecycle
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
