const { createWorker } = require("tesseract.js");
const { OCR_CONFIG } = require("./ocr-config");

// Initialize worker once and reuse
let worker = null;
let currentLanguages = null;

/**
 * Get or create a Tesseract worker
 * @param {BrowserWindow} mainWindow - Main window for sending logs to renderer
 * @returns {Promise<Tesseract.Worker>} - Tesseract worker
 */
async function getWorker(mainWindow = null) {
  const langString = OCR_CONFIG.getLanguageString();

  // Recreate worker if language configuration changed
  if (worker && currentLanguages !== langString) {
    const msg = `Language configuration changed from ${currentLanguages} to ${langString}, recreating worker...`;
    console.log(msg);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.executeJavaScript(
        `console.log('[OCR] ${msg.replace(/'/g, "\\'")}')`,
      );
    }
    await terminateWorker();
  }

  if (!worker) {
    currentLanguages = langString;
    const initMsg = `Initializing OCR worker with languages: ${langString}`;
    console.log(initMsg);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.executeJavaScript(
        `console.log('[OCR] ${initMsg.replace(/'/g, "\\'")}')`,
      );
    }

    const startTime = Date.now();
    worker = await createWorker(
      langString,
      OCR_CONFIG.performance.workerCount,
      {
        logger: (progress) => {
          if (OCR_CONFIG.performance.verboseLogging) {
            console.log(
              `OCR Progress: ${progress.status} - ${Math.round(progress.progress * 100)}%`,
            );
          }
          if (
            progress.status === "recognizing text" &&
            progress.progress === 1
          ) {
            console.log("OCR recognition complete");
          }
        },
      },
    );

    const initTime = Date.now() - startTime;
    const completeInitMsg = `OCR worker initialized in ${initTime}ms with languages: ${currentLanguages}`;
    console.log(completeInitMsg);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.executeJavaScript(
        `console.log('[OCR] ${completeInitMsg.replace(/'/g, "\\\\'")}')`,
      );
    }
  }
  return worker;
}

/**
 * Recognize text in an image
 * @param {string} imageDataUrl - Data URL of the image
 * @param {BrowserWindow} mainWindow - Main window for sending logs to renderer
 * @returns {Promise<string>} - Recognized text
 */
async function recognizeText(imageDataUrl, mainWindow = null) {
  const tessWorker = await getWorker(mainWindow);

  const startTime = Date.now();
  const startMsg = `Starting recognition with languages: ${currentLanguages}`;
  console.log(`[OCR] ${startMsg}`);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.executeJavaScript(
      `console.log('[OCR] ${startMsg.replace(/'/g, "\\'")}')`,
    );
  }

  const { data } = await tessWorker.recognize(imageDataUrl);

  const recognitionTime = Date.now() - startTime;
  const completeMsg = `Recognition completed in ${recognitionTime}ms`;
  console.log(`[OCR] ${completeMsg}`);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.executeJavaScript(
      `console.log('[OCR] ${completeMsg.replace(/'/g, "\\'")}')`,
    );
  }

  return data.text;
}

/**
 * Terminate the worker when the app is closing
 */
async function terminateWorker() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

module.exports = { getWorker, recognizeText, terminateWorker };
