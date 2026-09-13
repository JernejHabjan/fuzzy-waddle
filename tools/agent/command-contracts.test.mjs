import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_OUTPUT_BUDGET,
  compactOutput,
  validateAdapterDefinition,
  validateCommandDefinition,
  validateCommandResult
} from "./command-contracts.mjs";

const command = {
  schemaVersion: 1,
  id: "verify",
  description: "Select and verify the required work.",
  selection: { requireConfiguredWork: true, required: ["projects", "checks"] },
  outputBudget: { maxBytes: 32, maxLines: 2 }
};

const adapter = { id: "generic", schemaVersion: 1, commands: ["doctor", "context", "verify", "triage", "metrics"] };

function result(overrides = {}) {
  return {
    schemaVersion: 1,
    commandId: "verify",
    adapterId: "generic",
    status: "passed",
    provenance: { revision: "a".repeat(40), worktreeStatus: [] },
    selection: {
      configured: true,
      projects: ["portal"],
      checks: [{ id: "lint", projects: ["portal"], commands: [{ executable: "pnpm", arguments: ["lint"] }] }]
    },
    output: { summary: "selected portal", truncated: false },
    ...overrides
  };
}

test("validates versioned generic commands, adapters, and bounded successful results", () => {
  assert.equal(validateCommandDefinition(command), command);
  assert.equal(validateAdapterDefinition(adapter), adapter);
  assert.deepEqual(validateCommandResult({ command, adapters: [adapter], result: result() }), result());
});

test("compacts output deterministically within byte and line budgets", () => {
  assert.deepEqual(compactOutput("first\nsecond\nthird", { maxBytes: 20, maxLines: 2 }), {
    text: "first\nsecond",
    totalBytes: 18,
    totalLines: 3,
    truncated: true
  });
  assert.deepEqual(compactOutput("short"), {
    text: "short",
    totalBytes: 5,
    totalLines: 1,
    truncated: false
  });
  assert.throws(() => compactOutput("text", { maxBytes: 0, maxLines: 1 }), /invalid_output_budget/u);
  assert.equal(DEFAULT_OUTPUT_BUDGET.maxLines, 160);
});

test("fails closed for unknown adapters, unsupported commands, and invalid provenance", () => {
  assert.throws(
    () => validateCommandResult({ command, adapters: [adapter], result: result({ adapterId: "unknown" }) }),
    /unknown_adapter_result/u
  );
  assert.throws(
    () => validateCommandResult({ command, adapters: [{ ...adapter, commands: ["doctor"] }], result: result() }),
    /unsupported_adapter_command/u
  );
  assert.throws(
    () => validateCommandResult({ command, adapters: [adapter], result: result({ provenance: { revision: "bad" } }) }),
    /invalid_provenance_revision/u
  );
});

test("fails closed for absent configured work, empty required work, and unretained truncation", () => {
  assert.throws(
    () =>
      validateCommandResult({
        command,
        adapters: [adapter],
        result: result({ selection: { configured: false, projects: ["portal"], checks: result().selection.checks } })
      }),
    /missing_configured_work/u
  );
  assert.throws(
    () =>
      validateCommandResult({
        command,
        adapters: [adapter],
        result: result({ selection: { configured: true, projects: [], checks: result().selection.checks } })
      }),
    /empty_required_selection/u
  );
  assert.throws(
    () =>
      validateCommandResult({
        command,
        adapters: [adapter],
        result: result({ output: { summary: "cut", truncated: true } })
      }),
    /missing_retained_artifact/u
  );
});

test("permits optional empty selections while rejecting missing named required selections", () => {
  const optionalCommand = {
    ...command,
    id: "doctor",
    selection: { requireConfiguredWork: false, required: ["indexes"] }
  };
  const optionalResult = result({
    commandId: "doctor",
    selection: { configured: false, indexes: ["source"], projects: [], checks: [] }
  });
  assert.deepEqual(
    validateCommandResult({ command: optionalCommand, adapters: [adapter], result: optionalResult }),
    optionalResult
  );
  assert.throws(
    () => validateCommandResult({ command, adapters: [adapter], result: result({ selection: { configured: true } }) }),
    /missing_required_selection:projects/u
  );
});

test("rejects oversized summaries and retained-artifact escapes", () => {
  assert.throws(
    () =>
      validateCommandResult({
        command,
        adapters: [adapter],
        result: result({ output: { summary: "x".repeat(33), truncated: false } })
      }),
    /output_budget_exceeded/u
  );
  assert.throws(
    () =>
      validateCommandResult({
        command,
        adapters: [adapter],
        workspaceRoot: "/workspace",
        result: result({ output: { summary: "cut", truncated: true, retainedArtifact: "../outside.log" } })
      }),
    /retained_artifact_escapes_workspace/u
  );
  assert.throws(
    () =>
      validateCommandResult({
        command,
        adapters: [adapter],
        workspaceRoot: "/workspace",
        result: result({ output: { summary: "cut", truncated: true, retainedArtifact: ".." } })
      }),
    /retained_artifact_escapes_workspace/u
  );
});
