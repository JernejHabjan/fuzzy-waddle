/**
 * Sprite Directory Organizer - South-West-East-North Order
 *
 * This script organizes numbered PNG sprite files into directional subfolders
 * following the order: South, West, East, North (s-w-e-n).
 *
 * Purpose:
 * - Processes all directories in the current working directory
 * - Finds PNG files with numeric names (0.png, 1.png, 2.png, etc.)
 * - Splits them into 4 equal batches based on file count
 * - Moves files to directional subfolders: s/, w/, e/, n/
 *
 * File Distribution:
 * - First batch → s/ (South)
 * - Second batch → w/ (West)
 * - Third batch → e/ (East)
 * - Fourth batch → n/ (North)
 *
 * Usage:
 * Run this script from the parent directory containing sprite folders.
 * Each sprite folder should contain numbered PNG files (0.png, 1.png, etc.).
 *
 * Example structure before:
 * ./character1/0.png, 1.png, 2.png, 3.png, 4.png, 5.png, 6.png, 7.png
 *
 * Example structure after:
 * ./character1/s/0.png, 1.png
 * ./character1/w/2.png, 3.png
 * ./character1/e/4.png, 5.png
 * ./character1/n/6.png, 7.png
 */

const fs = require("fs");
const path = require("path");

// Current directory
const rootDir = path.resolve(".");
const directions = ["s", "w", "e", "n"];

// Get all folders in the current directory
const folders = fs
  .readdirSync(rootDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => path.join(rootDir, dirent.name));

folders.forEach((folder) => {
  // Find PNG files like 0.png, 1.png ...
  const files = fs
    .readdirSync(folder)
    .filter((f) => f.match(/^\d+\.png$/))
    .sort((a, b) => parseInt(a) - parseInt(b));

  if (files.length === 0) return;

  // Create subfolders s/w/e/n
  directions.forEach((dir) => {
    const sub = path.join(folder, dir);
    if (!fs.existsSync(sub)) fs.mkdirSync(sub);
  });

  // Split files into 4 equal batches and distribute by direction
  const batchSize = Math.ceil(files.length / 4);
  files.forEach((file, index) => {
    // Calculate which directional batch this file belongs to (0=s, 1=w, 2=e, 3=n)
    const batchIndex = Math.min(Math.floor(index / batchSize), 3); // 0..3
    const targetDir = path.join(folder, directions[batchIndex]);
    fs.renameSync(path.join(folder, file), path.join(targetDir, file));
  });

  console.log(`Processed folder: ${folder}`);
});

console.log("Done!");
