/**
 * Icon Generator Script
 *
 * This script generates application icons in multiple formats and sizes
 * required by Electron for Windows, macOS, and Linux platforms.
 *
 * It uses electron-icon-builder to:
 * - Create .ico files for Windows
 * - Create .icns files for macOS
 * - Create multiple sized PNG files for all platforms
 *
 * Usage: node scripts/generate-icons.js
 *
 * Requirements:
 * - A source PNG image at build/icon.png (should be at least 1024x1024 pixels)
 *
 * Output:
 * - Windows ICO file: build/icons/win/icon.ico (copied to build/icon.ico)
 * - macOS ICNS file: build/icons/mac/icon.icns
 * - Multiple PNG files in various sizes: build/icons/png/
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("Installing electron-icon-builder...");

try {
  // Install electron-icon-builder
  execSync("npm install --no-save electron-icon-builder");

  console.log("Creating temporary package.json script...");

  // Read the current package.json
  const packageJsonPath = path.join(__dirname, "..", "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  // Save original scripts
  const originalScripts = { ...packageJson.scripts };

  // Add the icon script
  packageJson.scripts = {
    ...packageJson.scripts,
    "generate-icons":
      "electron-icon-builder --input=./build/icon.png --output=./build",
  };

  // Write modified package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  console.log("Running icon generation...");
  execSync("npm run generate-icons", { stdio: "inherit" });

  console.log("Restoring original package.json...");
  // Restore original scripts
  packageJson.scripts = originalScripts;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  // Copy the icons to their proper locations
  console.log("Copying icons to standard locations...");

  // Make sure the ico file is in the build directory
  fs.copyFileSync(
    path.join(__dirname, "..", "build", "icons", "win", "icon.ico"),
    path.join(__dirname, "..", "build", "icon.ico")
  );

  // Make sure the icns file is in the build directory
  fs.copyFileSync(
    path.join(__dirname, "..", "build", "icons", "mac", "icon.icns"),
    path.join(__dirname, "..", "build", "icon.icns")
  );

  console.log("Icon generation complete!");
} catch (err) {
  console.error("Error:", err.message || err);
  process.exit(1);
}
