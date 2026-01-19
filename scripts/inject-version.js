// Script to inject version from package.json into renderer.js before build
const fs = require("fs");
const path = require("path");

// Read package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"),
);
const version = packageJson.version;

// Read renderer.js
const rendererPath = path.join(__dirname, "..", "renderer.js");
let rendererContent = fs.readFileSync(rendererPath, "utf8");

// Replace hardcoded version with actual version from package.json
// Look for: versionElement.textContent = "0.3.2";
// Replace with: versionElement.textContent = "X.Y.Z";
const versionRegex = /(versionElement\.textContent = ")[^"]+(")/;
const newContent = rendererContent.replace(versionRegex, `$1${version}$2`);

// Write back
fs.writeFileSync(rendererPath, newContent, "utf8");
console.log(`✓ Injected version ${version} into renderer.js`);
