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

  // Additional processing specific to your needs can be added here
  // For example, specific formatting for your Discord posts, etc.

  return processed;
}

/**
 * Format text for Discord
 * @param {string} text - Processed OCR text
 * @returns {string} - Discord-formatted text
 */
function formatForDiscord(text) {
  // Add Discord markdown or formatting as needed
  // For example, wrapping sections in code blocks, adding bold, etc.
  return text;
}

module.exports = { processText, formatForDiscord };
