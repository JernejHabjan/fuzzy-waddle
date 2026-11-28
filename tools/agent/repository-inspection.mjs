import { readFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { validateAdapterDefinition } from "./command-contracts.mjs";

export function inspectRepository(root, { execute = runCommand } = {}) {
  const packageJson = readJson(root, "package.json");
  const projects = discoverProjects(root);
  const registry = readAdapterRegistry(root);
  const provenance = readGitProvenance(root, execute);
  return {
    provenance,
    runtime: inspectRuntime(root, packageJson, execute),
    projects,
    indexes: inspectIndexes(root, registry.indexes),
    sourceStructure: inspectSourceStructure(root, provenance.worktreeStatus),
    adapters: inspectAdapters(root, registry.adapters, projects)
  };
}

export function findIssuePlan(root, issue) {
  if (!Number.isInteger(issue) || issue <= 0) throw new Error("invalid_issue_number");
  const matches = findFiles(
    resolve(root, "docs"),
    (path) => path.endsWith(".md") && new RegExp(`^# .*#${issue}(?:\\s|$)`, "m").test(readFileSync(path, "utf8"))
  );
  if (matches.length !== 1) throw new Error(`issue_plan_count:${issue}:${matches.length}`);
  return relative(root, matches[0]);
}

function discoverProjects(root) {
  return findFiles(root, (path) => path.endsWith("/project.json"))
    .map((path) => {
      const definition = JSON.parse(readFileSync(path, "utf8"));
      if (typeof definition.name !== "string" || !definition.name)
        throw new Error(`invalid_project:${relative(root, path)}`);
      return {
        name: definition.name,
        path: relative(root, path),
        targets: Object.keys(definition.targets ?? {}).sort()
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function readAdapterRegistry(root) {
  const registry = readJson(root, "tools/agent/adapters.json");
  if (registry?.schemaVersion !== 1 || !Array.isArray(registry.indexes) || !Array.isArray(registry.adapters))
    throw new Error("invalid_adapter_registry");
  if (registry.indexes.some((path) => typeof path !== "string")) throw new Error("invalid_adapter_indexes");
  for (const adapter of registry.adapters) validateAdapterDefinition(adapter);
  if (new Set(registry.adapters.map((adapter) => adapter.id)).size !== registry.adapters.length)
    throw new Error("duplicate_adapter_id");
  return registry;
}

function inspectRuntime(root, packageJson, execute) {
  const expectedPnpm = packageJson.packageManager;
  const pnpm = execute("pnpm", ["--version"], root);
  const nx = execute("pnpm", ["exec", "nx", "show", "projects", "--json"], root);
  if (pnpm.status !== 0 || nx.status !== 0) throw new Error("unavailable_repository_runtime");
  if (typeof expectedPnpm !== "string" || !expectedPnpm.startsWith("pnpm@")) throw new Error("invalid_package_manager");
  const version = pnpm.stdout.trim();
  if (`pnpm@${version}` !== expectedPnpm) throw new Error(`package_manager_mismatch:${version}`);
  let nxProjects;
  try {
    nxProjects = JSON.parse(nx.stdout);
  } catch {
    throw new Error("invalid_nx_project_graph");
  }
  if (!Array.isArray(nxProjects) || nxProjects.length === 0) throw new Error("empty_nx_project_graph");
  return { node: process.version, packageManager: expectedPnpm, nxProjectCount: nxProjects.length };
}

function inspectIndexes(root, indexes) {
  return indexes.map((path) => {
    const target = resolveInside(root, path);
    if (!statSync(target).isFile()) throw new Error(`missing_source_index:${path}`);
    return path;
  });
}

function inspectSourceStructure(root, worktreeStatus) {
  const path = "tools/eslint-plugin-fuzzy-waddle/source-structure-baseline.json";
  const baseline = readJson(root, path);
  const entries = Object.entries(baseline);
  if (entries.some(([file, digest]) => file.startsWith("../") || !/^[0-9a-f]{64}$/u.test(digest)))
    throw new Error("invalid_source_structure_baseline");
  const changedBaselinedFiles = worktreeStatus
    .map((entry) => entry.slice(3).split(" -> ").at(-1))
    .filter((file) => Object.hasOwn(baseline, file));
  return { baseline: path, legacyEntries: entries.length, changedBaselinedFiles };
}

function inspectAdapters(root, adapters, projects) {
  const names = new Set(projects.map((project) => project.name));
  return adapters.map((adapter) => {
    const metadata = adapter.metadata ?? {};
    if (metadata.project && !names.has(metadata.project)) throw new Error(`unknown_adapter_project:${adapter.id}`);
    for (const path of metadata.sourcePaths ?? []) {
      if (typeof path !== "string" || !statSync(resolveInside(root, path)).isFile())
        throw new Error(`missing_adapter_source:${adapter.id}:${path}`);
    }
    for (const port of metadata.ports ?? []) {
      if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error(`invalid_adapter_port:${adapter.id}`);
    }
    return { id: adapter.id, schemaVersion: adapter.schemaVersion, commands: adapter.commands, metadata };
  });
}

function readGitProvenance(root, execute) {
  const revision = execute("git", ["rev-parse", "HEAD"], root);
  const status = execute("git", ["status", "--porcelain=v1"], root);
  if (revision.status !== 0 || status.status !== 0 || !/^[0-9a-f]{40}$/u.test(revision.stdout.trim()))
    throw new Error("unavailable_git_provenance");
  return { revision: revision.stdout.trim(), worktreeStatus: status.stdout.trim().split("\n").filter(Boolean) };
}

function findFiles(directory, matches) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "tmp") continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...findFiles(path, matches));
    else if (entry.isFile() && matches(path)) files.push(path);
  }
  return files;
}

function readJson(root, path) {
  return JSON.parse(readFileSync(resolveInside(root, path), "utf8"));
}

function resolveInside(root, path) {
  if (isAbsolute(path)) throw new Error(`absolute_path_not_allowed:${path}`);
  const base = resolve(root);
  const target = resolve(base, path);
  if (!target.startsWith(`${base}${sep}`)) throw new Error(`path_escapes_workspace:${path}`);
  return target;
}

function runCommand(executable, arguments_, cwd) {
  const result = spawnSync(executable, arguments_, { cwd, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}
