/**
 * Multi-Language OCR Test & Configuration Helper
 * Use this to test different language configurations and benchmark performance
 */

const { OCR_CONFIG } = require("../lib/ocr-config");
const { recognizeText, terminateWorker } = require("../lib/ocr");
const { parseOCRText } = require("../lib/star-formatter");

// Test configurations
const TEST_CONFIGS = {
  englishOnly: {
    useMultiLanguage: false,
  },
  allLanguages: {
    useMultiLanguage: true,
    languages: {
      eng: { name: "English", enabled: true },
      fra: { name: "French", enabled: true },
      por: { name: "Portuguese", enabled: true },
      deu: { name: "German", enabled: true },
    },
  },
  englishAndFrench: {
    useMultiLanguage: true,
    languages: {
      eng: { name: "English", enabled: true },
      fra: { name: "French", enabled: true },
      por: { name: "Portuguese", enabled: false },
      deu: { name: "German", enabled: false },
    },
  },
};

/**
 * Apply a test configuration
 */
function applyConfig(configName) {
  const config = TEST_CONFIGS[configName];
  if (!config) {
    console.error(`Unknown config: ${configName}`);
    console.log(`Available configs: ${Object.keys(TEST_CONFIGS).join(", ")}`);
    return false;
  }

  console.log(`\n📝 Applying configuration: ${configName}`);
  Object.assign(OCR_CONFIG, config);
  console.log(`   Languages: ${OCR_CONFIG.getLanguageString()}`);
  return true;
}

/**
 * Benchmark OCR initialization time
 */
async function benchmarkInit(configName) {
  if (!applyConfig(configName)) return;

  console.log(`\n⏱️  Benchmarking initialization for: ${configName}`);

  // Terminate existing worker to force re-initialization
  await terminateWorker();

  const startTime = Date.now();
  const { getWorker } = require("../lib/ocr");
  await getWorker();
  const endTime = Date.now();

  console.log(`   ✅ Initialization time: ${endTime - startTime}ms`);
  return endTime - startTime;
}

/**
 * Compare all configurations
 */
async function compareAllConfigs() {
  console.log("🔍 Comparing OCR configurations...\n");

  const results = {};

  for (const configName of Object.keys(TEST_CONFIGS)) {
    results[configName] = await benchmarkInit(configName);
    // Wait a bit between tests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("\n📊 Results Summary:");
  console.log("==================");
  for (const [config, time] of Object.entries(results)) {
    console.log(`${config.padEnd(20)}: ${time}ms`);
  }

  const baseline = results.englishOnly;
  console.log("\n📈 Relative Performance:");
  console.log("========================");
  for (const [config, time] of Object.entries(results)) {
    const overhead = ((time - baseline) / baseline) * 100;
    console.log(
      `${config.padEnd(20)}: ${overhead > 0 ? "+" : ""}${overhead.toFixed(1)}%`
    );
  }

  await terminateWorker();
}

/**
 * Test translation mappings
 */
function testTranslations() {
  const { normalizeMultiLanguageText } = require("../lib/language-mappings");

  console.log("\n🌍 Testing Translation Mappings:");
  console.log("================================\n");

  const testPhrases = [
    "très petit",
    "assez grande",
    "désert kharidien",
    "muito pequeno",
    "sehr groß",
    "nächste 45 minuten",
    "prochaine heure",
  ];

  for (const phrase of testPhrases) {
    const normalized = normalizeMultiLanguageText(phrase);
    console.log(`"${phrase}" → "${normalized}"`);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || "help";

  switch (command) {
    case "benchmark":
      const config = args[1] || "englishOnly";
      benchmarkInit(config).then(() => process.exit(0));
      break;

    case "compare":
      compareAllConfigs().then(() => process.exit(0));
      break;

    case "translate":
      testTranslations();
      process.exit(0);
      break;

    case "status":
      console.log("\n📋 Current OCR Configuration:");
      console.log("============================");
      console.log(`Multi-language: ${OCR_CONFIG.useMultiLanguage}`);
      console.log(`Languages: ${OCR_CONFIG.getLanguageString()}`);
      console.log("\nEnabled Languages:");
      for (const [code, lang] of Object.entries(OCR_CONFIG.languages)) {
        if (lang.enabled) {
          console.log(`  ✓ ${code} - ${lang.name}`);
        }
      }
      process.exit(0);
      break;

    case "help":
    default:
      console.log("\n🛠️  Multi-Language OCR Test Tool");
      console.log("================================\n");
      console.log("Usage: node test-languages.js <command>\n");
      console.log("Commands:");
      console.log("  status              - Show current OCR configuration");
      console.log("  benchmark [config]  - Benchmark a specific configuration");
      console.log("  compare             - Compare all configurations");
      console.log("  translate           - Test translation mappings");
      console.log("  help                - Show this help\n");
      console.log("Available configs:");
      for (const name of Object.keys(TEST_CONFIGS)) {
        console.log(`  - ${name}`);
      }
      process.exit(0);
  }
}

module.exports = {
  applyConfig,
  benchmarkInit,
  compareAllConfigs,
  testTranslations,
  TEST_CONFIGS,
};
