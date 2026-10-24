import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import { fortificationAccessWorld } from "./skirmish-ai-fortification-access-world";
import { evaluateFortificationAccessWorld } from "./skirmish-ai-fortification-access-evaluation";
import { captureRuntimeHumanAuthority } from "./skirmish-ai-runtime-human-capture";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";
import { digestRuntimeValue } from "./skirmish-ai-runtime-digest";
import { encodeRuntimeProductionWorld } from "./skirmish-ai-runtime-production-world-storage";

test.skip(process.env.AI_FORTIFICATION_WORLD_E2E !== "1", "Explicit native physical controls, not full wall-plan acceptance.");
test.setTimeout(360_000);

for (const branch of ["stairs_present", "stairs_missing", "opening_worker", "opening_army", "sealed", "breach"] as const) {
  test(`native fortification access: ${branch}`, async ({ browser }, testInfo) => {
    const fixture = fortificationAccessWorld(branch), variant = fixture.recipe.variants[0];
    if (!variant) throw new Error("fortification_access_variant_missing");
    const source = execFileSync("git", ["rev-parse", "HEAD"], { cwd: resolve(__dirname, "../../../.."), encoding: "utf8" }).trim();
    let human: AiRuntimeProductionCaptureV1 | undefined;
    const result = await runVariant(browser, fixture, variant, null, fixture.scenarioIds, source, digestRuntimeValue(fixture),
      async (page, index) => {
        if (index === -1) await captureRuntimeHumanAuthority(page, 1, 800);
        if (index === fixture.recipe.checkpointTicks.length - 1) human = await captureRuntimeHumanAuthority(page, 1);
      }
    );
    const failures = [...result.aiErrors, ...evaluateFortificationAccessWorld(branch, result, human)];
    await testInfo.attach(`fortification-${branch}-summary.json`, {
      body: Buffer.from(JSON.stringify({ branch, source, failureCount: failures.length,
        failures: failures.slice(0, 12).map((failure) => failure.slice(0, 80)), omittedFailures: Math.max(0, failures.length - 12),
        shortenedFailureDetails: failures.slice(0, 12).filter((failure) => failure.length > 80).length,
        limitations: ["Human-owned physical control; AI construction prefixes, firing, shore/air safety and spend remain open"]
      })), contentType: "application/json"
    });
    await testInfo.attach(`fortification-${branch}-raw.json`, {
      body: Buffer.from(JSON.stringify({ ...encodeRuntimeProductionWorld(result), humanCapture: human, evaluationFailures: failures })),
      contentType: "application/json"
    });
    expect(failures.length, failures.slice(0, 12).map((failure) => failure.slice(0, 80)).join("\n")).toBe(0);
  });
}
