import { closeSync, openSync, readSync } from "node:fs";
import { spawnSync } from "node:child_process";

const AUDIO_PATTERNS = ["*.mp3", "*.m4a", "*.wav"];
const LFS_POINTER_SIGNATURE = "version https://git-lfs.github.com/spec/v1";
const warningOnly = process.argv.includes("--warn");
const pointersAllowed = process.env.FUZZY_WADDLE_ALLOW_LFS_POINTERS === "true";

function commandSucceeds(command, args) {
  return spawnSync(command, args, { stdio: "ignore" }).status === 0;
}

function trackedAudioFiles() {
  const result = spawnSync("git", ["ls-files", "-z", "--", ...AUDIO_PATTERNS], {
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error("Unable to list tracked audio assets with Git.");
  }
  return result.stdout.split("\0").filter(Boolean);
}

function isLfsPointer(filePath) {
  const descriptor = openSync(filePath, "r");
  try {
    const buffer = Buffer.alloc(LFS_POINTER_SIGNATURE.length);
    const bytesRead = readSync(descriptor, buffer, 0, buffer.length, 0);
    return buffer.subarray(0, bytesRead).toString("utf8") === LFS_POINTER_SIGNATURE;
  } finally {
    closeSync(descriptor);
  }
}

function reportProblem(message, details = []) {
  const level = warningOnly ? "WARNING" : "ERROR";
  console.error(`\n[assets:${level}] ${message}`);
  for (const detail of details) console.error(`[assets:${level}] ${detail}`);
  console.error("[assets] Install Git LFS, then run: pnpm assets:hydrate\n");
  if (!warningOnly) process.exitCode = 1;
}

try {
  const hasGitLfs = commandSucceeds("git", ["lfs", "version"]);
  const audioFiles = trackedAudioFiles();
  const pointerFiles = audioFiles.filter(isLfsPointer);

  if (pointersAllowed) {
    console.log(
      `[assets] Compile-only CI mode allows ${pointerFiles.length} Git LFS pointer asset(s) without downloading them.`
    );
  } else if (!hasGitLfs) {
    reportProblem("Git LFS is not installed. Future checkouts can contain pointer text instead of playable audio.");
  } else if (pointerFiles.length > 0) {
    const examples = pointerFiles.slice(0, 3).map((filePath) => `Unhydrated: ${filePath}`);
    reportProblem(`${pointerFiles.length} audio asset(s) are Git LFS pointers, not playable media.`, examples);
  } else {
    console.log(`[assets] Git LFS is installed and ${audioFiles.length} tracked audio assets are hydrated.`);
  }
} catch (error) {
  reportProblem(error instanceof Error ? error.message : String(error));
}
