const { createWorker } = require("tesseract.js");
const { OCR_CONFIG } = require("./ocr-config");

// Initialize worker once and reuse
let worker = null;
let currentLanguages = null;

/**
 * Get or create a Tesseract worker
 * @returns {Promise<Tesseract.Worker>} - Tesseract worker
 */
async function getWorker() {
  const langString = OCR_CONFIG.getLanguageString();
  
  // Recreate worker if language configuration changed
  if (worker && currentLanguages !== langString) {
    console.log(`Language configuration changed from ${currentLanguages} to ${langString}, recreating worker...`);
    await terminateWorker();
  }

  if (!worker) {
    currentLanguages = langString;
    console.log(`Initializing OCR worker with languages: ${langString}`);
    
    const startTime = Date.now();
    worker = await createWorker(langString, OCR_CONFIG.performance.workerCount, {
      logger: (progress) => {
        if (OCR_CONFIG.performance.verboseLogging) {
          console.log(`OCR Progress: ${progress.status} - ${Math.round(progress.progress * 100)}%`);
        }
        if (progress.status === "recognizing text" && progress.progress === 1) {
          console.log("OCR recognition complete");
        }
      },
    });
    
    const initTime = Date.now() - startTime;
    console.log(`OCR worker initialized in ${initTime}ms`);
  }
  return worker;
}

/**
 * Recognize text in an image
 * @param {string} imageDataUrl - Data URL of the image
 * @returns {Promise<string>} - Recognized text
 */
async function recognizeText(imageDataUrl) {
  const tessWorker = await getWorker();
  const { data } = await tessWorker.recognize(imageDataUrl);
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
