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
    const compatibleDefense = variant.checkpoints.some((checkpoint) =>
      checkpoint.squads.some((squad) => {
        if (!["attack", "defense", "escort"].includes(squad.role) || !squad.objectiveId) return false;
        const contact = checkpoint.objectiveContacts.find((candidate) => candidate.squadId === squad.squadId);
        return (
          (assertion.requiredDefenseTargetName === undefined ||
            contact?.objectName === assertion.requiredDefenseTargetName) &&
          (assertion.requiredDefenseActorName === undefined ||
            squad.actorNames.includes(assertion.requiredDefenseActorName))
        );
      })
    );
    if (!compatibleDefense) failures.push(`${variant.variantId}:compatible_defense_not_observed`);
  }
  return failures;
}
