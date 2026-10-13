import { createAiProductionPolicyFixture } from "../testing/ai-production-policy-fixture";
import { proposeAiMilitaryCapacity } from "./ai-military-capacity-proposal";
import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";

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
  const result = proposeAiMilitaryCapacity({
    observation: { ...fixture.observation, actors: self },
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
  expect(result.intent?.kind).toBe("construct");
  expect(result.intent?.kind === "construct" ? result.intent.builderIds : []).toEqual(["z-idle"]);
});
