/**
 * Test Portuguese time patterns
 */

const { parseOCRText, extractRelativeTime } = require("../lib/star-formatter");

const testText = `Region A:
Voce ve uma estrela cadente!
Parece que a estrela vai cair em na Terra Selvagem entre 1 hora e 36
minutos e 1 hora e 38 minutos.
A estrela parece ser de tamanho 4.


Region B:
RuneScape 94
`;

console.log("Testing Portuguese Hour+Minute Pattern\n");
console.log("=" .repeat(60));

// Test full parsing
console.log("\n📋 Full Parse Result:");
const result = parseOCRText(testText);
console.log(result);
console.log("\nExpected: /call world: 94 region: Wilderness size: 4 relative-time: 96");
console.log(`(1 hora e 36 minutos = 96 minutes) ${result.includes('96') ? '✓' : '✗'}`);

// Test various Portuguese patterns
console.log("\n" + "=".repeat(60));
console.log("\n🧪 Testing Portuguese Time Patterns:\n");
const timeVariations = [
  { text: "1 hora e 36 minutos", expected: 96 },
  { text: "1 hora e 45 minutos", expected: 105 },
  { text: "2 horas e 30 minutos", expected: 150 },
  { text: "3 horas e 15 minutos", expected: 195 },
];

for (const test of timeVariations) {
  const extractedTime = extractRelativeTime(test.text);
  const pass = extractedTime === test.expected;
  console.log(`"${test.text}"`);
  console.log(`  → ${extractedTime} minutes (expected: ${test.expected}) ${pass ? "✓" : "✗"}\n`);
}

// Compare all three languages
console.log("\n" + "=".repeat(60));
console.log("\n🌍 Multi-Language Comparison:\n");

const multiLang = [
  { lang: "German", text: "2 Stunden und 15 Minuten", expected: 135 },
  { lang: "French", text: "2 heures et 15 minutes", expected: 135 },
  { lang: "Portuguese", text: "2 horas e 15 minutos", expected: 135 },
  { lang: "English", text: "2 hours and 15 minutes", expected: 135 },
];

for (const test of multiLang) {
  const extractedTime = extractRelativeTime(test.text);
  const pass = extractedTime === test.expected;
  console.log(`${test.lang.padEnd(12)}: "${test.text}" → ${extractedTime} ${pass ? "✓" : "✗"}`);
}
