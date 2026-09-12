import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { parseArguments, runAgentCommand, writePacket } from "./run-agent-command.mjs";

const inspection = {
  provenance: { revision: "a".repeat(40), worktreeStatus: [] },
  runtime: { node: "v24.0.0", packageManager: "pnpm@11.14.0", nxProjectCount: 1 },
  projects: [{ name: "portal", path: "apps/portal/project.json", targets: ["lint"] }],
  indexes: ["source-index.md"],
  sourceStructure: { baseline: "baseline.json", legacyEntries: 1, changedBaselinedFiles: [] },
  adapters: [
    {
      id: "generic",
      schemaVersion: 1,
      commands: ["doctor", "context", "verify", "triage", "metrics"],
      metadata: {}
    }
  ]
};

test("parses only supported bounded commands", () => {
  assert.deepEqual(parseArguments(["doctor"]), { command: "doctor", issue: null, output: null });
  assert.deepEqual(parseArguments(["context", "--issue", "824"]), { command: "context", issue: "824", output: null });
  assert.throws(() => parseArguments(["context"]), /missing_issue/u);
  assert.throws(() => parseArguments(["verify"]), /unknown_command/u);
});

test("produces validated doctor and issue-context packets with deterministic next commands", () => {
  const doctor = runAgentCommand("/workspace", { command: "doctor", issue: null }, { inspect: () => inspection });
  assert.equal(doctor.result.status, "passed");
  assert.match(doctor.result.output.summary, /NEXT pnpm agent:context/u);
  const context = runAgentCommand(
    "/workspace",
    { command: "context", issue: "824" },
    { inspect: () => inspection, resolvePlan: () => "docs/ai/824.md" }
  );
  assert.deepEqual(context.result.selection.plans, ["docs/ai/824.md"]);
  assert.match(context.result.output.summary, /--issue 824/u);
});

test("writes explicit packets inside the workspace only", async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), "fuzzy-agent-command-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = writePacket(root, { status: "passed" }, "tmp/packet.json");
  assert.equal(path, "tmp/packet.json");
  assert.deepEqual(JSON.parse(await readFile(resolve(root, path), "utf8")), { status: "passed" });
  assert.throws(() => writePacket(root, {}, "../packet.json"), /invalid_packet_output/u);
});
