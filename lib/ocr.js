const { createWorker } = require("tesseract.js");

// Initialize worker once and reuse
let worker = null;

/**
 * Get or create a Tesseract worker
 * @returns {Promise<Tesseract.Worker>} - Tesseract worker
 */
async function getWorker() {
  if (!worker) {
    worker = await createWorker("eng", 1, {
      logger: (progress) => {
        if (progress.status === "recognizing text" && progress.progress === 1) {
          console.log("OCR recognition complete (lib)");
        }
      },
    });
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
