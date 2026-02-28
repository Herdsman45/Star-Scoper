# Test Files

This folder contains all test files for the Star Scoper OCR application.

## Running Tests

From the project root, run individual test files:

```bash
node tests/test-german.js
node tests/test-french.js
node tests/test-portuguese.js
node tests/test-languages.js
```

## Test Files

### Language-Specific Tests

- **test-german.js** - German OCR pattern tests (Größe, Stunden und Minuten)
- **test-french.js** - French OCR pattern tests (heures et minutes)
- **test-portuguese.js** - Portuguese OCR pattern tests (horas e minutos)
- **test-french-mixed.js** - French mixed time patterns (minutes to hours)
- **test-debug-french.js** - Debug script for French edge cases
- **test-portuguese-size.js** - Portuguese size descriptor tests

### General Tests

- **test-languages.js** - Multi-language comparison and benchmarking
- **test-latest.js** - Latest feature tests
- **test-german-time.js** - German time-specific tests

### Debug/Utility Tests

- **test-pattern-check.js** - Pattern matching debug script
- **test-pattern-check2.js** - Additional pattern testing
- **test-trace-minutes.js** - Minute pattern tracing
- **test-trace-pattern.js** - General pattern tracing

### Setup

- **setup-languages.js** - Download and setup language traineddata files

## Test Data

All test files use sample OCR outputs from RuneScape telescope text in various languages to verify pattern matching and extraction accuracy.
