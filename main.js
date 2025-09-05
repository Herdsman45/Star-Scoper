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
    autoHideMenuBar: true, // Hides the menu bar but allows showing with Alt key
    icon: path.join(__dirname, "build/icon.ico"), // Explicitly set the icon
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false, // Keep this false since we've already built with direct IPC access
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Hide the menu bar by default
  mainWindow.setMenuBarVisibility(false);

  // Set CSP headers
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;",
          ],
        },
      });
    }
  );

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

  // Register global capture hotkeys with platform-specific defaults
  registerHotkeys();
}

// Function to register hotkeys
function registerHotkeys() {
  // Unregister any existing shortcuts first
  globalShortcut.unregisterAll();

  const isMac = process.platform === "darwin";
  const defaultHotkey1 = isMac ? "Command+F1" : "Alt+Shift+1";
  const defaultHotkey2 = isMac ? "Command+F2" : "Alt+Shift+2";

  // Get saved hotkeys from store
  let hotkey1 = store.get("hotkey1", defaultHotkey1);
  let hotkey2 = store.get("hotkey2", defaultHotkey2);

  // Clean up any placeholder/UI text values that might have been saved
  const invalidValues = [
    "Click to set",
    "Recording...",
    "Error - Click to retry",
  ];
  if (invalidValues.includes(hotkey1)) hotkey1 = defaultHotkey1;
  if (invalidValues.includes(hotkey2)) hotkey2 = defaultHotkey2;

  try {
    // Helper function to check if a shortcut is valid
    const isValidShortcut = (shortcut) => {
      // Check if the shortcut is a non-empty string and not a placeholder
      return (
        typeof shortcut === "string" &&
        shortcut.trim() !== "" &&
        !["Click to set", "Recording...", "Error - Click to retry"].includes(
          shortcut
        )
      );
    };

    // Register for slot 1
    if (isValidShortcut(hotkey1)) {
      console.log("Attempting to register hotkey for Slot 1:", hotkey1);
      globalShortcut.register(hotkey1, () => {
        if (!isCapturing) captureAndProcess(1);
      });
      console.log("Registered hotkey for Slot 1:", hotkey1);
    } else {
      console.log("Skipping invalid hotkey1:", hotkey1);
    }

    // Register for slot 2
    if (isValidShortcut(hotkey2)) {
      console.log("Attempting to register hotkey for Slot 2:", hotkey2);
      globalShortcut.register(hotkey2, () => {
        if (!isCapturing) captureAndProcess(2);
      });
      console.log("Registered hotkey for Slot 2:", hotkey2);
    } else {
      console.log("Skipping invalid hotkey2:", hotkey2);
    }
  } catch (error) {
    console.error("Failed to register hotkeys:", error);
    // Try fallback hotkeys
    try {
      const fallbackKey1 = isMac ? "Alt+1" : "Alt+1";
      const fallbackKey2 = isMac ? "Alt+2" : "Alt+2";

      if (!hotkey1 || !globalShortcut.isRegistered(hotkey1)) {
        globalShortcut.register(fallbackKey1, () => {
          if (!isCapturing) captureAndProcess(1);
        });
        console.log("Using fallback hotkey for Slot 1:", fallbackKey1);
      }

      if (!hotkey2 || !globalShortcut.isRegistered(hotkey2)) {
        globalShortcut.register(fallbackKey2, () => {
          if (!isCapturing) captureAndProcess(2);
        });
        console.log("Using fallback hotkey for Slot 2:", fallbackKey2);
      }
    } catch (e) {
      console.error("Failed to register fallback hotkeys:", e);
    }
  }
}

// Capture regions and process for a specific slot
async function captureAndProcess(slotNumber) {
  try {
    isCapturing = true;

    // Check if debug mode is enabled
    const debugMode = store.get("debugMode", false);

    // Create debug directory if debug mode is enabled
    let debugDir = null;
    if (debugMode) {
      debugDir = path.join(os.tmpdir(), "ocr-debug");
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }
    }

    // Define scale factor for both regions
    const scaleFactor = 3; // Use a moderate scale factor

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

    // Get the current display where the app window is
    const { screen } = require("electron");
    const currentDisplay = screen.getDisplayNearestPoint({
      x: mainWindow.getBounds().x,
      y: mainWindow.getBounds().y,
    });

    console.log(
      `[DEBUG] Capturing on display: ${currentDisplay.id}, ${currentDisplay.size.width}x${currentDisplay.size.height}`
    );

    // Use Electron's desktopCapturer to get all screen sources
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1920, height: 1080 },
    });

    if (sources.length === 0) {
      throw new Error("No screens available for capture");
    }

    // Try to find the source that matches our current display
    let source = sources[0]; // Default to first source

    if (sources.length > 1) {
      // Try to match by display_id if available
      if (currentDisplay.id) {
        const matchedSource = sources.find(
          (s) =>
            s.display_id === currentDisplay.id.toString() ||
            s.id.includes(currentDisplay.id.toString())
        );

        if (matchedSource) {
          source = matchedSource;
          console.log(
            `[DEBUG] Found matching display source for capture: ${source.name}`
          );
        }
      }
    }

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

      // Crop and OCR regionA with 3x scaling for better results
      // Apply the same scale factor defined earlier

      // Crop and resize regionA
      const croppedA = await image
        .clone()
        .extract(normalizedA)
        .resize({
          width: normalizedA.width * scaleFactor,
          height: normalizedA.height * scaleFactor,
          fit: "fill",
        })
        .png()
        .toBuffer();

      console.log(`[DEBUG] Resized regionA (${scaleFactor}x) for better OCR`);

      // Save debug image for regionA if debug mode is enabled
      if (debugMode && debugDir) {
        const debugPathA = path.join(debugDir, `region_A_${Date.now()}.png`);
        fs.writeFileSync(debugPathA, croppedA);
        console.log(`[DEBUG] Saved regionA image to ${debugPathA}`);

        // Save a debug image showing the entire screen with an outline of where we're cropping
        const debugFullPath = path.join(
          debugDir,
          `full_screen_${Date.now()}.png`
        );

        // Draw rectangle for debugging (drawing a border instead of a filled rectangle)
        try {
          const fullImage = sharp(imgBuffer);

          // Create a transparent image
          const debugOverlay = await sharp({
            create: {
              width: imgWidth,
              height: imgHeight,
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
          })
            .png()
            .toBuffer();

          // Draw border by creating 4 thin rectangles (top, right, bottom, left)
          const border = 5; // Border thickness in pixels

          // Create top border
          let debugOverlayWithBorder = await sharp(debugOverlay)
            .composite([
              {
                input: Buffer.from([255, 0, 0, 255]), // Solid red
                raw: {
                  width: 1,
                  height: 1,
                  channels: 4,
                },
                tile: true,
                top: normalizedA.top,
                left: normalizedA.left,
                width: normalizedA.width,
                height: border,
              },
            ])
            .png()
            .toBuffer();

          // Create bottom border
          debugOverlayWithBorder = await sharp(debugOverlayWithBorder)
            .composite([
              {
                input: Buffer.from([255, 0, 0, 255]), // Solid red
                raw: {
                  width: 1,
                  height: 1,
                  channels: 4,
                },
                tile: true,
                top: normalizedA.top + normalizedA.height - border,
                left: normalizedA.left,
                width: normalizedA.width,
                height: border,
              },
            ])
            .png()
            .toBuffer();

          // Create left border
          debugOverlayWithBorder = await sharp(debugOverlayWithBorder)
            .composite([
              {
                input: Buffer.from([255, 0, 0, 255]), // Solid red
                raw: {
                  width: 1,
                  height: 1,
                  channels: 4,
                },
                tile: true,
                top: normalizedA.top,
                left: normalizedA.left,
                width: border,
                height: normalizedA.height,
              },
            ])
            .png()
            .toBuffer();

          // Create right border
          debugOverlayWithBorder = await sharp(debugOverlayWithBorder)
            .composite([
              {
                input: Buffer.from([255, 0, 0, 255]), // Solid red
                raw: {
                  width: 1,
                  height: 1,
                  channels: 4,
                },
                tile: true,
                top: normalizedA.top,
                left: normalizedA.left + normalizedA.width - border,
                width: border,
                height: normalizedA.height,
              },
            ])
            .png()
            .toBuffer();

          await fullImage
            .composite([
              {
                input: debugOverlayWithBorder,
                blend: "over",
              },
            ])
            .toFile(debugFullPath);

          console.log(
            `[DEBUG] Saved full screen debug image to ${debugFullPath}`
          );
        } catch (err) {
          console.error("[DEBUG] Error saving debug overlay:", err);
        }
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
      // For the World Line region, apply simple resizing
      let croppedB;

      // Simple resize for region B (World Line)
      // Using the scale factor defined earlier

      try {
        // Extract and resize with simple processing
        croppedB = await image
          .clone()
          .extract(normalizedB)
          .resize({
            width: normalizedB.width * scaleFactor,
            height: normalizedB.height * scaleFactor,
            fit: "fill",
          })
          .png()
          .toBuffer();

        console.log(`[DEBUG] Resized regionB (${scaleFactor}x) for better OCR`);

        // Save the original cropped version too for comparison if debug mode is enabled
        if (debugMode && debugDir) {
          const originalCropped = await image
            .clone()
            .extract(normalizedB)
            .png()
            .toBuffer();

          fs.writeFileSync(
            path.join(debugDir, `region_B_original_${Date.now()}.png`),
            originalCropped
          );
        }
      } catch (err) {
        // Fallback in case of error with advanced processing
        console.error("[DEBUG] Error in advanced image processing:", err);
        croppedB = await image.clone().extract(normalizedB).png().toBuffer();
      }

      // Save debug image for regionB if debug mode is enabled
      if (debugMode && debugDir) {
        const debugPathB = path.join(debugDir, `region_B_${Date.now()}.png`);
        fs.writeFileSync(debugPathB, croppedB);
        console.log(`[DEBUG] Saved regionB image to ${debugPathB}`);

        // Create another debug image showing both regions
        const debugFullPathB = path.join(
          debugDir,
          `full_screen_with_regions_${Date.now()}.png`
        );

        // Draw borders for both regions
        try {
          const fullImageForBoth = sharp(imgBuffer);
          const border = 5; // Border thickness in pixels

          // Create a transparent image
          let bothRegionsOverlay = await sharp({
            create: {
              width: imgWidth,
              height: imgHeight,
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
          })
            .png()
            .toBuffer();

          // Add regionA borders (red)
          // Top border
          bothRegionsOverlay = await sharp(bothRegionsOverlay)
            .composite([
              {
                input: Buffer.from([255, 0, 0, 255]), // Solid red
                raw: { width: 1, height: 1, channels: 4 },
                tile: true,
                top: normalizedA.top,
                left: normalizedA.left,
                width: normalizedA.width,
                height: border,
              },
            ])
            .png()
            .toBuffer();

          // Bottom border
          bothRegionsOverlay = await sharp(bothRegionsOverlay)
            .composite([
              {
                input: Buffer.from([255, 0, 0, 255]), // Solid red
                raw: { width: 1, height: 1, channels: 4 },
                tile: true,
                top: normalizedA.top + normalizedA.height - border,
                left: normalizedA.left,
                width: normalizedA.width,
                height: border,
              },
            ])
            .png()
            .toBuffer();

          // Left border
          bothRegionsOverlay = await sharp(bothRegionsOverlay)
            .composite([
              {
                input: Buffer.from([255, 0, 0, 255]), // Solid red
                raw: { width: 1, height: 1, channels: 4 },
                tile: true,
                top: normalizedA.top,
                left: normalizedA.left,
                width: border,
                height: normalizedA.height,
              },
            ])
            .png()
            .toBuffer();

          // Right border
          bothRegionsOverlay = await sharp(bothRegionsOverlay)
            .composite([
              {
                input: Buffer.from([255, 0, 0, 255]), // Solid red
                raw: { width: 1, height: 1, channels: 4 },
                tile: true,
                top: normalizedA.top,
                left: normalizedA.left + normalizedA.width - border,
                width: border,
                height: normalizedA.height,
              },
            ])
            .png()
            .toBuffer();

          // Add regionB borders (bright green for better visibility)
          // Top border
          bothRegionsOverlay = await sharp(bothRegionsOverlay)
            .composite([
              {
                input: Buffer.from([0, 255, 0, 255]), // Bright green
                raw: { width: 1, height: 1, channels: 4 },
                tile: true,
                top: normalizedB.top,
                left: normalizedB.left,
                width: normalizedB.width,
                height: border,
              },
            ])
            .png()
            .toBuffer();

          // Bottom border
          bothRegionsOverlay = await sharp(bothRegionsOverlay)
            .composite([
              {
                input: Buffer.from([0, 255, 0, 255]), // Bright green
                raw: { width: 1, height: 1, channels: 4 },
                tile: true,
                top: normalizedB.top + normalizedB.height - border,
                left: normalizedB.left,
                width: normalizedB.width,
                height: border,
              },
            ])
            .png()
            .toBuffer();

          // Left border
          bothRegionsOverlay = await sharp(bothRegionsOverlay)
            .composite([
              {
                input: Buffer.from([0, 255, 0, 255]), // Bright green
                raw: { width: 1, height: 1, channels: 4 },
                tile: true,
                top: normalizedB.top,
                left: normalizedB.left,
                width: border,
                height: normalizedB.height,
              },
            ])
            .png()
            .toBuffer();

          // Right border
          bothRegionsOverlay = await sharp(bothRegionsOverlay)
            .composite([
              {
                input: Buffer.from([0, 255, 0, 255]), // Bright green
                raw: { width: 1, height: 1, channels: 4 },
                tile: true,
                top: normalizedB.top,
                left: normalizedB.left + normalizedB.width - border,
                width: border,
                height: normalizedB.height,
              },
            ])
            .png()
            .toBuffer();

          // Compose final image
          await fullImageForBoth
            .composite([
              {
                input: bothRegionsOverlay,
                blend: "over",
              },
            ])
            .toFile(debugFullPathB);

          console.log(
            `[DEBUG] Saved full screen with both regions to ${debugFullPathB}`
          );
        } catch (err) {
          console.error(
            "[DEBUG] Error saving debug overlay with both regions:",
            err
          );
        }
      }

      // Save the full screenshot for reference if debug mode is enabled
      if (debugMode && debugDir) {
        const fullScreenPath = path.join(
          debugDir,
          `full_screen_original_${Date.now()}.png`
        );
        fs.writeFileSync(fullScreenPath, imgBuffer);
        console.log(`[DEBUG] Saved full screenshot to ${fullScreenPath}`);
      }

      console.log("[DEBUG] About to recognize regionB with Tesseract");

      // Use simple OCR parameters for World Line numbers
      try {
        // Just set a character whitelist for digits and symbols
        await ocrWorker.setParameters({
          tessedit_char_whitelist: "0123456789.%-",
        });

        ocrB = await ocrWorker.recognize(croppedB);
        console.log("[DEBUG] RegionB recognized successfully");
      } catch (error) {
        console.error("[DEBUG] Error with OCR for regionB:", error);
        // Try without parameters
        ocrB = await ocrWorker.recognize(croppedB);
        console.log("[DEBUG] RegionB recognized with default settings");
      }

      // Use simple character whitelist for world line text
      await ocrWorker.setParameters({
        tessedit_char_whitelist:
          "0123456789.%-ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", // Include letters for any text
      });

      ocrB = await ocrWorker.recognize(croppedB);
      console.log("[DEBUG] RegionB recognized successfully");

      // Reset whitelist for future OCR operations
      await ocrWorker.setParameters({
        tessedit_char_whitelist: "",
      });

      // Combine raw text - access properties correctly for Tesseract.js v4
      rawText = `Region A:\n${ocrA.data.text}\n\nRegion B:\n${ocrB.data.text}`;
      console.log("[DEBUG] Raw OCR text:", rawText);

      // Process text using the processing module
      const { processText, formatForDiscord } = require("./lib/processing");
      processedText = formatForDiscord(rawText);
    } catch (error) {
      console.error("[DEBUG] Error during image processing or OCR:", error);
      throw error;
    }

    // Set processed text to clipboard by default (user can choose raw if needed)
    clipboard.writeText(processedText);

    // Send back to renderer along with debug image location (if debug mode enabled)
    if (debugMode && debugDir) {
      mainWindow.webContents.send("ocr-result", {
        raw: rawText,
        processed: processedText,
        slot: slotNumber,
        debugDir: debugDir,
      });

      // Show notification about debug images
      mainWindow.webContents.send(
        "status-update",
        `Debug images saved to: ${debugDir}`
      );
    } else {
      mainWindow.webContents.send("ocr-result", {
        raw: rawText,
        processed: processedText,
        slot: slotNumber,
      });
    }

    isCapturing = false;
  } catch (error) {
    console.error("Capture error:", error);
    mainWindow.webContents.send("status-update", `Error: ${error.message}`);
    isCapturing = false;
  }
}

// Set regions for a slot
ipcMain.handle("set-regions", async (event, slotNumber, existingRegions) => {
  const regionsKey = `slot${slotNumber}_regions`;
  console.log(`[DEBUG] Starting region selection for slot ${slotNumber}`);
  console.log(`[DEBUG] Existing regions:`, existingRegions);

  // Get the current display where the app window is
  const { screen } = require("electron");
  const currentDisplay = screen.getDisplayNearestPoint({
    x: mainWindow.getBounds().x,
    y: mainWindow.getBounds().y,
  });

  console.log(
    `[DEBUG] App window is on display: ${currentDisplay.id}, ${currentDisplay.size.width}x${currentDisplay.size.height}`
  );

  // Store the display dimensions for later coordinate scaling
  store.set("captureDisplayInfo", {
    width: currentDisplay.size.width,
    height: currentDisplay.size.height,
    workAreaWidth: currentDisplay.workArea.width,
    workAreaHeight: currentDisplay.workArea.height,
    bounds: currentDisplay.bounds,
    workArea: currentDisplay.workArea,
  });

  // Use Electron's desktopCapturer to get all screen sources
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width: 1920, height: 1080 },
  });

  console.log(`[DEBUG] Found ${sources.length} screen sources`);

  // Try to find the source that matches our current display
  let targetSource = sources[0]; // Default to first source if we can't find a match

  if (sources.length > 1) {
    // Log all displays to help with debugging
    sources.forEach((source, index) => {
      console.log(
        `[DEBUG] Source ${index}: ${source.id}, ${source.name}, ${source.display_id}`
      );
    });

    // Try to match by display_id if available
    if (currentDisplay.id) {
      const matchedSource = sources.find(
        (s) =>
          s.display_id === currentDisplay.id.toString() ||
          s.id.includes(currentDisplay.id.toString())
      );

      if (matchedSource) {
        targetSource = matchedSource;
        console.log(
          `[DEBUG] Found matching display source: ${targetSource.name}`
        );
      }
    }
  }

  // Generate a data URL from the thumbnail
  const screenshotDataUrl = targetSource.thumbnail.toDataURL();

  // Platform-specific full screen handling
  if (process.platform === "darwin") {
    // On macOS, we use simpleFullscreen to avoid the green button animation
    mainWindow.setSimpleFullScreen(true);
  } else {
    // On Windows/Linux, use standard fullscreen
    mainWindow.setFullScreen(true);
  }

  // Tell renderer to start region selection with the screenshot and existing regions
  mainWindow.webContents.send(
    "start-region-selection",
    slotNumber,
    screenshotDataUrl,
    existingRegions
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

// Get regions for a slot
ipcMain.handle("get-regions", async (event, slotNumber) => {
  const regionsKey = `slot${slotNumber}_regions`;
  return store.get(regionsKey, null);
});

// Handle request for display information for coordinate scaling
ipcMain.handle("get-display-info", async (event) => {
  const displayInfo = store.get("captureDisplayInfo");
  if (!displayInfo) {
    // If we don't have stored display info, return the current display
    const { screen } = require("electron");
    const currentDisplay = screen.getDisplayNearestPoint({
      x: mainWindow.getBounds().x,
      y: mainWindow.getBounds().y,
    });

    return {
      width: currentDisplay.size.width,
      height: currentDisplay.size.height,
    };
  }
  return displayInfo;
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

// Get settings
ipcMain.handle("get-settings", async (event) => {
  return {
    hotkey1: store.get("hotkey1", "F13"),
    hotkey2: store.get("hotkey2", "F14"),
    debugMode: store.get("debugMode", false),
    darkTheme: store.get("darkTheme", false),
  };
});

// Set debug mode
ipcMain.handle("set-debug-mode", async (event, enabled) => {
  store.set("debugMode", enabled);
  return { success: true };
});

// This handler is no longer used as theme changes are now handled via save-settings
// ipcMain.handle("set-theme", async (event, isDark) => {
//   store.set("darkTheme", isDark);
//   return { success: true };
// });

// Save settings
ipcMain.handle("save-settings", async (event, settings) => {
  // Now we only save the theme setting as hotkeys are saved directly when set
  if (settings.darkTheme !== undefined) {
    // Check if the theme is actually different from what's stored
    const currentTheme = store.get("darkTheme", false);
    if (currentTheme !== settings.darkTheme) {
      store.set("darkTheme", settings.darkTheme);
      console.log("Saved dark theme preference:", settings.darkTheme);
    }
  }

  return { success: true };
});

// Handle opening debug folder
ipcMain.on("open-debug-folder", (event, folderPath) => {
  console.log(`[DEBUG] Opening debug folder: ${folderPath}`);

  // Use the operating system's file explorer to open the folder
  const { shell } = require("electron");
  shell.openPath(folderPath);
});

// Handle keyboard shortcut recording
ipcMain.handle("get-keyboard-shortcut", (event, slotNumber) => {
  return new Promise((resolve) => {
    let shortcutResult = null;

    // Create a small window for capturing key presses
    const keyRecordingWindow = new BrowserWindow({
      width: 400,
      height: 250,
      resizable: false,
      minimizable: false,
      maximizable: false,
      parent: mainWindow,
      modal: true,
      title: `Record Keyboard Shortcut for Slot ${slotNumber}`,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        preload: path.join(__dirname, "preload.js"),
        webSecurity: true,
      },
    });

    keyRecordingWindow.setMenuBarVisibility(false);

    // Set CSP for the window to allow our script
    keyRecordingWindow.webContents.session.webRequest.onHeadersReceived(
      (details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            "Content-Security-Policy": ["script-src 'self'"],
          },
        });
      }
    );

    // Set up IPC handlers for the key window
    const keybindSaveHandler = (event, shortcut) => {
      console.log("Received keybind-save with shortcut:", shortcut);
      shortcutResult = shortcut;

      // Save the shortcut to persistent storage
      if (shortcut) {
        // Store the keybinding based on slot number
        if (slotNumber === 1) {
          // Validate the shortcut format - make sure it's an actual key shortcut
          if (
            shortcut &&
            typeof shortcut === "string" &&
            ![
              "Click to set",
              "Recording...",
              "Error - Click to retry",
            ].includes(shortcut)
          ) {
            store.set("hotkey1", shortcut);
            console.log("Saved hotkey1:", shortcut);
          } else {
            console.error("Invalid shortcut format for slot 1:", shortcut);
          }
        } else if (slotNumber === 2) {
          // Validate the shortcut format - make sure it's an actual key shortcut
          if (
            shortcut &&
            typeof shortcut === "string" &&
            ![
              "Click to set",
              "Recording...",
              "Error - Click to retry",
            ].includes(shortcut)
          ) {
            store.set("hotkey2", shortcut);
            console.log("Saved hotkey2:", shortcut);
          } else {
            console.error("Invalid shortcut format for slot 2:", shortcut);
          }
        }

        // Re-register the hotkeys to apply the change immediately
        registerHotkeys();
      }

      if (!keyRecordingWindow.isDestroyed()) {
        keyRecordingWindow.close();
      }
    };

    const keybindCancelHandler = () => {
      console.log("Received keybind-cancel");
      shortcutResult = null;
      if (!keyRecordingWindow.isDestroyed()) {
        keyRecordingWindow.close();
      }
    };

    // Register handlers
    ipcMain.on("keybind-save", keybindSaveHandler);
    ipcMain.on("keybind-cancel", keybindCancelHandler);

    // Get current theme preference
    const isDarkTheme = store.get("darkTheme", false);

    // Set up theme handler for the keybind window
    ipcMain.on("get-theme-preference", (event) => {
      console.log("Sending theme preference:", isDarkTheme);
      event.sender.send("theme-preference", isDarkTheme);
    });

    // Load the HTML file for keybinding
    keyRecordingWindow.loadFile("keybind.html");

    // DevTools code commented out - no longer needed
    // if (process.env.DEBUG) {
    //   keyRecordingWindow.webContents.openDevTools({ mode: "detach" });
    // }

    keyRecordingWindow.once("closed", () => {
      // Clean up IPC handlers
      ipcMain.removeListener("keybind-save", keybindSaveHandler);
      ipcMain.removeListener("keybind-cancel", keybindCancelHandler);

      // Also cleanup the theme preference handler
      ipcMain.removeAllListeners("get-theme-preference");

      console.log("Keybind window closed, resolving with:", shortcutResult);
      // Resolve with our stored result
      resolve(shortcutResult);
    });
  });
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  // On macOS, check for screen capture permissions
  if (process.platform === "darwin") {
    const { systemPreferences } = require("electron");
    const hasScreenCapturePermission =
      systemPreferences.getMediaAccessStatus("screen");

    if (hasScreenCapturePermission !== "granted") {
      console.log("Requesting screen recording permission...");
      // This will prompt the user for screen recording permission
      systemPreferences.askForMediaAccess("screen").then((granted) => {
        if (!granted) {
          // Inform the user that screen capture permissions are needed
          mainWindow.webContents.send(
            "status-update",
            "Screen recording permission is required. Please enable it in System Preferences > Security & Privacy > Privacy > Screen Recording."
          );
        }
      });
    }
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();

  // Clean up OCR worker
  if (ocrWorker) {
    ocrWorker.terminate();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window when the dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
