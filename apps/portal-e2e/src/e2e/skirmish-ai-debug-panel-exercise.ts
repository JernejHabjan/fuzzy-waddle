import { resolve } from "node:path";
import type { Page } from "@playwright/test";

interface DebugPanel {
  toggleLabels(): void;
  labels: {
    historyOffset: number;
    lastTelemetryAt: number;
    refreshTelemetry(now: number): void;
    telemetryText: { text: string; listenerCount(event: string): number };
    playerName: { text: string };
    active: boolean;
  }[];
  playerButtons: Map<number, { emit(event: string): boolean }>;
  categoryButtons: Map<string, { emit(event: string): boolean }>;
  backButton?: { emit(event: string): boolean };
  playerBackButton?: { emit(event: string): boolean };
  panelBackdrop: { getBounds(): { left: number; right: number; top: number; bottom: number } };
}

export async function exerciseDebug(
  page: Page,
  mode: "hidden" | "shown" | "historical" | "exported" | "filtered",
  checkpointIndex: number,
  includeLifecycle = false,
  screenshotDirectory?: string
): Promise<void> {
  if (mode === "hidden") {
    if (checkpointIndex === 1 && screenshotDirectory) await page.screenshot({ path: resolve(screenshotDirectory, "hidden.png") });
    return;
  }
  if (checkpointIndex === -1) {
    await page.waitForFunction(
      () => {
        const host = (
          window as unknown as {
            __fuzzyWaddleAiRuntimeBrowserTestV1?: {
              game: { scene: { getScenes(active: boolean): { scene: { key: string }; aiControllerDebugPanel?: unknown }[] } };
            };
          }
        ).__fuzzyWaddleAiRuntimeBrowserTestV1;
        return !!host?.game.scene.getScenes(false).find((scene) => scene.scene.key === "HudProbableWaffle")
          ?.aiControllerDebugPanel;
      },
      undefined,
      { timeout: 30_000 }
    );
  }
  if (mode === "shown" && checkpointIndex === 1) {
    await page.setViewportSize({ width: 1024, height: 720 });
    await page.waitForTimeout(100);
  }
  await page.evaluate(
    ({ selectedMode, index, includeLifecycle: hasLifecycle }) => {
      const host = (
        window as unknown as {
          __fuzzyWaddleAiRuntimeBrowserTestV1?: {
            game: {
              scene: {
                getScenes(active: boolean): {
                  scene: { key: string };
                  children: { list: unknown[] };
                }[];
              };
            };
          };
        }
      ).__fuzzyWaddleAiRuntimeBrowserTestV1;
      const hud = host?.game.scene.getScenes(false).find((scene) => scene.scene.key === "HudProbableWaffle");
      const panel = (hud as { aiControllerDebugPanel?: unknown } | undefined)?.aiControllerDebugPanel as
        | DebugPanel
        | undefined;
      if (!panel) {
        const scenes = host?.game.scene.getScenes(false).map((scene) => ({
          key: scene.scene.key,
          hasPanel: !!(scene as { aiControllerDebugPanel?: unknown }).aiControllerDebugPanel,
          hudChildren: scene.scene.key === "HudProbableWaffle"
            ? scene.children?.list.map((child) => (child as { constructor: { name: string } }).constructor.name)
            : undefined
        }));
        throw new Error(`debug_panel_missing:${JSON.stringify(scenes)}`);
      }
      if (index === -1) {
        panel.toggleLabels();
        if (panel.playerButtons.size !== 1) throw new Error("debug_player_buttons_missing");
        if (!panel.playerButtons.get(2)?.emit("pointerdown")) throw new Error("debug_player_two_click_missing");
        if (!panel.categoryButtons.get("overview")?.emit("pointerdown")) throw new Error("debug_overview_click_missing");
      }
      if (selectedMode === "historical" && index === 1) {
        const label = panel.labels[0];
        if (!label) throw new Error("debug_label_missing");
        label.historyOffset = 1;
        label.lastTelemetryAt = 0;
        label.refreshTelemetry(performance.now());
        if (!label.telemetryText.text.includes("Snapshot -1")) throw new Error("historical_snapshot_not_selected");
      }
      if (selectedMode === "filtered" && index === 1) {
        if (!panel.backButton?.emit("pointerdown") || !panel.categoryButtons.get("transport")?.emit("pointerdown"))
          throw new Error("debug_actual_category_filter_missing");
      }
      if (selectedMode === "shown" && index === 1) {
        const text = panel.labels[0]?.telemetryText.text ?? "";
        for (const field of ["Purpose:", "Force:", "Production:", "Economy:", "Next:", "Blocker:"]) {
          if (!text.includes(field)) throw new Error(`overview_field_missing:${field}`);
        }
        if (/production_sim|claim_conflict/u.test(text)) throw new Error("overview_leaked_raw_reason_code");
        const bounds = panel.panelBackdrop.getBounds();
        if (bounds.left < 0 || bounds.right > window.innerWidth || bounds.top < 0 || bounds.bottom > window.innerHeight) {
          throw new Error(`debug_panel_clipped:${JSON.stringify(bounds)}`);
        }
      }
      if (selectedMode === "shown" && index === 2 && hasLifecycle) {
        const firstLabel = panel.labels[0];
        if (!firstLabel) throw new Error("debug_first_label_missing");
        const overlay = (hud as unknown as { add: { graphics(): { active: boolean } } }).add.graphics();
        (firstLabel as unknown as { transportOverlay?: typeof overlay }).transportOverlay = overlay;
        if (!panel.backButton?.emit("pointerdown")) throw new Error("debug_category_back_click_missing");
        if (!panel.playerBackButton?.emit("pointerdown")) throw new Error("debug_player_back_click_missing");
        if (!panel.playerButtons.get(2)?.emit("pointerdown")) throw new Error("debug_player_reselect_click_missing");
        if (!panel.categoryButtons.get("transport")?.emit("pointerdown")) throw new Error("debug_transport_click_missing");
        if (!panel.backButton?.emit("pointerdown")) throw new Error("debug_transport_back_click_missing");
        if (!panel.categoryButtons.get("overview")?.emit("pointerdown")) throw new Error("debug_overview_return_click_missing");
        if (panel.labels.length !== 1) throw new Error("debug_category_switch_leaked_label");
        if (firstLabel.active || firstLabel.telemetryText.listenerCount("wheel") !== 0) {
          throw new Error("debug_replaced_label_listener_leaked");
        }
        if (overlay.active) throw new Error("debug_replaced_label_overlay_leaked");
        if (!panel.labels[0]?.playerName.text.includes("Player 2")) throw new Error("debug_player_selection_not_visible");
      }
      if (selectedMode === "exported" && index >= 1) {
        const controller = window.__fuzzyWaddleAiRuntimePartsV1?.(2)?.controller;
        if (!controller) throw new Error("debug_controller_missing");
        const history = JSON.parse(controller.exportBrainDebugHistory()) as unknown[];
        if (history.length === 0) throw new Error("debug_export_empty");
      }
    },
    { selectedMode: mode, index: checkpointIndex, includeLifecycle }
  );
  if (checkpointIndex === 1 && mode !== "exported" && screenshotDirectory) {
    await page.screenshot({ path: resolve(screenshotDirectory, `${mode}.png`) });
  }
}

