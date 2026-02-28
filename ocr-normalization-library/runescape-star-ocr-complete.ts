/**
 * RuneScape Shooting Star OCR Parser - Complete Solution
 *
 * Single-file TypeScript library that handles the complete flow:
 * Raw OCR text → Normalized English → Parsed data (region/size/time)
 *
 * Supports Portuguese, French, and German game clients with eng-only Tesseract model.
 * Based on 100+ real captures with comprehensive OCR error pattern handling.
 *
 * @version 1.0.0
 * @license MIT
 *
 * USAGE:
 * ```typescript
 * import { parseStarOCR } from './runescape-star-ocr-complete';
 *
 * const regionA = "Du siehst eine Sternschnuppe! Die GroRRe ist 5 in Asgarnia.";
 * const worldNumber = 94;
 *
 * const result = parseStarOCR(regionA, worldNumber);
 * // { world: 94, region: "Asgarnia", size: 5, relativeTime: "Unknown" }
 * ```
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface StarCallData {
  world: number | string;
  region: string;
  size: number | string;
  relativeTime: number | string;
}

export interface LanguageMappings {
  [key: string]: string;
}

// ============================================================================
// LANGUAGE MAPPINGS & NORMALIZATION
// ============================================================================

const LANGUAGE_MAPPINGS: LanguageMappings = {
  // PORTUGUESE SHOOTING STAR DIALOG
  você: "you",
  vê: "see",
  uma: "a",
  estrela: "star",
  cadente: "shooting",
  parece: "appears",
  que: "that",
  está: "is",
  em: "in",
  ser: "be",
  de: "of",
  tamanho: "size",
  grande: "big",
  pequeno: "small",
  pequena: "small",
  médio: "average",
  média: "average",
  medio: "average", // Without accent (OCR)
  media: "average", // Without accent (OCR)

  // FRENCH SHOOTING STAR DIALOG
  vous: "you",
  voyez: "see",
  une: "a",
  étoile: "star",
  toile: "star", // OCR often reads "étoile" as "toile"
  filante: "shooting",
  on: "it",
  dirait: "appears",
  "qu'elle": "that it",
  "qu'il": "that it",
  elle: "it",
  il: "it",
  est: "is",
  dans: "in",
  le: "the",
  la: "the",
  "l'étoile": "the star",
  "l'etoile": "the star",
  semble: "seems",
  être: "to be",
  etre: "to be",
  taille: "size",
  grand: "big",
  petit: "small",
  petite: "small",
  moyen: "average",
  moyenne: "average",

  // GERMAN SHOOTING STAR DIALOG
  du: "you",
  siehst: "see",
  eine: "a",
  sternschnuppe: "shooting star",
  die: "the",
  scheint: "appears",
  sieht: "looks",
  aus: "out",
  zu: "to",
  sein: "be",
  haben: "have",
  größe: "size",
  grosse: "size",
  grösse: "size",
  groß: "big",
  gross: "big",
  klein: "small",
  durchschnittlich: "average", // German for "average"

  // REGION NAMES
  désert: "desert",
  deserto: "desert",
  wüste: "desert",
  "terres sauvages": "wilderness", // French for Wilderness
  sauvage: "wilderness",
  selvagem: "wilderness",
  wildnis: "wilderness",
  terres: "lands", // Part of "Terres sauvages"
  bois: "grove",
  perdu: "lost",
  bocage: "grove",
  bosque: "grove",
  perdido: "lost",
  verlorener: "lost",
  hain: "grove",
  morytanie: "morytania", // French spelling
  globino: "mos", // French for Mos Le'Harmless
  fensiv: "harmless", // Part of French "Globino Fensiv"

  // TIME WORDS
  minutes: "minutes",
  minutos: "minutes",
  minuten: "minutes",
  minute: "minute",
  minuto: "minute",
  heure: "hour",
  heures: "hours",
  hora: "hour",
  horas: "hours",
  stunde: "hour",
  stunden: "hours",
  prochain: "next",
  prochaine: "next",
  próximo: "next",
  próxima: "next",
  proximo: "next", // Without accent
  proxima: "next", // Without accent
  nächste: "next",
  nächsten: "next",
  nachsten: "next", // OCR missing umlaut
  entre: "between", // Portuguese "between" in time ranges
  bis: "to", // German "to" in time ranges
  et: "and", // French
  e: "and", // Portuguese
  und: "and", // German
};

const OCR_ERROR_PATTERNS: LanguageMappings = {
  // GERMAN ß (ESZETT) OCR ERRORS - Most common shooting star OCR issue
  grorre: "groß", // ß → rr
  grorRe: "groß", // ß → rR
  groRRe: "groß", // ß → RR (most common)
  grol3e: "groß", // ß → l3
  gro3e: "groß", // ß → 3
  gro8: "groß", // ß → 8
  grof3e: "groß", // ß → f3
  grofte: "groß", // ß → ft
  grofse: "groß", // ß → fs
  grobe: "groß", // ß → b
  grore: "groß", // ß → r
  groBe: "groß", // ß → B

  // FRENCH REGION NAME ERRORS
  asgarnie: "asgarnia",

  // COMPOUND PHRASES
  "bois perdu": "lost grove",
  "gro aus": "looks big", // Incomplete German "groß aus"
  "gro8 aus": "looks big", // Incomplete German "groß aus" (ß → 8)
};

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Normalize multi-language OCR text to English
 * Handles Portuguese, French, and German shooting star dialogs
 */
export function normalizeOCRText(text: string): string {
  if (!text) return "";

  let normalized = text;

  // Stage 1: Fix OCR errors first (before word translation)
  const sortedErrors = Object.keys(OCR_ERROR_PATTERNS).sort(
    (a, b) => b.length - a.length,
  );
  for (const error of sortedErrors) {
    const correction = OCR_ERROR_PATTERNS[error];
    const regex = new RegExp(escapeRegex(error), "gi");
    normalized = normalized.replace(regex, correction);
  }

  // Stage 2: Translate foreign words to English
  const sortedMappings = Object.keys(LANGUAGE_MAPPINGS).sort(
    (a, b) => b.length - a.length,
  );
  for (const foreignWord of sortedMappings) {
    const englishWord = LANGUAGE_MAPPINGS[foreignWord];
    const regex = new RegExp(`\\b${escapeRegex(foreignWord)}\\b`, "gi");
    normalized = normalized.replace(regex, englishWord);
  }

  return normalized;
}

// ============================================================================
// OCR CLEANUP UTILITIES
// ============================================================================

/**
 * Clean up OCR numbers (common character confusions)
 */
function cleanOCRNumbers(input: string): string {
  if (!input) return "";

  return input
    .replace(/\s+/g, "")
    .replace(/I/gi, "1")
    .replace(/O/gi, "0")
    .replace(/S/gi, "5")
    .replace(/Z/gi, "2")
    .replace(/B/g, "8")
    .replace(/g/g, "9")
    .replace(/l/g, "1")
    .replace(/i/g, "1");
}

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract region from telescope text (Region A)
 * Handles all RuneScape shooting star regions with multi-language support
 */
export function extractRegion(inputphrase: string): string {
  if (!inputphrase) return "Unknown";

  // Normalize and translate to English first
  inputphrase = normalizeOCRText(inputphrase);
  inputphrase = inputphrase.trim().toLowerCase().replace(/\s+/g, " ");

  const regionPatterns = [
    { name: "Anachronia", patterns: ["anachronia", "onia"] },
    { name: "Asgarnia", patterns: ["asgarnia", "rnia", "rnie"] },
    { name: "Ashdale", patterns: ["ashdale", "dale"] },
    { name: "Crandor/Karamja", patterns: ["crandor", "amja", "karamja"] },
    { name: "Daemonheim", patterns: ["daemonheim", "sula"] },
    { name: "Feldip Hills", patterns: ["feldip", "ills"] },
    { name: "Fremennik/Lunar Isle", patterns: ["fremennik", "unar", "lunar"] },
    { name: "Kandarin", patterns: ["kandarin", "arin"] },
    { name: "Kharidian Desert", patterns: ["desert", "dian", "kharid"] },
    { name: "Lost Grove", patterns: ["grove", "ost", "lost"] },
    { name: "Menaphos", patterns: ["menaphos", "phos"] },
    { name: "Misthalin", patterns: ["misthalin", "alin"] },
    {
      name: "Morytania/Mos Le'Harmless",
      patterns: ["morytania", "morytanie", "armless", "globino", "fensiv"],
    },
    {
      name: "Piscatoris/Gnome/Tirannwn",
      patterns: ["piscatoris", "nnwn", "tirannwn"],
    },
    { name: "Tuska", patterns: ["tuska", "uska"] },
    { name: "Wilderness", patterns: ["wilderness", "derness", "wild"] },
  ];

  for (const region of regionPatterns) {
    for (const pat of region.patterns) {
      if (inputphrase.includes(pat)) {
        return region.name;
      }
    }
  }

  return "Unknown";
}

/**
 * Extract star size from telescope text (Region A)
 * Handles: Direct numbers (1-10), size descriptions (Small/Big/Average), multi-language
 */
export function extractSize(inputphrase: string): number | string {
  if (!inputphrase) return "Unknown";

  // IMPORTANT: Check German "Größe X" pattern BEFORE normalization
  // This catches OCR errors like "GroRRe 8", "Grol3e 5" before they're translated
  const germanSizePattern =
    /(?:größe|grosse|grösse|grof3e|grol3e|grofte|grofse|gro3e|gro8|grobe|grore|groBe|grorre|grorRe|groRRe)\s*(\d+)/i;
  const germanMatch = inputphrase.match(germanSizePattern);
  if (germanMatch && germanMatch[1]) {
    const sizeNum = parseInt(germanMatch[1], 10);
    if (sizeNum >= 1 && sizeNum <= 10) {
      return sizeNum;
    }
  }

  // Normalize and translate to English
  inputphrase = normalizeOCRText(inputphrase);
  inputphrase = inputphrase.trim().toLowerCase().replace(/\s+/g, " ");

  // Direct size number extraction (e.g., "size 5")
  const sizeMatch = inputphrase.match(/size\s*(\d+)/i);
  if (sizeMatch && sizeMatch[1]) {
    const sizeNum = parseInt(sizeMatch[1], 10);
    if (sizeNum >= 1 && sizeNum <= 10) {
      return sizeNum;
    }
  }

  // Size description matching (normalized to English)
  const lowerText = inputphrase.toLowerCase();

  // Check longer phrases first to avoid partial matches
  if (lowerText.includes("very small")) return "Very small";
  if (lowerText.includes("fairly small")) return "Fairly small";
  if (lowerText.includes("very big")) return "Very big";
  if (lowerText.includes("fairly big")) return "Fairly big";

  // Single word size descriptors
  if (lowerText.includes("small")) return "Small";
  if (lowerText.includes("average")) return "Average";
  if (lowerText.includes("medium")) return "Average";

  // Check for German incomplete "groß aus" (looks big)
  if (lowerText.match(/\blooks\s+big\b/)) return "Big";
  if (lowerText.includes("big")) return "Big";

  // Legacy fallback: "be size X" pattern
  const beSizeIndex = inputphrase.indexOf("be");
  if (beSizeIndex >= 0) {
    const afterBe = inputphrase.substring(beSizeIndex + 2);
    if (afterBe.indexOf("size") === 1) {
      const sizeNum = parseInt(cleanOCRNumbers(afterBe.substring(6)), 10);
      if (!isNaN(sizeNum) && sizeNum >= 1 && sizeNum <= 10) {
        return sizeNum;
      }
    }
  }

  return "Unknown";
}

/**
 * Extract relative time until star from telescope text (Region A)
 * Handles: "X to Y minutes", "X hour Y minutes", multi-language time formats
 */
export function extractRelativeTime(inputphrase: string): number | string {
  if (!inputphrase) return "Unknown";

  // Normalize and translate to English
  inputphrase = normalizeOCRText(inputphrase);

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
  // Also handles: "between 59 minutes and 1 hour 23 minutes" (Portuguese: "entre X minutos e Y hora")
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

  // Direct time range: "33 to 35 minutes" or "56 and 58 minutes"
  // Portuguese: "entre 56 e 58 minutos" becomes "between 56 and 58 minutes"
  let directTimeMatch = norm.match(/(\d+)\s*(?:to|and)\s*(\d+)\s*minut\w*/i);
  if (directTimeMatch) {
    const firstNum = parseInt(directTimeMatch[1], 10);
    const secondNum = parseInt(directTimeMatch[2], 10);
    if (!isNaN(firstNum) && !isNaN(secondNum) && firstNum > 0) {
      return firstNum;
    }
  }

  // Partial time match: "6 to minutes" (OCR missed second number)
  let partialTimeMatch = norm.match(/(\d+)\s*to\s*minut\w*/i);
  if (partialTimeMatch) {
    const firstNum = parseInt(partialTimeMatch[1], 10);
    if (!isNaN(firstNum) && firstNum > 0 && firstNum < 120) {
      return firstNum;
    }
  }

  // Simple pattern: "next X minutes"
  let simpleMatch = norm.match(/next\s*(\d+)\s*minut\w*/i);
  if (simpleMatch && simpleMatch[1]) {
    const minutes = parseInt(simpleMatch[1], 10);
    if (!isNaN(minutes) && minutes > 0 && minutes < 120) {
      return minutes;
    }
  }

  // Complex pattern: "next X hour(s) Y minutes"
  let hourMinuteMatch = norm.match(
    /next\s*([\d\s]+)hours?\s*([\d\s]+)minut\w*/i,
  );
  if (hourMinuteMatch) {
    let nums = (hourMinuteMatch[0].match(/\d+/g) || []).map(Number);
    let hours = nums[0] || 0;
    let minutes = nums[1] || 0;
    if (minutes > 59 && nums.length > 2) {
      minutes = nums[2];
    }
    if (!isNaN(hours) && !isNaN(minutes) && minutes >= 0 && minutes < 60) {
      return hours * 60 + minutes;
    }
  }

  // Fallback: Find any "X minutes" pattern
  let fallbackMinMatch = norm.match(/(\d+)\s*minut\w*/i);
  if (fallbackMinMatch && fallbackMinMatch[1]) {
    const minutes = parseInt(fallbackMinMatch[1], 10);
    if (!isNaN(minutes) && minutes > 0 && minutes < 120) {
      return minutes;
    }
  }

  return "Unknown";
}

// ============================================================================
// MAIN PARSER FUNCTION
// ============================================================================

/**
 * Parse RuneScape shooting star OCR text into structured data
 *
 * @param regionA - OCR text from Region A (star location, size, time)
 * @param world - World number from external source
 * @returns Parsed star call data
 *
 * @example
 * ```typescript
 * // English
 * const result = parseStarOCR(
 *   "You see a shooting star! Size 5 in Asgarnia. 33 to 35 minutes.",
 *   94
 * );
 * // { world: 94, region: "Asgarnia", size: 5, relativeTime: 33 }
 *
 * // German with OCR errors
 * const result = parseStarOCR(
 *   "Du siehst eine Sternschnuppe! Die GroRRe ist 5 in Asgarnia.",
 *   102
 * );
 * // { world: 102, region: "Asgarnia", size: 5, relativeTime: "Unknown" }
 *
 * // Portuguese
 * const result = parseStarOCR(
 *   "Você vê uma estrela cadente! Tamanho grande em Asgarnia.",
 *   251
 * );
 * // { world: 251, region: "Asgarnia", size: "Big", relativeTime: "Unknown" }
 * ```
 */
export function parseStarOCR(
  regionA: string,
  world: number | string,
): StarCallData {
  return {
    world: world,
    region: extractRegion(regionA),
    size: extractSize(regionA),
    relativeTime: extractRelativeTime(regionA),
  };
}

/**
 * Format parsed star data as /call command string
 *
 * @param data - Parsed star call data
 * @returns Formatted /call command string
 *
 * @example
 * ```typescript
 * const data = { world: 94, region: "Asgarnia", size: 5, relativeTime: 33 };
 * const callString = formatStarCall(data);
 * // "/call world: 94 region: Asgarnia size: 5 relative-time: 33"
 * ```
 */
export function formatStarCall(data: StarCallData): string {
  return `/call world: ${data.world} region: ${data.region} size: ${data.size} relative-time: ${data.relativeTime}`;
}

/**
 * Complete OCR processing: raw text → parsed data → formatted string
 *
 * @param regionA - OCR text from Region A
 * @param world - World number from external source
 * @returns Object with raw data, parsed data, and formatted call string
 */
export function processStarOCR(regionA: string, world: number | string) {
  const parsed = parseStarOCR(regionA, world);
  const formatted = formatStarCall(parsed);

  return {
    raw: regionA,
    parsed,
    formatted,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Main functions
  parseStarOCR,
  formatStarCall,
  processStarOCR,

  // Normalization
  normalizeOCRText,

  // Individual extractors
  extractRegion,
  extractSize,
  extractRelativeTime,

  // Utilities
  cleanOCRNumbers,
};
