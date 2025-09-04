const { desktopCapturer } = require("electron");
const sharp = require("sharp");

/**
 * Capture the entire screen
 * @returns {Promise<string>} - Data URL of the captured screen
 */
async function captureEntireScreen() {
  // Get all screen sources
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width: 3000, height: 2000 }, // Large enough for most screens
  });

  // Return the primary screen
  return sources[0].thumbnail.toDataURL();
}

/**
 * Crop regions from a screenshot
 * @param {string} screenshotDataUrl - Data URL of the screenshot
 * @param {Array} regions - Array of region objects with x, y, width, height
 * @returns {Promise<Array>} - Array of data URLs for the cropped regions
 */
function cropRegions(screenshotDataUrl, regions) {
  return Promise.all(
    regions.map((region) => {
      return new Promise(async (resolve) => {
        // Convert data URL to buffer
        const base64Data = screenshotDataUrl.replace(
          /^data:image\/\w+;base64,/,
          ""
        );
        const imageBuffer = Buffer.from(base64Data, "base64");

        // Use sharp to crop region
        const croppedBuffer = await sharp(imageBuffer)
          .extract({
            left: region.x,
            top: region.y,
            width: region.width,
            height: region.height,
          })
          .toBuffer();

        // Return as data URL
        const croppedDataUrl = `data:image/png;base64,${croppedBuffer.toString(
          "base64"
        )}`;
        resolve(croppedDataUrl);
      });
    })
  );
}

module.exports = { captureEntireScreen, cropRegions };
