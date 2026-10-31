import type { Page } from "@playwright/test";

const framesPerBrowserCall = 100;

/** Advance complete Phaser frames in bounded browser calls so Node can time out and report progress. */
export async function advanceRuntimeFrames(
  page: Page,
  playerNumber: number,
  targetTick: number,
  simulationTimeScale = 1,
  stopOnTerminal = false,
  onProgress?: (tick: number) => void
): Promise<void> {
  if (!Number.isSafeInteger(targetTick) || targetTick < 0) throw new Error("runtime_frame_driver_invalid_tick");
  if (!Number.isFinite(simulationTimeScale) || simulationTimeScale < 0.25 || simulationTimeScale > 16)
    throw new Error("runtime_frame_driver_invalid_scale");
  let currentTick = 0;
  let frameTime: number | undefined;
  let framesWithoutTick = 0;
  let firstChunk = true;
  while (currentTick < targetTick || firstChunk) {
    firstChunk = false;
    const chunk = await page.evaluate(
      async ({
        playerNumber,
        targetTick,
        simulationTimeScale,
        stopOnTerminal,
        frameTime,
        framesWithoutTick,
        frameLimit
      }) => {
        const parts = window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber);
        const realm = window as unknown as {
          __fuzzyWaddleAiRuntimeBrowserTestV1?: { game: FrameGame };
          __fuzzyWaddleAiMultiplayerBrowserTestV1?: { game: FrameGame };
        };
        type FrameGame = { loop: { sleep(): void; now: number }; headlessStep(time: number, delta: number): void };
        const host = realm.__fuzzyWaddleAiRuntimeBrowserTestV1 ?? realm.__fuzzyWaddleAiMultiplayerBrowserTestV1;
        if (!parts || !host) throw new Error("runtime_frame_driver_unavailable");
        const game = host.game;
        game.loop.sleep();
        parts.tickService.setSimulationTimeScale(simulationTimeScale);
        parts.tickService.resumeTick("manual");
        let nextFrameTime = frameTime ?? game.loop.now + parts.tickService.currentTick * 50;
        let nextFramesWithoutTick = framesWithoutTick;
        try {
          for (let frame = 0; frame < frameLimit && parts.tickService.currentTick < targetTick; frame += 1) {
            const terminal =
              stopOnTerminal && ["win", "loss", "tie"].includes(parts.getScore(playerNumber).gameResult ?? "");
            if (terminal) break;
            const before = parts.tickService.currentTick;
            // The native frame owns scene timers, pathfinding, physics and fixed-tick subscribers.
            const frameDelta = 50 / simulationTimeScale;
            nextFrameTime += frameDelta;
            game.headlessStep(nextFrameTime, frameDelta);
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
            if (parts.tickService.currentTick > before + 1) throw new Error("runtime_frame_driver_tick_overshoot");
            nextFramesWithoutTick = parts.tickService.currentTick === before ? nextFramesWithoutTick + 1 : 0;
            if (nextFramesWithoutTick > frameLimit) throw new Error("runtime_frame_driver_stalled");
          }
          return {
            currentTick: parts.tickService.currentTick,
            frameTime: nextFrameTime,
            framesWithoutTick: nextFramesWithoutTick,
            terminal: stopOnTerminal && ["win", "loss", "tie"].includes(parts.getScore(playerNumber).gameResult ?? "")
          };
        } finally {
          parts.tickService.pauseTick("manual");
        }
      },
      {
        playerNumber,
        targetTick,
        simulationTimeScale,
        stopOnTerminal,
        frameTime,
        framesWithoutTick,
        frameLimit: framesPerBrowserCall
      }
    );
    currentTick = chunk.currentTick;
    frameTime = chunk.frameTime;
    framesWithoutTick = chunk.framesWithoutTick;
    onProgress?.(currentTick);
    if (chunk.terminal) return;
  }
}
