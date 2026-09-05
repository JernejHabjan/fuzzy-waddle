/** Read-only checks for maintained skill routes; this is not gameplay validation. */
import { access, readFile, readdir } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

/** Reject stale or escaping routes instead of silently treating them as optional. */
export async function checkPaths(root, paths) {
  const base = resolve(root);
  for (const path of new Set(paths)) {
    const target = resolve(base, path);
    if (target !== base && !target.startsWith(base + sep)) throw new Error(`Route escapes repository: ${path}`);
    try {
      await access(target);
    } catch {
      throw new Error(`Missing indexed route: ${path}`);
    }
  }
}

/** The table claims explicit targets, so compare it with the actual project definition. */
export async function checkProjectRows(root, markdown) {
  let count = 0;
  for (const line of markdown.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim().replaceAll("`", ""));
    if (!cells[1]?.endsWith("/project.json")) continue;
    await checkPaths(root, [cells[1]]);
    const project = JSON.parse(await readFile(resolve(root, cells[1]), "utf8"));
    if (project.name !== cells[0]) throw new Error(`Project name drift: ${cells[1]}`);
    const expected = cells[2]
      .split(";")[0]
      .split(",")
      .map((target) => target.trim());
    for (const target of expected)
      if (!Object.hasOwn(project.targets ?? {}, target)) throw new Error(`Missing target ${project.name}:${target}`);
    for (const match of cells[2].matchAll(/no (\w+) target/g))
      if (Object.hasOwn(project.targets ?? {}, match[1]))
        throw new Error(`Stale missing-target claim: ${project.name}:${match[1]}`);
    count += 1;
  }
  return count;
}

/** Validate links, folder/name identity, source anchors and explicit test-target claims. */
export async function checkIndex(root) {
  const skillRoot = resolve(root, "plugins/fuzzy-waddle-skills/skills");
  let skills = 0;
  let links = 0;
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(path);
        continue;
      }
      if (!entry.name.endsWith(".md")) continue;
      const text = await readFile(path, "utf8");
      if (entry.name === "SKILL.md") {
        const name = /^name: ([a-z0-9-]+)$/m.exec(text)?.[1];
        if (!name || resolve(skillRoot, name) !== directory) throw new Error(`Skill identity mismatch: ${path}`);
        if (!/^description: .+/m.test(text)) throw new Error(`Missing skill description: ${path}`);
        skills += 1;
      }
      for (const match of text.matchAll(/\]\(([^\s)]+)\)/g)) {
        if (/^(https?:|#)/.test(match[1])) continue;
        const target = resolve(directory, decodeURIComponent(match[1].split("#")[0]));
        await checkPaths(root, [target]);
        links += 1;
      }
    }
  }
  await visit(skillRoot);
  const agentRouter = await readFile(resolve(root, "AGENTS.md"), "utf8");
  await checkPaths(
    root,
    [...agentRouter.matchAll(/`(plugins\/[^`*]+\/SKILL\.md)`/g)].map((match) => match[1])
  );
  const referenceRoot = resolve(skillRoot, "fuzzy-waddle-repo-workflow/references");
  let sourceRoutes = 0;
  for (const name of ["source-index.md", "verification.md"]) {
    const text = await readFile(resolve(referenceRoot, name), "utf8");
    const paths = [...text.matchAll(/\b(?:apps|libs|tools)\/[\w./-]+/g)].map((match) => match[0]);
    await checkPaths(root, paths);
    sourceRoutes += new Set(paths).size;
  }
  const runtimeText = await readFile(resolve(skillRoot, "fuzzy-waddle-phaser/references/rts-source-index.md"), "utf8");
  const runtimeRoot = resolve(root, "libs/games/probable-waffle/phaser/src/lib");
  for (const line of runtimeText.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cell = line.split("|")[2]?.trim();
    if (!cell?.includes(".ts")) continue;
    const paths = cell.split(";").map((path) => path.trim());
    await checkPaths(runtimeRoot, paths);
    sourceRoutes += paths.length;
  }
  await checkPaths(
    root,
    [...runtimeText.matchAll(/\b(?:apps|libs|docs)\/[\w./-]+/g)].map((match) => match[0])
  );
  const projects = await checkProjectRows(root, await readFile(resolve(referenceRoot, "verification.md"), "utf8"));
  return { skills, links, sourceRoutes, projects };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  console.log("PASS:", await checkIndex(root));
}
