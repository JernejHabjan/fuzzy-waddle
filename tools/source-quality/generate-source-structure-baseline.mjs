import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const roots = ["apps", "libs", "tools"];
const baselinePath = "tools/eslint-plugin-fuzzy-waddle/source-structure-baseline.json";
const ignoredSegments = new Set(["dist", "generated", "node_modules", "vendor"]);

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredSegments.has(entry.name)) files.push(...(await collectSourceFiles(candidate)));
      continue;
    }
    if (/\.(?:[cm]?js|tsx?)$/u.test(entry.name) && !entry.name.endsWith(".d.ts")) files.push(candidate);
  }
  return files;
}

function mayViolateStructureLimits(source) {
  const lines = source.split(/\r?\n/u);
  const substantiveDeclarations = source.match(
    /(?:^|\n)\s*(?:export\s+(?:default\s+)?)?(?:abstract\s+)?(?:class|interface|type|enum)\s+[A-Za-z_$]/gu
  );
  return lines.length > 200 || lines.some((line) => line.length > 140) || (substantiveDeclarations?.length ?? 0) > 1;
}

const candidates = (await Promise.all(roots.map(collectSourceFiles))).flat().sort();
const baseline = {};
for (const filename of candidates) {
  if (filename === baselinePath) continue;
  const source = await readFile(filename, "utf8");
  if (!mayViolateStructureLimits(source)) continue;
  baseline[filename.split(path.sep).join("/")] = createHash("sha256").update(source).digest("hex");
}

await writeFile(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
console.log(`Recorded ${Object.keys(baseline).length} legacy source hashes in ${baselinePath}.`);
