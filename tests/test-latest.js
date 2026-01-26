/**
 * Test latest OCR issue
 */

const { parseOCRText, extractWorldNumber, extractSize } = require("../lib/star-formatter");

const testText = `Region A:
Du siehst eine Sternschnuppe!
Die Sternschnuppe wird wohl in den nachsten 9 bis 11 Minuten in Piscatoris
der GnomenFestung oder Tirannwn landen.
Die Sternschnuppe scheint die GroRe 4 zu haben.


Region B:
RuneScapei21
`;

console.log("Testing Latest OCR Issues\n");
console.log("=" .repeat(60));

// Test full parsing
console.log("\n📋 Full Parse Result:");
const result = parseOCRText(testText);
console.log(result);
console.log("\nExpected: /call world: 121 region: Piscatoris/Gnome/Tirannwn size: 4 relative-time: 9");

// Test individual extractions
const regionB = "RuneScapei21";
console.log("\n" + "=".repeat(60));
console.log("\n🔍 Individual Tests:\n");

console.log("World extraction from:", regionB);
const world = extractWorldNumber(regionB);
console.log(`  Result: ${world}`);
console.log(`  Expected: 121`);
console.log(`  ✓ ${world === 121 ? "PASS" : "FAIL"}`);

console.log("\nSize extraction from: 'Die Sternschnuppe scheint die GroRe 4 zu haben'");
const size = extractSize("Die Sternschnuppe scheint die GroRe 4 zu haben");
console.log(`  Result: ${size}`);
console.log(`  Expected: 4`);
console.log(`  ✓ ${size === 4 ? "PASS" : "FAIL"}`);

// Test various 'i' as '1' patterns
console.log("\n🧪 Testing World Number with 'i' as '1':\n");
const worldVariations = [
  "RuneScapei21",
  "RuneScape i21",
  "RuneScapeil2",
  "RuneScapei2i",
];

for (const text of worldVariations) {
  const extractedWorld = extractWorldNumber(text);
  console.log(`"${text}" → World: ${extractedWorld}`);
}
