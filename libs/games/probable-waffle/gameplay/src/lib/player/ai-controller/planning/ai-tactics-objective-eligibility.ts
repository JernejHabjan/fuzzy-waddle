import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { canTarget } from "./ai-tactics-combat";
import { knownPosition, distance, movementDomains } from "./ai-tactics-geometry";

/** Only targetable objectives with a usable approach compete for this cohort's orders.
 * A blocked movement route does not prevent an already-in-range weapon from firing across terrain.
 */
export function canPursueAiTacticalObjective(
  members: readonly AiObservedActorV1[],
  target: AiObservedActorV1 | undefined,
  observation: AiObservationV1
): boolean {
  if (!target || target.relation !== "enemy") return false;
  return members.some((member) => {
    if (!canTarget(member, target)) return false;
    const source = member.accessNodeId.status === "known" ? member.accessNodeId.value : null;
    const destination = target.accessNodeId.status === "known" ? target.accessNodeId.value : null;
    const route = observation.accessProducts.find(
      (product) =>
        product.fromNodeId === source &&
        product.toNodeId === destination &&
        product.updatedTick >= Math.max(member.observedTick, target.observedTick) &&
        movementDomains(member).some((domain) => product.domains.includes(domain))
    );
    if (!route || (route.status !== "blocked" && route.status !== "service_failed")) return true;
    const origin = knownPosition(member),
      goal = knownPosition(target);
    if (!origin || !goal || member.combatProfile?.status !== "known") return false;
    const separation = distance(origin, goal);
    return member.combatProfile.value.attacks.some(
      (attack) =>
        movementDomains(target).some((domain) => attack.targetDomains.includes(domain)) &&
        separation >= attack.minRange &&
        separation <= attack.range + (origin.z > goal.z ? attack.highGroundRangeBonus : 0)
    );
  });
}
