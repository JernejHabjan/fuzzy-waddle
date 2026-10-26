import { gunzipSync } from "node:zlib";
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
  const compressed = await page.evaluate(
    async ({ owner, horizon, omitLedger }) => {
      const host = window as unknown as {
        __fuzzyWaddleAiRuntimeBrowserTestV1?: {
          productionCapture?: { capture(player: number, horizon?: number): AiRuntimeProductionCaptureV1 };
        };
      };
      const capture = host.__fuzzyWaddleAiRuntimeBrowserTestV1?.productionCapture;
      if (!capture) throw new Error("runtime_production_capture_unavailable");
      const record = capture.capture(owner, horizon);
      const detached = omitLedger ? { ...record, recipientResourceFacts: undefined } : record;
      const stream = new Blob([JSON.stringify(detached)]).stream().pipeThrough(new CompressionStream("gzip"));
      const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
      let binary = "";
      for (let offset = 0; offset < bytes.length; offset += 0x8000)
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
      return btoa(binary);
    },
    { owner: playerNumber, horizon: latestTick, omitLedger: omitSharedLedger }
  );
  return JSON.parse(gunzipSync(Buffer.from(compressed, "base64")).toString("utf8")) as AiRuntimeProductionCaptureV1;
}
