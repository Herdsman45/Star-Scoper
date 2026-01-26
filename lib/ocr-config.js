/**
 * OCR Configuration
 * Controls language support and recognition settings
 */

const OCR_CONFIG = {
  // Language Configuration
  // Set to true to enable multi-language support (slower but supports FR/PT/DE)
  // Set to false for English-only (faster, smaller memory footprint)
  useMultiLanguage: false,

  // Available languages (requires corresponding .traineddata files in root directory)
  // eng = English (always included)
  // fra = French
  // por = Portuguese
  // deu = German (Deutsch)
  languages: {
    eng: { name: "English", enabled: true },
    fra: { name: "French", enabled: false },
    por: { name: "Portuguese", enabled: false },
    deu: { name: "German", enabled: false },
  },

  // Get active language string for Tesseract (e.g., "eng" or "eng+fra+por+deu")
  getLanguageString() {
    if (!this.useMultiLanguage) {
      return "eng";
    }

    const enabledLangs = Object.keys(this.languages).filter(
      (lang) => this.languages[lang].enabled
    );

    if (enabledLangs.length === 0) {
      console.warn("No languages enabled, defaulting to English");
      return "eng";
    }

    return enabledLangs.join("+");
  },

  // Performance settings
  performance: {
    // Tesseract worker count (1 is usually sufficient for most use cases)
    workerCount: 1,

    // Enable detailed logging
    verboseLogging: false,
  },
};

module.exports = { OCR_CONFIG };
