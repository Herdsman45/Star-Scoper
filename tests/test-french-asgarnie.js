/**
 * Test French OCR error: Asgarnie instead of Asgarnia
 */

const {
  extractRegion,
  extractSize,
  extractRelativeTime,
} = require("../lib/star-formatter");

console.log("\n=== Testing French Asgarnie OCR Error ===\n");

const text =
  "Vous voyez une toile ! On dirait que Itoile va toucher le sol en Asgarnie dici 1 heure et 35 minutes a 1 heure et 59 minutes. Ltoile semble petite.";

console.log(`Input: "${text}"\n`);

const region = extractRegion(text);
const size = extractSize(text);
const time = extractRelativeTime(text);

console.log(`Extracted region: ${region}`);
console.log(`Extracted size: ${size}`);
console.log(`Extracted time: ${time}\n`);

console.log(`Expected: region=Asgarnia, size=Small, time=95`);
console.log(
  `Result: ${region === "Asgarnia" && size === "Small" && time === 95 ? "✓ PASS" : "✗ FAIL"}`,
);

console.log("\n=== Test Complete ===\n");
