import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";

/** HealthComponent initialization is deferred, so durability starts must run from the paused setup callback. */
export function requiresScheduledAiRuntimePresetSetup(
  preset: Pick<
    AiRuntimePresetWorldV1,
    | "queues"
    | "constructionOrders"
    | "researchQueues"
    | "routeOutages"
    | "receiptFault"
    | "recoveryStart"
    | "controls"
    | "productionRallies"
    | "healthStarts"
  >
): boolean {
  return (
    (preset.queues?.length ?? 0) +
      (preset.constructionOrders?.length ?? 0) +
      (preset.researchQueues?.length ?? 0) +
      (preset.routeOutages?.length ?? 0) +
      (preset.receiptFault ? 1 : 0) +
      (preset.recoveryStart ? 1 : 0) +
      (preset.controls?.length ?? 0) +
      (preset.productionRallies?.length ?? 0) +
      (preset.healthStarts?.length ?? 0) >
    0
  );
}
