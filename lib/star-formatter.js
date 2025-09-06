/**
 *
 * === Future Improvement Suggestions ===
 *
 * 1. Unit Tests:
 *    - Add automated tests for each extraction function using real and edge-case OCR outputs.
 *
 * 2. Configurable Patterns:
 *    - Move region/size/time patterns to a config file or JSON for easier updates.
 *
 * 3. Extraction Confidence:
 *    - Return a confidence score or flag (e.g., "low confidence" if fallback logic or "Unknown" is triggered).
 *
 * 4. Modular Logging:
 *    - Use a logging utility/library instead of console.warn for better log management.
 *
 * 5. Internationalization:
 *    - Make patterns and logic language-agnostic for future multi-language support.
 *
 * 6. Performance:
 *    - Profile and optimize extraction functions if scaling up or for real-time use.
 *
 * 7. User Feedback Loop:
 *    - Log user corrections for future model or logic improvements.
 *
 * 8. Documentation:
 *    - Add JSDoc comments and usage examples for each function.
 *
 *
 * Star-Formatter - Integration of StarTool text processing capabilities
 * Based on StargazerTool-1.16.html logic
 */

// Helper function to clean up OCR numbers
function replaceOCRN(input) {
  if (!input) return "";

  let processedOCRN = input
    .replace(/\s+/g, "")
    .replace(/I/gi, "1")
    .replace(/O/gi, "0")
    .replace(/S/gi, "5")
    .replace(/Z/gi, "2")
    .replace(/B/g, "8")
    .replace(/g/g, "9")
    .replace(/l/g, "1");
  return processedOCRN;
}

/**
 * Extract world number from OCR text
 * @param {string} input - Raw OCR text containing world number
 * @returns {number} - Extracted world number
 */
function extractWorldNumber(input) {
  if (!input) return "Unknown";
  // Normalize input
  input = input.trim().replace(/\s+/g, " ");

  // Fuzzy match for "RuneScape" with up to 1-2 character errors (handles common OCR mistakes)
  const fuzzyRuneScape = /R.{0,2}ne.?Sca.{0,2}pe?\s*(\d{1,3})/i;
  let worldMatch = input.match(fuzzyRuneScape);
  if (!worldMatch) {
    // Try the original strict match as a fallback
    worldMatch = input.match(/RuneScape\s*(\d{1,3})/i);
  }
  if (worldMatch && worldMatch[1]) {
    const worldNum = parseInt(worldMatch[1], 10);
    if (worldNum >= 1 && worldNum <= 259) {
      return worldNum;
    }
  }

  let worldInt = "Unknown";

  // Look for "cape" or "caoe" (case-insensitive) or variants
  let idx = input.search(/cape|caoe|ape|sca/i);
  if (idx > -1) {
    // Take up to 6 chars after "cape" (to cover " 3 2", " 259", etc)
    let afterCape = input.substring(idx + 4, idx + 10);
    let digits = replaceOCRN(afterCape).replace(/\s+/g, "");
    worldInt = parseInt(digits, 10);
    if (!(worldInt >= 1 && worldInt <= 259)) {
      worldInt = NaN; // fallback if not valid
    }
  }

  // Fallback: use last valid number in string
  if (worldInt === "Unknown") {
    let cleaned = input
      .replace(/I|l/g, "1")
      .replace(/O/g, "0")
      .replace(/S/g, "5")
      .replace(/B/g, "8")
      .replace(/Z/g, "2")
      .replace(/g/g, "9");
    let allNums = cleaned.match(/\d{1,3}/g) || [];
    for (let i = allNums.length - 1; i >= 0; i--) {
      let n = parseInt(allNums[i], 10);
      if (n >= 1 && n <= 259) {
        worldInt = n;
        break;
      }
    }
  }

  return worldInt;
}

/**
 * Extract region from telescope text
 * @param {string} inputphrase - Raw OCR text, typically from Region B
 * @returns {string} - Extracted region name
 */
function extractRegion(inputphrase) {
  if (!inputphrase) return "Unknown";
  // Normalize input
  inputphrase = inputphrase.trim().toLowerCase().replace(/\s+/g, " ");
  const regionPatterns = [
    { name: "Anachronia", patterns: ["anachronia", "onia"] },
    { name: "Asgarnia", patterns: ["asgarnia", "rnia"] },
    { name: "Ashdale", patterns: ["ashdale", "dale"] },
    { name: "Crandor/Karamja", patterns: ["crandor", "amja"] },
    { name: "Daemonheim", patterns: ["daemonheim", "sula"] },
    { name: "Feldip Hills", patterns: ["feldip", "ills"] },
    { name: "Fremennik/Lunar Isle", patterns: ["fremennik", "unar"] },
    { name: "Kandarin", patterns: ["kandarin", "arin"] },
    { name: "Kharidian Desert", patterns: ["desert", "dian"] },
    { name: "Lost Grove", patterns: ["grove", "ost"] },
    { name: "Menaphos", patterns: ["menaphos", "phos"] },
    { name: "Misthalin", patterns: ["misthalin", "alin"] },
    { name: "Morytania/Mos Le'Harmless", patterns: ["morytania", "armless"] },
    { name: "Piscatoris/Gnome/Tirannwn", patterns: ["piscatoris", "nnwn"] },
    { name: "Tuska", patterns: ["tuska", "uska"] },
    { name: "Wilderness", patterns: ["wilderness", "derness"] },
  ];
  for (const region of regionPatterns) {
    for (const pat of region.patterns) {
      if (inputphrase.includes(pat)) {
        return region.name;
      }
    }
  }
  // Log unknown region for future improvement
  console.warn("Unknown region extraction:", inputphrase);
  return "Unknown";
}

/**
 * Extract star size from telescope text
 * @param {string} inputphrase - Raw OCR text, typically from telescope text
 * @returns {string|number} - Extracted star size (number or text)
 */
function extractSize(inputphrase) {
  if (!inputphrase) return "Unknown";
  // Normalize input
  inputphrase = inputphrase.trim().toLowerCase().replace(/\s+/g, " ");

  // Direct size extraction (e.g., "size 5" or "size 10")
  const sizeMatch = inputphrase.match(/size\s*(\d+)/i);
  if (sizeMatch && sizeMatch[1]) {
    const sizeNum = parseInt(sizeMatch[1], 10);
    if (sizeNum >= 1 && sizeNum <= 10) {
      return sizeNum;
    }
  }

  // Fallback to check for approximate size descriptions
  let size_of_star = "Unknown";
  const size_text_start = "be";
  let size_text_startIndex = inputphrase.indexOf(size_text_start) + 2;

  if (size_text_startIndex >= 2) {
    if (inputphrase.substring(size_text_startIndex).indexOf("size") === 1) {
      // Try to extract a direct size mention
      size_of_star = parseInt(
        replaceOCRN(inputphrase.substring(size_text_startIndex + 5)),
        10
      );

      // If it's a valid number between 1-10, use it
      if (!isNaN(size_of_star) && size_of_star >= 1 && size_of_star <= 10) {
        return size_of_star;
      }
    }

    // Check for approximate size descriptions with fuzzy matching to handle OCR errors
    const lowerText = inputphrase.toLowerCase();

    // Helper function for fuzzy matching to handle OCR errors
    function fuzzyMatch(text, pattern) {
      // Remove spaces for more flexible matching
      const cleanText = text.replace(/\s+/g, "");
      const cleanPattern = pattern.replace(/\s+/g, "");

      // Check for direct includes (most reliable)
      if (text.includes(pattern)) return true;

      // Check for pattern with one character missing or wrong
      if (cleanText.includes(cleanPattern)) return true;

      // For short patterns, check if most characters are present in sequence
      if (cleanPattern.length <= 4) {
        return false; // Too short to do fuzzy matching safely
      }

      // Check if at least 75% of characters are present in the correct order
      let matchCount = 0;
      let textIndex = 0;

      for (let i = 0; i < cleanPattern.length; i++) {
        // Look for the next character in the remaining text
        const nextCharIndex = cleanText.indexOf(cleanPattern[i], textIndex);
        if (nextCharIndex >= textIndex) {
          matchCount++;
          textIndex = nextCharIndex + 1;
        }
      }

      return matchCount / cleanPattern.length >= 0.75;
    }

    // Check for approximate size descriptions that should trigger the user prompt
    if (
      fuzzyMatch(lowerText, "very small") ||
      fuzzyMatch(lowerText, "small") ||
      fuzzyMatch(lowerText, "fairly small") ||
      fuzzyMatch(lowerText, "average") ||
      fuzzyMatch(lowerText, "fairly big") ||
      fuzzyMatch(lowerText, "big") ||
      fuzzyMatch(lowerText, "very big")
    ) {
      return "Approximate";
    }
  }

  return size_of_star;
}

/**
 * Extract time until star from telescope text
 * @param {string} inputphrase - Raw OCR text from telescope
 * @returns {number|string} - Minutes until star falls or "Unknown" if not found
 */
function extractRelativeTime(inputphrase) {
  if (!inputphrase) return "Unknown";
  // Normalize input
  inputphrase = inputphrase.trim().toLowerCase().replace(/\s+/g, " ");
  if (worldInt === "Unknown") {
    console.warn("Unknown world extraction:", input);
  }
  if (size_of_star === "Unknown") {
    console.warn("Unknown size extraction:", inputphrase);
  }
  if (typeof norm === "string" && (norm === "" || norm === "unknown")) {
    console.warn("Unknown time extraction:", inputphrase);
  }

  // Normalize common OCR errors and whitespace
  let norm = inputphrase
    .replace(/[\r\n]+/g, " ") // Replace newlines with space
    .replace(/mnutes|m1nutes|minltes|minules|minutcs|minutcs/gi, "minutes")
    .replace(/h0ur|h0urs|h0ur5|h0ur5/gi, "hour")
    .replace(/ +/g, " ")
    .replace(/to\s*\n\s*/gi, "to ")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Try to match the direct pattern "33 to 35 minutes" (tolerant to OCR errors)
  let directTimeMatch = norm.match(/(\d+)\s*to\s*(\d+)\s*minutes/i);
  if (!directTimeMatch) {
    // Try to match with possible misspelling of "minutes"
    directTimeMatch = norm.match(/(\d+)\s*to\s*(\d+)\s*minut\w*/i);
  }
  if (directTimeMatch) {
    const firstNum = parseInt(directTimeMatch[1], 10);
    const secondNum = parseInt(directTimeMatch[2], 10);
    if (!isNaN(firstNum) && !isNaN(secondNum)) {
      return firstNum;
    }
  }

  // Try pattern: "next X minutes" (tolerant to OCR errors)
  let simpleMatch = norm.match(/next\s*(\d+)\s*minutes/i);
  if (!simpleMatch) {
    simpleMatch = norm.match(/next\s*(\d+)\s*minut\w*/i);
  }
  if (simpleMatch && simpleMatch[1]) {
    const minutes = parseInt(simpleMatch[1], 10);
    if (!isNaN(minutes) && minutes > 0) {
      return minutes;
    }
  }

  // Try robust pattern: "next X hour(s) Y minutes" (artifact-tolerant)
  let hourMinuteMatch1 = norm.match(
    /next\s*((?:\d+\s*hour[s]?\s*)+)([\d\s]+)minut\w*/i
  );
  let hourMinuteMatch2 = null;
  if (!hourMinuteMatch1) {
    hourMinuteMatch2 = norm.match(
      /next\s*([\d\s]+)hour[s]?\s*([\d\s]+)minut\w*/i
    );
  }
  let hourMinuteMatch = hourMinuteMatch1 || hourMinuteMatch2;
  if (hourMinuteMatch) {
    // Extract all numbers from the matched groups
    let nums = (hourMinuteMatch[0].match(/\d+/g) || []).map(Number);
    // Remove spurious trailing single digits (likely artifacts)
    while (nums.length > 2 && nums[nums.length - 1] < 10) nums.pop();
    // If more than 2 numbers, take the first as hours, the next plausible as minutes
    let hours = nums[0] || 0;
    let minutes = nums[1] || 0;
    // If minutes > 59 and there are more numbers, try the next one
    if (minutes > 59 && nums.length > 2) {
      minutes = nums[2];
    }
    // Sanity check
    if (!isNaN(hours) && !isNaN(minutes) && minutes >= 0 && minutes < 60) {
      return hours * 60 + minutes;
    }
  }
  if (!hourRangeMatch) {
    hourRangeMatch = norm.match(
      /next\s*(\d+)\s*hour[s]?\s*to\s*(\d+)\s*hour[s]?\s*(\d+)\s*minut\w*/i
    );
  }
  if (hourRangeMatch) {
    const hours1 = parseInt(hourRangeMatch[1], 10);
    const hours2 = parseInt(hourRangeMatch[2], 10);
    const minutes = parseInt(hourRangeMatch[3], 10);
    if (!isNaN(hours1) && !isNaN(hours2) && !isNaN(minutes)) {
      return hours1 * 60 + minutes;
    }
  }

  // Try pattern: "next X hour(s) Y to Z minutes"
  let hourMinuteRangeMatch = norm.match(
    /next\s*(\d+)\s*hour[s]?\s*(\d+)\s*to\s*(\d+)\s*minutes/i
  );
  if (!hourMinuteRangeMatch) {
    hourMinuteRangeMatch = norm.match(
      /next\s*(\d+)\s*hour[s]?\s*(\d+)\s*to\s*(\d+)\s*minut\w*/i
    );
  }
  if (hourMinuteRangeMatch) {
    const hours = parseInt(hourMinuteRangeMatch[1], 10);
    const min1 = parseInt(hourMinuteRangeMatch[2], 10);
    const min2 = parseInt(hourMinuteRangeMatch[3], 10);
    if (!isNaN(hours) && !isNaN(min1) && !isNaN(min2)) {
      return hours * 60 + min1;
    }
  }

  // Fallback: try to find any "X minutes" or "X minut..." pattern
  let fallbackMinMatch = norm.match(/(\d+)\s*minut\w*/i);
  if (fallbackMinMatch && fallbackMinMatch[1]) {
    const minutes = parseInt(fallbackMinMatch[1], 10);
    if (!isNaN(minutes) && minutes > 0) {
      return minutes;
    }
  }

  // Fallback: try to find "X hour(s)" pattern
  let fallbackHourMatch = norm.match(/(\d+)\s*hour[s]?/i);
  if (fallbackHourMatch && fallbackHourMatch[1]) {
    const hours = parseInt(fallbackHourMatch[1], 10);
    if (!isNaN(hours) && hours > 0) {
      return hours * 60;
    }
  }

  return "Unknown";
}

/**
 * Extract world, region, size, and time from OCR text and format as Discord call
 * @param {string} telescopeText - OCR text containing telescope info (region, size, time)
 * @param {string} worldText - OCR text containing world number
 * @returns {string} - Formatted discord call
 */
function generateDiscordCall(telescopeText, worldText) {
  const world = extractWorldNumber(worldText);
  const region = extractRegion(telescopeText);
  const size = extractSize(telescopeText);
  const relativeTime = extractRelativeTime(telescopeText);

  return `/call world: ${world} region: ${region} size: ${size} relative-time: ${relativeTime}`;
}

/**
 * Parse raw OCR text (which contains both regions)
 * @param {string} ocrText - Raw OCR text containing both Region A and Region B
 * @returns {string} - Formatted discord call
 */
function parseOCRText(ocrText) {
  if (!ocrText) return "";

  // Split the text to get separate regions
  const regionSplit = ocrText.split(/Region [AB]:/);

  // Need at least 3 parts (original text, region A, region B)
  if (regionSplit.length < 3) {
    return "Could not parse OCR text properly";
  }

  // SWAP THE REGIONS - Region A contains telescope text, Region B contains world number
  const telescopeText = regionSplit[1];
  const worldText = regionSplit[2];

  // Now extract information from the correct regions
  const world = extractWorldNumber(worldText);
  const region = extractRegion(telescopeText);
  const size = extractSize(telescopeText);
  const relativeTime = extractRelativeTime(telescopeText);

  return `/call world: ${world} region: ${region} size: ${size} relative-time: ${relativeTime}`;
}

module.exports = {
  parseOCRText,
  generateDiscordCall,
  extractWorldNumber,
  extractRegion,
  extractSize,
  extractRelativeTime,
  replaceOCRN,
};
