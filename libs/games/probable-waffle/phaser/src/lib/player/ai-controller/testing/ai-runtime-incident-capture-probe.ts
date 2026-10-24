import type Phaser from "phaser";
import { AiIncidentCaptureStoreV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { captureAiDecisionBundleV1 } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-repro-runner-v1";
import { digestCanonicalAiValue } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/canonical-ai-serialization";
import type { AiRuntimeDecisionRepro } from "./ai-runtime-decision-repro";

/** Explicit diagnostic owner over an actual selected input; no probe or store exists unless the browser harness arms it. */
export function armAiRuntimeIncidentCaptureProbe(scene: Phaser.Scene, sourceRevision: string, dirtySourceDigest: string | null) {
  const store = new AiIncidentCaptureStoreV1({ maxRetainedIncidentBundles: 5, sessionQuotaBytes: 16 * 1024 });
  let capture: AiRuntimeDecisionRepro | undefined;
  const listener = (value: AiRuntimeDecisionRepro) => { capture = value; };
  const dispose = () => { scene.events.off("ai-runtime-decision-repro", listener); capture = undefined; store.dispose(); };
  scene.events.once("ai-runtime-decision-repro", listener);
  scene.events.once("shutdown", dispose);
  return {
    captureEpisode(episode: string) {
      if (!capture || store.metrics().disposed) throw new Error("native_incident_capture_unavailable");
      const { payload, profile, catalog } = capture;
      const artifact = captureAiDecisionBundleV1(payload, { sourceRevision, dirtySourceDigest,
        mapId: "AI Open Economy (test only)", mapDigest: digestCanonicalAiValue(payload.observation.map ?? null),
        contentDigest: digestCanonicalAiValue(catalog), configVersion: profile.profileVersion,
        profileVersion: profile.profileVersion, archetypeVersion: profile.archetypeVersion,
        difficulty: profile.difficulty, faction: payload.observation.faction, playerNumber: payload.observation.playerNumber,
        rulesVersion: "skirmish-ai-v1", tickInterval: 50, authorityEpoch: payload.priorState.authority.authorityEpoch,
        tick: payload.observation.tick, expectedCheckpoints: [], scenarioId: "DBG-06" }, "Actual native incident");
      return store.addAutomatic(episode, artifact.manifest);
    },
    metrics: () => ({ ...store.metrics(), listenerDetached: scene.events.listeners("ai-runtime-decision-repro")
      .every((entry) => entry !== listener), captureReleased: !capture })
  };
}
