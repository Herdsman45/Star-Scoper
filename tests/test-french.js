/**
 * Test French time patterns
 */

const { parseOCRText, extractRelativeTime } = require("../lib/star-formatter");

const testText1 = `Region A:
Vous voyez une toile !
On dirait que Itoile va toucher le sol dans le desert kharidien dici 1 heure
et 44 minutes a 1 heure et 46 minutes.
Ltoile semble tre une toile de taille 3.


Region B:
RuneScape 55
`;

const testText2 = `Region A:
Vous voyez une toile !
On dirait que Itoile va toucher le sol a Ashdale dici 1 heure et 47 minutes
a 1 heure et 49 minutes.
Ltoile semble tre une toile de taille 4.


Region B:
RuneScape 118
`;

console.log("Testing French Hour+Minute Patterns\n");
console.log("=" .repeat(60));

// Test 1
console.log("\n📋 Test 1:");
const result1 = parseOCRText(testText1);
console.log(result1);
console.log("Expected: /call world: 55 region: Kharidian Desert size: 3 relative-time: 104");
console.log(`(1 heure + 44 minutes = 104 minutes) ${result1.includes('104') ? '✓' : '✗'}`);

// Test 2
console.log("\n📋 Test 2:");
const result2 = parseOCRText(testText2);
console.log(result2);
console.log("Expected: /call world: 118 region: Ashdale size: 4 relative-time: 107");
console.log(`(1 heure + 47 minutes = 107 minutes) ${result2.includes('107') ? '✓' : '✗'}`);

// Test various French patterns
console.log("\n" + "=".repeat(60));
console.log("\n🧪 Testing French Time Patterns:\n");
const timeVariations = [
  { text: "dici 1 heure et 44 minutes", expected: 104 },
  { text: "dans 1 heure et 47 minutes", expected: 107 },
  { text: "2 heures et 30 minutes", expected: 150 },
  { text: "3 heures et 15 minutes", expected: 195 },
];

for (const test of timeVariations) {
  const extractedTime = extractRelativeTime(test.text);
  const pass = extractedTime === test.expected;
  console.log(`"${test.text}"`);
  console.log(`  → ${extractedTime} minutes (expected: ${test.expected}) ${pass ? "✓" : "✗"}\n`);
}
