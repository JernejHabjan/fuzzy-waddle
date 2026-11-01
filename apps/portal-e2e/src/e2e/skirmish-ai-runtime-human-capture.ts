import type { Page } from "@playwright/test";
import type { AiRuntimeProductionSnapshot } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-snapshot";

/** Read the existing opt-in observer for an actual human player; no AI observation, command or second capture is created. */
export async function captureRuntimeHumanAuthority(
  page: Page, playerNumber: number, latestTick?: number
): Promise<AiRuntimeProductionSnapshot> {
  await page.waitForFunction(() => !!(window as unknown as {
    __fuzzyWaddleAiRuntimeBrowserTest?: { presetApplication?: unknown };
  }).__fuzzyWaddleAiRuntimeBrowserTest?.presetApplication);
  return page.evaluate(({ player, horizon }) => {
    const capture = (window as unknown as {
      __fuzzyWaddleAiRuntimeBrowserTest?: { productionCapture?: {
        captureHuman?(owner: number, through?: number): AiRuntimeProductionSnapshot;
      } };
    }).__fuzzyWaddleAiRuntimeBrowserTest?.productionCapture;
    if (!capture?.captureHuman) throw new Error("runtime_human_authority_unavailable");
    const record = capture.captureHuman(player, horizon);
    // The AI record retains the shared recipient ledger; opponent movement/combat reads need only their own native facts.
    return { ...record, recipientResourceFacts: undefined };
  }, { player: playerNumber, horizon: latestTick });
}
