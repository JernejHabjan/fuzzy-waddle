import type { AiDecisionInputV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/ai-decision-input-v1";
import type { RuntimeProductionFairInputV1 } from "./skirmish-ai-runtime-production-fair-input";
import { validateRuntimeProductionFairGraph } from "./skirmish-ai-runtime-production-fair-graph";
import { normalizeRuntimeProducerExposure } from "./skirmish-ai-runtime-producer-exposure";

/** Preserves exact visible/remembered semantics and real query statuses, without reading the live opponent world. */
export function normalizeRuntimeProductionFairInput(input: AiDecisionInputV1) {
  const failures: string[] = [];
  const gaps = new Set<string>();
  const exposure = normalizeRuntimeProducerExposure(input);
  failures.push(...exposure.failures);
  exposure.gaps.forEach((gap) => gaps.add(gap));
  const observation = input.observation;
  if (!observation) return { fairInput: null, failures, gaps: [...gaps, "production_decision_observation_missing"] };
  const { tick, playerNumber, actors } = observation;
  if (actors.length > 256 || observation.accessProducts.length > 64) {
    return { fairInput: null, failures: ["production_decision_fair_overflow"], gaps: [] };
  }
  const integer = (value: number) => Number.isSafeInteger(value) && value >= 0;
  const currentIds = actors.filter((actor) => actor.relation === "enemy" && actor.visibility === "visible")
    .map((actor) => actor.actorId).sort();
  const rememberedIds = actors.filter((actor) => actor.relation === "enemy" && actor.visibility === "last_seen")
    .map((actor) => actor.actorId).sort();
  const families = [...new Set(actors.filter((actor) => actor.relation === "enemy" && actor.visibility === "visible")
    .flatMap((actor) => actor.capabilities.map((capability) => capability.family)))].sort();
  const sameIds = (left: readonly string[], right: readonly string[]) =>
    new Set(left).size === left.length && left.length === right.length && [...left].sort().every((id, index) => id === right[index]);
  if (new Set(actors.map((actor) => actor.actorId)).size !== actors.length ||
    observation.threatSummary.observedTick !== tick ||
    !sameIds(observation.threatSummary.visibleEnemyActorIds, currentIds) ||
    !sameIds(observation.threatSummary.rememberedEnemyActorIds, rememberedIds) ||
    !sameIds(observation.threatSummary.observedCapabilityFamilies, families)) {
    failures.push("production_decision_fair_identity");
  }
  for (const actor of actors) {
    const remembered = actor.visibility === "last_seen";
    if (!actor.actorId || !actor.evidenceId || !actor.objectName ||
      !["owned", "visible", "last_seen"].includes(actor.visibility) ||
      !["self", "ally", "neutral", "enemy"].includes(actor.relation) ||
      !integer(actor.observedTick) || actor.observedTick > tick || (!remembered && actor.observedTick !== tick) ||
      (actor.owner !== null && !integer(actor.owner)) ||
      (actor.relation === "self" ? actor.visibility !== "owned" || actor.owner !== playerNumber
        : actor.visibility === "owned" || actor.owner === playerNumber) ||
      actor.capabilities.length > 64) failures.push("production_decision_actor_invalid");
    for (const value of [actor.logicalPosition, actor.accessNodeId, actor.effectiveLevel, actor.combatProfile]) {
      if (value?.status === "known" && (!integer(value.observedTick) || value.observedTick > actor.observedTick ||
        (!remembered && value.observedTick !== tick))) failures.push("production_decision_actor_value_tick");
    }
    if (actor.logicalPosition.status === "known" &&
      !Object.values(actor.logicalPosition.value).every(Number.isFinite)) failures.push("production_decision_position_invalid");
    if (actor.effectiveLevel.status === "known" && (!integer(actor.effectiveLevel.value) || actor.effectiveLevel.value < 1)) {
      failures.push("production_decision_level_invalid");
    }
    if (actor.combatProfile?.status === "known") {
      const attacks = actor.combatProfile.value.attacks;
      if (remembered || attacks.length > 32 || attacks.some((attack) =>
        ![attack.damage, attack.range, attack.minRange, attack.highGroundRangeBonus, attack.areaRadius].every((value) =>
          Number.isFinite(value) && value >= 0) || attack.minRange > attack.range ||
        !integer(attack.cooldownTicks) || attack.cooldownTicks === 0 || !integer(attack.impactDelayTicks) ||
        (actor.relation !== "self" && attack.remainingCooldownTicks != null) ||
        attack.targetDomains.some((domain) => !["ground", "water", "air"].includes(domain)))) {
        failures.push("production_decision_weapon_invalid");
      }
    }
  }
  const graph = input.accessGraph;
  if (graph) {
    failures.push(...validateRuntimeProductionFairGraph(graph, tick));
    if (graph.status !== "ready") gaps.add("production_decision_graph_not_ready");
  } else gaps.add("production_decision_graph_missing");
  const queries = observation.accessProducts;
  if (queries.length > 64 || new Set(queries.map((query) => query.queryId)).size !== queries.length) {
    failures.push("production_decision_query_identity");
  }
  // The existing publisher names exact owned-to-visible-enemy endpoint checks. It currently never returns ready.
  const sources = actors.filter((actor) => actor.relation === "self" && actor.visibility === "owned");
  const targets = actors.filter((actor) => actor.relation === "enemy" && actor.visibility === "visible");
  for (const query of queries) {
    const matches = sources.flatMap((source) => {
      const prefix = `query:access:${source.actorId}:`;
      if (!query.queryId.startsWith(prefix)) return [];
      const target = targets.find((actor) => actor.actorId === query.queryId.slice(prefix.length));
      return target ? [{ source, target }] : [];
    });
    const pair = matches[0];
    if (matches.length !== 1 || !pair || !integer(query.revision) || query.updatedTick !== tick ||
      !["ready", "not_ready", "unknown", "blocked", "service_failed"].includes(query.status) ||
      pair.source.accessNodeId.status !== "known" || pair.target.accessNodeId.status !== "known" ||
      query.fromNodeId !== pair.source.accessNodeId.value || query.toNodeId !== pair.target.accessNodeId.value ||
      !sameIds(query.domains, [...new Set(pair.source.capabilities.flatMap((capability) => capability.domains))].sort())) {
      failures.push("production_decision_query_mismatch");
    }
    if (query.status === "ready") gaps.add("production_decision_query_path_authority_missing");
    if (query.status !== "ready") gaps.add(`production_decision_query_${query.status}`);
  }
  gaps.add("production_decision_producer_reachability_missing");
  const visibleThreats: RuntimeProductionFairInputV1["visibleThreats"][number][] = actors
    .filter((actor) => actor.relation === "enemy" && actor.visibility === "visible")
    .map((actor) => {
      const position = actor.logicalPosition.status === "known" ? actor.logicalPosition.value : null;
      const attacks = actor.combatProfile?.status === "known" ? actor.combatProfile.value.attacks : null;
      if (!position) gaps.add("production_decision_threat_position_missing");
      if (!attacks) gaps.add("production_decision_threat_weapons_missing");
      return { actorId: actor.actorId, observedTick: actor.observedTick, position, attacks, buildingRange: null };
    });
  const fairInput = { accessGraph: graph, accessProducts: queries, visibleThreats, producerExposure: exposure.exposure }
    satisfies RuntimeProductionFairInputV1;
  return structuredClone({ fairInput: failures.length ? null : fairInput, failures: [...new Set(failures)], gaps: [...gaps].sort() });
}
