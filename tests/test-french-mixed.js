/**
 * Test French mixed minute-to-hour pattern
 */

const { parseOCRText, extractRelativeTime } = require("../lib/star-formatter");

const testText = `Region A:
Vous voyez une toile !
On dirait que Itoile va toucher le sol dans le desert kharidien dici 57
minutes a 1 heure et 21 minutes.
Ltoile semble petite.


Region B:
RuneScape 55
`;

console.log("Testing French Mixed Time Pattern\n");
console.log("=" .repeat(60));

// Test full parsing
console.log("\n📋 Full Parse Result:");
const result = parseOCRText(testText);
console.log(result);
console.log("\nExpected: /call world: 55 region: Kharidian Desert size: Small relative-time: 57");
console.log(`${result.includes('57') ? '✓' : '✗'}`);

// Test time extraction
const regionA = testText.split("Region B:")[0];

console.log("\n" + "=".repeat(60));
console.log("\n🔍 Time Extraction:\n");
console.log("Text: 'dici 57 minutes a 1 heure et 21 minutes'");
const time = extractRelativeTime(regionA);
console.log(`  Result: ${time}`);
console.log(`  Expected: 57 (lower bound)`);
console.log(`  ✓ ${time === 57 ? "PASS" : "FAIL"}`);

// Test various mixed patterns
console.log("\n🧪 Testing Mixed Time Patterns:\n");
const timeVariations = [
  { text: "57 minutes a 1 heure et 21 minutes", expected: 57 },
  { text: "45 minutes to 1 hour and 15 minutes", expected: 45 },
  { text: "30 minutos a 1 hora e 35 minutos", expected: 30 },
  { text: "1 heure et 30 minutes", expected: 90 },  // Pure hour+minute should still work
  { text: "50 to 52 minutes", expected: 50 },       // Pure minute range
];

for (const test of timeVariations) {
  const extractedTime = extractRelativeTime(test.text);
  const pass = extractedTime === test.expected;
  console.log(`"${test.text}"`);
  console.log(`  → ${extractedTime} minutes (expected: ${test.expected}) ${pass ? "✓" : "✗"}\n`);
}
