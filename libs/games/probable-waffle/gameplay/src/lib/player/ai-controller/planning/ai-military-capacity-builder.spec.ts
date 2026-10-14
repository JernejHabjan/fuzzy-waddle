import { createAiProductionPolicyFixture, createAiProducerThreat } from "../testing/ai-production-policy-fixture";
import type { AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";
import { proposeAiMilitaryCapacity } from "./ai-military-capacity-proposal";
import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";

function propose(
  fixture: ReturnType<typeof createAiProductionPolicyFixture>,
  self: readonly AiObservedActorV1[],
  observation: AiObservationV1 = { ...fixture.observation, actors: self }
) {
  return proposeAiMilitaryCapacity({
    observation,
    state: fixture.state,
    catalog: fixture.catalog,
    self,
    pressureDomain: "ground",
    targetMilitary: 12,
    militaryCount: 0,
    queuedMilitaryCount: 0,
    openingComplete: true,
    workforceRecoveryOwnsFood: false,
    reservedActorIds: new Set(),
    selectedConstructionTileKeys: new Set(),
    priorIntents: [],
    ordinal: 0
  });
}

it("prefers a genuinely idle builder over interrupting an active gather cycle for dated capacity", () => {
  const fixture = createAiProductionPolicyFixture();
  const worker = fixture.observation.actors[0];
  if (!worker) throw new Error("builder_fixture_missing");
  const busy = {
    ...worker,
    actorId: "a-busy",
    activeOrder: {
      status: "known" as const,
      observedTick: fixture.observation.tick,
      value: { orderType: OrderType.Gather, targetActorId: "deposit" }
    }
  };
  const idle = {
    ...worker,
    actorId: "z-idle",
    activeOrder: { status: "known" as const, observedTick: fixture.observation.tick, value: null }
  };
  const self = [busy, idle, fixture.producer];
  const result = propose(fixture, self);
  expect(result.intent?.kind).toBe("construct");
  expect(result.intent?.kind === "construct" ? result.intent.builderIds : []).toEqual(["z-idle"]);
});

it("tries the next available builder when the preferred idle worker is outside known construction connectivity", () => {
  const f = createAiProductionPolicyFixture(),
    worker = f.observation.actors[0];
  if (!worker) throw new Error("builder_fixture_missing");
  const idle = {
    ...worker,
    actorId: "a-idle",
    activeOrder: { status: "known" as const, observedTick: 200, value: null },
    logicalPosition: { status: "known" as const, observedTick: 200, value: { x: 20, y: 20, z: 0 } }
  };
  const busy = {
    ...worker,
    actorId: "z-feasible",
    activeOrder: {
      status: "known" as const,
      observedTick: 200,
      value: { orderType: OrderType.Gather, targetActorId: "deposit" }
    },
    logicalPosition: { status: "known" as const, observedTick: 200, value: { x: 2, y: 2, z: 0 } }
  };
  const threat = createAiProducerThreat(),
    self = [idle, busy, f.producer];
  const observation = {
    ...f.observation,
    actors: [...self, threat],
    threatSummary: { ...f.observation.threatSummary, visibleEnemyActorIds: [threat.actorId] }
  };
  const result = propose(f, self, observation);
  expect(result.intent?.kind === "construct" ? result.intent.builderIds : []).toEqual([busy.actorId]);
  const impossible = propose(f, [idle, f.producer], { ...observation, actors: [idle, f.producer, threat] });
  expect(impossible.intent).toBeNull();
  expect(impossible.demand?.purpose).toBe("critical_producer_resilience");
});
