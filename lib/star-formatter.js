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
 *    ✅ IMPLEMENTED - Multi-language support with translation mappings
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
 * Now supports multi-language OCR with French, Portuguese, and German
 */

const { normalizeMultiLanguageText } = require("./language-mappings");

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
    .replace(/l/g, "1")
    .replace(/i/g, "1"); // Lowercase i often read as 1
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

  // First, apply OCR corrections to help pattern matching
  // This handles common errors like 'i' or 'l' being read instead of '1'
  // Find "RuneScape" followed by potential world number and clean it
  let correctedInput = input;
  const scapeMatch = correctedInput.match(
    /(R.{0,2}ne.?Sca.{0,2}pe?)([il\d\s]{1,5})/i,
  );
  if (scapeMatch) {
    // Clean up the number part: convert i/l to 1, remove spaces
    const cleanedNumber = scapeMatch[2]
      .replace(/i/gi, "1")
      .replace(/l/gi, "1")
      .replace(/\s+/g, "");
    correctedInput =
      input.substring(0, scapeMatch.index) +
      scapeMatch[1] +
      cleanedNumber +
      input.substring(scapeMatch.index + scapeMatch[0].length);
  }

  // Fuzzy match for "RuneScape" with up to 1-2 character errors (handles common OCR mistakes)
  const fuzzyRuneScape = /R.{0,2}ne.?Sca.{0,2}pe?\s*(\d{1,3})/i;
  let worldMatch = correctedInput.match(fuzzyRuneScape);
  if (!worldMatch) {
    // Try the original strict match as a fallback
    worldMatch = correctedInput.match(/RuneScape\s*(\d{1,3})/i);
  }
  if (worldMatch && worldMatch[1]) {
    const worldNum = parseInt(worldMatch[1], 10);
    if (worldNum >= 1 && worldNum <= 298) {
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
    if (!(worldInt >= 1 && worldInt <= 298)) {
      worldInt = NaN; // fallback if not valid
    }
  }

  // Fallback: use last valid number in string (with OCR corrections)
  if (worldInt === "Unknown" || isNaN(worldInt)) {
    // Apply OCR corrections before matching
    let cleaned = input
      .replace(/I/gi, "1")
      .replace(/i/g, "1") // lowercase i as 1
      .replace(/l/g, "1")
      .replace(/O/gi, "0")
      .replace(/S/gi, "5")
      .replace(/B/g, "8")
      .replace(/Z/gi, "2")
      .replace(/g/g, "9");
    let allNums = cleaned.match(/\d{1,3}/g) || [];
    for (let i = allNums.length - 1; i >= 0; i--) {
      let n = parseInt(allNums[i], 10);
      if (n >= 1 && n <= 298) {
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
  // Normalize input and translate foreign words to English
  inputphrase = normalizeMultiLanguageText(inputphrase);
  inputphrase = inputphrase.trim().toLowerCase().replace(/\s+/g, " ");
  const regionPatterns = [
    { name: "Anachronia", patterns: ["anachronia", "onia"] },
    { name: "Asgarnia", patterns: ["asgarnia", "rnia", "rnie"] },
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
    {
      name: "Morytania/Mos Le'Harmless",
      patterns: ["morytania", "morytanie", "armless", "globino", "fensiv"],
    },
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

  // First try to extract German "Größe X" pattern before normalization
  // This handles OCR errors like "Grof3e 3" or "Grosse 5" or "GroRRe 8" or "Grol3e 8"
  const germanSizePattern =
    /(?:größe|grosse|grösse|grof3e|grol3e|gro8|grofte|grofse|gro3e|grobe|grore|groBe|grorre|grorRe|groRRe)\s*(\d+)/i;
  const germanMatch = inputphrase.match(germanSizePattern);
  if (germanMatch && germanMatch[1]) {
    const sizeNum = parseInt(germanMatch[1], 10);
    if (sizeNum >= 1 && sizeNum <= 10) {
      return sizeNum;
    }
  }

  // Normalize input and translate foreign words to English
  inputphrase = normalizeMultiLanguageText(inputphrase);
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

  // Check for approximate size descriptions with fuzzy matching to handle OCR errors
  const lowerText = inputphrase.toLowerCase();

  // Check for specific size descriptions and return them
  // Check longer phrases first to avoid partial matches
  if (lowerText.includes("very small")) {
    return "Very small";
  }
  if (lowerText.includes("fairly small")) {
    return "Fairly small";
  }
  if (lowerText.includes("very big")) {
    return "Very big";
  }
  if (lowerText.includes("fairly big")) {
    return "Fairly big";
  }
  // Then check shorter phrases
  if (lowerText.includes("small")) {
    return "Small";
  }
  if (lowerText.includes("average")) {
    return "Average";
  }
  if (lowerText.includes("medium")) {
    return "Average"; // Portuguese "medio" becomes "medium" after translation
  }
  // Check for German incomplete "groß" (gro aus = looks big)
  if (lowerText.match(/\bgro\s+aus\b/)) {
    return "Big";
  }
  if (lowerText.includes("big")) {
    return "Big";
  }

  // Legacy check for "be size" pattern
  const size_text_start = "be";
  let size_text_startIndex = inputphrase.indexOf(size_text_start) + 2;

  if (size_text_startIndex >= 2) {
    if (inputphrase.substring(size_text_startIndex).indexOf("size") === 1) {
      // Try to extract a direct size mention
      size_of_star = parseInt(
        replaceOCRN(inputphrase.substring(size_text_startIndex + 5)),
        10,
      );

      // If it's a valid number between 1-10, use it
      if (!isNaN(size_of_star) && size_of_star >= 1 && size_of_star <= 10) {
        return size_of_star;
      }
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
  // Normalize input and translate foreign words to English
  inputphrase = normalizeMultiLanguageText(inputphrase);

  // Clean up common OCR errors (artifacts from 1.25x scaling on single-pixel fonts)
  let norm = inputphrase
    .trim()
    .toLowerCase()
    .replace(/[\r\n]+/g, " ")
    .replace(/\(s\)/g, "s")
    .replace(/itwill/gi, "it will")
    .replace(/mines/gi, "minutes")
    .replace(/mnutes|m1nutes|minltes|minules|minutcs/gi, "minutes")
    .replace(/h0ur|h0urs|h0ur5/gi, "hour")
    .replace(/t0/g, "to")
    .replace(/oto\s+(\d+)/gi, "0 to $1")
    .replace(/o\s*to\s+(\d+)/gi, "0 to $1")
    .replace(/\.\s*minutes/g, " minutes")
    .replace(/\.\s*to/g, " to")
    .replace(/\.\s*next/g, " next")
    .replace(/\./g, "")
    .replace(/S0/g, "50")
    .replace(/S1/g, "51")
    .replace(/S2/g, "52")
    .replace(/S3/g, "53")
    .replace(/S4/g, "54")
    .replace(/S5/g, "55")
    .replace(/S6/g, "56")
    .replace(/S7/g, "57")
    .replace(/S8/g, "58")
    .replace(/S9/g, "59")
    .replace(/3d/g, "34")
    .replace(/B\s*minutes/g, "8 minutes")
    .replace(/next(\d+)/g, "next $1")
    .replace(/(\d)\s*to\s*(\d)/g, "$1 to $2")
    .replace(/(\d)\s*minut\w*/g, "$1 minutes")
    .replace(/(\d)\s*hours?/g, "$1 hour")
    .replace(/ +/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Fix inverted time ranges (when first > second, OCR likely added extra digit)
  // Example: "54 to 56" is correct, but "544 to 56" should become "54 to 56"
  const invertedRangeMatch = norm.match(/(\d+)\s+to\s+(\d+)/);
  if (invertedRangeMatch) {
    const startNum = parseInt(invertedRangeMatch[1], 10);
    const endNum = parseInt(invertedRangeMatch[2], 10);
    if (startNum > endNum && startNum > 99) {
      norm = norm.replace(
        invertedRangeMatch[0],
        `${Math.floor(startNum / 10)} to ${endNum}`,
      );
    }
  }

  // Add 'to' between bare adjacent numbers if missing (after other cleanup)
  norm = norm.replace(/(\d+)\s+(\d+)(?!\s*(?:hour|minute))/g, "$1 to $2");

  // IMPORTANT: Check for mixed patterns FIRST (X minutes to Y hour)
  // Example: "57 minutes to 1 hour 21 minutes" should return 57
  // Portuguese: "entre 59 minutos e 1 hora e 23 minutos" → "between 59 minutes and 1 hour and 23 minutes" → return 59
  const minutesToHourPattern =
    /\b(\d+)\s*minut\w*\s*(?:to|and|e)\s*\d+\s*(?:hour)/i;
  const minutesToHourMatch = norm.match(minutesToHourPattern);
  if (minutesToHourMatch) {
    const matchIndex = norm.indexOf(minutesToHourMatch[0]);
    const before = norm
      .substring(Math.max(0, matchIndex - 25), matchIndex)
      .toLowerCase();
    const hasDigitHourBefore = /\d+\s*hour/i.test(before);

    if (!hasDigitHourBefore) {
      const minutes = parseInt(minutesToHourMatch[1], 10);
      if (!isNaN(minutes) && minutes > 0 && minutes < 120) {
        return minutes;
      }
    }
  }

  // Hour + minute patterns (all languages now normalized to "hour"/"minutes")
  // Pattern: "X hour and Y minutes" or "X hours and Y minutes"
  const hourMinPattern = /(\d+)\s*hours?\s*(?:and)\s*(\d+)\s*minut\w*/i;
  const hourMinMatch = norm.match(hourMinPattern);
  if (hourMinMatch) {
    const hours = parseInt(hourMinMatch[1], 10);
    const minutes = parseInt(hourMinMatch[2], 10);
    if (!isNaN(hours) && !isNaN(minutes) && minutes < 60) {
      return hours * 60 + minutes;
    }
  }

  // Try to match the direct pattern "33 to 35 minutes" or "56 and 58 minutes"
  // Portuguese: "entre 56 e 58 minutos" becomes "between 56 and 58 minutes"
  let directTimeMatch = norm.match(/(\d+)\s*(?:to|and|e)\s*(\d+)\s*minutes/i);
  if (!directTimeMatch) {
    // Try to match with possible misspelling of "minutes"
    directTimeMatch = norm.match(/(\d+)\s*(?:to|and|e)\s*(\d+)\s*minut\w*/i);
  }
  if (directTimeMatch) {
    const firstNum = parseInt(directTimeMatch[1], 10);
    const secondNum = parseInt(directTimeMatch[2], 10);
    if (!isNaN(firstNum) && !isNaN(secondNum)) {
      return firstNum;
    }
  }

  // Fallback: Handle cases where OCR misses the second number (e.g., "6 to minutes" instead of "6 to 8 minutes")
  let partialTimeMatch = norm.match(/(\d+)\s*to\s*minutes/i);
  if (!partialTimeMatch) {
    // Try with misspelling of "minutes"
    partialTimeMatch = norm.match(/(\d+)\s*to\s*minut\w*/i);
  }
  if (partialTimeMatch) {
    const firstNum = parseInt(partialTimeMatch[1], 10);
    if (!isNaN(firstNum) && firstNum > 0) {
      console.warn(
        `OCR appears to have missed second number in time range. Found "${partialTimeMatch[0]}", using first number: ${firstNum}`,
      );
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
    /next\s*((?:\d+\s*hour[s]?\s*)+)([\d\s]+)minut\w*/i,
  );
  let hourMinuteMatch2 = null;
  if (!hourMinuteMatch1) {
    hourMinuteMatch2 = norm.match(
      /next\s*([\d\s]+)hour[s]?\s*([\d\s]+)minut\w*/i,
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
  // Check for "next X hour(s) to Y hour(s) Z minute(s)" format
  const hourRangeMatch = norm.match(
    /next\s*(\d+)\s*hour[s]?\s*to\s*(\d+)\s*hour[s]?\s*(\d+)\s*minut\w*/i,
  );
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
    /next\s*(\d+)\s*hour[s]?\s*(\d+)\s*to\s*(\d+)\s*minutes/i,
  );
  if (!hourMinuteRangeMatch) {
    hourMinuteRangeMatch = norm.match(
      /next\s*(\d+)\s*hour[s]?\s*(\d+)\s*to\s*(\d+)\s*minut\w*/i,
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
