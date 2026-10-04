import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { AiRuntimeProductionBoundaryState } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-boundary-state";
import { productionRejectionFixture } from "./skirmish-ai-runtime-production-rejection-fixture";

/** Same effect correlation with a new accepting result after the actual-shaped lease-retirement boundary. */
export function rejectionRetryFixture() {
  const first = productionRejectionFixture();
  const retry = productionRejectionFixture("application");
  const selected = retry.facts[0];
  if (selected.kind !== "decision_selected") throw new Error("synthetic_retry_decision_missing");
  const identity = { ...selected.decision.identity, tick: 8, generation: 8, decisionSequence: 2 };
  const accepted = selected.decision.acceptedIntents[0];
  if (!accepted) throw new Error("synthetic_retry_intent_missing");
  const intent = { ...accepted, proposedTick: 8 };
  const boundary = (value: AiRuntimeProductionBoundaryState | undefined) => value ? { ...value,
    unspentClaims: value.unspentClaims ? { ...value.unspentClaims, entries: value.unspentClaims.entries.map((entry) => ({
      ...entry, identity, intent, commandId: entry.commandId ? "purchase-retry" : null
    })) } : undefined } : undefined;
  const facts: AiRuntimeProductionFactV1[] = [...first.facts, { ...selected, tick: 8, decision: { ...selected.decision,
    identity: { ...identity, decisionSequence: 1 }, acceptedIntents: [], decisions: [], reservations: [] } }];
  for (const fact of retry.facts) {
    const common = { ...fact, tick: fact.tick + 4, boundaryState: boundary(fact.boundaryState) };
    if (fact.kind === "decision_selected") facts.push({ ...common, kind: fact.kind, decision: { ...fact.decision,
      identity, acceptedIntents: [intent], decisions: [{ intent, outcome: "accepted", reason: "accepted" }],
      reservations: fact.decision.reservations.map((lease) => ({ ...lease, createdTick: 8 })) } });
    else if (fact.kind === "outcome") facts.push({ ...common, kind: fact.kind, outcome: { ...fact.outcome,
      tick: fact.outcome.tick + 4, commandId: "purchase-retry", sequence: 2 },
      scheduledTick: fact.scheduledTick === null ? null : fact.scheduledTick + 4,
      boundaryStateBefore: boundary(fact.boundaryStateBefore) });
    else if (fact.kind === "command_delivered") facts.push({ ...common, kind: fact.kind, command: { ...fact.command,
      tick: fact.command.tick + 4, execution: fact.command.execution ? { ...fact.command.execution,
        commandId: "purchase-retry", sequence: 2 } : undefined } });
    else if (fact.kind === "intent_dispatch") facts.push({ ...common, kind: fact.kind,
      boundaryStateBefore: boundary(fact.boundaryStateBefore), event: fact.event.kind === "requested" ? {
        ...fact.event, proposedTick: 8, acceptedIntent: intent, decisionIdentity: identity
      } : fact.event.kind === "finished" && fact.event.receipt.status === "dispatched" ? { ...fact.event,
        receipt: { ...fact.event.receipt, command: { ...fact.event.receipt.command, tick: fact.event.receipt.command.tick + 4,
          execution: fact.event.receipt.command.execution ? { ...fact.event.receipt.command.execution,
            commandId: "purchase-retry", sequence: 2 } : undefined } } } : fact.event });
    else facts.push(common);
  }
  return { ...first, facts: facts.map((fact, index) => ({ ...fact, sequence: index + 1 })) };
}
