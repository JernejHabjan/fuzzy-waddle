#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectRuntimeInventory, renderRuntimeInventory } from "./skirmish-runtime-inventory.mjs";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const testingDirectory = join(
  workspaceRoot,
  "libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing"
);
const fixtureDirectory = join(workspaceRoot, "tools/ai/fixtures");
const catalogPath = join(testingDirectory, "scenario-catalog.md");
const requirementFiles = [
  "strategic-scenarios.md",
  "adversarial-scenarios.md",
  "classic-rts-and-difficulty-scenarios.md",
  "debugging-scenarios.md"
];
const specDirectories = [
  "libs/games/probable-waffle/gameplay/src/lib/player/ai-controller",
  "libs/games/probable-waffle/phaser/src/lib/player/ai-controller"
];
const groupNames = {
  economy: "Economy and workers",
  production: "Production and composition",
  technology: "Technology and counters",
  scouting: "Scouting and knowledge",
  strategy: "Strategic purpose",
  access: "Access and transport",
  combat: "Combat and squads",
  placement: "Placement",
  fortification: "Walls and fortifications",
  recovery: "Recovery and liveness",
  authority: "Command authority",
  reservations: "Resources and reservations",
  lanes: "Decision-lane fairness",
  lifecycle: "Save, reload and disposal",
  continuous: "Continuous matches",
  "classic-rts": "Classic RTS behavior",
  difficulty: "Difficulty",
  debug: "Debugging and reproduction"
};

export function parseRequirementRows(source, document) {
  const rows = [];
  for (const line of document.split(/\r?\n/)) {
    const id = line.match(/^\|\s*([A-Z]+-[0-9]{2})\s*\|/);
    if (!id) continue;
    const cells = line
      .split(/(?<!\\)\|/)
      .slice(2, -1)
      .map((cell) => cell.trim());
    if (cells.length < 1 || cells.length > 2 || cells.some((cell) => !cell)) {
      throw new Error(`invalid_catalog_requirement:${source}:${id[1]}`);
    }
    rows.push({ id: id[1], source, setup: cells.length === 2 ? cells[0] : null, result: cells.at(-1) });
  }
  return rows;
}

function readRequirements() {
  const requirements = new Map();
  for (const source of requirementFiles) {
    for (const row of parseRequirementRows(source, readFileSync(join(testingDirectory, source), "utf8"))) {
      if (requirements.has(row.id)) throw new Error(`duplicate_catalog_requirement:${row.id}`);
      requirements.set(row.id, row);
    }
  }
  return requirements;
}

function readSpecs(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return readSpecs(path);
    return entry.name.endsWith(".spec.ts") ? [{ path, text: readFileSync(path, "utf8") }] : [];
  });
}

function link(path, label) {
  return `[${label}](${relative(testingDirectory, path).replaceAll("\\", "/")})`;
}

function cell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll(/\s+/g, " ");
}

function pureCell(row, specs) {
  if (!row.drivers.includes("pure")) return "Not required";
  if (!row.authoredFixture) return "**Missing registered fixture**";
  const fixture = link(join(fixtureDirectory, row.authoredFixture), "fixture");
  const references = specs
    .filter((spec) => spec.text.includes(row.id))
    .map((spec) => link(spec.path, basename(spec.path)));
  return `Registered ${fixture}${references.length ? `; ${references.join(", ")}` : "; no ID-linked spec"}`;
}

function runtimeCell(row) {
  if (!row.drivers.includes("runtime")) return "Not required";
  if (row.runtimeSupport?.status === "deferred_content") {
    return `Deferred: [#${row.runtimeSupport.issue}](https://github.com/JernejHabjan/fuzzy-waddle/issues/${row.runtimeSupport.issue})`;
  }
  if (!row.fixture) return "**Missing real-game recipe**";
  const fixture = JSON.parse(readFileSync(join(fixtureDirectory, row.fixture), "utf8"));
  const variants = fixture.recipe.variants.filter(
    (variant) => !variant.scenarioIds || variant.scenarioIds.includes(row.id)
  );
  if (!fixture.scenarioIds.includes(row.id) || !fixture.assertions?.[row.id] || variants.length === 0) {
    throw new Error(`catalog_runtime_recipe_not_runnable:${row.id}`);
  }
  const maps = [...new Set(variants.map((variant) => variant.mapLabel ?? fixture.recipe.mapLabel))];
  const runs = variants.reduce((sum, variant) => sum + (variant.repetitions ?? 1), 0);
  const maximumTick = Math.max(
    ...variants.map((variant) => Math.max(...(variant.checkpointTicks ?? fixture.recipe.checkpointTicks)))
  );
  return (
    `Registered ${link(join(fixtureDirectory, row.fixture), "recipe")}; ${maps.join(" / ")}; ` +
    `${runs} run${runs === 1 ? "" : "s"}, ≤${maximumTick.toLocaleString("en-US")} ticks`
  );
}

export function renderCatalog() {
  const manifest = JSON.parse(readFileSync(join(fixtureDirectory, "skirmish-v1.json"), "utf8"));
  const requirements = readRequirements();
  const ids = new Set(manifest.rows.map((row) => row.id));
  if (manifest.rows.length !== manifest.requiredCaseCount || ids.size !== manifest.rows.length) {
    throw new Error("catalog_manifest_denominator_mismatch");
  }
  const missing = manifest.rows.filter((row) => !requirements.has(row.id)).map((row) => row.id);
  const unexpected = [...requirements.keys()].filter((id) => !ids.has(id));
  if (missing.length || unexpected.length) {
    throw new Error(`catalog_requirement_mismatch:missing=${missing.join(",")};unexpected=${unexpected.join(",")}`);
  }
  const specs = specDirectories.flatMap((directory) => readSpecs(join(workspaceRoot, directory)));
  const pureRequired = manifest.rows.filter((row) => row.drivers.includes("pure"));
  const runtimeRequired = manifest.rows.filter((row) => row.drivers.includes("runtime"));
  const pureRegistered = pureRequired.filter((row) => row.authoredFixture).length;
  const runtimeRegistered = runtimeRequired.filter((row) => row.fixture).length;
  const runtimeDeferred = runtimeRequired.filter((row) => row.runtimeSupport?.status === "deferred_content").length;
  const lines = [
    "<!-- Generated by tools/ai/generate-skirmish-test-catalog.mjs. Edit the linked scenario requirements and manifest. -->",
    "# Skirmish AI scenario test catalog",
    "",
    `This index joins the [manifest](${relative(testingDirectory, join(fixtureDirectory, "skirmish-v1.json"))}) ` +
      "to the linked requirement documents, fixtures, and test files. It is navigation, not a second source of truth.",
    "",
    "**Registered is not passed:** no row below claims execution evidence. A spec link means the file mentions the ID; " +
      "the matrix must still execute an ID-specific semantic assertion.",
    "",
    `- ${manifest.rows.length} required scenarios; ${pureRegistered}/${pureRequired.length} pure fixtures registered; ` +
      `${runtimeRegistered}/${runtimeRequired.length} real-game recipes registered; ${runtimeDeferred} runtime cases ` +
      "deferred for absent island-map content.",
    "- Pure cases use Jest without a map. Browser cases use the " +
      link(join(workspaceRoot, "apps/portal-e2e/src/e2e/skirmish-ai-runtime.spec.ts"), "Playwright driver") +
      " and launch a real lobby/Phaser match with authoritative outcomes.",
    "- Current registered browser recipes still name mutable shipped maps. Their migration to " +
      link(join(testingDirectory, "test-map-contract.md"), "frozen test maps") +
      " is planned, not complete. Keep natural-map playtests separate from deterministic CI.",
    "- For each scenario, its linked requirement defines the setup/trigger and expected outcome. The linked JSON " +
      "defines current variants, seeds, maps, checkpoints, and predicates. A missing setup or recipe is work to author, " +
      "not permission to infer a pass.",
    "- Update the requirement row and manifest/fixture, then regenerate with `pnpm ai:skirmish:catalog -- --write`. " +
      "CI checks that this file matches its sources; do not edit generated rows by hand.",
    ""
  ];
  const groups = [...new Set(manifest.rows.map((row) => row.group))];
  for (const group of groups) {
    lines.push(
      `## ${groupNames[group] ?? group}`,
      "",
      "| Scenario | Setup / trigger | Required outcome / forbidden behavior | Pure Jest | Real-game browser |",
      "| --- | --- | --- | --- | --- |"
    );
    for (const row of manifest.rows.filter((item) => item.group === group)) {
      const requirement = requirements.get(row.id);
      const name = row.name ? `${row.name} (${row.id})` : row.id;
      const scenario = link(join(testingDirectory, requirement.source), name);
      lines.push(
        `| ${scenario} | ${cell(requirement.setup ?? "Setup must be authored in its fixture")} | ` +
          `${cell(requirement.result)} | ${pureCell(row, specs)} | ${runtimeCell(row)} |`
      );
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2] ?? "--check";
  if (!["--write", "--check", "--inventory"].includes(mode) || process.argv.length > 3) {
    throw new Error("usage: --write|--check|--inventory");
  }
  if (mode === "--inventory") {
    const manifest = JSON.parse(readFileSync(join(fixtureDirectory, "skirmish-v1.json"), "utf8"));
    const inventory = collectRuntimeInventory(manifest, (path) =>
      JSON.parse(readFileSync(join(fixtureDirectory, path), "utf8"))
    );
    process.stdout.write(renderRuntimeInventory(inventory));
  } else {
    const content = renderCatalog();
    if (mode === "--write") writeFileSync(catalogPath, content);
    else if (readFileSync(catalogPath, "utf8") !== content) throw new Error("skirmish_test_catalog_stale");
  }
}
