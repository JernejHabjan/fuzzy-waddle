import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { executeVerification } from "./verification-execution.mjs";

const provenance = { revision: "a".repeat(40), worktreeStatus: [] };

test("retains every command stream and reports the first failed check without stopping later evidence", async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), "fuzzy-agent-verification-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const report = executeVerification(
    root,
    {
      mode: "changed",
      base: "develop",
      targetBranch: "develop",
      checks: [
        { id: "first", projects: [], commands: [{ executable: "one", arguments: [] }] },
        { id: "second", projects: ["portal"], commands: [{ executable: "two", arguments: ["arg"] }] }
      ]
    },
    provenance,
    {
      runId: "test-run",
      execute: (executable) =>
        executable === "one"
          ? { status: 1, stdout: "first output", stderr: "first error" }
          : { status: 0, stdout: "second output", stderr: "" }
    }
  );
  assert.equal(report.status, "failed");
  assert.equal(report.checks[0].status, "failed");
  assert.equal(report.checks[1].status, "passed");
  assert.match(await readFile(resolve(root, report.checks[0].commands[0].stderrPath), "utf8"), /first error/u);
  const persisted = JSON.parse(await readFile(resolve(root, report.reportPath), "utf8"));
  assert.equal(persisted.status, "failed");
  assert.match(report.reportPath, /tmp\/agent-verification\//u);
});

test("fails closed for unsafe revision and run identifiers", () => {
  assert.throws(
    () => executeVerification("/workspace", { checks: [] }, { revision: "invalid", worktreeStatus: [] }),
    /invalid_execution_revision/u
  );
  assert.throws(
    () => executeVerification("/workspace", { checks: [] }, provenance, { runId: "../escape" }),
    /invalid_execution_run_id/u
  );
});
