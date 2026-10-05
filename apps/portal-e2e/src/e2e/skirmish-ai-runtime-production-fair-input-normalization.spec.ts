import { expect, test } from "@playwright/test";
import type { AiDecisionInputV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/ai-decision-input-v1";
import { productionConsumedDecisionFixture } from "./skirmish-ai-runtime-production-consumed-decision-fixture";
import { normalizeRuntimeProductionFairInput } from "./skirmish-ai-runtime-production-fair-input-normalization";

test.describe("fair production decision synthetic contract tests", () => {
  test("remembered enemies cannot become current threats and missing current weapon facts remain null", () => {
    const { input } = productionConsumedDecisionFixture();
    if (!input.observation) throw new Error("synthetic_observation_missing");
    const unknown = { status: "unknown", reason: "not_observed" } as const;
    const remembered: AiDecisionInputV1 = { ...input, observation: { ...input.observation, accessProducts: [],
      actors: input.observation.actors.map((actor) => actor.actorId !== "enemy" ? actor : {
        ...actor, visibility: "last_seen" as const, observedTick: 10, combatProfile: undefined, effectiveLevel: unknown,
        accessNodeId: unknown, logicalPosition: { status: "known" as const, observedTick: 10, value: { x: 1, y: 2, z: 0 } }
      }), threatSummary: { ...input.observation.threatSummary,
        visibleEnemyActorIds: [], rememberedEnemyActorIds: ["enemy"] } } };
    const result = normalizeRuntimeProductionFairInput(remembered);
    expect(result.failures).toEqual([]);
    expect(result.fairInput?.visibleThreats).toEqual([]);
    const missing: AiDecisionInputV1 = { ...input, observation: { ...input.observation,
      actors: input.observation.actors.map((actor) => actor.actorId !== "enemy" ? actor : {
        ...actor, combatProfile: unknown, logicalPosition: unknown
      }) } };
    expect(normalizeRuntimeProductionFairInput(missing).fairInput?.visibleThreats[0])
      .toMatchObject({ position: null, attacks: null, buildingRange: null });
    expect(normalizeRuntimeProductionFairInput(missing).gaps).toContain("production_decision_threat_weapons_missing");
  });

  test("pending/missing topology and blocked/failed endpoint checks retain their actual status", () => {
    const { input } = productionConsumedDecisionFixture();
    if (!input.observation || !input.accessGraph) throw new Error("synthetic_input_missing");
    for (const status of ["not_ready", "blocked", "service_failed", "ready"] as const) {
      const result = normalizeRuntimeProductionFairInput({ ...input, accessGraph: { ...input.accessGraph, status: "pending" },
        observation: { ...input.observation, accessProducts: input.observation.accessProducts.map((query) => ({ ...query, status })) } });
      expect(result.failures).toEqual([]);
      expect(result.fairInput?.accessProducts[0].status).toBe(status);
      expect(result.gaps).toContain("production_decision_graph_not_ready");
      expect(result.gaps).toContain("production_decision_producer_reachability_missing");
      if (status === "ready") expect(result.gaps).toContain("production_decision_query_path_authority_missing");
    }
    expect(normalizeRuntimeProductionFairInput({ ...input, accessGraph: null }).gaps).toContain("production_decision_graph_missing");
  });

  test("hidden/foreign/future/duplicate/malformed weapons, graph endpoints and mismatched query owners fail closed", () => {
    const { input } = productionConsumedDecisionFixture();
    if (!input.observation || !input.accessGraph) throw new Error("synthetic_input_missing");
    const observation = input.observation;
    const defects: AiDecisionInputV1[] = [
      { ...input, observation: { ...observation, actors: [...observation.actors, observation.actors[0]] } },
      { ...input, observation: { ...observation, actors: observation.actors.map((actor) => actor.relation === "self"
        ? { ...actor, visibility: "last_seen" as const } : actor) } },
      { ...input, observation: { ...observation, actors: observation.actors.map((actor) => actor.relation === "self"
        ? { ...actor, owner: 2 } : actor) } },
      { ...input, observation: { ...observation, actors: observation.actors.map((actor) => ({ ...actor, observedTick: 21 })) } },
      { ...input, observation: { ...observation, actors: observation.actors.map((actor) => ({ ...actor,
        logicalPosition: { status: "known" as const, value: { x: 7, y: Number.NaN, z: 0 }, observedTick: 20 } })) } },
      { ...input, observation: { ...observation, actors: observation.actors.map((actor) => actor.combatProfile?.status !== "known"
        ? actor : { ...actor, combatProfile: { ...actor.combatProfile, value: { ...actor.combatProfile.value,
          attacks: actor.combatProfile.value.attacks.map((attack) => ({ ...attack, range: -1 })) } } }) } },
      { ...input, observation: { ...observation, threatSummary: { ...observation.threatSummary, visibleEnemyActorIds: [] } } },
      { ...input, accessGraph: { ...input.accessGraph, nodes: [...input.accessGraph.nodes, input.accessGraph.nodes[0]] } },
      { ...input, accessGraph: { ...input.accessGraph, links: [{ linkId: "link:missing", fromNodeId: "access:main",
        toNodeId: "access:absent", domain: "ground", clearance: 1, distanceCost: 1, knowledge: "known_static" }] } },
      { ...input, observation: { ...observation, accessProducts: observation.accessProducts.map((query) => ({
        ...query, queryId: "query:access:enemy:producer" })) } },
      { ...input, observation: { ...observation, accessProducts: observation.accessProducts.map((query) => ({
        ...query, fromNodeId: "access:absent" })) } }
    ];
    for (const defect of defects) {
      const result = normalizeRuntimeProductionFairInput(defect);
      expect(result.failures.length).toBeGreaterThan(0);
      expect(result.fairInput).toBeNull();
    }
  });
});
