import { expect, type Browser } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeRequestV1 } from "./skirmish-ai-runtime-request";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import type GameProbableWaffleScene from
  "@fuzzy-waddle/probable-waffle-phaser/world/scenes/GameProbableWaffleScene";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";
import type { ActorIndexSystem } from "@fuzzy-waddle/probable-waffle-phaser/world/services/ActorIndexSystem";
import { startMultiplayerTestMatch } from "./skirmish-ai-multiplayer-match";
import { multiplayerAuthorityProbe } from "./skirmish-ai-multiplayer-authority-probe";
import { observeMultiplayerPeer } from "./skirmish-ai-multiplayer-observation";
import { installRuntimeAccessor } from "./skirmish-ai-runtime-browser-accessor";
import { captureCheckpoint } from "./skirmish-ai-runtime-checkpoint-capture";
import { retainNativeSceneWork } from "./skirmish-ai-native-retained-work";
import { transitionNativeLifecycle } from "./skirmish-ai-native-lifecycle-transition";
import { projectRuntimeVariantStart } from "./skirmish-ai-runtime-variant-start-report";
import { nativeDebugWorldDigest } from "./skirmish-ai-native-debug-comparison";
import { installRuntimeErrorListeners } from "./skirmish-ai-runtime-error-listeners";

/** Genuine relayed AI3 host replacement, followed by a native AI2 next match in the surviving peer's original realm. */
export async function runNativeLifecycleMultiplayer(
  browser: Browser, fixture: RuntimeFixtureV1, variant: RuntimeVariantV1, request: RuntimeRequestV1
): Promise<RuntimeVariantResultV1> {
  if (process.env.AI_MULTIPLAYER_E2E !== "1") throw new Error("native_lifecycle_requires_real_multiplayer_config");
  const seed = request.seed ?? variant.seed;
  const match = await startMultiplayerTestMatch(browser, { authorityProbe: true, seed,
    aiFaction: variant.aiFaction, aiDifficulty: variant.difficulty });
  const aiErrors: string[] = [];
  installRuntimeErrorListeners(match.peer, aiErrors);
  try {
    await expect.poll(async () => {
      try {
        const probe = await multiplayerAuthorityProbe(match.peer, "pin");
        return !!probe.original && probe.active && probe.applications === 1 && probe.failure === null;
      }
      catch (error) {
        if (String(error).includes("actual_linked_ai_work_missing")) return false;
        throw error;
      }
    }, { timeout: 60_000 }).toBe(true);
    const pinned = await multiplayerAuthorityProbe(match.peer, "retain");
    await match.hostContext.close();
    await expect.poll(async () => {
      const peer = await observeMultiplayerPeer(match.peer, 3);
      return peer.aiControllerPresent && peer.relay.authorityEpoch > pinned.authorityEpoch;
    }, { timeout: 60_000 }).toBe(true);
    await installRuntimeAccessor(match.peer);
    await match.peer.waitForFunction(() => !!window.__fuzzyWaddleAiRuntimePartsV1?.(3)?.controller.getCommittedObservation());
    await match.peer.evaluate(() => {
      const clock = window.__fuzzyWaddleAiRuntimePartsV1?.(3)?.tickService;
      if (!clock) throw new Error("lifecycle_promoted_native_clock_missing");
      clock.pauseTick("manual");
    });
    await match.peer.waitForFunction(() => window.__fuzzyWaddleAiRuntimePartsV1?.(3)?.controller.isDecisionBoundarySettled());
    const initial = await match.peer.evaluate(() => {
      const host = (window as unknown as { __fuzzyWaddleAiMultiplayerBrowserTestV1?:
        Pick<AiRuntimeBrowserTestHostV1, "game"> }).__fuzzyWaddleAiMultiplayerBrowserTestV1;
      const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key === "MapAiMultiplayer") as
        GameProbableWaffleScene | undefined;
      const services: readonly object[] = scene?.getSceneGameData().services ?? [];
      const index = services.find((entry): entry is ActorIndexSystem => "getOwnedActors" in entry && "getActorById" in entry);
      if (!scene || !index) throw new Error("lifecycle_actual_multiplayer_boundary_missing");
      const actors = index.getOwnedActors(3);
      return { state: { ownedActorCount: actors.length, ownedActorNames: actors.map((actor) => actor.name).sort(),
        workerCount: actors.filter((actor) => {
          const components = actor.getData("actorData")?.components as Map<{ name: string }, unknown> | undefined;
          return [...(components?.keys() ?? [])].some((key) => key.name === "GathererComponent");
        }).length }, presetApplication: null,
        initialResourceBalances: Object.fromEntries(scene.players.map((player) => [player.playerNumber, player.getResources()])) };
    });
    const observedTick = await match.peer.evaluate(() => window.__fuzzyWaddleAiRuntimePartsV1?.(3)?.tickService.currentTick);
    if (observedTick === undefined || observedTick > 4000) throw new Error("native_lifecycle_promotion_exceeded_original_ceiling");
    const checkpoint = await captureCheckpoint(match.peer, 3, observedTick, false);
    const promotedEpoch = (await observeMultiplayerPeer(match.peer, 3)).relay.authorityEpoch;
    await retainNativeSceneWork(match.peer, 3, false);
    const initialWorldDigest = await nativeDebugWorldDigest(match.peer);
    const nativeLifecycle = { ...await transitionNativeLifecycle(match.peer, fixture, variant, "host_replacement", 3,
      request.sourceRevision, request.fixtureDigest), originalEpoch: pinned.authorityEpoch, promotedEpoch };
    return { ...projectRuntimeVariantStart(variant, initial, seed, "AI Multiplayer (test only)"),
      initialWorldDigest, stopReason: "checkpoint_ceiling", outcomeDigest: nativeLifecycle.nativeAfterLateWork,
      checkpoints: [checkpoint], perturbations: [], aiErrors: [...aiErrors], nativeLifecycle };
  } finally { await match.dispose(); }
}
