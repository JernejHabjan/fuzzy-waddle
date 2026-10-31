import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/create-ai-brain-state-v1";
import { createAiProfileConfigV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/profiles/ai-profile-defaults";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { productionCausalityFixture } from "./skirmish-ai-runtime-production-causality-fixture";

/** Invented decision shape for pure contract tests only. It supplies no fair setup, real leases or AI usefulness. */
export function productionDecisionFixture() {
  const raw = productionCausalityFixture();
  const state = createAiBrainStateV1({ playerNumber: 1, faction: FactionType.Tivara, tick: 1, archetypeId: "balanced",
    profile: createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium) });
  const facts: AiRuntimeProductionFactV1[] = [];
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
