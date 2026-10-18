import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import { expansionWorld } from "./skirmish-ai-expansion-world";
import { evaluateExpansionWorld } from "./skirmish-ai-expansion-world-evaluation";
import { captureRuntimeHumanAuthority } from "./skirmish-ai-runtime-human-capture";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";
import { digestRuntimeValue } from "./skirmish-ai-runtime-digest";
import { encodeRuntimeProductionWorld } from "./skirmish-ai-runtime-production-world-storage";

test.skip(process.env.AI_EXPANSION_WORLD_E2E !== "1", "Explicit native land owner branches, not complete EXP acceptance.");
test.setTimeout(600_000);

for (const faction of ["Tivara", "Skaduwee"] as const) {
  for (const branch of ["expand", "served", "home_pressure", "pressure_withdrawn"] as const) {
    test(`native expansion: ${faction} ${branch}`, async ({ browser }, testInfo) => {
      const fixture = expansionWorld(faction, branch), variant = fixture.recipe.variants[0];
      if (!variant) throw new Error("expansion_variant_missing");
      const source = execFileSync("git", ["rev-parse", "HEAD"], { cwd: resolve(__dirname, "../../../.."), encoding: "utf8" }).trim();
      let human: AiRuntimeProductionCaptureV1 | undefined;
      const result = await runVariant(browser, fixture, variant, null, fixture.scenarioIds, source, digestRuntimeValue(fixture),
        async (page, index) => {
          if (index === -1) await captureRuntimeHumanAuthority(page, 1, 3000);
          if (index === fixture.recipe.checkpointTicks.length - 1) human = await captureRuntimeHumanAuthority(page, 1);
        }
      );
      const failures = [...result.aiErrors, ...evaluateExpansionWorld(branch, result, human)];
      await testInfo.attach(`expansion-${faction}-${branch}-summary.json`, {
        body: Buffer.from(JSON.stringify({ faction, branch, source, failureCount: failures.length,
          failures: failures.slice(0, 12).map((failure) => failure.slice(0, 80)), omittedFailures: Math.max(0, failures.length - 12),
          shortenedFailureDetails: failures.slice(0, 12).filter((failure) => failure.length > 80).length,
          limitations: ["Land owner branches; combat-based removal, exhaustive site utility and cross-lease controls remain open"]
        })), contentType: "application/json"
      });
      await testInfo.attach(`expansion-${faction}-${branch}-raw.json`, {
        body: Buffer.from(JSON.stringify({ ...encodeRuntimeProductionWorld(result), humanCapture: human, evaluationFailures: failures })),
        contentType: "application/json"
      });
      expect(failures.length, failures.slice(0, 12).map((failure) => failure.slice(0, 80)).join("\n")).toBe(0);
    });
  }
}
