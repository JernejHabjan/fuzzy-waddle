import { execFileSync } from "node:child_process";
import { join } from "node:path";
import type { RuntimeFixture } from "../contracts/skirmish-ai-runtime-fixture";

/** Expand authoring recipes in the tooling process, keeping its compiler boundary separate from E2E. */
export function readRuntimeFixture(root: string, reference: string): RuntimeFixture {
  const reader = join(root, "tools/probable-waffle/skirmish/ai/cli/read-runtime-fixture.ts");
  return JSON.parse(
    execFileSync(process.execPath, [reader, reference], { cwd: root, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 })
  );
}
