import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const FOCUSED_TARGETS = [{ target: "lint" }, { target: "test" }];

const DELIVERY_TARGETS = [
  { target: "lint" },
  { target: "test", configuration: "ci" },
  { target: "build", configuration: "production" }
];

export function selectVerification(
  root,
  { adapterId, base, mode, inspection, targetBranch },
  { execute = runCommand } = {}
) {
  validateRequest({ adapterId, mode, inspection });
  const resolvedBase = base ?? readDefaultBase(root);
  const changedFiles = readChangedFiles(root, resolvedBase, execute);
  if (changedFiles.length === 0) throw new Error("empty_changed_files");
  const checks = [
    ...selectWorkspaceChecks(changedFiles, resolvedBase),
    ...selectTargetChecks(root, resolvedBase, targetBranch ?? resolvedBase, mode, inspection.projects, execute)
  ];
  if (checks.length === 0) throw new Error("empty_verification_checks");
  return {
    configured: true,
    mode,
    base: resolvedBase,
    targetBranch: targetBranch ?? resolvedBase,
    changedFiles,
    projects: unique(checks.flatMap((check) => check.projects ?? [])),
    checks
  };
}

function validateRequest({ adapterId, mode, inspection }) {
  if (!new Set(["changed", "required"]).has(mode)) throw new Error(`invalid_verification_mode:${mode ?? "missing"}`);
  const adapter = inspection.adapters.find((candidate) => candidate.id === adapterId);
  if (!adapter) throw new Error(`unknown_adapter:${adapterId ?? "missing"}`);
  if (!adapter.commands.includes("verify")) throw new Error(`unsupported_adapter_command:${adapterId}`);
}

function readDefaultBase(root) {
  const nx = JSON.parse(readFileSync(resolve(root, "nx.json"), "utf8"));
  if (typeof nx.defaultBase !== "string" || !nx.defaultBase) throw new Error("missing_nx_default_base");
  return nx.defaultBase;
}

function readChangedFiles(root, base, execute) {
  const committed = execute("git", ["diff", "--name-only", `${base}...HEAD`], root);
  const unstaged = execute("git", ["diff", "--name-only"], root);
  const staged = execute("git", ["diff", "--cached", "--name-only"], root);
  const untracked = execute("git", ["ls-files", "--others", "--exclude-standard"], root);
  const results = [committed, unstaged, staged, untracked];
  if (results.some((result) => result.status !== 0)) throw new Error("unavailable_changed_file_selection");
  return unique(results.flatMap((result) => parseLines(result.stdout)));
}

function selectWorkspaceChecks(changedFiles, base) {
  const checks = [
    {
      id: "git-diff-check",
      projects: [],
      commands: [
        ["git", "diff", "--check", `${base}...HEAD`],
        ["git", "diff", "--cached", "--check"],
        ["git", "diff", "--check"]
      ]
    }
  ];
  if (
    changedFiles.some(
      (path) => path.startsWith("plugins/fuzzy-waddle-skills/") || path === "tools/skills/check-index.mjs"
    )
  )
    checks.push({ id: "skills-index", projects: [], commands: [["pnpm", "skills:check"]] });
  if (changedFiles.some((path) => path.startsWith("tools/agent/") || path === "package.json"))
    checks.push({ id: "agent-tools", projects: [], commands: [["pnpm", "agent:tools:test"]] });
  return checks;
}

function selectTargetChecks(root, base, targetBranch, mode, projects, execute) {
  const targetDefinitions = mode === "changed" ? FOCUSED_TARGETS : deliveryTargets(targetBranch);
  return targetDefinitions.flatMap((definition) => {
    const selectedProjects = readAffectedProjects(root, base, definition.target, projects, execute);
    if (selectedProjects.length === 0) return [];
    return [createTargetCheck(definition, selectedProjects)];
  });
}

function deliveryTargets(base) {
  return base === "main" || base.endsWith("/main") ? [...DELIVERY_TARGETS, { target: "e2e" }] : DELIVERY_TARGETS;
}

function readAffectedProjects(root, base, target, projects, execute) {
  const result = execute(
    "pnpm",
    ["exec", "nx", "show", "projects", "--affected", "--withTarget", target, "--base", base, "--json"],
    root
  );
  if (result.status !== 0) throw new Error(`unavailable_affected_target:${target}`);
  let selected;
  try {
    selected = JSON.parse(result.stdout);
  } catch {
    throw new Error(`invalid_affected_target:${target}`);
  }
  if (!Array.isArray(selected) || selected.some((project) => typeof project !== "string"))
    throw new Error(`invalid_affected_target:${target}`);
  const knownProjects = new Set(projects.map((project) => project.name));
  if (selected.some((project) => !knownProjects.has(project))) throw new Error(`unknown_affected_project:${target}`);
  return unique(selected);
}

function createTargetCheck(definition, projects) {
  const arguments_ = ["exec", "nx", "run-many", `--target=${definition.target}`, `--projects=${projects.join(",")}`];
  if (definition.configuration) arguments_.push(`--configuration=${definition.configuration}`);
  return {
    id: `nx-${definition.target}${definition.configuration ? `-${definition.configuration}` : ""}`,
    projects,
    commands: [["pnpm", ...arguments_]]
  };
}

function parseLines(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values)].sort();
}

function runCommand(executable, arguments_, cwd) {
  const result = spawnSync(executable, arguments_, { cwd, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}
