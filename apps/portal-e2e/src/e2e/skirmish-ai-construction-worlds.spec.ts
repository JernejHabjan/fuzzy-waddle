import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { constructionRecoveryWorld } from "./skirmish-ai-construction-world";
import { evaluateConstructionRecoveryWorld } from "./skirmish-ai-construction-world-evaluation";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";
import { evaluateRuntimeVariant } from "./skirmish-ai-runtime-variant-evaluation";
import { digestRuntimeValue } from "./skirmish-ai-runtime-digest";
import { encodeRuntimeProductionWorld } from "./skirmish-ai-runtime-production-world-storage";

test.skip(process.env.AI_CONSTRUCTION_WORLD_E2E !== "1", "Explicit native owner control, not full scenario acceptance.");
test.setTimeout(360_000);

for (const branch of ["builder_loss", "intact", "cancel_site"] as const) {
  test(`native construction binding: ${branch}`, async ({ browser }, testInfo) => {
    const fixture = constructionRecoveryWorld(branch);
    const source = execFileSync("git", ["rev-parse", "HEAD"], { cwd: resolve(__dirname, "../../../.."), encoding: "utf8" }).trim();
    const variant = fixture.recipe.variants[0];
    const assertion = fixture.assertions["PLACE-03"];
    if (!variant?.presetWorld || !assertion) throw new Error("construction_variant_missing");
    const result = await runVariant(browser, fixture, variant, null, ["PLACE-03"], source, digestRuntimeValue(fixture));
    const failures = [
      ...evaluateRuntimeVariant("PLACE-03", assertion, result),
      ...evaluateConstructionRecoveryWorld(branch, result)
    ];
    await testInfo.attach(`construction-${branch}-summary.json`, {
      body: Buffer.from(JSON.stringify({
        branch, source, failures: failures.slice(0, 12).map((failure) => failure.slice(0, 80)),
        omittedFailures: Math.max(0, failures.length - 12),
        shortenedFailureDetails: failures.slice(0, 12).filter((failure) => failure.length > 80).length,
        site: result.presetCreatedActorIds["unfinished-producer"], tick: result.checkpoints.at(-1)?.tick,
        limitations: ["Tivara owner control; static envelopes do not prove unit transit, spawn, walls or peer/replay"]
      })),
      contentType: "application/json"
    });
    // Existing single-copy storage retains proof locally; only the bounded summary is intended for model context.
    await testInfo.attach(`construction-${branch}-raw.json`, {
      body: Buffer.from(JSON.stringify({ ...encodeRuntimeProductionWorld(result), evaluationFailures: failures })),
      contentType: "application/json"
    });
    expect(failures.length, failures.slice(0, 12).join("\n")).toBe(0);
  });
}
