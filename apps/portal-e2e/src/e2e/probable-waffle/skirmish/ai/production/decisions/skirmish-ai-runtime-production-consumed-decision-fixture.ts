import type { AiObservedActor } from "@fuzzy-waddle/probable-waffle-gameplay";
import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainState } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/state/create-ai-brain-state";
import { createAiProfileConfig } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/profiles/ai-profile-defaults";
import type { AiDecisionInput } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/decision/ai-decision-input";
import type { AiRuntimeProductionSnapshot } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-snapshot";
import type { AiRuntimeProductionFact } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-fact";
import { productionWorldFixture, productionWorldObservation } from "../world/skirmish-ai-runtime-production-world-fixture";

/** Synthetic consumed input/cadence shapes. No live path, safe producer or useful AI strategy is asserted. */
export function productionConsumedDecisionFixture(tick = 20, decisionSequence = 1, completedBefore = 0) {
  const source = productionWorldObservation(tick).actors[0];
  if (!source) throw new Error("synthetic_decision_actor_missing");
  const known = <T>(value: T) => ({ status: "known" as const, value, observedTick: tick });
  const owned = { ...source, accessNodeId: known("access:main" as const), capabilities: [{ id: "move:ground",
    family: "move", level: 1, domains: ["ground"], targetDomains: [], capacity: known(1) }] } satisfies AiObservedActor;
  const enemy = { ...source, actorId: "enemy", owner: 2, relation: "enemy", visibility: "visible",
    evidenceId: "evidence:enemy", accessNodeId: known("access:main" as const), combatProfile: known({
      maxHealth: 10, maxArmour: 0, armourPermille: 0, passiveRegenerationPerSecond: 0,
      attacks: [{ damage: 3, cooldownTicks: 5, range: 3, minRange: 0, highGroundRangeBonus: 1,
        impactDelayTicks: 0, areaRadius: 0, targetDomains: ["ground" as const] }], healing: null, spells: [], statuses: []
    }) } satisfies AiObservedActor;
  const input: AiDecisionInput = {
    observation: { ...productionWorldObservation(tick), actors: [owned, enemy], accessProducts: [{
      queryId: "query:access:producer:enemy", revision: 2, status: "not_ready", fromNodeId: "access:main",
      toNodeId: "access:main", domains: ["ground"], updatedTick: tick
    }], threatSummary: { observedTick: tick, visibleEnemyActorIds: ["enemy"], rememberedEnemyActorIds: [],
      observedCapabilityFamilies: [] } },
    capabilityCatalog: { schemaVersion: 1, generation: 1, entries: [], unsupported: [] },
    accessGraph: { schemaVersion: 1, generation: 3, status: "ready", staticRevision: 1, dynamicRevision: 3,
      threatRevision: 2, builtTick: 10, continuationCursor: 0, nodes: [{ nodeId: "access:main", domain: "ground",
        elevation: 0, knowledge: "known_static", representativePosition: { x: 7, y: 9, z: 0 }, tileCount: 10, clearance: 1 }],
      links: [], transferPoints: [], unknownNodeIds: [] },
    cadence: { clock: "simulation", tick, configuredIntervalTicks: 5, completedBefore },
    snapshotRestoreInProgress: false, gaps: []
  };
  const state = createAiBrainState({ playerNumber: 1, faction: FactionType.Tivara, tick, archetypeId: "balanced",
    profile: createAiProfileConfig(ProbableWaffleAiDifficulty.Medium) });
  const selected = { sequence: 1, tick, playerNumber: 1, kind: "decision_selected", decision: {
    identity: { playerNumber: 1, tick, generation: 1, decisionSequence, authorityEpoch: 0 }, input,
    acceptedIntents: [], decisions: [], reservations: state.reservations, economyProduction: state.economyProduction
  } } satisfies AiRuntimeProductionFact;
  const capture = { ...productionWorldFixture().capture, facts: [selected], snapshots: [] } satisfies AiRuntimeProductionSnapshot;
  return { capture, input, selected };
}
