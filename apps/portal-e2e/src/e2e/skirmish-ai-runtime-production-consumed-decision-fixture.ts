import type { AiObservedActorV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/create-ai-brain-state-v1";
import { createAiProfileConfigV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/profiles/ai-profile-defaults";
import type { AiDecisionInputV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/ai-decision-input-v1";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { productionWorldFixture, productionWorldObservation } from "./skirmish-ai-runtime-production-world-fixture";

/** Synthetic consumed input/cadence shapes. No live path, safe producer or useful AI strategy is asserted. */
export function productionConsumedDecisionFixture(tick = 20, decisionSequence = 1, completedBefore = 0) {
  const source = productionWorldObservation(tick).actors[0];
  if (!source) throw new Error("synthetic_decision_actor_missing");
  const known = <T>(value: T) => ({ status: "known" as const, value, observedTick: tick });
  const owned = { ...source, accessNodeId: known("access:main" as const), capabilities: [{ id: "move:ground",
    family: "move", level: 1, domains: ["ground"], targetDomains: [], capacity: known(1) }] } satisfies AiObservedActorV1;
  const enemy = { ...source, actorId: "enemy", owner: 2, relation: "enemy", visibility: "visible",
    evidenceId: "evidence:enemy", accessNodeId: known("access:main" as const), combatProfile: known({
      maxHealth: 10, maxArmour: 0, armourPermille: 0, passiveRegenerationPerSecond: 0,
      attacks: [{ damage: 3, cooldownTicks: 5, range: 3, minRange: 0, highGroundRangeBonus: 1,
        impactDelayTicks: 0, areaRadius: 0, targetDomains: ["ground" as const] }], healing: null, spells: [], statuses: []
    }) } satisfies AiObservedActorV1;
  const input: AiDecisionInputV1 = {
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
  const state = createAiBrainStateV1({ playerNumber: 1, faction: FactionType.Tivara, tick, archetypeId: "balanced",
    profile: createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium) });
  const selected = { sequence: 1, tick, playerNumber: 1, kind: "decision_selected", decision: {
    identity: { playerNumber: 1, tick, generation: 1, decisionSequence, authorityEpoch: 0 }, input,
    acceptedIntents: [], decisions: [], reservations: state.reservations, economyProduction: state.economyProduction
  } } satisfies AiRuntimeProductionFactV1;
  const capture = { ...productionWorldFixture().capture, facts: [selected], snapshots: [] } satisfies AiRuntimeProductionCaptureV1;
  return { capture, input, selected };
}
