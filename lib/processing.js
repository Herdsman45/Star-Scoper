const starFormatter = require("./star-formatter");

/**
 * Process OCR text to make it more usable
 * @param {string} text - Raw OCR text
 * @returns {string} - Processed text
 */
function processText(text) {
  if (!text) return "";

  // Basic cleaning
  let processed = text
    .trim()
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/[^\x20-\x7E\n]/g, ""); // Remove non-printable chars except newlines

  // Remove multiple consecutive spaces
  processed = processed.replace(/[ \t]+/g, " ");

  // Remove empty lines
  processed = processed.replace(/\n+/g, "\n");

  return processed;
}

/**
 * Format text for Discord
 * @param {string} text - Processed OCR text
 * @returns {string} - Discord-formatted text with "/call" command
 */
function formatForDiscord(text) {
  // Use the star formatter to extract information and format as Discord call
  return starFormatter.parseOCRText(text);
}

module.exports = { processText, formatForDiscord };
