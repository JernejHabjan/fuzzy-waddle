import type { Page } from "@playwright/test";
// prettier-ignore
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";

/** Retains diagnostic authority facts, without converting incomplete provenance into passing production evidence. */
export async function captureRuntimeProductionAuthority(
  page: Page,
  playerNumber: number,
  latestTick?: number,
  omitSharedLedger = false
): Promise<AiRuntimeProductionCaptureV1> {
  return page.evaluate(
    ({ owner, horizon, omitLedger }) => {
      const host = window as unknown as {
        __fuzzyWaddleAiRuntimeBrowserTestV1?: {
          productionCapture?: { capture(player: number, horizon?: number): AiRuntimeProductionCaptureV1 };
        };
      };
      const capture = host.__fuzzyWaddleAiRuntimeBrowserTestV1?.productionCapture;
      if (!capture) throw new Error("runtime_production_capture_unavailable");
      const record = capture.capture(owner, horizon);
      return omitLedger ? { ...record, recipientResourceFacts: undefined } : record;
    },
    { owner: playerNumber, horizon: latestTick, omitLedger: omitSharedLedger }
  );
}
