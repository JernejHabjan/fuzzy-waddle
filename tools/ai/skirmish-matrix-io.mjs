import { readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";

export const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export function readJson(path, maxBytes) {
  const text = readFileSync(path, "utf8");
  if (Buffer.byteLength(text) > maxBytes) throw new Error(`oversized_json:${path}`);
  return JSON.parse(text);
}

export function resolveExplicitPath(value) {
  const supplied = required(value, "path");
  if (supplied.includes("\0")) throw new Error("invalid_path");
  return isAbsolute(supplied) ? resolve(supplied) : resolve(process.cwd(), supplied);
}

export function requireInteger(value, label, minimum, maximum) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum || number > maximum) throw new Error(`invalid_${label}`);
  return number;
}

export function requireSha(value, label) {
  const sha = required(value, label);
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error(`invalid_${label}_sha`);
  return sha;
}

export function requireEnum(value, choices, label) {
  if (!choices.includes(value)) throw new Error(`invalid_${label}:${value}`);
  return value;
}

export function required(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new Error(`missing_${label}`);
  return value;
}

export function readHead() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd: workspaceRoot, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "working-tree";
}

function readGitText(arguments_) {
  const result = spawnSync("git", arguments_, { cwd: workspaceRoot, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git_inspection_failed:${arguments_.join("_")}`);
  return result.stdout;
}

export function readWorkingTreeSource() {
  const tracked = readGitText(["diff", "--no-ext-diff", "HEAD", "--"]);
  const untrackedPaths = readGitText(["ls-files", "--others", "--exclude-standard", "-z"])
    .split("\0")
    .filter(Boolean)
    .sort();
  const untracked = untrackedPaths.map((path) => {
    const absolutePath = resolve(workspaceRoot, path);
    if (relative(workspaceRoot, absolutePath).startsWith("..")) throw new Error(`unsafe_untracked_path:${path}`);
    return `${path}\0${readFileSync(absolutePath).toString("base64")}`;
  });
  return tracked.length > 0 || untracked.length > 0 ? `${tracked}\0${untracked.join("\0")}` : "";
}

export function digestString(input) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
