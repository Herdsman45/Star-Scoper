/**
 * Test latest German time pattern
 */

const { parseOCRText, extractRelativeTime } = require("../lib/star-formatter");

const testText = `Region A:
Du siehst eine Sternschnuppe!
Die Sternschnuppe wird wohl in den nachsten 2 Stunden und 1 Minuten bis 2
Stunden und 3 Minuten im Land der Fremennik oder auf der Mondinsel
landen.


Region B:
RuneScape102
`;

console.log("Testing German Hour+Minute Pattern\n");
console.log("=" .repeat(60));

// Test full parsing
console.log("\n📋 Full Parse Result:");
const result = parseOCRText(testText);
console.log(result);
console.log("\nExpected: /call world: 102 region: Fremennik/Lunar Isle size: Unknown relative-time: 121");
console.log("(2 hours 1 minute = 121 minutes)");

// Test time extraction
const regionA = testText.split("Region B:")[0];

console.log("\n" + "=".repeat(60));
console.log("\n🔍 Time Extraction:\n");
console.log("Text: 'in den nachsten 2 Stunden und 1 Minuten...'");
const time = extractRelativeTime(regionA);
console.log(`  Result: ${time}`);
console.log(`  Expected: 121 (2 hours × 60 + 1 minute)`);
console.log(`  ✓ ${time === 121 ? "PASS" : "FAIL"}`);

// Test various German hour+minute patterns
console.log("\n🧪 Testing German Hour+Minute Patterns:\n");
const timeVariations = [
  { text: "in den nächsten 2 Stunden und 1 Minuten", expected: 121 },
  { text: "in den nachsten 2 Stunden und 1 Minuten", expected: 121 },
  { text: "in den nächsten 1 Stunde und 30 Minuten", expected: 90 },
  { text: "in den nächsten 3 Stunden und 15 Minuten", expected: 195 },
  { text: "next 2 hours and 5 minutes", expected: 125 },
];

for (const test of timeVariations) {
  const extractedTime = extractRelativeTime(test.text);
  const pass = extractedTime === test.expected;
  console.log(`"${test.text}"`);
  console.log(`  → ${extractedTime} minutes (expected: ${test.expected}) ${pass ? "✓" : "✗"}\n`);
}
