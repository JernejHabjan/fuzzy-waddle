import type { Page } from "@playwright/test";
import type { AiMultiplayerDiagnostics } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/multiplayer/ai-multiplayer-diagnostics";

/** Bounded selected-command access through the existing real multiplayer scene diagnostics, never private authority edits. */
export async function multiplayerAuthorityProbe(
  page: Page, action: "read" | "pin" | "redeliver" | "receipt" | "retain" = "read"
) {
  return page.evaluate((requested) => {
    type Diagnostics = Pick<AiMultiplayerDiagnostics,
      "kind" | "getSnapshot" | "pinAuthorityProbe" | "redeliverAuthorityProbe" | "redeliverAuthorityReceipt" | "retainAuthorityReplay">;
    const realm = window as unknown as {
      __fuzzyWaddleAiMultiplayerBrowserTest?: {
        game: { scene: { getScenes(active: boolean): {
          scene: { key: string }; getSceneGameData(): { services: unknown[] };
        }[] } };
      };
      __fuzzyWaddleRetainedAuthorityReplay?: () => boolean;
    };
    const scene = realm.__fuzzyWaddleAiMultiplayerBrowserTest?.game.scene.getScenes(true)
      .find((entry) => entry.scene.key === "MapAiMultiplayer");
    const diagnostics = scene?.getSceneGameData().services.find((candidate): candidate is Diagnostics =>
      !!candidate && (candidate as { kind?: unknown }).kind === "ai-multiplayer-browser-diagnostics");
    if (!diagnostics) throw new Error("multiplayer_authority_diagnostics_missing");
    if (requested === "pin") diagnostics.pinAuthorityProbe();
    if (requested === "redeliver") diagnostics.redeliverAuthorityProbe();
    if (requested === "receipt") diagnostics.redeliverAuthorityReceipt();
    if (requested === "retain") realm.__fuzzyWaddleRetainedAuthorityReplay = diagnostics.retainAuthorityReplay();
    const snapshot = diagnostics.getSnapshot(3).authorityProbe;
    if (!snapshot) throw new Error("multiplayer_authority_probe_not_enabled");
    return snapshot;
  }, action);
}
