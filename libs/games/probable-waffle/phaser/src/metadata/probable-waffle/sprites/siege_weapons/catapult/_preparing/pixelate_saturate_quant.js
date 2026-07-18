const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Folders
const inputFolder = path.join(__dirname, "_pile-rocks"); // original images
const outputFolder = path.join(__dirname, "throw_final");
if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

// Settings
const scaleFactor = 0.5;       // final downscale factor
const saturationFactor = 2.0;  // saturation increase
const brightnessFactor = 1.2;  // brightness increase
const maxColors = 20;          // max colors in palette

async function processImage(file) {
  const inputPath = path.join(inputFolder, file);
  const outputPath = path.join(outputFolder, file);

  // 1️⃣ Adjust saturation & brightness, then reduce colors
  const tempBuffer = await sharp(inputPath)
    .ensureAlpha() // RGBA
    .modulate({ saturation: saturationFactor, brightness: brightnessFactor })
    .png({ palette: true, colors: maxColors }) // reduce colors first
    .toBuffer();

  // 2️⃣ Downscale
  const meta = await sharp(tempBuffer).metadata();
  const downWidth = Math.round(meta.width * scaleFactor);
  const downHeight = Math.round(meta.height * scaleFactor);

  await sharp(tempBuffer)
    .resize(downWidth, downHeight, { kernel: sharp.kernel.nearest })
    .toFile(outputPath);

  console.log("Processed:", file);
}

// Process all PNGs
fs.readdirSync(inputFolder).forEach(file => {
  if (file.toLowerCase().endsWith(".png")) {
    processImage(file).catch(console.error);
  }
});

console.log("Batch processing started...");
