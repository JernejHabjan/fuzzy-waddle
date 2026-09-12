import assert from "node:assert/strict";
import test from "node:test";
import { selectVerification } from "./verification-selection.mjs";

const inspection = {
  projects: [{ name: "portal" }, { name: "portal-e2e" }, { name: "probable-waffle-gameplay" }],
  adapters: [{ id: "generic", commands: ["doctor", "context", "verify", "triage", "metrics"] }]
};

test("selects focused Nx targets and local tool checks from changed ownership", () => {
  const result = selectVerification(
    "/workspace",
    { adapterId: "generic", base: "develop", mode: "changed", inspection },
    { execute: executor({ lint: ["portal"], test: ["portal", "probable-waffle-gameplay"] }) }
  );
  assert.deepEqual(result.changedFiles, ["apps/portal/src/app.ts", "tools/agent/run-agent-command.mjs"]);
  assert.deepEqual(result.projects, ["portal", "probable-waffle-gameplay"]);
  assert.deepEqual(
    result.checks.map((check) => check.id),
    ["git-diff-check", "agent-tools", "nx-lint", "nx-test"]
  );
  assert.match(result.checks.at(-1).commands[0].join(" "), /--projects=portal,probable-waffle-gameplay/u);
});

test("selects CI-facing delivery targets and main-only browser coverage", () => {
  const result = selectVerification(
    "/workspace",
    { adapterId: "generic", base: "develop", mode: "required", inspection, targetBranch: "main" },
    { execute: executor({ lint: ["portal"], test: ["portal"], build: ["portal"], e2e: ["portal-e2e"] }) }
  );
  assert.deepEqual(
    result.checks.map((check) => check.id),
    ["git-diff-check", "agent-tools", "nx-lint", "nx-test-ci", "nx-build-production", "nx-e2e"]
  );
  assert.match(result.checks[3].commands[0].join(" "), /--configuration=ci/u);
});

test("keeps docs-only selection actionable and fails closed for no changes or unknown ownership", () => {
  const docsOnly = selectVerification(
    "/workspace",
    { adapterId: "generic", base: "develop", mode: "changed", inspection },
    { execute: executor({ lint: [], test: [], files: ["docs/guide.md"] }) }
  );
  assert.deepEqual(docsOnly.projects, []);
  assert.deepEqual(
    docsOnly.checks.map((check) => check.id),
    ["git-diff-check"]
  );
  assert.throws(
    () =>
      selectVerification(
        "/workspace",
        { adapterId: "generic", base: "develop", mode: "changed", inspection },
        { execute: executor({ files: [] }) }
      ),
    /empty_changed_files/u
  );
  assert.throws(
    () =>
      selectVerification(
        "/workspace",
        { adapterId: "generic", base: "develop", mode: "changed", inspection },
        { execute: executor({ lint: ["missing"], test: [] }) }
      ),
    /unknown_affected_project:lint/u
  );
});

function executor({
  build = [],
  e2e = [],
  files = ["apps/portal/src/app.ts", "tools/agent/run-agent-command.mjs"],
  lint = [],
  test = []
}) {
  return (executable, arguments_) => {
    if (executable === "git" && arguments_[0] === "diff") return { status: 0, stdout: files.join("\n") };
    if (executable === "git") return { status: 0, stdout: "" };
    const target = arguments_[arguments_.indexOf("--withTarget") + 1];
    return { status: 0, stdout: JSON.stringify({ lint, test, build, e2e }[target] ?? []) };
  };
}
