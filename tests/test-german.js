/**
 * Test German OCR extraction with real example
 */

const { extractSize, extractRelativeTime, extractRegion, parseOCRText } = require("../lib/star-formatter");

// Real German OCR text from user
const germanText = `Region A:
Du siehst eine Sternschnuppe!
Die Sternschnuppe wird wohl in den nachsten 15 bis 17 Minuten in
Piscatoris der GnomenFestung oder Tirannwn landen.
Die Sternschnuppe scheint die Grof3e 3 zu haben.


Region B:
RuneScape102
`;

console.log("Testing German OCR Text Extraction\n");
console.log("=" .repeat(60));
console.log("\nRaw Text:");
console.log(germanText);
console.log("\n" + "=".repeat(60));

// Test full parsing
console.log("\n📋 Full Parse Result:");
const result = parseOCRText(germanText);
console.log(result);

// Test individual extractions
const regionA = germanText.split("Region B:")[0];
const regionB = germanText.split("Region B:")[1];

console.log("\n" + "=".repeat(60));
console.log("\n🔍 Individual Extractions:\n");

console.log("Region A Text:", regionA.substring(0, 100) + "...");
console.log("\nSize extraction:");
const size = extractSize(regionA);
console.log(`  Result: ${size}`);
console.log(`  Expected: 3`);
console.log(`  ✓ ${size === 3 ? "PASS" : "FAIL"}`);

console.log("\nTime extraction:");
const time = extractRelativeTime(regionA);
console.log(`  Result: ${time}`);
console.log(`  Expected: 15 (not 17)`);
console.log(`  ✓ ${time === 15 ? "PASS" : "FAIL"}`);

console.log("\nRegion extraction:");
const region = extractRegion(regionA);
console.log(`  Result: ${region}`);
console.log(`  Expected: Piscatoris/Gnome/Tirannwn`);
console.log(`  ✓ ${region === "Piscatoris/Gnome/Tirannwn" ? "PASS" : "FAIL"}`);

console.log("\nRegion B Text:", regionB.trim());
console.log("\n" + "=".repeat(60));

// Test various German size OCR errors
console.log("\n🧪 Testing German Size Pattern Variations:\n");
const sizeVariations = [
  "Die Sternschnuppe scheint die Größe 5 zu haben",
  "Die Sternschnuppe scheint die Grosse 7 zu haben",
  "Die Sternschnuppe scheint die Grof3e 3 zu haben", // User's actual OCR
  "Die Sternschnuppe scheint die Grofte 9 zu haben",
  "Die Sternschnuppe scheint die Grofse 4 zu haben",
];

for (const text of sizeVariations) {
  const extractedSize = extractSize(text);
  console.log(`"${text}"`);
  console.log(`  → Size: ${extractedSize}\n`);
}

// Test German time patterns
console.log("\n🧪 Testing German Time Pattern Variations:\n");
const timeVariations = [
  "in den nächsten 15 bis 17 Minuten",
  "in den nachsten 15 bis 17 Minuten", // OCR without umlaut
  "in den nächsten 30 bis 32 Minuten",
  "in den nächsten 5 bis 7 Minuten",
];

for (const text of timeVariations) {
  const extractedTime = extractRelativeTime(text);
  console.log(`"${text}"`);
  console.log(`  → Time: ${extractedTime} minutes\n`);
}
