import type { Page } from "@playwright/test";

/** Advance complete native Phaser frames, allowing Promise continuations between simulation ticks. */
export async function advanceRuntimeFrames(
  page: Page, playerNumber: number, targetTick: number, simulationTimeScale = 1
): Promise<void> {
  if (!Number.isSafeInteger(targetTick) || targetTick < 0) throw new Error("runtime_frame_driver_invalid_tick");
  if (!Number.isFinite(simulationTimeScale) || simulationTimeScale < 0.25 || simulationTimeScale > 16)
    throw new Error("runtime_frame_driver_invalid_scale");
  await page.evaluate(
    async ({ playerNumber, targetTick, simulationTimeScale }) => {
      const parts = window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber);
      const host = (
        window as unknown as {
          __fuzzyWaddleAiRuntimeBrowserTestV1?: {
            game: { loop: { sleep(): void; now: number }; headlessStep(time: number, delta: number): void };
          };
        }
      ).__fuzzyWaddleAiRuntimeBrowserTestV1;
      if (!parts || !host) throw new Error("runtime_frame_driver_unavailable");
      const game = host.game;
      game.loop.sleep();
      parts.tickService.setSimulationTimeScale(simulationTimeScale);
      parts.tickService.resumeTick("manual");
      let framesWithoutTick = 0;
      let frameTime = game.loop.now + parts.tickService.currentTick * 50;
      try {
        while (parts.tickService.currentTick < targetTick) {
          const before = parts.tickService.currentTick;
          // The native frame owns scene timers, pathfinding, physics and fixed-tick subscribers.
          const frameDelta = 50 / simulationTimeScale;
          frameTime += frameDelta;
          game.headlessStep(frameTime, frameDelta);
          await new Promise<void>((resolve) => setTimeout(resolve, 0));
          if (parts.tickService.currentTick > before + 1) throw new Error("runtime_frame_driver_tick_overshoot");
          framesWithoutTick = parts.tickService.currentTick === before ? framesWithoutTick + 1 : 0;
          if (framesWithoutTick > 100) throw new Error("runtime_frame_driver_stalled");
        }
      } finally {
        parts.tickService.pauseTick("manual");
      }
    },
    { playerNumber, targetTick, simulationTimeScale }
  );
}
