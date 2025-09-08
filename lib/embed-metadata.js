// Helper to embed JSON metadata in a PNG file using chunk manipulation
const extract = require("png-chunks-extract");
const encode = require("png-chunks-encode");
const { encode: createTextChunk } = require("png-chunk-text");

/**
 * Embeds a JSON object as a tEXt chunk in a PNG buffer and returns the new buffer.
 * @param {Buffer} pngBuffer - The PNG image buffer.
 * @param {Object} metadata - The metadata object to embed.
 * @returns {Promise<Buffer>} - The PNG buffer with embedded metadata.
 */
async function embedMetadataInPng(pngBuffer, metadata) {
  // Extract existing chunks
  const chunks = extract(pngBuffer);
  // Create a tEXt chunk with our metadata
  const metaChunk = createTextChunk(
    "star_scoper_metadata",
    JSON.stringify(metadata)
  );
  // Insert before the IEND chunk
  const iendIndex = chunks.findIndex((chunk) => chunk.name === "IEND");
  if (iendIndex === -1) throw new Error("Invalid PNG: no IEND chunk");
  const newChunks = [
    ...chunks.slice(0, iendIndex),
    metaChunk,
    ...chunks.slice(iendIndex),
  ];
  // Encode back to buffer
  return Buffer.from(encode(newChunks));
}

module.exports = { embedMetadataInPng };
