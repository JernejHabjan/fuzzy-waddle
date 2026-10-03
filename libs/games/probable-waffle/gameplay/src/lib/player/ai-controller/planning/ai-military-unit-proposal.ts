import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
import { nextIds } from "./ai-macro-effect-identity";
import { queueFree } from "./ai-macro-observation";
import { producerMilitaryProducts, productionRoleDeficit, roleFor } from "./ai-military-catalog";
import type { AiProductionTransitionV1 } from "../contracts/brain-state/ai-production-transition-v1";

/** Fills the bounded force deficit with affordable, role-balanced production. */
export function proposeAiMilitaryUnits(args: {
  readonly observation: AiObservationV1;
  readonly state: AiBrainStateV1;
  readonly catalog: AiCapabilityCatalogV1;
  readonly producers: readonly AiObservationV1["actors"][number][];
  readonly military: readonly AiObservationV1["actors"][number][];
  readonly queuedMilitary: readonly { readonly objectName: ObjectNames }[];
  readonly acceptedEffectCount: number;
  readonly targetMilitary: number;
  readonly rangedPermille: number;
  readonly pressureDomain: "ground" | "air";
  readonly compositionPrefix: string;
  readonly workforceRecoveryOwnsFood: boolean;
  readonly priorIntents: readonly AiIntentV1[];
  readonly ordinal: number;
  readonly transition?: AiProductionTransitionV1;
}): readonly AiIntentV1[] {
  const {
    observation, state, catalog, producers, military, queuedMilitary, acceptedEffectCount, targetMilitary,
    rangedPermille, pressureDomain, compositionPrefix, workforceRecoveryOwnsFood, priorIntents, ordinal, transition
  } = args;
  const projectedCount = military.length + queuedMilitary.length + acceptedEffectCount;
  if (workforceRecoveryOwnsFood || projectedCount >= targetMilitary ||
    (transition && observation.tick < transition.beginsTick)) return [];
  const roleCounts = { frontline: 0, ranged: 0, support: 0 };
  for (const actor of military) roleCounts[roleFor(actor.objectName, catalog)] += 1;
  for (const item of queuedMilitary) roleCounts[roleFor(item.objectName, catalog)] += 1;
  const desiredRanged = Math.ceil((targetMilitary * rangedPermille) / 1000);
  const remainingProductionResources = new Map(
    observation.resources.map(
      (resource) =>
        [resource.resourceType, resource.stockpile - resource.reservedUnspent - resource.obligationsDue] as const
    )
  );
  const proposals: AiIntentV1[] = [];
  let remaining = targetMilitary - projectedCount;
  for (const producer of producers.filter(queueFree)) {
    if (remaining <= 0) break;
    const candidate = [...producerMilitaryProducts(producer.objectName, catalog, pressureDomain)]
      .filter((objectName) => !transition || objectName === transition.productObjectName)
      .filter((objectName) => {
        const cost = catalog.entries.find((entry) => entry.sourceObjectName === objectName)?.constructionProfile
          ?.resourceCost;
        return Object.entries(cost ?? {}).every(
          ([resourceType, amount]) =>
            (remainingProductionResources.get(resourceType as ResourceType) ?? 0) >= (amount ?? 0)
        );
      })
      .sort((left, right) => {
        const leftRole = roleFor(left, catalog);
        const rightRole = roleFor(right, catalog);
        const leftDeficit = productionRoleDeficit(leftRole, roleCounts, targetMilitary, desiredRanged);
        const rightDeficit = productionRoleDeficit(rightRole, roleCounts, targetMilitary, desiredRanged);
        const totalCost = (objectName: ObjectNames) =>
          Object.values(
            catalog.entries.find((entry) => entry.sourceObjectName === objectName)?.constructionProfile
              ?.resourceCost ?? {}
          ).reduce<number>((total, amount) => total + (amount ?? 0), 0);
        return rightDeficit - leftDeficit || totalCost(left) - totalCost(right) || left.localeCompare(right);
      })[0];
    if (!candidate) continue;
    const next = nextIds(state, compositionPrefix, ordinal + proposals.length);
    const resourceCost =
      catalog.entries.find((entry) => entry.sourceObjectName === candidate)?.constructionProfile?.resourceCost ?? {};
    const resourceClaims = Object.entries(resourceCost)
      .filter((entry): entry is [ResourceType, number] => entry[1] !== undefined && entry[1] > 0)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([resourceType, amount]) => ({
        claimId: `${next.claimId}:${resourceType}` as AiIntentV1["claims"][number]["claimId"],
        kind: "resource" as const,
        resourceType,
        amount
      }));
    const producedSoFar = priorIntents.filter(
      (intent) => intent.kind === "produce" && intent.demandId === "demand:composition:first-squad"
    ).length + proposals.length + 1;
    proposals.push({
      ...next,
      kind: "produce",
      spendingCategory: "defense",
      planId: transition?.planId ?? state.opening.plan.planId,
      demandId: transition?.demandId ?? "demand:composition:first-squad" as AiDemandV1["demandId"],
      lane: "supply_production",
      proposedTick: observation.tick,
      urgencyClass: 3,
      utility: 600,
      preconditions: [{ kind: "actor_exists", actorId: producer.actorId }],
      claims: [
        { claimId: next.claimId, kind: "production_slot", producerId: producer.actorId, slot: 0 },
        ...resourceClaims,
        {
          claimId: `${next.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
          kind: "effect",
          effectId: next.effectId
        }
      ],
      reasonCode:
        `composition:${state.opening.archetypeId}:${roleFor(candidate, catalog)}:` +
        `frontline=${roleCounts.frontline}:ranged=${roleCounts.ranged}:projected=${
          projectedCount + producedSoFar
        }/${targetMilitary}`,
      producerId: producer.actorId,
      objectName: candidate
    });
    for (const [resourceType, amount] of Object.entries(resourceCost)) {
      remainingProductionResources.set(
        resourceType as ResourceType,
        Math.max(0, (remainingProductionResources.get(resourceType as ResourceType) ?? 0) - (amount ?? 0))
      );
    }
    roleCounts[roleFor(candidate, catalog)] += 1;
    remaining -= 1;
  }
  return proposals;
}
