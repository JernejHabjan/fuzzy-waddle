import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { manageProcess } from "./process-lifecycle.mjs";

const definition = {
  adapterId: "skirmish-ai",
  id: "portal-runtime",
  executable: "node",
  arguments: ["server.mjs"],
  cwd: ".",
  readyUrl: "http://127.0.0.1:4200",
  timeoutMilliseconds: 1_000
};

async function fixture(t) {
  const root = await mkdtemp(resolve(tmpdir(), "fuzzy-agent-process-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test("starts once and reuses only the matching process identity", async (t) => {
  const root = await fixture(t);
  let spawned = 0;
  const operations = {
    spawn: () => ({
      pid: 42,
      unref() {
        spawned += 1;
      }
    }),
    isLive: (pid) => pid === 42,
    readArguments: () => ["node", "server.mjs"],
    waitForReady: async () => {},
    kill: () => {}
  };
  const started = await manageProcess(root, definition, "start", operations);
  const reused = await manageProcess(root, definition, "start", operations);
  assert.equal(started.state, "started");
  assert.equal(reused.state, "reused");
  assert.equal(spawned, 1);
});

test("does not kill a live process whose command identity has changed", async (t) => {
  const root = await fixture(t);
  let killed = false;
  const operations = {
    spawn: () => ({ pid: 42, unref() {} }),
    isLive: () => true,
    readArguments: () => ["/usr/bin/node", "other.mjs"],
    waitForReady: async () => {},
    kill: () => {
      killed = true;
    }
  };
  await manageProcess(root, definition, "start", {
    ...operations,
    readArguments: () => ["/usr/bin/node", "server.mjs"]
  });
  await assert.rejects(() => manageProcess(root, definition, "stop", operations), /managed_process_identity_mismatch/u);
  assert.equal(killed, false);
});

test("stops a matching process and clears its reusable ownership state", async (t) => {
  const root = await fixture(t);
  let live = true;
  const operations = {
    spawn: () => ({ pid: 42, unref() {} }),
    isLive: () => live,
    readArguments: () => ["node", "server.mjs"],
    waitForReady: async () => {},
    kill: () => {
      live = false;
    },
    sleep: async () => {}
  };
  await manageProcess(root, definition, "start", operations);
  assert.equal((await manageProcess(root, definition, "stop", operations)).state, "stopped");
  assert.equal((await manageProcess(root, definition, "status", operations)).state, "not_running");
});

test("rejects definitions outside the adapter-owned local process boundary", async (t) => {
  const root = await fixture(t);
  await assert.rejects(
    () => manageProcess(root, { ...definition, readyUrl: "https://example.com" }, "status"),
    /invalid_managed_process_definition/u
  );
});
