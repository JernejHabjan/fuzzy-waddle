import type { Page } from "@playwright/test";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";

/** Read the existing opt-in observer for an actual human player; no AI observation, command or second capture is created. */
export async function captureRuntimeHumanAuthority(
  page: Page, playerNumber: number, latestTick?: number
): Promise<AiRuntimeProductionCaptureV1> {
  await page.waitForFunction(() => !!(window as unknown as {
    __fuzzyWaddleAiRuntimeBrowserTestV1?: { presetApplication?: unknown };
  }).__fuzzyWaddleAiRuntimeBrowserTestV1?.presetApplication);
  return page.evaluate(({ player, horizon }) => {
    const capture = (window as unknown as {
      __fuzzyWaddleAiRuntimeBrowserTestV1?: { productionCapture?: {
        captureHuman?(owner: number, through?: number): AiRuntimeProductionCaptureV1;
      } };
    }).__fuzzyWaddleAiRuntimeBrowserTestV1?.productionCapture;
    if (!capture?.captureHuman) throw new Error("runtime_human_authority_unavailable");
    const record = capture.captureHuman(player, horizon);
    // The AI record retains the shared recipient ledger; opponent movement/combat reads need only their own native facts.
    return { ...record, recipientResourceFacts: undefined };
  }, { player: playerNumber, horizon: latestTick });
}
