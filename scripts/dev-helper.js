#!/usr/bin/env node

/**
 * Development helper script for Star Scoper
 * Run with: node scripts/dev-helper.js [command]
 *
 * Available commands:
 * - clean: Clean build artifacts
 * - prepare-release: Update version numbers and prepare for release
 * - check: Run pre-flight checks for a build
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const packageJson = require("../package.json");

const COMMANDS = {
  CLEAN: "clean",
  PREPARE_RELEASE: "prepare-release",
  CHECK: "check",
};

function clean() {
  console.log("Cleaning build artifacts...");
  const foldersToClean = ["dist", "out"];

  foldersToClean.forEach((folder) => {
    const folderPath = path.join(__dirname, "..", folder);
    if (fs.existsSync(folderPath)) {
      console.log(`Removing ${folder}/`);
      try {
        if (process.platform === "win32") {
          execSync(`rd /s /q "${folderPath}"`);
        } else {
          execSync(`rm -rf "${folderPath}"`);
        }
      } catch (error) {
        console.error(`Error removing ${folder}/: ${error.message}`);
      }
    }
  });

  console.log("Clean complete!");
}

function prepareRelease() {
  console.log("Preparing for release...");

  // Check if there are uncommitted changes
  try {
    execSync("git diff --quiet && git diff --staged --quiet");
  } catch (error) {
    console.error(
      "You have uncommitted changes. Please commit or stash them before preparing a release."
    );
    process.exit(1);
  }

  // Prompt for version update type
  console.log(`Current version: ${packageJson.version}`);
  console.log(
    "Please update the version in package.json manually, then commit with:"
  );
  console.log('git commit -m "Bump version to X.Y.Z"');
  console.log("git tag vX.Y.Z");
  console.log("git push --follow-tags");
}

function check() {
  console.log("Running pre-flight checks...");

  let allPassed = true;

  // Check for package.json
  if (!fs.existsSync(path.join(__dirname, "..", "package.json"))) {
    console.error("❌ package.json not found");
    allPassed = false;
  } else {
    console.log("✅ package.json found");
  }

  // Check for main.js
  if (!fs.existsSync(path.join(__dirname, "..", "main.js"))) {
    console.error("❌ main.js not found");
    allPassed = false;
  } else {
    console.log("✅ main.js found");
  }

  // Check for Tesseract data file
  if (!fs.existsSync(path.join(__dirname, "..", "eng.traineddata"))) {
    console.error("❌ eng.traineddata not found");
    allPassed = false;
  } else {
    console.log("✅ eng.traineddata found");
  }

  // Check for node_modules
  if (!fs.existsSync(path.join(__dirname, "..", "node_modules"))) {
    console.warn("⚠️ node_modules not found, you may need to run npm install");
  } else {
    console.log("✅ node_modules found");
  }

  if (allPassed) {
    console.log("All pre-flight checks passed!");
  } else {
    console.error(
      "Some pre-flight checks failed. Please fix the issues before building."
    );
    process.exit(1);
  }
}

function printUsage() {
  console.log("Usage: node dev-helper.js [command]");
  console.log("Available commands:");
  console.log(`  ${COMMANDS.CLEAN}: Clean build artifacts`);
  console.log(
    `  ${COMMANDS.PREPARE_RELEASE}: Update version numbers and prepare for release`
  );
  console.log(`  ${COMMANDS.CHECK}: Run pre-flight checks for a build`);
}

// Main execution
const command = process.argv[2];

if (!command) {
  printUsage();
  process.exit(1);
}

switch (command.toLowerCase()) {
  case COMMANDS.CLEAN:
    clean();
    break;
  case COMMANDS.PREPARE_RELEASE:
    prepareRelease();
    break;
  case COMMANDS.CHECK:
    check();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
}
