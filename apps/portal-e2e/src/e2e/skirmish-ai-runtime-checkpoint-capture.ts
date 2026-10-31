import type { Page } from "@playwright/test";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import { captureRuntimeEconomyCheckpoint } from "./skirmish-ai-runtime-economy-checkpoint";
import { captureRuntimeStrategyCheckpoint } from "./skirmish-ai-runtime-strategy-checkpoint";
import { captureRuntimeTransportCheckpoint } from "./skirmish-ai-runtime-transport-checkpoint";

export async function captureCheckpoint(
  page: Page,
  aiPlayerNumber: number,
  targetTick: number,
  captureFairness = false
): Promise<RuntimeCheckpointV1> {
  if (process.env.AI_SKIRMISH_DIAGNOSTIC_CHECKPOINT_TRACE === "1" && targetTick >= 4000) {
    const capture = async <T>(phase: string, run: () => Promise<T>): Promise<T> => {
      const startedAt = performance.now();
      process.stdout.write(`[AI_SKIRMISH_CHECKPOINT] tick=${targetTick} phase=${phase} start\n`);
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        const result = await Promise.race([
          run(),
          new Promise<never>((_, reject) => {
            timeout = setTimeout(() => reject(new Error(`runtime_checkpoint_phase_timeout:${phase}`)), 120_000);
          })
        ]);
        process.stdout.write(
          `[AI_SKIRMISH_CHECKPOINT] tick=${targetTick} phase=${phase} complete elapsedMs=${Math.round(
            performance.now() - startedAt
          )}\n`
        );
        return result;
      } catch (error) {
        process.stdout.write(`[AI_SKIRMISH_CHECKPOINT] tick=${targetTick} phase=${phase} failed\n`);
        throw error;
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    };
    const economy = await capture("economy", () => captureRuntimeEconomyCheckpoint(page, aiPlayerNumber, targetTick));
    const strategy = await capture("strategy", () =>
      captureRuntimeStrategyCheckpoint(page, aiPlayerNumber, captureFairness)
    );
    const transport = await capture("transport", () => captureRuntimeTransportCheckpoint(page, aiPlayerNumber));
    return { ...economy, ...strategy, ...transport } as RuntimeCheckpointV1;
  }
  const [economy, strategy, transport] = await Promise.all([
    captureRuntimeEconomyCheckpoint(page, aiPlayerNumber, targetTick),
    captureRuntimeStrategyCheckpoint(page, aiPlayerNumber, captureFairness),
    captureRuntimeTransportCheckpoint(page, aiPlayerNumber)
  ]);
  return { ...economy, ...strategy, ...transport } as RuntimeCheckpointV1;
}
