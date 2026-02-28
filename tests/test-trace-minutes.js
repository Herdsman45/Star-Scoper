const { normalizeMultiLanguageText } = require('../lib/language-mappings');

const original = "dici 1 heure et 16 minutes a 1 heure et 18 minutes";
const norm = normalizeMultiLanguageText(original);

console.log('Normalized:', norm);
console.log('');

// Test minutesToHourPattern
const minutesToHourPattern = /\b(\d+)\s*minut\w*\s*(?:a|to)\s*\d+\s*(?:heures?|horas?|hours?)/i;
const minutesMatch = norm.match(minutesToHourPattern);

console.log('Minutes-to-hour pattern:', minutesToHourPattern.source);
console.log('Match result:', minutesMatch);

if (minutesMatch) {
  console.log('Full match:', minutesMatch[0]);
  console.log('Minutes:', minutesMatch[1]);
  console.log('Index:', minutesMatch.index);
  
  // Check what's before the match
  const matchIndex = minutesMatch.index;
  const before = norm.substring(Math.max(0, matchIndex - 15), matchIndex);
  console.log('Text before match:', JSON.stringify(before));
  console.log('Has hour before:', /(?:hour|heure|hora|stunde)[s]?\s+\d+\s*$/i.test(before));
}
