import { strict as assert } from "node:assert";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pnpmInvocation, requiresMultiplayerForRuntime } from "../skirmish-matrix-execution.ts";
import { planRuntimeExecutionShards } from "../skirmish-runtime-shards.ts";
import { assembleRuntimeParts, writeRuntimePart } from "../../shared/transport/skirmish-ai-runtime-parts.ts";
import { decodeRuntimeArtifact } from "../../shared/transport/skirmish-ai-runtime-artifact-codec.ts";
import { workspaceRoot } from "../../shared/workspace-paths.ts";

test("focused runtime selection can override a mixed fixture's peer requirement", () => {
  const fixture = { recipe: { requiresMultiplayer: true } };
  assert.equal(requiresMultiplayerForRuntime([fixture], { requiresMultiplayer: false }), false);
  assert.equal(requiresMultiplayerForRuntime([fixture], { requiresMultiplayer: true }), true);
  assert.equal(requiresMultiplayerForRuntime([fixture], null), true);
});

test("runtime runner resolves pnpm.cmd through the Windows command shell", () => {
  const args = ["exec", "playwright", "test", "spec.ts", "--workers=1"];
  assert.deepEqual(pnpmInvocation(args, "win32", "C:\\Windows\\System32\\cmd.exe"), {
    command: "C:\\Windows\\System32\\cmd.exe",
    args: ["/d", "/s", "/c", "pnpm exec playwright test spec.ts --workers=1"]
  });
});

test("runtime runner invokes pnpm directly on POSIX systems", () => {
  const args = ["exec", "playwright", "test", "spec.ts"];
  assert.deepEqual(pnpmInvocation(args, "linux"), { command: "pnpm", args });
});

test("runtime execution shards split singleplayer and multiplayer and group by manifest group", () => {
  const fixtureDirectory = join(workspaceRoot, "tools/probable-waffle/skirmish/ai/testing/fixtures");
  const manifest = JSON.parse(readFileSync(join(fixtureDirectory, "skirmish-scenario-manifest.json"), "utf8"));
  const runtimeRows = manifest.rows.filter((row) => row.drivers.includes("runtime") && typeof row.fixture === "string");
  const shards = planRuntimeExecutionShards(runtimeRows, fixtureDirectory);
  const singleplayerShards = shards.filter((shard) => !shard.requiresMultiplayer);
  const multiplayerShards = shards.filter((shard) => shard.requiresMultiplayer);
  assert.ok(singleplayerShards.length > 1);
  assert.ok(multiplayerShards.length >= 1);
  // All singleplayer shards are scheduled before multiplayer shards.
  const firstMpIndex = shards.findIndex((shard) => shard.requiresMultiplayer);
  assert.equal(firstMpIndex, singleplayerShards.length);
  assert.equal(
    shards.reduce((sum, shard) => sum + shard.rows.length, 0),
    runtimeRows.length
  );
});

test("incremental runtime parts assemble into a valid decodable runtime artifact", () => {
  const dir = mkdtempSync(join(tmpdir(), "fuzzy-runtime-parts-"));
  try {
    const artifactPath = join(dir, "runtime.json");
    const metadata = {
      sourceRevision: "a".repeat(40),
      dirtySourceDigest: null,
      fixtureDigest: "fnv1a32:12345678",
      diagnosticSelection: null
    };
    writeRuntimePart(artifactPath, 0, {
      schemaVersion: 1,
      ...metadata,
      status: "passed",
      scenarios: [
        { scenarioId: "ECO-01", passed: true, failures: [], variants: [{ variantId: "v1", checkpoints: [] }] }
      ],
      workCounts: { scenarios: 1, decisions: 5, ticks: 100 }
    });
    writeRuntimePart(artifactPath, 1, {
      schemaVersion: 1,
      ...metadata,
      status: "failed",
      scenarios: [{ scenarioId: "ECO-03", passed: false, failures: ["runtime_test_timeout:180000ms"], variants: [] }],
      workCounts: { scenarios: 1, decisions: 0, ticks: 0 }
    });
    const assembled = assembleRuntimeParts(artifactPath, metadata);
    assert.ok(assembled);
    const decoded = decodeRuntimeArtifact(
      JSON.parse(readFileSync(artifactPath, "utf8")) as Parameters<typeof decodeRuntimeArtifact>[0],
      artifactPath,
      { expandExternalVariants: true }
    ) as { status?: string; scenarios?: unknown[]; workCounts?: unknown };
    assert.equal(decoded.status, "failed");
    assert.equal(decoded.scenarios?.length, 2);
    assert.deepEqual(decoded.workCounts, { scenarios: 2, decisions: 5, ticks: 100 });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
