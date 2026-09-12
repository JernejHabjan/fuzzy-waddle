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
  assert.deepEqual(parseArguments(["doctor"]), {
    adapter: "generic",
    base: null,
    command: "doctor",
    issue: null,
    output: null,
    targetBranch: null,
    verificationMode: null
  });
  assert.deepEqual(parseArguments(["context", "--issue", "824"]), {
    adapter: "generic",
    base: null,
    command: "context",
    issue: "824",
    output: null,
    targetBranch: null,
    verificationMode: null
  });
  assert.deepEqual(parseArguments(["verify", "--required", "--base", "develop", "--target-branch", "main"]), {
    adapter: "generic",
    base: "develop",
    command: "verify",
    issue: null,
    output: null,
    targetBranch: "main",
    verificationMode: "required"
  });
  assert.throws(() => parseArguments(["context"]), /missing_issue/u);
  assert.throws(() => parseArguments(["verify"]), /missing_verification_mode/u);
  assert.throws(() => parseArguments(["verify", "--changed", "--issue", "824"]), /unexpected_issue/u);
  assert.throws(() => parseArguments(["verify", "--changed", "--required"]), /duplicate_verification_mode/u);
});

test("produces validated doctor and issue-context packets with deterministic next commands", () => {
  const doctor = runAgentCommand("/workspace", parseArguments(["doctor"]), { inspect: () => inspection });
  assert.equal(doctor.result.status, "passed");
  assert.match(doctor.result.output.summary, /NEXT pnpm agent:context/u);
  const context = runAgentCommand("/workspace", parseArguments(["context", "--issue", "824"]), {
    inspect: () => inspection,
    resolvePlan: () => "docs/ai/824.md"
  });
  assert.deepEqual(context.result.selection.plans, ["docs/ai/824.md"]);
  assert.match(context.result.output.summary, /--issue 824/u);
});

test("produces a validated verification-selection packet", () => {
  const verification = runAgentCommand("/workspace", parseArguments(["verify", "--changed"]), {
    inspect: () => inspection,
    select: () => ({
      configured: true,
      mode: "changed",
      base: "develop",
      targetBranch: "develop",
      changedFiles: ["tools/agent/run-agent-command.mjs"],
      projects: ["portal"],
      checks: [{ id: "agent-tools", projects: [], commands: [["pnpm", "agent:tools:test"]] }]
    })
  });
  assert.equal(verification.result.commandId, "verify");
  assert.match(verification.result.output.summary, /VERIFY mode=changed/u);
});

test("writes explicit packets inside the workspace only", async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), "fuzzy-agent-command-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = writePacket(root, { status: "passed" }, "tmp/packet.json");
  assert.equal(path, "tmp/packet.json");
  assert.deepEqual(JSON.parse(await readFile(resolve(root, path), "utf8")), { status: "passed" });
  assert.throws(() => writePacket(root, {}, "../packet.json"), /invalid_packet_output/u);
});
