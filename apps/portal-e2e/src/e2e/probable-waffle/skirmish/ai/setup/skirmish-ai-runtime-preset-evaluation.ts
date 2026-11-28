import { nativeScenarioContext } from "../contracts/skirmish-ai-native-scenario-context";
import { nativeWeaponHits } from "../combat/effects/skirmish-ai-native-combat-effects";
import type { RuntimeAssertion } from "../evaluation/controls/skirmish-ai-runtime-assertion";
import type { RuntimeVariantResult } from "../runner/skirmish-ai-runtime-variant-result";

export function evaluateRuntimePresetWorld(assertion: RuntimeAssertion, variant: RuntimeVariantResult): string[] {
  const failures: string[] = [];
  if (assertion.requiredPresetFixtureId !== undefined) {
    if (variant.presetFixtureId !== assertion.requiredPresetFixtureId)
      failures.push(`${variant.variantId}:preset_fixture`);
    if (
      variant.presetCreatedActorNames.length +
        variant.presetResourceGrantCount +
        variant.presetResourceStartCount +
        variant.presetInitialOrderCount ===
      0
    ) {
      failures.push(`${variant.variantId}:preset_zero_work`);
    }
  }
  if (assertion.requiredDefenseTargetName !== undefined || assertion.requiredDefenseActorName !== undefined) {
    const raid = variant.perturbations.find((event) => event.id === "home-raid" && event.dispatchedActors > 0);
    if (assertion.maximumTick === undefined) return [...failures, "compatible_defense_horizon_missing"];
    const context = nativeScenarioContext(variant, assertion.maximumTick, undefined, {
      requireResourceCoverage: false
    });
    const compatibleDefense =
      raid &&
      !context.failures.length &&
      nativeWeaponHits(context, undefined, raid.tick).some(
        ({ damage, tick }) =>
          (assertion.requiredDefenseTargetName === undefined ||
            damage.target.canonicalObjectName === assertion.requiredDefenseTargetName) &&
          (assertion.requiredDefenseActorName === undefined ||
            damage.initiator?.canonicalObjectName === assertion.requiredDefenseActorName) &&
          context.frames.some(
            (frame) =>
              frame.tick <= tick &&
              frame.decision.missionState?.squads.some(
                (squad) =>
                  ["defense", "escort", "attack"].includes(squad.role) &&
                  (squad.objectiveId === damage.target.actorId ||
                    squad.tactics?.targetActorId === damage.target.actorId) &&
                  !!damage.initiator?.actorId &&
                  squad.actorIds.some((actorId) => actorId === damage.initiator?.actorId)
              )
          )
      );
    if (!compatibleDefense) failures.push(`${variant.variantId}:compatible_defense_native_hit_missing`);
  }
  return failures;
}
