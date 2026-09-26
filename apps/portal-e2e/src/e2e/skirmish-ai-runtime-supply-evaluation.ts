import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";

type SupplyCheckpoint = Pick<
  RuntimeCheckpointV1,
  "tick" | "readyHousingCapacity" | "usedPopulation" | "queuedPopulation" | "readyHousingActorNames"
> & Partial<Pick<RuntimeCheckpointV1, "ownedConstruction" | "decisionFacts">>;

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

/** Paired ample-capacity branch: no speculative house is allowed while the authored queue still fits. */
export function evaluateRuntimeSupplyControl(
  checkpoints: readonly SupplyCheckpoint[],
  requirement: { readonly minimumBuffer: number; readonly latestTick: number; readonly housingObjectName: string }
): string[] {
  const inWindow = checkpoints.filter((checkpoint) => checkpoint.tick <= requirement.latestTick);
  const initial = inWindow[0];
  if (!initial || initial.readyHousingCapacity === undefined || initial.usedPopulation === undefined ||
    initial.queuedPopulation === undefined || initial.queuedPopulation <= 0) return ["supply_control_precondition_missing"];
  const initialHousing = initial.readyHousingActorNames?.filter(
    (name) => name === requirement.housingObjectName
  ).length ?? 0;
  if (initial.usedPopulation + initial.queuedPopulation + requirement.minimumBuffer > initial.readyHousingCapacity) {
    return ["supply_control_initial_capacity_insufficient"];
  }
  if (inWindow.some((checkpoint) =>
    checkpoint.usedPopulation !== undefined && checkpoint.queuedPopulation !== undefined &&
    checkpoint.readyHousingCapacity !== undefined &&
    checkpoint.usedPopulation + checkpoint.queuedPopulation + requirement.minimumBuffer >
      checkpoint.readyHousingCapacity
  )) return ["supply_control_became_pressured"];
  if (inWindow.some((checkpoint) =>
    (checkpoint.readyHousingActorNames?.filter((name) => name === requirement.housingObjectName).length ?? 0) >
      initialHousing
  )) return ["supply_control_unneeded_housing"];
  if (inWindow.some((checkpoint) =>
    checkpoint.ownedConstruction?.some((actor) => actor.objectName === requirement.housingObjectName) ||
    checkpoint.decisionFacts?.some(
      (decision) => decision.outcome === "accepted" && decision.kind === "construct" &&
        decision.objectName === requirement.housingObjectName
    )
  )) return ["supply_control_unneeded_housing_attempt"];
  return [];
}
