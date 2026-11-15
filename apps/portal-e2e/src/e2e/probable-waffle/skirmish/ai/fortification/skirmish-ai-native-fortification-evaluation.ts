import type { nativeScenarioContext } from "../contracts/skirmish-ai-native-scenario-context";
import type { RuntimePresetWorld } from "../setup/skirmish-ai-runtime-preset-world";
import { nativeCompletedPlacements } from "../construction/evaluation/skirmish-ai-native-construction-evidence";
import { evaluateRuntimePlacementPrefixes } from "../construction/evaluation/skirmish-ai-placement-prefix-evaluation";
import { nativeProtectedTransits } from "../construction/evaluation/skirmish-ai-native-placement-evaluation";
import { nativeWeaponHits } from "../combat/effects/skirmish-ai-native-combat-effects";
import { runtimeControlTransitFailures } from "../navigation/skirmish-ai-runtime-control-transit";
import { nativeFortificationBudgetFailures } from "./skirmish-ai-native-fortification-budget";

/** Real paid prefixes, friendly passage, hostile access and occupied compatible firing stay separate obligations. */
export function evaluateNativeFortification(
  id: string, branch: string, context: ReturnType<typeof nativeScenarioContext>, preset: RuntimePresetWorld
): string[] {
  const failures: string[] = [];
  const capture = context.capture;
  const nodes = nativeCompletedPlacements(context, false).filter((placement) =>
    ["Wall", "Stairs", "WatchTower"].includes(placement.value.site.canonicalObjectName)
  ).sort((left, right) => left.completionTick - right.completionTick || left.fact.sequence - right.fact.sequence);
  const controls = ["no_value", "stairs_missing", "unaffordable"].includes(branch);
  const transitRoles = id === "WALL-02"
    ? branch === "worker" ? ["worker-transit"]
      : branch === "army" ? ["army-transit"]
        : branch === "concurrent" ? ["worker-transit", "army-transit"] : []
    : undefined;
  if (!controls) {
    if (!nodes.length) failures.push("fortification_no_native_paid_completed_ai_prefix");
    failures.push(...evaluateRuntimePlacementPrefixes(preset, context.result, 1));
  }
  failures.push(...nativeProtectedTransits(context, preset, transitRoles, id === "WALL-02"));
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
    if (branch === "enemy_opening") {
      const openingPrefix = nodes.find((node) => node.value.site.canonicalObjectName === "Wall") ?? nodes[0];
      const openingPrefixTick = openingPrefix?.completionTick ?? Infinity;
      const hostileStageControl = preset.controls?.find((control) => control.id === "move-hostile-transit-1720");
      const enemySideRoute = preset.protectedRoutes?.find((route) =>
        route.id === "production-army" && route.playerNumber === capture?.playerNumber);
      const hostileTargetsOpening = hostileStageControl?.action.kind === "move" && enemySideRoute &&
        hostileStageControl.action.worldPosition.x === enemySideRoute.to.x &&
        hostileStageControl.action.worldPosition.y === enemySideRoute.to.y;
      const hostileStaging = hostileTargetsOpening && context.opponent && openingPrefixTick > 0 &&
        context.opponent.facts.some((fact) => fact.kind === "preset_control" &&
          fact.control.id === "move-hostile-transit-1720" && fact.control.phase === "applied" &&
          fact.tick < openingPrefixTick && fact.control.command?.execution &&
          context.opponent?.facts.some((movement) => movement.kind === "spatial_authority" &&
            movement.spatial.kind === "movement" && movement.spatial.source.actorId === fact.control.actorId &&
            movement.spatial.caller?.order?.commandContext?.execution.commandId ===
              fact.control.command?.execution?.commandId && movement.tick < openingPrefixTick &&
            movement.spatial.phase === "arrived" && movement.spatial.actualTile?.x === fact.control.command.tileVec3.x &&
            movement.spatial.actualTile?.y === fact.control.command.tileVec3.y));
      const hostileAttackControl = preset.controls?.find((control) => control.id === "attack-hostile-transit-2010");
      const hostileAttackTargetsHome = hostileAttackControl?.action.kind === "attack" &&
        hostileAttackControl.action.targetFixtureActorId === "original-home";
      const hostileAttack = hostileAttackTargetsHome && context.opponent?.facts.some((fact) => fact.kind === "preset_control" &&
        fact.control.id === "attack-hostile-transit-2010" && fact.control.phase === "applied" &&
        fact.tick > openingPrefixTick);
      const hostileDamage = context.facts.some((fact) => fact.kind === "native_damage" &&
        fact.tick > openingPrefixTick && fact.damage.target.actorId === context.roles["original-home"] &&
        fact.damage.initiator?.actorId === context.roles["hostile-transit"] && fact.damage.amount > 0);
      if (!hostileStaging) failures.push("fortification_opening_hostile_stage_not_physically_proven");
      if (!hostileAttack) failures.push("fortification_opening_hostile_attack_not_applied_after_prefix");
      if (!hostileDamage) failures.push("fortification_opening_hostile_damage_not_applied_after_prefix");
    }
    // Worker traffic exercises every prefix. A military actor proves the opening once, then
    // returns to its AI mission instead of being repeatedly commandeered by the test harness.
    for (const [index, node] of nodes.entries()) {
      const after = node.completionTick;
      const through = nodes[index + 1]?.completionTick ?? context.capture?.frontiers?.latestTick ?? 0;
      for (const role of transitRoles ?? ["worker-transit", "army-transit"]) {
        if (role === "army-transit" && index > 0) continue;
        const commands = preset.controls?.filter((control) => control.producerFixtureActorId === role &&
          control.requestTick > after && control.applicationTick < through) ?? [];
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
