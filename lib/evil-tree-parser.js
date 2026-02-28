/**
 * Evil Tree Time Parser
 * Parses OCR text from Evil Tree availability time capture
 * Handles formats: "ready" or "available in hh:mm"
 */

/**
 * Parse evil tree time from OCR text
 * @param {string} ocrText - Raw OCR text from Region C
 * @returns {number|null} - Unix timestamp in milliseconds when tree will be available, or null if parsing failed
 */
function parseEvilTreeTime(ocrText) {
  if (!ocrText || typeof ocrText !== "string") {
    console.log("[EVIL_TREE] Invalid input text");
    return null;
  }

  // Normalize the text
  const normalized = ocrText.toLowerCase().trim().replace(/\s+/g, " ");

  console.log("[EVIL_TREE] Parsing text:", normalized);

  // Check for "ready" state
  if (normalized.includes("ready")) {
    console.log("[EVIL_TREE] Evil tree is ready now");
    return Date.now();
  }

  // Parse "available in hh:mm" format
  // Common OCR patterns to match:
  // - "available in 01:23"
  // - "available in 1:23"
  // - "available in0l:23" (OCR mistakes)
  // - "avai1able in 01:23" (OCR mistakes)

  // Try to find time pattern with various separators and formats
  const timePatterns = [
    // Standard format: "available in hh:mm"
    /available\s+in\s+(\d{1,2})[:\s]*(\d{2})/i,
    // Variations with OCR mistakes
    /avai[il1]able\s+in\s*[o0]?(\d{1,2})[:\s]*[o0]?(\d{2})/i,
    // Just looking for time pattern (fallback)
    /(\d{1,2})[:\s]+(\d{2})/,
  ];

  for (const pattern of timePatterns) {
    const match = normalized.match(pattern);
    if (match) {
      let hours = parseInt(match[1].replace(/[o0]/gi, "0"), 10);
      let minutes = parseInt(match[2].replace(/[o0]/gi, "0"), 10);

      // Validate ranges
      if (hours < 0 || hours > 23) {
        console.log("[EVIL_TREE] Invalid hours:", hours);
        continue;
      }
      if (minutes < 0 || minutes > 59) {
        console.log("[EVIL_TREE] Invalid minutes:", minutes);
        continue;
      }

      // Calculate timestamp (current time + hours + minutes)
      const totalMinutes = hours * 60 + minutes;
      const timestamp = Date.now() + totalMinutes * 60 * 1000;

      console.log(
        `[EVIL_TREE] Parsed time: ${hours}h ${minutes}m (${totalMinutes} total minutes)`,
      );
      console.log(
        `[EVIL_TREE] Available at: ${new Date(timestamp).toISOString()}`,
      );

      return timestamp;
    }
  }

  console.log("[EVIL_TREE] Could not parse time from text");
  return null;
}

/**
 * Extract evil tree availability time (convenience wrapper)
 * Returns a formatted object with the timestamp
 * @param {string} ocrText - Raw OCR text from Region C
 * @returns {object|null} - Object with timestamp, or null if parsing failed
 */
function extractEvilTreeTime(ocrText) {
  const timestamp = parseEvilTreeTime(ocrText);

  if (timestamp === null) {
    return null;
  }

  return {
    timestamp,
    isReady: timestamp <= Date.now(),
  };
}

module.exports = {
  parseEvilTreeTime,
  extractEvilTreeTime,
};
