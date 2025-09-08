const fs = require("fs");
const extract = require("png-chunks-extract");
const { decode: decodeText } = require("png-chunk-text");

const file = process.argv[2];
if (!file) {
  console.log("Usage: node view-metadata.js <image.png>");
  process.exit(1);
}

const buffer = fs.readFileSync(file);
const chunks = extract(buffer);
const textChunks = chunks
  .filter((chunk) => chunk.name === "tEXt")
  .map((chunk) => decodeText(chunk.data));

const meta = textChunks.find((t) => t.keyword === "star_scoper_metadata");
if (meta) {
  console.log("Metadata:", JSON.parse(meta.text));
} else {
  console.log("No star_scoper_metadata found.");
}
