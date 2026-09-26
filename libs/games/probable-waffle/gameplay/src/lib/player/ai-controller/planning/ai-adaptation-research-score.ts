import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";

export const MIN_RESEARCH_UTILITY = 500;

export function scoreAdaptationResearch(
  candidate: AiObservationV1["researchCandidates"][number],
  observation: AiObservationV1,
  state: AiBrainStateV1
): number {
  const self = observation.actors.filter((actor) => actor.relation === "self" && actor.visibility === "owned");
  const upgradeTarget = candidate.benefit.kind === "unit_level" ? candidate.benefit.targetObjectName : null;
  const queuedItemIds = new Set<string>();
  const queuedBeneficiaries = upgradeTarget
    ? self.flatMap((actor) => actor.queue.status === "known" ? actor.queue.value.items ?? [] : [])
        .filter((item) => item.kind === "production" && item.objectName === upgradeTarget)
        .filter((item) => {
          if (queuedItemIds.has(item.itemId)) return false;
          queuedItemIds.add(item.itemId);
          return true;
        }).length
    : 0;
  const beneficiaries = upgradeTarget
    ? self.filter((actor) => actor.objectName === upgradeTarget).length + queuedBeneficiaries
    : self.filter(
        (actor) =>
          actor.combatProfile?.status === "known" &&
          actor.combatProfile.value.spells.some((spell) => spell.spellType === candidate.benefit.spellType)
      ).length;
  const resources = Object.values(candidate.cost).reduce((total, value) => total + (value ?? 0), 0);
  const researchProducer = self.find((actor) => actor.actorId === candidate.producerId);
  const queueDelay = researchProducer?.queue.status === "known" ? researchProducer.queue.value.occupied * 60 : 0;
  const survivalCost = observation.threatSummary.visibleEnemyActorIds.length > 0 ? 400 : 0;
  const archetypeParts = state.opening.archetypeId.split(":");
  const purpose = archetypeParts[archetypeParts.length - 1];
  const archetypeBias = purpose === "tech" ? 200 : purpose === "rush" || purpose === "pressure" ? -100 : 0;
  return Math.max(
    0,
    Math.min(
      1000,
      beneficiaries * 180 +
        180 -
        Math.round(resources / 2) -
        Math.round(candidate.durationTicks / 10) -
        queueDelay -
        survivalCost +
        archetypeBias
    )
  );
}
