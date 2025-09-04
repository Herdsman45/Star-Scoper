const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  clipboard,
  desktopCapturer,
} = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { createWorker } = require("tesseract.js");
const Store = require("electron-store");
const { processText } = require("./lib/processing");
const sharp = require("sharp");

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
      contextIsolation: false, // Keep this false since we've already built with direct IPC access
    },
  });

  // Load the UI
  mainWindow.loadFile("index.html");

  // Initialize OCR engine
  try {
    // Proper initialization for Tesseract.js v4.0.0
    ocrWorker = await createWorker({
      logger: (progress) => {
        if (progress.status === "recognizing text" && progress.progress === 1) {
          console.log("OCR recognition complete");
        }
      },
    });
    // Need to load language explicitly for v4.0.0
    await ocrWorker.loadLanguage("eng");
    await ocrWorker.initialize("eng");
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

    console.log(
      `[DEBUG] Capture slot ${slotNumber}, regions:`,
      JSON.stringify(regions)
    );

    if (!regions || !regions.regionA || !regions.regionB) {
      console.log(`[DEBUG] Missing regions for slot ${slotNumber}`);
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

    // Since we have issues with screen capture APIs, let's use the same approach
    // as we did for region selection
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1920, height: 1080 },
    });

    if (sources.length === 0) {
      throw new Error("No screens available for capture");
    }

    // Get the primary display (first source)
    const source = sources[0];

    // Get the image data
    const nativeImage = source.thumbnail;
    const imgBuffer = nativeImage.toPNG();
    const image = sharp(imgBuffer);

    // Get image dimensions
    const metadata = await image.metadata();
    const imgWidth = metadata.width;
    const imgHeight = metadata.height;

    // Validate regions
    const validateRegion = (region) => {
      // Normalize negative coordinates
      const normalizedRegion = {
        x: Math.abs(region.x),
        y: Math.abs(region.y),
        width: region.width,
        height: region.height,
      };

      console.log(`[DEBUG] Validating region:`, JSON.stringify(region));
      console.log(
        `[DEBUG] Normalized region:`,
        JSON.stringify(normalizedRegion)
      );

      return (
        normalizedRegion.width > 0 &&
        normalizedRegion.height > 0 &&
        normalizedRegion.x + normalizedRegion.width <= imgWidth &&
        normalizedRegion.y + normalizedRegion.height <= imgHeight
      );
    };

    if (!validateRegion(regions.regionA) || !validateRegion(regions.regionB)) {
      console.log(
        `[DEBUG] Region validation failed. Screen size: ${imgWidth}x${imgHeight}`
      );
      mainWindow.webContents.send(
        "status-update",
        `Invalid regions for slot ${slotNumber}. Please reset regions.`
      );
      isCapturing = false;
      return;
    }

    // Declare variables outside the try block to make them accessible throughout the function
    let ocrA, ocrB, rawText, processedText;

    try {
      // Normalize coordinates for regionA
      const normalizedA = {
        left: Math.floor(Math.abs(regions.regionA.x)),
        top: Math.floor(Math.abs(regions.regionA.y)),
        width: Math.floor(regions.regionA.width),
        height: Math.floor(regions.regionA.height),
      };
      console.log(
        `[DEBUG] Extracting regionA with coords:`,
        JSON.stringify(normalizedA)
      );

      // Crop and OCR regionA
      const croppedA = await image
        .clone()
        .extract(normalizedA)
        .png()
        .toBuffer();

      // Save debug image for regionA
      if (process.env.DEBUG) {
        const debugDir = path.join(os.tmpdir(), "ocr-debug");
        if (!fs.existsSync(debugDir)) {
          fs.mkdirSync(debugDir, { recursive: true });
        }
        const debugPathA = path.join(debugDir, `region_A_${Date.now()}.png`);
        fs.writeFileSync(debugPathA, croppedA);
        console.log(`[DEBUG] Saved regionA image to ${debugPathA}`);
      }

      console.log("[DEBUG] About to recognize regionA with Tesseract");
      ocrA = await ocrWorker.recognize(croppedA);
      console.log("[DEBUG] RegionA recognized successfully");

      // Normalize coordinates for regionB
      const normalizedB = {
        left: Math.floor(Math.abs(regions.regionB.x)),
        top: Math.floor(Math.abs(regions.regionB.y)),
        width: Math.floor(regions.regionB.width),
        height: Math.floor(regions.regionB.height),
      };
      console.log(
        `[DEBUG] Extracting regionB with coords:`,
        JSON.stringify(normalizedB)
      );

      // Crop and OCR regionB
      const croppedB = await image
        .clone()
        .extract(normalizedB)
        .png()
        .toBuffer();

      // Save debug image for regionB
      if (process.env.DEBUG) {
        const debugDir = path.join(os.tmpdir(), "ocr-debug");
        if (!fs.existsSync(debugDir)) {
          fs.mkdirSync(debugDir, { recursive: true });
        }
        const debugPathB = path.join(debugDir, `region_B_${Date.now()}.png`);
        fs.writeFileSync(debugPathB, croppedB);
        console.log(`[DEBUG] Saved regionB image to ${debugPathB}`);

        // Also save the full screenshot for reference
        const fullScreenPath = path.join(
          debugDir,
          `full_screen_${Date.now()}.png`
        );
        fs.writeFileSync(fullScreenPath, imgBuffer);
        console.log(`[DEBUG] Saved full screenshot to ${fullScreenPath}`);
      }

      console.log("[DEBUG] About to recognize regionB with Tesseract");
      ocrB = await ocrWorker.recognize(croppedB);
      console.log("[DEBUG] RegionB recognized successfully");

      // Combine raw text - access properties correctly for Tesseract.js v4
      rawText = `Region A:\n${ocrA.data.text}\n\nRegion B:\n${ocrB.data.text}`;
      console.log("[DEBUG] Raw OCR text:", rawText);

      // Process text
      processedText = processText(rawText);
    } catch (error) {
      console.error("[DEBUG] Error during image processing or OCR:", error);
      throw error;
    }

    // Set to clipboard
    clipboard.writeText(processedText);

    // Send back to renderer
    mainWindow.webContents.send("ocr-result", {
      raw: rawText,
      processed: processedText,
      slot: slotNumber,
    });

    isCapturing = false;
  } catch (error) {
    console.error("Capture error:", error);
    mainWindow.webContents.send("status-update", `Error: ${error.message}`);
    isCapturing = false;
  }
}

// Set regions for a slot
ipcMain.handle("set-regions", async (event, slotNumber) => {
  const regionsKey = `slot${slotNumber}_regions`;
  console.log(`[DEBUG] Starting region selection for slot ${slotNumber}`);

  // Use Electron's desktopCapturer to get all screen sources
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width: 1920, height: 1080 },
  });

  // Get the primary display (usually the first one)
  const primarySource = sources[0];

  // Generate a data URL from the thumbnail
  const screenshotDataUrl = primarySource.thumbnail.toDataURL();

  // Make window full screen
  mainWindow.setFullScreen(true);

  // Tell renderer to start region selection with the screenshot
  mainWindow.webContents.send(
    "start-region-selection",
    slotNumber,
    screenshotDataUrl
  );

  // Wait for regions from renderer
  return new Promise((resolve) => {
    const onSelected = async (event, data) => {
      ipcMain.removeListener("regions-selected", onSelected);
      ipcMain.removeListener("cancel-region-selection", onCancel);
      mainWindow.setFullScreen(false);
      if (data && data.regionA && data.regionB) {
        // Save regions
        console.log(
          `[DEBUG] Saving regions for slot ${slotNumber}:`,
          JSON.stringify(data)
        );
        store.set(regionsKey, data);
        console.log(
          `[DEBUG] Regions after save:`,
          JSON.stringify(store.get(regionsKey))
        );
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
    };

    const onCancel = async () => {
      ipcMain.removeListener("regions-selected", onSelected);
      ipcMain.removeListener("cancel-region-selection", onCancel);
      mainWindow.setFullScreen(false);
      resolve({
        success: false,
        message: "Region selection cancelled",
      });
    };

    ipcMain.once("regions-selected", onSelected);
    ipcMain.once("cancel-region-selection", onCancel);
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
