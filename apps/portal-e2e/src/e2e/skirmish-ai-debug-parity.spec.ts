import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import { digestRuntimeValue } from "./skirmish-ai-runtime-digest";
import { exerciseDebug } from "./skirmish-ai-debug-panel-exercise";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";

const repositoryRoot = resolve(__dirname, "../../../..");
const fixturePath = resolve(repositoryRoot, "tools/ai/fixtures/focused-hidden-state-runtime.json");
const screenshotDirectory = resolve(repositoryRoot, "tmp/ai-debug-parity");


test("AI debug hidden, shown, historical and exported views preserve authoritative outcomes", async ({ browser }) => {
  test.setTimeout(600_000);
  mkdirSync(screenshotDirectory, { recursive: true });
  const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as RuntimeFixtureV1;
  const authoredVariant = fixture.recipe.variants[0];
  if (!authoredVariant) throw new Error("debug_parity_variant_missing");
  const variant = { ...authoredVariant, checkpointTicks: [20, 100, 200, 400] };
  const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const fixtureDigest = digestRuntimeValue(fixture);
  const modes = ["hidden", "shown", "historical", "exported"] as const;
  const results = [];
  for (const mode of modes) {
    results.push(
      await runVariant(browser, fixture, variant, null, ["SCOUT-05"], revision, fixtureDigest, (page, index) =>
        exerciseDebug(page, mode, index, false, screenshotDirectory)
      )
    );
  }
  const authoritativeDigests = results.map((result) => result.outcomeDigest);
  expect(results.flatMap((result) => result.aiErrors)).toEqual([]);
  expect(results.at(0)?.checkpoints.at(-1)?.decisionSequence).toBeGreaterThan(0);
  expect(new Set(authoritativeDigests).size).toBe(1);
});

test("AI debug selection releases replaced presentation resources", async ({ browser }) => {
  test.setTimeout(240_000);
  mkdirSync(screenshotDirectory, { recursive: true });
  const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as RuntimeFixtureV1;
  const authoredVariant = fixture.recipe.variants[0];
  if (!authoredVariant) throw new Error("debug_lifecycle_variant_missing");
  const variant = { ...authoredVariant, checkpointTicks: [20, 100, 200, 400] };
  const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const result = await runVariant(
    browser,
    fixture,
    variant,
    null,
    ["SCOUT-05"],
    revision,
    digestRuntimeValue(fixture),
    (page, index) => exerciseDebug(page, "shown", index, true, screenshotDirectory)
  );
  expect(result.aiErrors).toEqual([]);
  expect(result.checkpoints.at(-1)?.decisionSequence).toBeGreaterThan(0);
});
