import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiPlanId } from "../contracts/ai-core-types";

/** Only a known edge can prove a cycle; convergent paths and feeders must not become victims. */
function isCyclic(state: AiBrainStateV1, planId: AiPlanId): boolean {
  const edges = state.waitEdges.filter((edge) => edge.status === "known" && edge.toPlanId !== null);
  const pending = edges.filter((edge) => edge.fromPlanId === planId).flatMap((edge) => edge.toPlanId ?? []);
  const seen = new Set<AiPlanId>();
  while (pending.length) {
    const cursor = pending.pop();
    if (cursor === undefined) break;
    if (cursor === planId) return true;
    if (seen.has(cursor)) continue;
    seen.add(cursor);
    pending.push(...edges.filter((edge) => edge.fromPlanId === cursor).flatMap((edge) => edge.toPlanId ?? []));
  }
  return false;
}

/**
 * Release a whole reversible plan bundle, ranked by its ORIGINAL admission, never current enumeration or names.
 * Any dispatched/paid/refundable neighbor in that same plan fences the bundle. Unknown legacy ranks retain ownership.
 * Stable plan identity breaks equal-rank ties. A stronger sibling claim protects the plan's entire atomic purpose.
 */
export function selectAiCycleVictim(state: AiBrainStateV1): AiPlanId | null {
  const plans = [...new Set(state.waitEdges.map((edge) => edge.fromPlanId))];
  const candidates = plans.flatMap((planId) => {
    if (!isCyclic(state, planId)) return [];
    const bundle = state.reservations.filter((claim) => claim.ownerPlanId === planId);
    if (!bundle.length || bundle.some((claim) => claim.state.kind !== "provisional" || !claim.priority)) return [];
    // A provisional label may lag synchronous shared dispatch. Positive original lifecycle evidence fences the whole purpose.
    if (bundle.some((claim) => claim.subjectKey?.startsWith("effect:") && state.pendingOutcomes.some((outcome) =>
      claim.subjectKey === `effect:${outcome.identity.effectId}` &&
      ["dispatched", "applied", "active", "completed"].includes(outcome.kind)))) return [];
    const priority = bundle.map((claim) => claim.priority).filter((rank) => rank !== undefined)
      .sort((left, right) => left.urgencyClass - right.urgencyClass || right.utility - left.utility)[0];
    return priority ? [{ planId, priority }] : [];
  });
  candidates.sort((left, right) => right.priority.urgencyClass - left.priority.urgencyClass ||
    left.priority.utility - right.priority.utility || left.planId.localeCompare(right.planId));
  return candidates[0]?.planId ?? null;
}
