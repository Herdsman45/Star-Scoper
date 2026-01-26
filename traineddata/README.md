# Tesseract Trained Data Files

This folder contains Tesseract OCR trained data files for multi-language support.

## Required Files

- **eng.traineddata** - English (required, included in repository)
- **fra.traineddata** - French
- **por.traineddata** - Portuguese
- **deu.traineddata** - German

## Download

Download language files from:
https://github.com/tesseract-ocr/tessdata_fast/tree/main

Or use the setup script from the project root:

```bash
node tests/setup-languages.js
```

## Configuration

Enable/disable languages in `lib/ocr-config.js`.

See [../docs/MULTI_LANGUAGE_SETUP.md](../docs/MULTI_LANGUAGE_SETUP.md) for complete setup instructions.

## File Sizes

- eng.traineddata: ~4.96 MB
- fra.traineddata: ~4.96 MB
- por.traineddata: ~4.88 MB
- deu.traineddata: ~15.1 MB

**Note:** German file is larger due to compound word handling.
