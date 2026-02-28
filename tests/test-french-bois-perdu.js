/**
 * Test French "Bois perdu" (Lost Grove)
 */

const {
  extractRegion,
  extractSize,
  extractRelativeTime,
} = require("../lib/star-formatter");

console.log("\n=== Testing French 'Bois perdu' ===\n");

const text =
  "Vous voyez une toile ! On dirait que Itoile va toucher le sol au Bois perdu dici 1 heure et 26 minutes a 1 heure et 28 minutes. Ltoile semble tre une toile de taille 6.";

console.log(`Input: "${text}"\n`);

const region = extractRegion(text);
const size = extractSize(text);
const time = extractRelativeTime(text);

console.log(`Extracted region: ${region}`);
console.log(`Extracted size: ${size}`);
console.log(`Extracted time: ${time}\n`);

console.log(`Expected: region=Lost Grove, size=6, time=86`);
console.log(
  `Result: ${region === "Lost Grove" && size === 6 && time === 86 ? "✓ PASS" : "✗ FAIL"}`,
);

console.log("\n=== Test Complete ===\n");
