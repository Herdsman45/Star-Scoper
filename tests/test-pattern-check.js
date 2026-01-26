const before = "dici 1 hour et ";
console.log('Before text:', JSON.stringify(before));

// Current test
const hasHourDigitBefore = /(?:hour|heure|hora|stunde)[s]?\s+.*\d+\s*$/i.test(before);
console.log('Has hour-digit before:', hasHourDigitBefore);

// Breaking it down
console.log('Has hour word:', /(?:hour|heure|hora|stunde)/i.test(before));
console.log('Has digit:', /\d/.test(before));
console.log('Pattern breakdown:', before.match(/(?:hour|heure|hora|stunde)[s]?\s+.*\d+\s*$/i));
