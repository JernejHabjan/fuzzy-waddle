import type { Browser } from "@playwright/test";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeRequestV1 } from "./skirmish-ai-runtime-request";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";
import { captureRuntimeHumanAuthority } from "./skirmish-ai-runtime-human-capture";

/** The existing runner owns the match. Bound cases additionally arm/read the same observer for the real human opponent. */
export async function runRegisteredRuntimeVariant(
  browser: Browser, fixture: RuntimeFixtureV1, variant: RuntimeVariantV1, request: RuntimeRequestV1
) {
  const contract = (request.scenarioIds.includes("EXP-02") ? fixture.assertions["EXP-02"]?.requiredExpansionPressure : undefined) ??
    request.scenarioIds.map((id) => fixture.assertions[id]?.requiredNativeScenario).find((binding) => binding !== undefined);
  let opponentCapture: AiRuntimeProductionCaptureV1 | undefined;
  const result = await runVariant(browser, fixture, variant, request.seed, request.scenarioIds,
    request.sourceRevision, request.fixtureDigest, contract ? async (page, index) => {
      if (index === -1) await captureRuntimeHumanAuthority(page, contract.humanPlayerNumber, contract.latestTick);
      if (index === (variant.checkpointTicks ?? fixture.recipe.checkpointTicks).length - 1) {
        opponentCapture = await captureRuntimeHumanAuthority(page, contract.humanPlayerNumber);
      }
    } : undefined
  );
  return contract ? { ...result, opponentCapture } : result;
}
