# Security Policy

## Supported Versions

Currently, only the latest version of Star Scoper OCR is actively maintained and receives security updates.

| Version  | Supported          |
| -------- | ------------------ |
| Latest   | :white_check_mark: |
| < Latest | :x:                |

## Privacy Statement

Star Scoper OCR is designed with privacy and security in mind:

- **No Data Collection**: The application does not collect any user data
- **No Network Communication**: The application does not send any data over the network
- **Local Processing**: All OCR and image processing happens locally on your device

## Reporting a Vulnerability

If you discover a security vulnerability within Star Scoper OCR, please submit an issue with the label "security" on our GitHub repository.

We take security issues seriously and will address them promptly.

## Security Features

The application implements several security measures:

- Content Security Policy (CSP) to prevent code injection
- No remote code execution
- No use of dangerous APIs like `eval()`
- No external dependencies loaded at runtime

## Security Recommendations

For the most secure experience, we recommend:

1. Always download from the official GitHub releases page
2. Keep the application updated to the latest version
3. If building from source, verify the integrity of the source code
4. Run the application with standard user privileges (not administrator/root)
