const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("Installing png-to-ico package...");
try {
  execSync("npm install --no-save png-to-ico sharp");

  // After installation, we can require the package
  const pngToIco = require("png-to-ico");
  const sharp = require("sharp");

  const sourceIcon = path.join(__dirname, "..", "build", "icon.png");
  const targetIco = path.join(__dirname, "..", "build", "icon.ico");

  // Create array of differently sized PNGs for the ico
  async function generateIco() {
    console.log("Generating ICO file with multiple sizes...");

    // Temp directory for resized images
    const tempDir = path.join(__dirname, "..", "temp_icons");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Sizes to include in the ico file - Windows typically needs these
    const sizes = [16, 24, 32, 48, 64, 128, 256];
    const pngFiles = [];

    // Generate PNG files of different sizes
    for (const size of sizes) {
      const outputPath = path.join(tempDir, `icon-${size}.png`);
      await sharp(sourceIcon).resize(size, size).toFile(outputPath);
      pngFiles.push(outputPath);
    }

    // Convert the PNG files to an ICO file
    const buffer = await pngToIco(pngFiles);
    fs.writeFileSync(targetIco, buffer);

    // Clean up temp files
    for (const file of pngFiles) {
      fs.unlinkSync(file);
    }
    fs.rmdirSync(tempDir);

    console.log("ICO file has been generated successfully!");
  }

  generateIco().catch((err) => {
    console.error("Error generating ICO file:", err);
    process.exit(1);
  });
} catch (err) {
  console.error("Error installing or running png-to-ico:", err);
  process.exit(1);
}
