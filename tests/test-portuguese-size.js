/**
 * Test Portuguese size issue
 */

const { parseOCRText, extractSize } = require("../lib/star-formatter");

const testText = `Region A:
Voce ve uma estrela cadente!
Parece que a estrela vai cair em na Terra Selvagem entre 1 hora e 15
minutos e 1 hora e 39 minutos.
A estrela parece ter um tamanho medio.


Region B:
RuneScape 47
`;

console.log("Testing Portuguese Size Extraction\n");
console.log("=" .repeat(60));

// Test full parsing
console.log("\n📋 Full Parse Result:");
const result = parseOCRText(testText);
console.log(result);
console.log("\nExpected: /call world: 47 region: Wilderness size: Average relative-time: 75");
console.log(`${result.includes('Average') ? '✓' : '✗'}`);

// Test size extraction
const regionA = testText.split("Region B:")[0];

console.log("\n" + "=".repeat(60));
console.log("\n🔍 Size Extraction:\n");
console.log("Text: 'A estrela parece ter um tamanho medio'");
const size = extractSize(regionA);
console.log(`  Result: ${size}`);
console.log(`  Expected: Average`);
console.log(`  ✓ ${size === "Average" ? "PASS" : "FAIL"}`);

// Test various Portuguese size variations
console.log("\n🧪 Testing Portuguese Size Patterns:\n");
const sizeVariations = [
  { text: "A estrela parece ter um tamanho médio", expected: "Average" },
  { text: "A estrela parece ter um tamanho medio", expected: "Average" },
  { text: "A estrela parece ser muito pequena", expected: "Very small" },
  { text: "A estrela parece ser muito grande", expected: "Very big" },
  { text: "A estrela parece ser pequena", expected: "Small" },
  { text: "A estrela parece ser grande", expected: "Big" },
  { text: "A estrela parece ser de tamanho 5", expected: 5 },
];

for (const test of sizeVariations) {
  const extractedSize = extractSize(test.text);
  const pass = extractedSize === test.expected;
  console.log(`"${test.text}"`);
  console.log(`  → Size: ${extractedSize} (expected: ${test.expected}) ${pass ? "✓" : "✗"}\n`);
}
