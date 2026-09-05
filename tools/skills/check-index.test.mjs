import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { checkPaths, checkProjectRows } from "./check-index.mjs";

/** Isolated generated fixtures never modify repository files or invoke game targets. */
async function fixture(t) {
  const root = await mkdtemp(resolve(tmpdir(), "fuzzy-skill-index-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(resolve(root, "libs/sample"), { recursive: true });
  await writeFile(resolve(root, "libs/sample/project.json"), JSON.stringify({ name: "sample", targets: { lint: {} } }));
  return root;
}

test("indexed paths resolve, while stale paths and traversal fail", async (t) => {
  const root = await fixture(t);
  await checkPaths(root, ["libs/sample/", "libs/sample/project.json"]);
  await assert.rejects(checkPaths(root, ["libs/moved/project.json"]), /Missing indexed route/);
  await assert.rejects(checkPaths(root, ["../"]), /escapes repository/);
});

test("target claims reflect the actual project, not a plausible command name", async (t) => {
  const root = await fixture(t);
  assert.equal(await checkProjectRows(root, "| sample | libs/sample/project.json | lint; no test target yet |"), 1);
  await assert.rejects(
    checkProjectRows(root, "| sample | libs/sample/project.json | lint, test |"),
    /Missing target sample:test/
  );
  await assert.rejects(
    checkProjectRows(root, "| sample | libs/sample/project.json | lint; no lint target yet |"),
    /Stale missing-target claim/
  );
  await assert.rejects(checkProjectRows(root, "| renamed | libs/sample/project.json | lint |"), /Project name drift/);
});
