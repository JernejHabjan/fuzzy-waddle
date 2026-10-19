import type { Browser } from "@playwright/test";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeRequestV1 } from "./skirmish-ai-runtime-request";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";
import { captureRuntimeHumanAuthority } from "./skirmish-ai-runtime-human-capture";
import { captureRuntimeProductionAuthority } from "./skirmish-ai-runtime-production-capture";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";

/** The existing runner owns the match. Bound cases additionally arm/read the same observer for the real human opponent. */
export async function runRegisteredRuntimeVariant(
  browser: Browser, fixture: RuntimeFixtureV1, variant: RuntimeVariantV1, request: RuntimeRequestV1
) {
  const contract = (request.scenarioIds.includes("EXP-02") ? fixture.assertions["EXP-02"]?.requiredExpansionPressure : undefined) ??
    request.scenarioIds.map((id) => fixture.assertions[id]?.requiredNativeScenario).find((binding) => binding !== undefined);
  let opponentCapture: AiRuntimeProductionCaptureV1 | undefined;
  let otherOpponentCaptures: AiRuntimeProductionCaptureV1[] | undefined;
  const result = await runVariant(browser, fixture, variant, request.seed, request.scenarioIds,
    request.sourceRevision, request.fixtureDigest, contract ? async (page, index, checkpoint?: RuntimeCheckpointV1) => {
      if (index === -1) {
        await captureRuntimeHumanAuthority(page, contract.humanPlayerNumber, contract.latestTick);
        for (const player of variant.additionalAiPlayers ?? [])
          await captureRuntimeProductionAuthority(page, player.playerNumber, contract.latestTick, true);
      }
      if (index === (variant.checkpointTicks ?? fixture.recipe.checkpointTicks).length - 1 ||
          checkpoint?.gameResult === "win" && request.scenarioIds.some((id) => fixture.assertions[id]?.requireAiVictory)) {
        opponentCapture = await captureRuntimeHumanAuthority(page, contract.humanPlayerNumber);
        otherOpponentCaptures = await Promise.all((variant.additionalAiPlayers ?? []).map((player) =>
          captureRuntimeProductionAuthority(page, player.playerNumber, undefined, true)));
      }
    } : undefined
  );
  return contract ? { ...result, opponentCapture, ...(otherOpponentCaptures?.length ? { otherOpponentCaptures } : {}) } : result;
}
