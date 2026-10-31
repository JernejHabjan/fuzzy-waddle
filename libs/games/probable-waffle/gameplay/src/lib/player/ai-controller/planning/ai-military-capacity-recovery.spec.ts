import { createAiProductionPolicyFixture } from "../testing/ai-production-policy-fixture";
import { AiMacroManager } from "./ai-macro-manager";
import { proposeAiMilitaryCapacity } from "./ai-military-capacity-proposal";

describe("lost military production capacity", () => {
  it("rebuilds a completed opening producer without a prior threat warning and counts its replacement site", () => {
    const f = createAiProductionPolicyFixture();
    const first = new AiMacroManager(() => f.catalog).propose(f.observation, f.state);
    const economyProduction = first.statePatch?.economyProduction;
    if (!economyProduction) throw new Error("missing_opening_production_history");
    expect(economyProduction.demands.some((demand) => demand.purpose === "critical_producer_resilience")).toBe(false);
    const survivors = f.observation.actors.filter(
      (actor) => actor.relation === "self" && actor.actorId !== f.producer.actorId
    );
    const args = {
      observation: { ...f.observation, actors: survivors },
      state: { ...f.state, strategy: { ...f.state.strategy, assessment: undefined }, economyProduction },
      catalog: f.catalog,
      self: survivors,
      pressureDomain: "ground" as const,
      targetMilitary: 4,
      militaryCount: 0,
      queuedMilitaryCount: 0,
      openingComplete: true,
      workforceRecoveryOwnsFood: false,
      reservedActorIds: new Set<string>(),
      selectedConstructionTileKeys: new Set<string>(),
      priorIntents: [],
      ordinal: 0
    };
    const replacement = proposeAiMilitaryCapacity(args);
    expect(replacement.demand).toMatchObject({ preferredObjectNames: [f.producerName] });
    expect(replacement.intent).toMatchObject({ kind: "construct", objectName: f.producerName });
    const site = {
      ...f.producer,
      actorId: "replacement-site",
      constructionProgress: { status: "known" as const, value: 50, observedTick: 200 }
    };
    const whileBuilding = proposeAiMilitaryCapacity({
      ...args,
      observation: { ...args.observation, actors: [...survivors, site] },
      self: [...survivors, site],
      selectedConstructionTileKeys: new Set<string>()
    });
    expect(whileBuilding.intent).toBeNull();
    expect(whileBuilding.demand?.constructingIds).toEqual([site.actorId]);
    expect(proposeAiMilitaryCapacity({ ...args, militaryCount: 4 }).intent).toBeNull();
  });
});
