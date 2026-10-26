import { strict as assert } from "node:assert";
import { test } from "node:test";
import { pnpmInvocation } from "./skirmish-matrix-execution.mjs";

test("runtime runner resolves pnpm.cmd through the Windows command shell", () => {
  const args = ["exec", "playwright", "test", "spec.ts", "--workers=1"];
  assert.deepEqual(pnpmInvocation(args, "win32", "C:\\Windows\\System32\\cmd.exe"), {
    command: "C:\\Windows\\System32\\cmd.exe",
    args: ["/d", "/s", "/c", "pnpm exec playwright test spec.ts --workers=1"]
  });
});

test("runtime runner invokes pnpm directly on POSIX systems", () => {
  const args = ["exec", "playwright", "test", "spec.ts"];
  assert.deepEqual(pnpmInvocation(args, "linux"), { command: "pnpm", args });
});
