import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";

/** Exact result linkage only. Missing legacy records remain a gap; supplied contradictory authority is a failure. */
export function matchRuntimeProductionDecision(
  request: Extract<AiRuntimeProductionFactV1, { kind: "intent_dispatch" }>,
  decisions: readonly Extract<AiRuntimeProductionFactV1, { kind: "decision_selected" }>[],
  authorityEpoch: number | undefined
) {
  if (request.event.kind !== "requested") return { failures: ["production_ai_decision_request_invalid"], decision: null };
  const identity = request.event.decisionIdentity;
  if (!identity) return { failures: [], decision: null };
  const matches = decisions.filter((fact) => isDeepStrictEqual(fact.decision.identity, identity));
  const selected = matches[0];
  const intent = request.event.acceptedIntent;
  if (matches.length !== 1 || !selected || !intent || selected.playerNumber !== request.playerNumber ||
    selected.sequence >= request.sequence || selected.tick !== request.tick ||
    identity.tick > request.tick || intent.proposedTick > identity.tick ||
    identity.playerNumber !== request.playerNumber || identity.authorityEpoch !== authorityEpoch ||
    [identity.tick, identity.generation, identity.decisionSequence, identity.authorityEpoch].some((value) =>
      !Number.isSafeInteger(value) || value < 0) ||
    selected.decision.acceptedIntents.filter((entry) => entry.intentId === intent.intentId).length !== 1 ||
    !selected.decision.acceptedIntents.some((entry) => isDeepStrictEqual(entry, intent)) ||
    selected.decision.decisions.filter((entry) => entry.intent.intentId === intent.intentId).length !== 1 ||
    !selected.decision.decisions.some((entry) => entry.outcome === "accepted" && entry.reason === "accepted" &&
      isDeepStrictEqual(entry.intent, intent))) {
    return { failures: ["production_ai_committed_decision_lineage"], decision: null };
  }
  return { failures: [], decision: selected };
}
