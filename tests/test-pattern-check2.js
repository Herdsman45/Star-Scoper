const before = "dici 1 hour et ";
console.log('Before text:', JSON.stringify(before));

// We need to check if there's a "digit hour" pattern, not "hour digit"
// The pattern should be: digit followed by hour word
const hasDigitHourBefore = /\d+\s*(?:hour|heure|hora|stunde)[s]?/i.test(before);
console.log('Has digit-hour before:', hasDigitHourBefore);

// Test with the correct match
console.log('Match:', before.match(/\d+\s*(?:hour|heure|hora|stunde)[s]?/i));
