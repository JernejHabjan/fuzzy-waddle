import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainState } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/state/create-ai-brain-state";
import { createAiProfileConfig } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/profiles/ai-profile-defaults";
import type { AiRuntimeProductionFact } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-fact";
import { productionCausalityFixture } from "./skirmish-ai-runtime-production-causality-fixture";

/** Invented decision shape for pure contract tests only. It supplies no fair setup, real leases or AI usefulness. */
export function productionDecisionFixture() {
  const raw = productionCausalityFixture();
  const state = createAiBrainState({ playerNumber: 1, faction: FactionType.Tivara, tick: 1, archetypeId: "balanced",
    profile: createAiProfileConfig(ProbableWaffleAiDifficulty.Medium) });
  const facts: AiRuntimeProductionFact[] = [];
  let decisionSequence = 1;
  for (const fact of raw.facts) {
    if (fact.kind !== "intent_dispatch" || fact.event.kind !== "requested" || !fact.event.acceptedIntent) {
      facts.push(fact);
      continue;
    }
    const intent = fact.event.acceptedIntent;
    const identity = { playerNumber: raw.playerNumber, tick: fact.tick, generation: 7,
      decisionSequence: decisionSequence++, authorityEpoch: 0 };
    facts.push({ sequence: 0, tick: fact.tick, playerNumber: raw.playerNumber, kind: "decision_selected", decision: {
      identity, acceptedIntents: [intent], decisions: [{ outcome: "accepted", reason: "accepted", intent }],
      reservations: [], economyProduction: state.economyProduction
    } }, { ...fact, event: { ...fact.event, decisionIdentity: identity } });
  }
  return { ...raw, facts: facts.map((fact, index) => ({ ...fact, sequence: index + 1 })) };
}
