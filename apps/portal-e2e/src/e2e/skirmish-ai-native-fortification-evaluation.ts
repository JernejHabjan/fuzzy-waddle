import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import type { RuntimePresetWorldV1 } from "./skirmish-ai-runtime-preset-world";
import { nativeCompletedPlacements } from "./skirmish-ai-native-construction-evidence";
import { evaluateRuntimePlacementPrefixes } from "./skirmish-ai-placement-prefix-evaluation";
import { nativeProtectedTransits } from "./skirmish-ai-native-placement-evaluation";
import { nativeWeaponHits } from "./skirmish-ai-native-combat-effects";
import { runtimeControlTransitFailures } from "./skirmish-ai-runtime-control-transit";
import { nativeFortificationBudgetFailures } from "./skirmish-ai-native-fortification-budget";

/** Real paid prefixes, friendly passage, hostile access and occupied compatible firing stay separate obligations. */
export function evaluateNativeFortification(
  id: string, branch: string, context: ReturnType<typeof nativeScenarioContext>, preset: RuntimePresetWorldV1
): string[] {
  const failures: string[] = [];
  const capture = context.capture;
  const nodes = nativeCompletedPlacements(context, false).filter((placement) =>
    ["Wall", "Stairs", "WatchTower"].includes(placement.value.site.canonicalObjectName));
  const controls = ["no_value", "stairs_missing", "unaffordable"].includes(branch);
  if (!controls) {
    if (!nodes.length) failures.push("fortification_no_native_paid_completed_ai_prefix");
    failures.push(...evaluateRuntimePlacementPrefixes(preset, context.result, 1));
  }
  failures.push(...nativeProtectedTransits(context, preset));
  const plans = context.frames.flatMap((frame) => frame.decision.missionState?.fortifications ?? []);
  if (id === "WALL-01") {
    if (branch === "terrain" && !context.capture?.setup?.topology.some((layer) => layer.cells.some((cell) =>
      JSON.stringify(cell.properties).includes('"water"')))) failures.push("fortification_actual_terrain_anchor_missing");
    if (branch !== "no_value" && (!nativeWeaponHits(context, context.roles["contact-group"]).length ||
        !plans.some((plan) => plan.graph?.nodes.some((node) => node.kind === "wall" && node.lifecycle === "finished"))))
      failures.push("fortification_graph_has_no_native_defensive_effect");
    if (branch === "no_value" && nodes.some((node) => node.fact.tick > 200 && node.value.command.tileVec3.x < 34))
      failures.push("fortification_obsolete_remote_asset_still_funded");
  }
  if (id === "WALL-02") {
    if (!plans.some((plan) => plan.graph?.nodes.some((node) => node.kind === "gate_slot" && node.objectName === null)))
      failures.push("fortification_real_intentional_opening_missing");
    if (!context.facts.some((fact) => fact.kind === "native_damage" &&
      fact.damage.target.actorId === context.roles["original-home"] &&
      fact.damage.initiator?.actorId === context.roles["contact-group"] && fact.damage.amount > 0))
      failures.push("fortification_opening_not_independently_proven_hostile_passable");
    // A transit must start after this prefix and finish before the next one changes the measured layout.
    for (const [index, node] of nodes.entries()) {
      const through = nodes[index + 1]?.fact.tick ?? context.capture?.frontiers?.latestTick ?? 0;
      for (const role of ["worker-transit", "army-transit"]) {
        const commands = preset.controls?.filter((control) => control.producerFixtureActorId === role &&
          control.requestTick >= node.fact.tick && control.applicationTick < through) ?? [];
        if (!capture || !commands.some((control) =>
          !runtimeControlTransitFailures(capture, control.id, through, "arrive").length))
          failures.push(`fortification_prefix_has_no_physical_friendly_clearance:${index}:${role}`);
      }
    }
  }
  if (id === "WALL-03") {
    const ranged = context.roles["ranged-probe"];
    const post = context.capture?.frontiers?.intervals.find((interval) => interval.actors.some(({ identity, position }) =>
      identity.actorId === ranged && identity.alive && position && position.z >= 64));
    if (branch !== "stairs_missing" && (!post || !context.arrived(ranged).some((movement) =>
      movement.observations.some((entry) => entry.tick <= post.closedThroughTick)) ||
      !nativeWeaponHits(context, undefined, post.closedThroughTick).some((fact) =>
        fact.kind === "native_damage" && fact.damage.initiator?.actorId === ranged)))
      failures.push("fortification_elevated_post_not_physically_reached_and_used");
    if (branch === "stairs_missing" && post) failures.push("fortification_stairless_elevated_post_occupied");
    if (branch === "redundant" && nodes.some((node) => node.value.site.canonicalObjectName === "WatchTower" &&
      !nativeWeaponHits(context).some((fact) => fact.kind === "native_damage" && fact.damage.initiator?.actorId === node.siteId &&
        !nativeWeaponHits(context).some((other) => other.kind === "native_damage" &&
          other.damage.initiator?.actorId === context.roles["existing-tower"] &&
          other.damage.target.actorId === fact.damage.target.actorId))))
        failures.push("fortification_redundant_tower_adds_no_native_coverage");
  }
  if (id === "WALL-04") {
    const role = branch === "breach" ? "perimeter-wall" : "perimeter-stair";
    if (branch !== "no_value" && !context.result.perturbations.some((event) => event.id === `loss-${role}` &&
      event.affectedActorId === context.roles[role] && event.tick === 400)) failures.push("fortification_pinned_native_breach_missing");
    if (["stairs_loss", "breach"].includes(branch) && !nodes.some((node) => node.fact.tick > 400 &&
      node.value.site.canonicalObjectName === (role === "perimeter-wall" ? "Wall" : "Stairs")))
      failures.push("fortification_useful_breach_has_no_native_paid_recovery");
    if (["no_value", "unreachable"].includes(branch) && !context.arrived(context.roles["ranged-probe"], 400).length)
      failures.push("fortification_obsolete_or_unreachable_post_not_physically_released");
    if (branch === "unreachable" && !context.facts.some((fact) => fact.kind === "spatial_authority" &&
      fact.spatial.kind === "builder_path" && fact.tick >= 500 && fact.spatial.result === "no_path"))
      failures.push("fortification_repair_route_never_natively_blocked");
    const intact = context.capture?.setup?.actors.find((actor) => actor.actorId === context.roles["perimeter-wall-2"]);
    if (nodes.some((node) => intact?.footprint?.some((tile) => node.value.footprint?.some((other) =>
      tile.x === other.x && tile.y === other.y)))) failures.push("fortification_intact_node_rebuilt_or_overlapped");
  }
  if (id === "WALL-05") {
    if (!context.capture?.setup?.topology.some((layer) => layer.cells.some((cell) =>
      JSON.stringify(cell.properties).includes('"water"')))) failures.push("fortification_real_shore_terrain_missing");
    if (branch === "air") {
      if (!nativeWeaponHits(context, context.roles["air-threat"]).length)
        failures.push("fortification_air_threat_no_actual_compatible_weapon_hit");
      if (context.frames.some((frame) => frame.decision.input?.observation?.actors.some((actor) =>
        actor.actorId === context.roles["air-threat"] && actor.visibility === "last_seen" && actor.combatProfile?.status === "known")))
        failures.push("fortification_hidden_air_weapon_state_leaked");
    }
    if (branch === "shore" && (!context.capture ||
      runtimeControlTransitFailures(context.capture, "shore-egress", 800, "arrive").length))
      failures.push("fortification_native_shore_egress_missing");
  }
  if (id === "H-27") {
    const intrusion = context.facts.find((fact) => fact.kind === "native_damage" &&
      fact.damage.target.actorId === context.roles["original-home"] && fact.damage.initiator?.playerNumber === 1);
    if (!intrusion) failures.push("fortification_uncovered_opening_never_independently_exercised");
    const corrected = intrusion && nativeWeaponHits(context, context.roles["contact-group"], intrusion.tick).length > 0;
    const rejected = plans.some((plan) => plan.lifecycle === "abandoned" || plan.graph?.wholeConnectivity === "rejected");
    if (branch !== "defended" && !corrected && !rejected) failures.push("fortification_ineffective_layout_not_corrected_or_rejected");
  }
  if (id === "H-28") {
    failures.push(...nativeFortificationBudgetFailures(context));
    if (nodes.length < 2) failures.push("fortification_repeated_native_prefix_premise_missing");
    if (["changed_plan", "repair"].includes(branch) && !context.result.perturbations.some((event) =>
      event.id === "loss-ai-wall" && nodes.some((node) => node.siteId === event.affectedActorId && node.completionTick < event.tick)))
      failures.push("fortification_original_completed_ai_prefix_breach_missing");
    if (branch === "repair" && !nodes.some((node) => node.fact.tick > 1200 && node.value.site.canonicalObjectName === "Wall"))
      failures.push("fortification_useful_repair_never_natively_completed");
    if (branch === "changed_plan" && new Set(plans.map((plan) => plan.planId)).size < 2)
      failures.push("fortification_changed_plan_id_control_missing");
    if (branch === "multiple_bases" && !context.frames.some((frame) =>
      (frame.decision.missionState?.bases.filter((base) => base.active).length ?? 0) >= 2))
      failures.push("fortification_multiple_native_bases_not_observed");
  }
  return [...new Set(failures)];
}
