import type { RuntimeAssertion } from "./skirmish-ai-runtime-assertion";
import type { RuntimeCheckpoint } from "./skirmish-ai-runtime-checkpoint";
import type { RuntimeVariantResult } from "./skirmish-ai-runtime-variant-result";

export function evaluateRuntimeRaidRecovery(
  assertion: RuntimeAssertion,
  variant: RuntimeVariantResult,
  final: RuntimeCheckpoint,
  hasAiVictory: boolean
): string[] {
  const failures: string[] = [];
  if (assertion.requireRaidDefenseRecovery) {
    const raid = variant.perturbations.find((perturbation) => perturbation.id === "home-raid");
    const beforeRaid = variant.checkpoints
      .filter((checkpoint) => checkpoint.tick < (raid?.tick ?? 0))
      .sort((left, right) => right.tick - left.tick)[0];
    const defenseSeen = variant.checkpoints.some(
      (checkpoint) =>
        checkpoint.tick >= (raid?.tick ?? Number.MAX_SAFE_INTEGER) &&
        checkpoint.squads.some((squad) => squad.role === "defense")
    );
    const interceptedOutsideHome = variant.checkpoints
      .filter((checkpoint) => checkpoint.tick >= (raid?.tick ?? Number.MAX_SAFE_INTEGER))
      .some(
        (checkpoint) =>
          (checkpoint.scoreMetrics["damage_dealt"] ?? 0) > (beforeRaid?.scoreMetrics["damage_dealt"] ?? 0) &&
          (checkpoint.scoreMetrics["units_killed"] ?? 0) + (checkpoint.scoreMetrics["buildings_destroyed"] ?? 0) >
            (beforeRaid?.scoreMetrics["units_killed"] ?? 0) + (beforeRaid?.scoreMetrics["buildings_destroyed"] ?? 0)
      );
    const recovered =
      raid !== undefined &&
      variant.checkpoints.some(
        (checkpoint) =>
          checkpoint.tick >= raid.tick &&
          checkpoint.tick <= final.tick &&
          checkpoint.deliveredIncome > 0 &&
          checkpoint.strategyStance !== "defend" &&
          (hasAiVictory || checkpoint.squads.some((squad) => squad.role === "attack" && squad.actorCount > 0))
      );
    if (!raid || raid.dispatchedActors <= 0) failures.push(`${variant.variantId}:raid_not_dispatched`);
    if (!defenseSeen && !interceptedOutsideHome) failures.push(`${variant.variantId}:raid_defense_not_observed`);
    if (!recovered) failures.push(`${variant.variantId}:raid_recovery_not_observed`);
  }
  return failures;
}
