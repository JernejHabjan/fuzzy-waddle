import type { Page } from "@playwright/test";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";
import type { AiRuntimeDecisionRepro } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-decision-repro";

/** Keep only exact-boundary fingerprints; full selected inputs remain inside the native scene observer callback. */
export async function armNativeDecisionTrace(page: Page, playerNumber: number) {
  await page.evaluate((playerNumber) => {
    type TraceEntry = { tick: number; sequence: number; inputDigest: string; resultDigest: string };
    type Handle = { read(): { overflow: boolean; records: TraceEntry[] }; dispose(): void };
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1;
      __nativeDecisionTrace?: Handle };
    realm.__nativeDecisionTrace?.dispose();
    const scene = realm.__fuzzyWaddleAiRuntimeBrowserTestV1?.game.scene.getScenes(true)
      .find((entry) => entry.scene.key.startsWith("Map"));
    if (!scene) throw new Error("native_decision_trace_scene_missing");
    const records: TraceEntry[] = [];
    let overflow = false;
    const canonical = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(canonical);
      if (value !== null && typeof value === "object") return Object.fromEntries(Object.keys(value).sort()
        .map((key) => [key, canonical((value as Record<string, unknown>)[key])]));
      return value;
    };
    const digest = (value: unknown) => {
      const text = JSON.stringify(canonical(value));
      let hash = 0x811c9dc5;
      for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193);
      return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
    };
    const receive = (capture: AiRuntimeDecisionRepro) => {
      if (capture.payload.observation.playerNumber !== playerNumber) return;
      if (records.length >= 2048) { overflow = true; scene.events.off("ai-runtime-decision-repro", receive); return; }
      const result = capture.payload.expectedResult;
      if (!result) { overflow = true; return; }
      records.push({ tick: capture.payload.observation.tick, sequence: result.nextState.scheduler.decisionSequence,
        inputDigest: digest({ profile: capture.profile, catalog: capture.catalog, observation: capture.payload.observation,
          priorState: capture.payload.priorState, outcomes: capture.payload.outcomes }),
        resultDigest: digest({ nextState: result.nextState, acceptedIntents: result.acceptedIntents }) });
    };
    const handle: Handle = { read: () => ({ overflow, records: records.map((entry) => ({ ...entry })) }), dispose: () => {
      scene.events.off("ai-runtime-decision-repro", receive);
      scene.events.off("shutdown", handle.dispose);
      if (realm.__nativeDecisionTrace === handle) delete realm.__nativeDecisionTrace;
    } };
    realm.__nativeDecisionTrace = handle;
    scene.events.on("ai-runtime-decision-repro", receive);
    scene.events.once("shutdown", handle.dispose);
  }, playerNumber);
}

export async function closeNativeDecisionTrace(page: Page) {
  return page.evaluate(() => {
    const realm = window as unknown as { __nativeDecisionTrace?: {
      read(): { overflow: boolean; records: { tick: number; sequence: number; inputDigest: string; resultDigest: string }[] };
      dispose(): void } };
    if (!realm.__nativeDecisionTrace) throw new Error("native_decision_trace_owner_missing");
    const result = realm.__nativeDecisionTrace.read();
    realm.__nativeDecisionTrace.dispose();
    return result;
  });
}
