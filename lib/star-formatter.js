/**
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
  if (!input) return NaN;

  // For "RuneScape59" style text - direct regex to extract
  const worldMatch = input.match(/RuneScape\s*(\d+)/i);
  if (worldMatch && worldMatch[1]) {
    const worldNum = parseInt(worldMatch[1], 10);
    if (worldNum >= 1 && worldNum <= 259) {
      return worldNum;
    }
  }

  let worldInt = NaN;

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
  if (isNaN(worldInt)) {
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

  let location_of_star = "Unknown";
  if (
    inputphrase.indexOf("Anachronia") > -1 ||
    inputphrase.indexOf("onia") > -1
  ) {
    location_of_star = "Anachronia";
  } else if (
    inputphrase.indexOf("Asgarnia") > -1 ||
    inputphrase.indexOf("rnia") > -1
  ) {
    location_of_star = "Asgarnia";
  } else if (
    inputphrase.indexOf("Ashdale") > -1 ||
    inputphrase.indexOf("dale") > -1
  ) {
    location_of_star = "Ashdale";
  } else if (
    inputphrase.indexOf("Crandor") > -1 ||
    inputphrase.indexOf("amja") > -1
  ) {
    location_of_star = "Crandor/Karamja";
  } else if (
    inputphrase.indexOf("Daemonheim") > -1 ||
    inputphrase.indexOf("sula") > -1
  ) {
    location_of_star = "Daemonheim";
  } else if (
    inputphrase.indexOf("Feldip") > -1 ||
    inputphrase.indexOf("ills") > -1
  ) {
    location_of_star = "Feldip Hills";
  } else if (
    inputphrase.indexOf("Fremennik") > -1 ||
    inputphrase.indexOf("unar") > -1
  ) {
    location_of_star = "Fremennik/Lunar Isle";
  } else if (
    inputphrase.indexOf("Kandarin") > -1 ||
    inputphrase.indexOf("arin") > -1
  ) {
    location_of_star = "Kandarin";
  } else if (
    inputphrase.indexOf("Desert") > -1 ||
    inputphrase.indexOf("dian") > -1
  ) {
    location_of_star = "Kharidian Desert";
  } else if (
    inputphrase.indexOf("Grove") > -1 ||
    inputphrase.indexOf("ost") > -1
  ) {
    location_of_star = "Lost Grove";
  } else if (
    inputphrase.indexOf("Menaphos") > -1 ||
    inputphrase.indexOf("phos") > -1
  ) {
    location_of_star = "Menaphos";
  } else if (
    inputphrase.indexOf("Misthalin") > -1 ||
    inputphrase.indexOf("alin") > -1
  ) {
    location_of_star = "Misthalin";
  } else if (
    inputphrase.indexOf("Morytania") > -1 ||
    inputphrase.indexOf("armless") > -1
  ) {
    location_of_star = "Morytania/Mos Le'Harmless";
  } else if (
    inputphrase.indexOf("Piscatoris") > -1 ||
    inputphrase.indexOf("nnwn") > -1
  ) {
    location_of_star = "Piscatoris/Gnome/Tirannwn";
  } else if (
    inputphrase.indexOf("Tuska") > -1 ||
    inputphrase.indexOf("uska") > -1
  ) {
    location_of_star = "Tuska";
  } else if (
    inputphrase.indexOf("Wilderness") > -1 ||
    inputphrase.indexOf("derness") > -1
  ) {
    location_of_star = "Wilderness";
  }

  return location_of_star;
}

/**
 * Extract star size from telescope text
 * @param {string} inputphrase - Raw OCR text, typically from telescope text
 * @returns {string|number} - Extracted star size (number or text)
 */
function extractSize(inputphrase) {
  if (!inputphrase) return "Unknown";

  // Direct size extraction (e.g., "size 5" or "size 10")
  const sizeMatch = inputphrase.match(/size\s*(\d+)/i);
  if (sizeMatch && sizeMatch[1]) {
    const sizeNum = parseInt(sizeMatch[1], 10);
    if (sizeNum >= 1 && sizeNum <= 10) {
      return sizeNum;
    }
  }

  // Fallback to the original method
  let size_of_star = "Unknown";
  const size_text_start = "be";
  let size_text_startIndex = inputphrase.indexOf(size_text_start) + 2;

  if (size_text_startIndex >= 2) {
    if (inputphrase.substring(size_text_startIndex).indexOf("size") === 1) {
      size_of_star = parseInt(
        replaceOCRN(inputphrase.substring(size_text_startIndex + 5)),
        10
      );
    } else {
      if (inputphrase.substring(size_text_startIndex).indexOf("small") > -1) {
        size_of_star = "Small";
      }
      if (inputphrase.substring(size_text_startIndex).indexOf("average") > -1) {
        size_of_star = "Average";
      }
      if (inputphrase.substring(size_text_startIndex).indexOf("big") > -1) {
        size_of_star = "Big";
      }
      if (
        inputphrase.substring(size_text_startIndex).indexOf("very small") > -1
      ) {
        size_of_star = "Small";
      }
      if (
        inputphrase.substring(size_text_startIndex).indexOf("fairly small") > -1
      ) {
        size_of_star = "Small";
      }
      if (
        inputphrase.substring(size_text_startIndex).indexOf("fairly big") > -1
      ) {
        size_of_star = "Average";
      }
      if (
        inputphrase.substring(size_text_startIndex).indexOf("very big") > -1
      ) {
        size_of_star = "Big";
      }
    }
  }

  // Convert text sizes to numbers if needed
  if (size_of_star === "Small") size_of_star = 1;
  else if (size_of_star === "Average") size_of_star = 4;
  else if (size_of_star === "Big") size_of_star = 7;

  // Ensure it's a valid size number
  if (
    typeof size_of_star === "number" &&
    (isNaN(size_of_star) || size_of_star < 1 || size_of_star > 9)
  ) {
    size_of_star = 4; // Default to size 4 if invalid
  }

  return size_of_star;
}

/**
 * Extract time until star from telescope text
 * @param {string} inputphrase - Raw OCR text from telescope
 * @returns {number} - Minutes until star falls
 */
function extractRelativeTime(inputphrase) {
  if (!inputphrase) return 60;

  // Try to match the direct pattern "33 to 35 minutes"
  const directTimeMatch = inputphrase.match(/(\d+)\s*to\s*(\d+)\s*minutes/i);
  if (directTimeMatch) {
    // We have a range like "33 to 35 minutes" - use the average
    const firstNum = parseInt(directTimeMatch[1], 10);
    const secondNum = parseInt(directTimeMatch[2], 10);

    if (!isNaN(firstNum) && !isNaN(secondNum)) {
      return Math.round((firstNum + secondNum) / 2); // Average of the range
    }
  }

  // Try simple pattern "next X minutes"
  const simpleMatch = inputphrase.match(/next\s*(\d+)\s*minutes/i);
  if (simpleMatch && simpleMatch[1]) {
    const minutes = parseInt(simpleMatch[1], 10);
    if (!isNaN(minutes) && minutes > 0) {
      return minutes;
    }
  }

  // Fall back to the original method
  const time_text_start = "next";
  const time_text_end = "to ";
  let time_text_startIndex = inputphrase.indexOf(time_text_start) + 4;
  let time_text_endIndex = inputphrase.indexOf(time_text_end);

  if (time_text_startIndex < 4 || time_text_endIndex < 0) {
    return 60; // Default if we can't parse
  }

  let hashours_flag = inputphrase
    .substring(time_text_startIndex, time_text_endIndex)
    .indexOf("hour");
  let multihours_flag = inputphrase
    .substring(time_text_startIndex, time_text_endIndex)
    .indexOf("hours");
  let minutes_to_star = 0;
  let minutes_index = inputphrase
    .substring(time_text_startIndex, time_text_endIndex)
    .indexOf("minute");

  if (multihours_flag > -1) {
    minutes_to_star = parseInt(
      replaceOCRN(
        inputphrase
          .substring(time_text_startIndex, time_text_endIndex)
          .substring(multihours_flag + 5, minutes_index)
      ),
      10
    );
    minutes_to_star += 120;
  } else if (multihours_flag === -1 && hashours_flag > -1) {
    minutes_to_star = parseInt(
      replaceOCRN(
        inputphrase
          .substring(time_text_startIndex, time_text_endIndex)
          .substring(hashours_flag + 4, minutes_index)
      ),
      10
    );
    minutes_to_star += 60;
  } else if (minutes_index === -1) {
    minutes_to_star = parseInt(
      replaceOCRN(
        inputphrase.substring(time_text_startIndex, time_text_endIndex)
      ),
      10
    );
  } else {
    minutes_to_star = parseInt(
      replaceOCRN(
        inputphrase
          .substring(time_text_startIndex, time_text_endIndex)
          .substring(0, minutes_index)
      ),
      10
    );
  }

  // Ensure it's a valid time
  if (isNaN(minutes_to_star) || minutes_to_star < 1) {
    minutes_to_star = 60; // Default to 60 minutes if invalid
  }

  return minutes_to_star;
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

  return `/call world: ${
    world || "??"
  } region: ${region} size: ${size} relative-time: ${relativeTime}`;
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

  return `/call world: ${
    world || "??"
  } region: ${region} size: ${size} relative-time: ${relativeTime}`;
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
