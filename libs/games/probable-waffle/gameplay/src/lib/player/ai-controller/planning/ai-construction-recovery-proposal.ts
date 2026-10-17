import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import { claimedActorIds, hasAssignedBuilder, isAvailableBuilder, owned } from "./ai-macro-observation";
import { nextIds } from "./ai-macro-effect-identity";

/** Repairs one abandoned worker-built site even after its original opening checkpoint has completed.
 * Existing sites retain their native payment/work; this proposal claims no construction resources.
 */
export function proposeAiConstructionRecovery(
  observation: AiObservationV1,
  state: AiBrainStateV1,
  catalog: AiCapabilityCatalogV1,
  reservedActorIds: ReadonlySet<string>,
  priorIntents: readonly AiIntentV1[],
  ordinal: number
): AiIntentV1 | null {
  const self = owned(observation);
  const claimed = claimedActorIds(priorIntents);
  for (const site of self) {
    if (
      site.constructionProgress?.status !== "known" ||
      site.constructionProgress.value >= 100 ||
      hasAssignedBuilder(observation, site.actorId) ||
      priorIntents.some((intent) => intent.kind === "resume_construct" && intent.targetActorId === site.actorId) ||
      !catalog.entries.some(
        (entry) =>
          entry.sourceObjectName === site.objectName && entry.constructionProfile?.requiresAssignedBuilder === true
      )
    )
      continue;
    const builder = self
      .filter(isAvailableBuilder)
      .filter((actor) => !claimed.has(actor.actorId) && !reservedActorIds.has(actor.actorId))
      .filter((actor) =>
        catalog.entries.some(
          (entry) => entry.sourceObjectName === actor.objectName && entry.constructs.includes(site.objectName)
        )
      )
      .sort(
        (left, right) => distance(left, site) - distance(right, site) || left.actorId.localeCompare(right.actorId)
      )[0];
    if (!builder) continue;
    const ids = nextIds(state, `resume-construction:${site.actorId}`, ordinal);
    return {
      ...ids,
      kind: "resume_construct",
      planId: state.opening.plan.planId,
      demandId: null,
      lane: "supply_production",
      proposedTick: observation.tick,
      urgencyClass: 1,
      utility: 950,
      preconditions: [
        { kind: "actor_exists", actorId: builder.actorId },
        { kind: "actor_exists", actorId: site.actorId }
      ],
      claims: [
        { claimId: `${ids.claimId}:builder`, kind: "actor", actorId: builder.actorId },
        { claimId: `${ids.claimId}:site`, kind: "site", siteKey: `observed-site:${site.actorId}` },
        { claimId: `${ids.claimId}:effect`, kind: "effect", effectId: ids.effectId }
      ],
      reasonCode: "construction:resume_unassigned_site",
      actorIds: [builder.actorId],
      targetActorId: site.actorId
    };
  }
  return null;
}

/** Unknown locations sort last without inventing native reachability. */
function distance(actor: AiObservationV1["actors"][number], target: AiObservationV1["actors"][number]): number {
  if (actor.logicalPosition.status !== "known" || target.logicalPosition.status !== "known")
    return Number.MAX_SAFE_INTEGER;
  return (
    Math.abs(actor.logicalPosition.value.x - target.logicalPosition.value.x) +
    Math.abs(actor.logicalPosition.value.y - target.logicalPosition.value.y)
  );
}
