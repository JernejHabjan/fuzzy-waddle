import bindings from "../../../../tools/ai/native-scenario-bindings.json";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeCompletedPlacements } from "./skirmish-ai-native-construction-evidence";
import { evaluateDifficultyFairnessPairs } from "./skirmish-ai-native-difficulty-fairness";

/** Full-case coverage and counterfactual comparisons; a successful individual diagnostic world remains partial. */
export function evaluateNativeScenarioPairs(id: string, fixture: RuntimeFixtureV1, results: readonly RuntimeVariantResultV1[]): string[] {
  const definition = Object.entries(bindings.cases).find(([scenarioId]) => scenarioId === id)?.[1];
  if (!definition) return [];
  const contract = fixture.assertions[id]?.requiredNativeScenario;
  if (!contract || contract.scenarioId !== id || contract.latestTick !== definition.latestTick)
    return ["native_case_binding_missing"];
  const failures: string[] = [];
  const branchesFor = (faction: string) => ("branchesByFaction" in definition ?
    Object.entries(definition.branchesByFaction).find(([name]) => name === faction)?.[1] : undefined) ??
    definition.branches.filter((branch) =>
    !(id === "FIGHT-04" && (branch === "zone" && faction !== "Tivara" || branch === "support_expiry" && faction !== "Skaduwee")) &&
    !(id === "FIGHT-05" && (branch === "stun" && faction !== "Tivara" || branch === "slow" && faction !== "Skaduwee")));
  if (Object.keys(contract.branchByVariant).length !== fixture.recipe.variants.length ||
      results.length !== fixture.recipe.variants.length) failures.push("native_full_case_variant_set_incomplete");
  for (const faction of ["Tivara", "Skaduwee"]) {
    const worlds = results.filter((result) => result.aiFaction === faction);
    const required = branchesFor(faction);
    if (worlds.length !== required.length || required.some((branch) => worlds.filter((world) =>
      contract.branchByVariant[world.variantId] === branch).length !== 1)) {
      failures.push(`native_required_branch_missing_or_repeated:${faction}`);
      continue;
    }
    if (id === "H-32") {
      if (new Set(worlds.map((world) => world.seed)).size !== 1 ||
          worlds.some((world) => !world.nativeLifecycle?.sourceRevision || !world.nativeLifecycle.fixtureDigest) ||
          new Set(worlds.map((world) => world.nativeLifecycle?.sourceRevision)).size !== 1 ||
          new Set(worlds.map((world) => world.nativeLifecycle?.fixtureDigest)).size !== 1)
        failures.push(`native_lifecycle_paired_source_or_seed_drift:${faction}`);
      continue;
    }
    if (new Set(worlds.map((world) => world.seed)).size !== 1 || new Set(worlds.map((world) => world.mapLabel)).size !== 1 ||
        new Set(worlds.map((world) => world.productionPreset?.sourceRevision)).size !== 1 ||
        new Set(worlds.map((world) => world.productionPreset?.fixtureDigest)).size !== 1)
      failures.push(`native_paired_source_seed_or_map_drift:${faction}`);
    const find = (branch: string) => worlds.find((world) => contract.branchByVariant[world.variantId] === branch);
    if (id === "DBG-06") {
      const digests = worlds.map((world) => world.nativeDebugParity?.beforeDigest);
      const decisions = worlds.map((world) => JSON.stringify(nativeScenarioContext(world, definition.latestTick).frames
        .map((frame) => ({ tick: frame.tick, input: frame.decision.input, intents: frame.decision.acceptedIntents }))));
      if (digests.some((digest) => !digest) || new Set(digests).size !== 1 || new Set(decisions).size !== 1)
        failures.push("debug_modes_differ_in_canonical_native_world_rng_or_exact_selected_decisions");
    }
    if (id === "D-03") failures.push(...evaluateDifficultyFairnessPairs(worlds, (world) =>
      contract.branchByVariant[world.variantId]));
    if (id === "SCOUT-01") failures.push(...hiddenParity(find("hidden_a"), find("hidden_b"), definition.latestTick, true));
    if (id === "SCOUT-02") for (const branch of ["hidden_position", "hidden_health", "hidden_queue"])
      failures.push(...hiddenParity(find("withdrawn"), find(branch), definition.latestTick));
    if (id === "STRAT-06") {
      const strong = find("strong"), damaged = find("damaged");
      if (!strong || !damaged) continue;
      const a = nativeScenarioContext(strong, definition.latestTick), b = nativeScenarioContext(damaged, definition.latestTick);
      if (JSON.stringify(a.frames.filter((frame) => frame.tick < 200).map(permitted)) !==
          JSON.stringify(b.frames.filter((frame) => frame.tick < 200).map(permitted)))
        failures.push("strategy_state_pair_initial_permitted_inputs_differ");
      const changed = a.frames.some((frame) => frame.tick >= 200 && frame.tick <= 600 && b.frames.some((other) =>
        other.tick === frame.tick && other.decision.strategy?.stance !== frame.decision.strategy?.stance));
      if (!changed) failures.push("strategy_elapsed_time_control_has_no_state_driven_phase_difference");
    }
    if (id === "WALL-01") {
      const assisted = find("terrain"), free = find("freestanding");
      if (!assisted || !free) continue;
      const walls = (world: RuntimeVariantResultV1) => nativeCompletedPlacements(nativeScenarioContext(world, definition.latestTick))
        .filter((node) => node.value.site.canonicalObjectName === "Wall").length;
      if (!walls(assisted) || walls(assisted) >= walls(free))
        failures.push("fortification_terrain_anchor_does_not_reduce_native_wall_length");
    }
  }
  return [...new Set(failures)];
}

/** Compare complete permitted inputs and exact selected intents until genuine permitted contact first differs. */
function hiddenParity(
  a: RuntimeVariantResultV1 | undefined, b: RuntimeVariantResultV1 | undefined, latestTick: number, differentSetup = false
): string[] {
  if (!a || !b || differentSetup && a.initialWorldDigest === b.initialWorldDigest)
    return ["scouting_hidden_counterfactual_world_missing"];
  const left = nativeScenarioContext(a, latestTick, undefined, { requireResourceCoverage: false });
  const right = nativeScenarioContext(b, latestTick, undefined, { requireResourceCoverage: false });
  if (left.failures.length || right.failures.length) return ["scouting_hidden_pair_native_history_incomplete"];
  let compared = 0;
  for (const frame of left.frames) {
    const other = right.frames.find((candidate) => candidate.tick === frame.tick);
    if (!other) return ["scouting_hidden_pair_decision_boundary_missing"];
    if (JSON.stringify(canonicalNativePairValue(frame.decision.input?.observation?.actors.filter((actor) => actor.visibility === "visible"), left, "actors")) !==
        JSON.stringify(canonicalNativePairValue(other.decision.input?.observation?.actors.filter((actor) => actor.visibility === "visible"), right, "actors"))) break;
    if (JSON.stringify(canonicalNativePairValue(permitted(frame), left)) !== JSON.stringify(canonicalNativePairValue(permitted(other), right)))
      return ["scouting_hidden_world_altered_permitted_inputs"];
    if (JSON.stringify(canonicalNativePairValue(frame.decision.acceptedIntents, left, "acceptedIntents")) !==
        JSON.stringify(canonicalNativePairValue(other.decision.acceptedIntents, right, "acceptedIntents")))
      return ["scouting_hidden_world_altered_selected_intents"];
    compared++;
  }
  return compared >= 2 ? [] : ["scouting_hidden_pair_has_no_substantial_equal_information_window"];
}

/** Privileged native geometry/exposure is excluded; public map, effects, catalog and own cash remain part of the comparison. */
function permitted(frame: ReturnType<typeof nativeScenarioContext>["frames"][number]) {
  const input = frame.decision.input;
  return { observation: input?.observation, resources: input?.resources, map: input?.map,
    effects: input?.effects, modeGoals: input?.modeGoals, capabilityCatalog: input?.capabilityCatalog, accessGraph: input?.accessGraph };
}

/** Simulation and fixture IDs are run-local; compare the observable world by authored role and position. */
export function canonicalNativePairValue(
  value: unknown, context: ReturnType<typeof nativeScenarioContext>, parentKey = ""
): unknown {
  const aliases = new Map<string, string>();
  for (const [role, actorId] of Object.entries(context.roles)) {
    if (!/^worker-\d+$/.test(role)) aliases.set(actorId, `role:${role}`);
  }
  const observedActors = context.frames.flatMap((frame) => frame.decision.input?.observation?.actors ?? []);
  const fallback = new Map<string, string[]>();
  const actorKey = (actor: (typeof observedActors)[number]) => JSON.stringify([
    actor.relation, actor.owner, actor.objectName, actor.logicalPosition.status === "known"
      ? actor.logicalPosition.value : null
  ]);
  const seen = new Set<string>();
  for (const actor of observedActors) {
    if (aliases.has(actor.actorId)) continue;
    if (seen.has(actor.actorId)) continue;
    seen.add(actor.actorId);
    const group = fallback.get(actorKey(actor)) ?? [];
    group.push(actor.actorId);
    fallback.set(actorKey(actor), group);
  }
  for (const [key, ids] of fallback) ids.forEach((id) => aliases.set(id, `actor:${key}`));
  const unordered = new Set([
    "actors", "actorIds", "targetActorIds", "acceptedIntents", "claims", "dynamicObstacleActorIds", "frontierAccessNodeIds", "unknownNodeIds",
    "nodes", "links", "transferPoints", "scoutSearchPoints", "accessProducts", "visibleEnemyActorIds",
    "rememberedEnemyActorIds", "observedCapabilityFamilies"
  ]);
  const normalize = (entry: unknown, key: string): unknown => {
    if (Array.isArray(entry)) {
      const normalized = entry.map((item) => normalize(item, key));
      return unordered.has(key) ? normalized.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) : normalized;
    }
    if (entry && typeof entry === "object") {
      return Object.fromEntries(Object.entries(entry).filter(([field]) =>
        !(key === "accessGraph" && ["generation", "dynamicRevision", "threatRevision", "builtTick", "continuationCursor"].includes(field)) &&
        !(key === "regionGeneration" && field === "generation")
      ).sort(([left], [right]) => left.localeCompare(right)).map(([field, item]) => [field, normalize(item, field)]));
    }
    if (typeof entry === "string") return entry
      .replace(/sim-[a-f\d]+/g, (id) => aliases.get(id) ?? id)
      .replace(/runtime-fixture-[^:,\s"]+/g, "runtime-fixture");
    return entry;
  };
  return normalize(value, parentKey);
}
