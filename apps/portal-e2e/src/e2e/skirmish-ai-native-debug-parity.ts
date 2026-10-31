import type { Page } from "@playwright/test";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";
import type { armAiRuntimeIncidentCaptureProbe } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-incident-capture-probe";
import { nativeDebugWorldDigest } from "./skirmish-ai-native-debug-comparison";
import { captureNativeDisposal } from "./skirmish-ai-native-disposal";
import type { NativeDebugParityProof } from "./skirmish-ai-native-debug-parity-proof";

/** Arm the real scene-owned diagnostic capture, including its shutdown subscriber, before the first selected input. */
export async function armNativeDebugParity(page: Page, sourceRevision: string, dirtySourceDigest: string | null) {
  await page.evaluate(({ sourceRevision, dirtySourceDigest }) => {
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1;
      __nativeDebugQuota?: ReturnType<typeof armAiRuntimeIncidentCaptureProbe> };
    const arm = realm.__fuzzyWaddleAiRuntimeBrowserTestV1?.armIncidentCaptureProbe;
    if (!arm) throw new Error("native_debug_incident_owner_missing");
    realm.__nativeDebugQuota = arm(sourceRevision, dirtySourceDigest);
  }, { sourceRevision, dirtySourceDigest });
}

/** Finite functional quota pressure leaves the paused authoritative world untouched, then actual shutdown releases ownership. */
export async function captureNativeDebugParity(page: Page) {
  const beforeDigest = await nativeDebugWorldDigest(page);
  const quota = await page.evaluate(() => {
    const probe = (window as unknown as { __nativeDebugQuota?: ReturnType<typeof armAiRuntimeIncidentCaptureProbe> })
      .__nativeDebugQuota;
    if (!probe) throw new Error("native_debug_incident_capture_missing");
    let accepted = 0, rejected = false;
    for (let i = 0; i < 32; i++) {
      const result = probe.captureEpisode(`diagnostic-quota-${i}`);
      if (result === "captured") accepted++;
      if (result === "quota_exceeded") { rejected = true; break; }
    }
    const history = window.__fuzzyWaddleAiRuntimePartsV1?.(2)?.controller.getBrainDebugHistory();
    const first = history?.[0], last = history?.at(-1);
    if (!history || !first || !last) throw new Error("native_debug_retained_history_missing");
    return { accepted, rejected, repeated: probe.captureEpisode("diagnostic-quota-0"), peak: probe.metrics(),
      history: { count: history.length, firstSequence: first.decisionSequence,
        lastSequence: last.decisionSequence, missingThroughTick: first.tick - 10 } };
  });
  const afterDigest = await nativeDebugWorldDigest(page);
  const nativeDisposal = await captureNativeDisposal(page);
  const shutdown = await page.evaluate(() => {
    const realm = window as unknown as { __nativeDebugQuota?: ReturnType<typeof armAiRuntimeIncidentCaptureProbe> };
    const metrics = realm.__nativeDebugQuota?.metrics();
    delete realm.__nativeDebugQuota;
    if (!metrics) throw new Error("native_debug_shutdown_owner_missing");
    return metrics;
  });
  const nativeDebugParity: NativeDebugParityProof = { beforeDigest, afterDigest, ...quota, shutdown };
  return { nativeDebugParity, nativeDisposal };
}
