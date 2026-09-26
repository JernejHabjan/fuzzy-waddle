import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";

type SupplyCheckpoint = Pick<
  RuntimeCheckpointV1,
  "tick" | "readyHousingCapacity" | "usedPopulation" | "queuedPopulation" | "readyHousingActorNames"
>;

export function evaluateRuntimeSupplyPrebuild(
  checkpoints: readonly SupplyCheckpoint[],
  requirement: { readonly minimumBuffer: number; readonly latestTick: number; readonly housingObjectName: string }
): string[] {
  const pressured = checkpoints.find(
    (checkpoint) =>
      checkpoint.tick <= requirement.latestTick &&
      (checkpoint.queuedPopulation ?? 0) > 0 &&
      checkpoint.readyHousingCapacity !== undefined &&
      checkpoint.usedPopulation !== undefined &&
      checkpoint.usedPopulation + checkpoint.queuedPopulation! + requirement.minimumBuffer >
        checkpoint.readyHousingCapacity
  );
  if (!pressured) return ["supply_prebuild_precondition_missing"];
  const initialCapacity = pressured.readyHousingCapacity!;
  const initialHousingCount = pressured.readyHousingActorNames?.filter(
    (name) => name === requirement.housingObjectName
  ).length ?? 0;
  const built = checkpoints.some(
    (checkpoint) =>
      checkpoint.tick > pressured.tick &&
      checkpoint.tick <= requirement.latestTick &&
      (checkpoint.readyHousingCapacity ?? 0) > initialCapacity &&
      (checkpoint.readyHousingActorNames?.filter((name) => name === requirement.housingObjectName).length ?? 0) >
        initialHousingCount
  );
  return built ? [] : ["supply_not_prebuilt_before_deadline"];
}
