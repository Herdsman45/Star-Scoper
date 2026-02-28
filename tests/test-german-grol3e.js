/**
 * Test German OCR error: Grol3e (with lowercase L and 3)
 */

const {
  extractSize,
  extractRelativeTime,
  extractRegion,
} = require("../lib/star-formatter");

console.log("\n=== Testing German 'Grol3e 8' ===\n");

const text =
  "Du siehst eine Sternschnuppe! Die Sternschnuppe wird wohl in 1 Stunde und 7 Minuten bis 1 Stunde und 9 Minuten in Kandarin landen. Die Sternschnuppe scheint die Grol3e 8 zu haben.";

console.log(`Input: "${text}"\n`);

const region = extractRegion(text);
const size = extractSize(text);
const time = extractRelativeTime(text);

console.log(`Extracted region: ${region}`);
console.log(`Extracted size: ${size}`);
console.log(`Extracted time: ${time}\n`);

console.log(`Expected: region=Kandarin, size=8, time=67`);
console.log(
  `Result: ${region === "Kandarin" && size === 8 && time === 67 ? "✓ PASS" : "✗ FAIL"}`,
);

console.log("\n=== Test Complete ===\n");
