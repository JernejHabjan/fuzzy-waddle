import type { Page } from "@playwright/test";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import { captureRuntimeEconomyCheckpoint } from "./skirmish-ai-runtime-economy-checkpoint";
import { captureRuntimeStrategyCheckpoint } from "./skirmish-ai-runtime-strategy-checkpoint";
import { captureRuntimeTransportCheckpoint } from "./skirmish-ai-runtime-transport-checkpoint";

export async function captureCheckpoint(
  page: Page,
  aiPlayerNumber: number,
  targetTick: number
): Promise<RuntimeCheckpointV1> {
  const [economy, strategy, transport] = await Promise.all([
    captureRuntimeEconomyCheckpoint(page, aiPlayerNumber, targetTick),
    captureRuntimeStrategyCheckpoint(page, aiPlayerNumber),
    captureRuntimeTransportCheckpoint(page, aiPlayerNumber)
  ]);
  return { ...economy, ...strategy, ...transport } as RuntimeCheckpointV1;
}
