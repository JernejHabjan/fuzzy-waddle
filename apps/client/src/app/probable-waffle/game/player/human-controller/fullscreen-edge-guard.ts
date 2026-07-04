import { Input } from "phaser";

/**
 * Browser fullscreen reserves a thin strip at the very top of the screen for its exit UI
 * (e.g. Chrome's "Press Esc to exit full screen" bar). When the cursor enters that strip,
 * Phaser fires GAME_OUT because the pointer technically leaves the canvas area.
 *
 * Use this guard in every GAME_OUT handler to suppress reactions that would incorrectly
 * interrupt gameplay (edge-scroll, building placement, multi-selection, spell targeting)
 * when the cursor is merely grazing the browser's reserved top pixels.
 */
export const FULLSCREEN_TOP_EDGE_PX = 50;

export function isFullscreenTopEdgeExit(input: Input.InputPlugin): boolean {
  return !!(document.fullscreenElement && input.activePointer.y < FULLSCREEN_TOP_EDGE_PX);
}
