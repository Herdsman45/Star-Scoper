/**
 * Test German OCR errors: GroRRe and incomplete "gro aus"
 */

const { extractSize, extractRelativeTime } = require("../lib/star-formatter");

console.log("\n=== Testing German OCR Errors ===\n");

// Test 1: GroRRe 8 (capital R, double R)
console.log("Test 1: GroRRe 8");
const text1 = "Die Sternschnuppe scheint die GroRRe 8 zu haben.";
const size1 = extractSize(text1);
console.log(`  Input: "${text1}"`);
console.log(`  Extracted size: ${size1}`);
console.log(`  Expected: 8`);
console.log(`  Result: ${size1 === 8 ? "✓ PASS" : "✗ FAIL"}\n`);

// Test 2: "gro aus" (incomplete groß = big)
console.log("Test 2: gro aus (incomplete groß)");
const text2 = "Die Sternschnuppe sieht gro aus.";
const size2 = extractSize(text2);
console.log(`  Input: "${text2}"`);
console.log(`  Extracted size: ${size2}`);
console.log(`  Expected: Big`);
console.log(`  Result: ${size2 === "Big" ? "✓ PASS" : "✗ FAIL"}\n`);

// Test 3: Full first example with time
console.log("Test 3: Full first example");
const text3 =
  "Die Sternschnuppe wird wohl in 1 Stunde und 35 Minuten bis 1 Stunde und 37 Minuten in Kandarin landen. Die Sternschnuppe scheint die GroRRe 8 zu haben.";
const size3 = extractSize(text3);
const time3 = extractRelativeTime(text3);
console.log(`  Input: "${text3}"`);
console.log(`  Extracted size: ${size3}`);
console.log(`  Extracted time: ${time3}`);
console.log(`  Expected size: 8, time: 95`);
console.log(`  Result: ${size3 === 8 && time3 === 95 ? "✓ PASS" : "✗ FAIL"}\n`);

// Test 4: Full second example with time
console.log("Test 4: Full second example");
const text4 =
  "Die Sternschnuppe wird wohl in 1 Stunde und 33 Minuten bis 1 Stunde und 57 Minuten in Kandarin landen. Die Sternschnuppe sieht gro aus.";
const size4 = extractSize(text4);
const time4 = extractRelativeTime(text4);
console.log(`  Input: "${text4}"`);
console.log(`  Extracted size: ${size4}`);
console.log(`  Extracted time: ${time4}`);
console.log(`  Expected size: Big, time: 93`);
console.log(
  `  Result: ${size4 === "Big" && time4 === 93 ? "✓ PASS" : "✗ FAIL"}\n`,
);

console.log("=== Test Complete ===\n");
