/**
 * Helper script to check and download language traineddata files
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const LANGUAGES = {
  eng: { name: "English", required: true },
  fra: { name: "French", required: false },
  por: { name: "Portuguese", required: false },
  deu: { name: "German", required: false },
};

const TESSDATA_URL =
  "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/";

/**
 * Check if a traineddata file exists
 */
function checkFile(langCode) {
  const filePath = path.join(__dirname, `${langCode}.traineddata`);
  return fs.existsSync(filePath);
}

/**
 * Download a traineddata file
 */
function downloadFile(langCode) {
  return new Promise((resolve, reject) => {
    const url = `${TESSDATA_URL}${langCode}.traineddata`;
    const filePath = path.join(__dirname, `${langCode}.traineddata`);

    console.log(`\n📥 Downloading ${langCode}.traineddata...`);
    console.log(`   From: ${url}`);

    const file = fs.createWriteStream(filePath);
    let downloadedSize = 0;

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        const totalSize = parseInt(response.headers["content-length"], 10);

        response.on("data", (chunk) => {
          downloadedSize += chunk.length;
          const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
          process.stdout.write(`\r   Progress: ${percent}% (${downloadedSize}/${totalSize} bytes)`);
        });

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          console.log(`\n   ✅ Downloaded successfully!`);
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
  });
}

/**
 * Main check and download routine
 */
async function main() {
  console.log("\n🔍 Checking OCR Language Files...\n");
  console.log("Project root:", __dirname);
  console.log("");

  const missing = [];
  const present = [];

  // Check all language files
  for (const [code, lang] of Object.entries(LANGUAGES)) {
    const exists = checkFile(code);
    if (exists) {
      const stats = fs.statSync(path.join(__dirname, `${code}.traineddata`));
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`✅ ${code}.traineddata - ${lang.name} (${sizeMB} MB)`);
      present.push(code);
    } else {
      console.log(`❌ ${code}.traineddata - ${lang.name} (missing)`);
      if (lang.required) {
        console.log(`   ⚠️  This is a REQUIRED file!`);
      }
      missing.push(code);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`Present: ${present.length}/${Object.keys(LANGUAGES).length}`);
  console.log(`Missing: ${missing.length}/${Object.keys(LANGUAGES).length}`);

  if (missing.length === 0) {
    console.log("\n🎉 All language files are present!");
    console.log("\nTo enable multi-language support:");
    console.log("  1. Edit lib/ocr-config.js");
    console.log("  2. Set useMultiLanguage: true");
    console.log("  3. Enable desired languages");
    console.log("\nRun: node test-languages.js status");
    return;
  }

  // Offer to download missing files
  console.log("\n📦 Missing Files:");
  for (const code of missing) {
    const lang = LANGUAGES[code];
    console.log(
      `   - ${code}.traineddata (${lang.name})${lang.required ? " [REQUIRED]" : ""}`
    );
  }

  console.log("\nDownload Options:");
  console.log("  1. Automatic: node setup-languages.js download");
  console.log("  2. Manual: Visit https://github.com/tesseract-ocr/tessdata_fast");
  console.log("     Download files and place them in the project root directory");

  // Check if download was requested
  const args = process.argv.slice(2);
  if (args.includes("download") || args.includes("--download")) {
    console.log("\n🚀 Starting automatic download...");

    for (const code of missing) {
      try {
        await downloadFile(code);
      } catch (error) {
        console.error(`\n❌ Failed to download ${code}.traineddata:`, error.message);
        console.log(`\n💡 Try manual download from:`);
        console.log(`   ${TESSDATA_URL}${code}.traineddata`);
      }
    }

    console.log("\n✨ Download process complete!");
    console.log("\nRun: node setup-languages.js");
    console.log("to verify all files are present.");
  }
}

// Run the script
main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
