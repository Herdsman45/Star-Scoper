const { normalizeMultiLanguageText } = require('../lib/language-mappings');

const original = "dici 1 heure et 16 minutes a 1 heure et 18 minutes";
const norm = normalizeMultiLanguageText(original);

console.log('Original:', original);
console.log('Normalized:', norm);
console.log('');

// Test romance pattern directly
const romanceHourMinPattern = /(\d+)\s*(?:heures?|horas?|hours?)\s*(?:et?|and)\s*(\d+)\s*minut\w*/i;
const match = norm.match(romanceHourMinPattern);

console.log('Romance pattern:', romanceHourMinPattern.source);
console.log('Match result:', match);

if (match) {
  console.log('Full match:', match[0]);
  console.log('Hour:', match[1]);
  console.log('Minutes:', match[2]);
  console.log('Calculated:', parseInt(match[1]) * 60 + parseInt(match[2]));
} else {
  console.log('NO MATCH!');
}

// Check if "et" survived normalization
console.log('');
console.log('Contains "et":', norm.includes('et'));
console.log('Contains "1 hour et":', norm.includes('1 hour et'));
