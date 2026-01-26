/**
 * Language Mappings for OCR Text Recognition
 * Maps non-English words to their English equivalents for star call parsing
 */

const LANGUAGE_MAPPINGS = {
  // Region name translations
  regions: {
    // French
    désert: "desert",
    "désert kharidien": "desert",
    "collines feldip": "feldip",
    "île lunaire": "lunar",
    "désert sauvage": "wilderness",
    sauvage: "wilderness",
    "bocage perdu": "grove",
    "bosquet perdu": "grove",

    // Portuguese
    deserto: "desert",
    "deserto kharidiano": "desert",
    "colinas feldip": "feldip",
    "ilha lunar": "lunar",
    "ermo selvagem": "wilderness",
    selvagem: "wilderness",
    "bosque perdido": "grove",

    // German
    wüste: "desert",
    "kharidianische wüste": "desert",
    "feldip-hügel": "feldip",
    mondinsel: "lunar",
    wildnis: "wilderness",
    "verlorener hain": "grove",
  },

  // Size descriptor translations
  sizes: {
    // French
    "très petit": "very small",
    "très petite": "very small",
    "assez petit": "fairly small",
    "assez petite": "fairly small",
    petit: "small",
    petite: "small",
    moyen: "average",
    moyenne: "average",
    grand: "big",
    grande: "big",
    "assez grand": "fairly big",
    "assez grande": "fairly big",
    "très grand": "very big",
    "très grande": "very big",

    // Portuguese
    "muito pequeno": "very small",
    "muito pequena": "very small",
    "razoavelmente pequeno": "fairly small",
    "razoavelmente pequena": "fairly small",
    pequeno: "small",
    pequena: "small",
    médio: "average",
    média: "average",
    medio: "average",  // Without accent
    media: "average",  // Without accent
    grande: "big",
    "razoavelmente grande": "fairly big",
    "muito grande": "very big",

    // German
    "sehr klein": "very small",
    "ziemlich klein": "fairly small",
    klein: "small",
    durchschnittlich: "average",
    mittel: "average",
    "groß": "big",
    "gross": "big", // Alternative spelling without umlaut
    "ziemlich groß": "fairly big",
    "ziemlich gross": "fairly big",
    "sehr groß": "very big",
    "sehr gross": "very big",
  },

  // Time-related words
  time: {
    // French
    minutes: "minutes",
    minute: "minute",
    heure: "hour",
    heures: "hours",
    prochain: "next",
    prochaine: "next",

    // Portuguese
    minutos: "minutes",
    minuto: "minute",
    hora: "hour",
    horas: "hours",
    próximo: "next",
    próxima: "next",

    // German
    minuten: "minutes",
    minute: "minute",
    stunde: "hour",
    stunden: "hours",
    nächste: "next",
    nächsten: "next",
    nachsten: "next", // OCR error: missing umlaut
    bis: "to", // German "to" in time ranges
  },

  // Size-related words (for pattern matching)
  sizeWords: {
    // German - handle various OCR errors for "Größe" (size)
    "größe": "size",
    "grosse": "size",
    "grösse": "size",
    "grof3e": "size", // Common OCR error: ß -> f3
    "grofte": "size", // Common OCR error: ß -> ft
    "grofse": "size", // Common OCR error: ß -> fs
    "gro3e": "size",  // OCR error
    "grobe": "size",  // OCR error
    "grore": "size",  // OCR error: ß -> R
    "groBe": "size",  // OCR error: ß -> B
    "scheint": "seems", // German context word
    "haben": "have",   // German context word
    
    // French
    "taille": "size",
    
    // Portuguese
    "tamanho": "size",
  },
};

/**
 * Normalize OCR text by translating non-English words to English
 * @param {string} text - Raw OCR text (possibly in multiple languages)
 * @returns {string} - Normalized text with English equivalents
 */
function normalizeMultiLanguageText(text) {
  if (!text) return "";

  let normalized = text;

  // Apply all mappings
  const allMappings = {
    ...LANGUAGE_MAPPINGS.regions,
    ...LANGUAGE_MAPPINGS.sizes,
    ...LANGUAGE_MAPPINGS.time,
    ...LANGUAGE_MAPPINGS.sizeWords,
  };

  // Sort by length (longest first) to avoid partial replacements
  const sortedKeys = Object.keys(allMappings).sort((a, b) => b.length - a.length);

  for (const foreignWord of sortedKeys) {
    const englishWord = allMappings[foreignWord];
    // Use word boundaries when possible
    // Case-insensitive replacement
    const regex = new RegExp(escapeRegex(foreignWord), "gi");
    normalized = normalized.replace(regex, englishWord);
  }

  return normalized;
}

/**
 * Escape special regex characters
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  LANGUAGE_MAPPINGS,
  normalizeMultiLanguageText,
};
