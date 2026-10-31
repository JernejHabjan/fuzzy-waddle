import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fieldPlacementWorld } from "./skirmish-ai-field-placement-world";
import { evaluateFieldPlacementWorld } from "./skirmish-ai-field-placement-evaluation";
import { evaluateRuntimePlacementPrefixes } from "./skirmish-ai-placement-prefix-evaluation";
import { evaluateRuntimeVariant } from "./skirmish-ai-runtime-variant-evaluation";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";
import { digestRuntimeValue } from "./skirmish-ai-runtime-digest";
import { encodeRuntimeProductionWorld } from "./skirmish-ai-runtime-production-world-storage";

test.skip(process.env.AI_PLACEMENT_WORLD_E2E !== "1", "Explicit native field owner controls, not full PLACE acceptance.");
test.setTimeout(360_000);

for (const faction of ["Tivara", "Skaduwee"] as const) {
  test(`native field placement and food: ${faction}`, async ({ browser }, testInfo) => {
    const fixture = fieldPlacementWorld(faction), variant = fixture.recipe.variants[0], assertion = fixture.assertions["PLACE-01"];
    if (!variant?.presetWorld || !assertion) throw new Error("field_placement_variant_missing");
    const source = execFileSync("git", ["rev-parse", "HEAD"], { cwd: resolve(__dirname, "../../../.."), encoding: "utf8" }).trim();
    const result = await runVariant(browser, fixture, variant, null, ["PLACE-01"], source, digestRuntimeValue(fixture));
    const failures = [
      ...evaluateRuntimeVariant("PLACE-01", assertion, result),
      ...evaluateRuntimePlacementPrefixes(variant.presetWorld, result, 2),
      ...evaluateFieldPlacementWorld(result)
    ];
    await testInfo.attach(`field-placement-${faction}-summary.json`, {
      body: Buffer.from(JSON.stringify({
        faction, source, failures: failures.slice(0, 12).map((failure) => failure.slice(0, 80)),
        omittedFailures: Math.max(0, failures.length - 12),
        shortenedFailureDetails: failures.slice(0, 12).filter((failure) => failure.length > 80).length,
        tick: result.checkpoints.at(-1)?.tick,
        limitations: ["Safe-room owner branch; constrained sites, threats, actual per-prefix unit transit and expansion remain open"]
      })), contentType: "application/json"
    });
    await testInfo.attach(`field-placement-${faction}-raw.json`, {
      body: Buffer.from(JSON.stringify({ ...encodeRuntimeProductionWorld(result), evaluationFailures: failures })),
      contentType: "application/json"
    });
    expect(failures.length, failures.slice(0, 12).map((failure) => failure.slice(0, 80)).join("\n")).toBe(0);
  });
}
