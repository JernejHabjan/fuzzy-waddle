import { expect, type Page } from "@playwright/test";
import type Phaser from "phaser";
import type { AiRuntimeBrowserTestHost } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host";

/** Use actual visible Phaser menu hitboxes, preserving the app realm and its ordinary scene/dialog/Angular route handlers. */
export async function openNativeGameAction(page: Page, action: "load" | "quit") {
  await clickNativeGameMenuButton(page, "menu");
  await page.waitForFunction(() => {
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost;
      __fuzzyWaddleAiMultiplayerBrowserTest?: { game: Phaser.Game } };
    return (realm.__fuzzyWaddleAiRuntimeBrowserTest?.game ?? realm.__fuzzyWaddleAiMultiplayerBrowserTest?.game)
      ?.scene.isActive("GameActionsLayer");
  });
  await clickNativeGameMenuButton(page, action);
  if (action === "load") await expect(page.getByRole("button", { name: "Load", exact: true }).first()).toBeVisible();
}

async function clickNativeGameMenuButton(page: Page, action: "menu" | "load" | "quit") {
  const target = await page.evaluate((action) => {
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost;
      __fuzzyWaddleAiMultiplayerBrowserTest?: { game: Phaser.Game } };
    const game = realm.__fuzzyWaddleAiRuntimeBrowserTest?.game ?? realm.__fuzzyWaddleAiMultiplayerBrowserTest?.game;
    if (!game) throw new Error("lifecycle_native_game_unavailable");
    game.loop.wake();
    const scene = game.scene.getScenes(true).find((entry) => entry.scene.key ===
      (action === "menu" ? "HudProbableWaffle" : "GameActionsLayer")) as unknown as {
        game_actions_container?: { game_action_menu?: Phaser.GameObjects.Container };
        game_action_load?: Phaser.GameObjects.Container; game_action_quit?: Phaser.GameObjects.Container;
      } | undefined;
    const button = action === "menu" ? scene?.game_actions_container?.game_action_menu :
      action === "load" ? scene?.game_action_load : scene?.game_action_quit;
    if (!button?.visible || !button.active) throw new Error(`lifecycle_native_${action}_button_unavailable`);
    const bounds = button.getBounds(), canvas = game.canvas.getBoundingClientRect();
    if (!canvas.width || !canvas.height) throw new Error("lifecycle_native_canvas_not_visible");
    return { x: canvas.left + bounds.centerX * canvas.width / game.scale.width,
      y: canvas.top + bounds.centerY * canvas.height / game.scale.height };
  }, action);
  await page.mouse.click(target.x, target.y);
}

/** UI leave/return is deliberately a SPA transition; navigating the document would conceal stale callbacks and listeners. */
export async function leaveNativeMatchInSameRealm(page: Page) {
  await continueNativeEndGameDialog(page);
  if (!await page.getByRole("heading", { name: "Score Screen" }).isVisible()) await openNativeGameAction(page, "quit");
  await expect(page.getByRole("heading", { name: "Score Screen" })).toBeVisible();
  await page.getByRole("button", { name: "Leave", exact: true }).click();
  await expect(page.getByRole("button", { name: /Skirmish.*Custom battles/ })).toBeVisible();
}

/** A real adjudicated finish follows the dialog's ordinary pointer action, not a second quit result. */
export async function continueNativeEndGameDialog(page: Page) {
  const terminalDialog = await page.evaluate(() => {
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost;
      __fuzzyWaddleAiMultiplayerBrowserTest?: { game: Phaser.Game } };
    return (realm.__fuzzyWaddleAiRuntimeBrowserTest?.game ?? realm.__fuzzyWaddleAiMultiplayerBrowserTest?.game)
      ?.scene.isActive("EndGameDialog") === true;
  });
  if (!terminalDialog) return;
  await page.waitForFunction(() => {
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost;
      __fuzzyWaddleAiMultiplayerBrowserTest?: { game: Phaser.Game } };
    const game = realm.__fuzzyWaddleAiRuntimeBrowserTest?.game ?? realm.__fuzzyWaddleAiMultiplayerBrowserTest?.game;
    const dialog = game?.scene.getScenes(true).find((entry) => entry.scene.key === "EndGameDialog") as unknown as
      { callback?: unknown } | undefined;
    return typeof dialog?.callback === "function";
  });
  const target = await page.evaluate(() => {
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost;
      __fuzzyWaddleAiMultiplayerBrowserTest?: { game: Phaser.Game } };
    const game = realm.__fuzzyWaddleAiRuntimeBrowserTest?.game ?? realm.__fuzzyWaddleAiMultiplayerBrowserTest?.game;
    const dialog = game?.scene.getScenes(true).find((entry) => entry.scene.key === "EndGameDialog") as unknown as
      { continue_button?: Phaser.GameObjects.Container } | undefined;
    const button = dialog?.continue_button;
    if (!game || !button?.active || !button.visible) throw new Error("native_sequence_end_dialog_button_missing");
    game.loop.wake();
    const bounds = button.getBounds(), canvas = game.canvas.getBoundingClientRect();
    if (!canvas.width || !canvas.height) throw new Error("native_sequence_end_dialog_canvas_hidden");
    return { x: canvas.left + bounds.centerX * canvas.width / game.scale.width,
      y: canvas.top + bounds.centerY * canvas.height / game.scale.height };
  });
  await page.mouse.click(target.x, target.y);
  await expect(page.getByRole("heading", { name: "Score Screen" })).toBeVisible();
}
