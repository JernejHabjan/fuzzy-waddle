import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { triageVerification } from "./verification-triage.mjs";

test("triages the first failed retained command with its exact replay", async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), "fuzzy-agent-triage-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(resolve(root, "tmp"));
  await writeFile(
    resolve(root, "tmp/report.json"),
    JSON.stringify({
      schemaVersion: 1,
      kind: "agent-verification-report",
      status: "failed",
      provenance: { revision: "a".repeat(40), worktreeStatus: [] },
      checks: [
        {
          id: "lint",
          status: "failed",
          commands: [
            {
              status: "failed",
              executable: "pnpm",
              arguments: ["lint"],
              exitCode: 2,
              stdoutPath: "tmp/out",
              stderrPath: "tmp/err"
            }
          ]
        }
      ]
    })
  );
  assert.deepEqual(triageVerification(root, "tmp/report.json"), {
    configured: true,
    reports: ["tmp/report.json"],
    executionStatus: "failed",
    reportProvenance: { revision: "a".repeat(40), worktreeStatus: [] },
    failedCheck: "lint",
    replay: "pnpm lint",
    stdoutPath: "tmp/out",
    stderrPath: "tmp/err",
    exitCode: 2
  });
});

test("rejects missing, escaping, and malformed reports", () => {
  assert.throws(() => triageVerification("/workspace", "../report.json"), /triage_report_escapes_workspace/u);
  assert.throws(() => triageVerification("/workspace", "missing.json"), /unreadable_triage_report/u);
});

test("rejects reports whose status, command result, or retained artifact is inconsistent", async (t) => {
  const root = await mkdtemp(resolve(tmpdir(), "fuzzy-agent-triage-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(
    resolve(root, "report.json"),
    JSON.stringify({
      schemaVersion: 1,
      kind: "agent-verification-report",
      status: "failed",
      provenance: { revision: "a".repeat(40), worktreeStatus: [] },
      checks: [
        {
          id: "lint",
          status: "failed",
          commands: [
            {
              status: "passed",
              executable: "pnpm",
              arguments: ["lint"],
              exitCode: 0,
              stdoutPath: "tmp/out",
              stderrPath: "tmp/err"
            }
          ]
        }
      ]
    })
  );
  assert.throws(() => triageVerification(root, "report.json"), /inconsistent_triage_report/u);
  await writeFile(
    resolve(root, "report.json"),
    JSON.stringify({
      schemaVersion: 1,
      kind: "agent-verification-report",
      status: "passed",
      provenance: { revision: "a".repeat(40), worktreeStatus: [] },
      checks: [
        {
          id: "lint",
          status: "passed",
          commands: [
            {
              status: "passed",
              executable: "pnpm",
              arguments: ["lint"],
              exitCode: 0,
              stdoutPath: "../out",
              stderrPath: "tmp/err"
            }
          ]
        }
      ]
    })
  );
  assert.throws(() => triageVerification(root, "report.json"), /triage_artifact_escapes_workspace/u);
});
