/**
 * Test this specific French case
 */

const { parseOCRText, extractRelativeTime } = require("../lib/star-formatter");
const { normalizeMultiLanguageText } = require("../lib/language-mappings");

const testText = `Region A:
Vous voyez une toile !
On dirait que Itoile va toucher le sol a Ashdale dici 1 heure et 16 minutes
a 1 heure et 18 minutes.
Ltoile semble tre une toile de taille 4.


Region B:
RuneScape 118
`;

console.log("Testing French Time Issue\n");
console.log("=" .repeat(60));

const regionA = testText.split("Region B:")[0];

console.log("\nOriginal text:");
console.log(regionA.substring(0, 200));

console.log("\n\nNormalized text:");
const normalized = normalizeMultiLanguageText(regionA);
console.log(normalized.substring(0, 200));

console.log("\n" + "=".repeat(60));
console.log("\n📋 Full Parse Result:");
const result = parseOCRText(testText);
console.log(result);
console.log("\nExpected: /call world: 118 region: Ashdale size: 4 relative-time: 76");
console.log(`${result.includes('76') ? '✓' : '✗'}`);

console.log("\n🔍 Time Extraction:");
const time = extractRelativeTime(regionA);
console.log(`Result: ${time}`);
console.log(`Expected: 76 (1 hour + 16 minutes)`);
console.log(`${time === 76 ? '✓' : '✗'}`);

// Test the specific pattern
console.log("\n🧪 Testing Specific Patterns:\n");
const tests = [
  "dici 1 heure et 16 minutes a 1 heure et 18 minutes",
  "1 heure et 16 minutes",
  "next 1 hour 16 minutes",
];

for (const test of tests) {
  const extractedTime = extractRelativeTime(test);
  console.log(`"${test}"`);
  console.log(`  → ${extractedTime} minutes\n`);
}
