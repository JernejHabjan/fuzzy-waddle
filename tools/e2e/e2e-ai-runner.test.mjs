import assert from "node:assert/strict";
import test from "node:test";
import { runE2eWithAi } from "./e2e-ai-runner.mjs";

test("core pins its profile and forwards filters only to ordinary E2E", async () => {
  const calls = [];
  const exit = await runE2eWithAi({
    mode: "core",
    forwardedArgs: ["--grep", "opening"],
    run: async (args) => {
      calls.push(args);
      return calls.length === 1 ? 0 : 7;
    },
    resolveRelease: () => assert.fail("core must not resolve full release provenance")
  });
  assert.equal(exit, 7);
  assert.deepEqual(calls, [
    ["node_modules/nx/dist/bin/nx.js", "run", "portal-e2e:e2e", "--grep", "opening"],
    ["tools/probable-waffle/skirmish/ai/cli/run-ai-regression.ts", "--profile", "core"]
  ]);
});

test("neither AI mode runs after ordinary E2E fails", async () => {
  for (const mode of ["core", "full"]) {
    let calls = 0;
    assert.equal(
      await runE2eWithAi({
        mode,
        run: async () => {
          calls++;
          return 4;
        },
        resolveRelease: () => assert.fail("failed E2E must short circuit release resolution")
      }),
      4
    );
    assert.equal(calls, 1);
  }
});

test("full selects the release catalog and preserves a blocked runner exit", async () => {
  const calls = [];
  const exit = await runE2eWithAi({
    mode: "full",
    run: async (args) => {
      calls.push(args);
      return calls.length === 1 ? 0 : 1;
    },
    resolveRelease: () => {
      assert.equal(calls.length, 1);
      return { candidate: "a".repeat(40), baseline: "b".repeat(40) };
    }
  });
  assert.equal(exit, 1);
  assert.deepEqual(calls[1], [
    "tools/probable-waffle/skirmish/ai/cli/run-skirmish-matrix.ts",
    "--suite",
    "release",
    "--candidate",
    "a".repeat(40),
    "--baseline",
    "b".repeat(40)
  ]);
});

test("invalid modes fail before launching E2E", async () => {
  await assert.rejects(runE2eWithAi({ mode: "all", run: () => assert.fail("must not spawn") }), /invalid_e2e_ai_mode/);
});

test("release resolution errors are propagated", async () => {
  await assert.rejects(
    runE2eWithAi({
      mode: "full",
      run: async () => 0,
      resolveRelease: () => {
        throw new Error("missing baseline");
      }
    }),
    /missing baseline/
  );
});
