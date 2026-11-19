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
  if (assertion.requireProducerReplacementAfterLoss) {
    const loss = variant.perturbations.find((perturbation) => perturbation.id === "producer-loss");
    const producerName = loss?.subjectName;
    const beforeCount = Math.max(
      0,
      ...variant.checkpoints
        .filter((checkpoint) => checkpoint.tick < (loss?.tick ?? 0))
        .map((checkpoint) => checkpoint.militaryProducerNames.filter((name) => name === producerName).length)
    );
    const lossIndex = variant.checkpoints.findIndex(
      (checkpoint) =>
        checkpoint.tick >= (loss?.tick ?? Number.MAX_SAFE_INTEGER) &&
        checkpoint.militaryProducerNames.filter((name) => name === producerName).length < beforeCount
    );
    const restored = variant.checkpoints
      .slice(lossIndex + 1)
      .some(
        (checkpoint) => checkpoint.militaryProducerNames.filter((name) => name === producerName).length >= beforeCount
      );
    if (!loss || loss.dispatchedActors <= 0 || !producerName || beforeCount === 0) {
      failures.push(`${variant.variantId}:producer_loss_not_applied`);
    }
    if (lossIndex < 0) failures.push(`${variant.variantId}:producer_loss_not_observed`);
    if (!restored) failures.push(`${variant.variantId}:producer_not_replaced`);
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
