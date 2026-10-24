import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import type { RuntimePresetWorldV1 } from "./skirmish-ai-runtime-preset-world";
import { nativeCompletedPlacements, nativeInitialFieldSites } from "./skirmish-ai-native-construction-evidence";
import { evaluateRuntimePlacementPrefixes } from "./skirmish-ai-placement-prefix-evaluation";
import { evaluateFieldPlacementWorld } from "./skirmish-ai-field-placement-evaluation";
import { runtimeControlTransitFailures } from "./skirmish-ai-runtime-control-transit";

/** Every build prefix uses fresh native clearance; physical transit and useful production/income remain separate checks. */
export function evaluateNativePlacement(
  id: string, branch: string, context: ReturnType<typeof nativeScenarioContext>, preset: RuntimePresetWorldV1
): string[] {
  const failures: string[] = [], placed = nativeCompletedPlacements(context);
  if (id === "PLACE-01" || id === "PLACE-02" && branch !== "both_exposed") {
    failures.push(...evaluateFieldPlacementWorld(context.result, id === "PLACE-01" && branch === "room" ? 2 : 1));
    if (branch === "constrained" && nativeInitialFieldSites(context)?.length !== 1)
      failures.push("placement_constrained_world_does_not_have_exactly_one_native_unreserved_field_site");
  }
  if (id === "PLACE-02") {
    const fields = placed.filter((placement) => placement.value.site.canonicalObjectName === "Field");
    for (const field of fields) {
      const input = field.selected.decision.input?.observation;
      const exposed = input?.actors.filter((actor) => actor.relation === "enemy" && actor.visibility === "visible" &&
        actor.logicalPosition.status === "known" && actor.combatProfile?.status === "known").some((actor) => {
        if (actor.logicalPosition.status !== "known" || actor.combatProfile?.status !== "known") return false;
        const position = actor.logicalPosition.value;
        return field.value.footprint?.some((tile) => actor.combatProfile?.status === "known" &&
          actor.combatProfile.value.attacks.some((attack) => attack.targetDomains.includes("ground") &&
            Math.hypot(tile.x - position.x, tile.y - position.y) <= attack.range + attack.highGroundRangeBonus));
      });
      if (exposed) failures.push("placement_field_inside_observed_native_enemy_weapon_coverage");
    }
    if (branch !== "safe" && !context.frames.some((frame) => frame.decision.input?.observation?.actors.some((actor) =>
      actor.actorId === context.roles["outer-threat"] && actor.visibility === "visible")))
      failures.push("placement_exposed_outer_threat_not_fairly_observed");
    if (branch === "both_exposed" && !context.frames.some((frame) => frame.decision.decisions.some((decision) =>
      decision.intent.kind === "construct" && decision.intent.objectName === "Field" && decision.outcome === "rejected") ||
      frame.decision.missionState?.recoveryEpisodes.some((episode) => JSON.stringify(episode).includes("placement"))))
      failures.push("placement_both_exposed_has_no_explicit_constrained_decision");
  }
  if (id === "PLACE-03") {
    if (placed.length < 3 || new Set(placed.map((placement) => placement.value.site.canonicalObjectName)).size < 2)
      failures.push("placement_competing_useful_building_layout_missing");
    if (branch === "concurrent" && !context.frames.some((frame) =>
      frame.decision.decisions.filter((decision) => decision.intent.kind === "construct").length >= 2))
      failures.push("placement_actual_competing_proposals_missing");
    if (!context.capture?.facts.some((fact) => fact.kind === "spatial_authority" && fact.spatial.kind === "spawn" &&
      fact.spatial.producer.actorId === context.roles["ready-producer"] && fact.spatial.tile))
      failures.push("placement_native_production_exit_spawn_missing");
    if (branch === "loss" && !context.result.perturbations.some((event) => event.id === "loss-perimeter-wall" &&
      event.affectedActorId === context.roles["perimeter-wall"])) failures.push("placement_original_obstacle_loss_missing");
  }
  if (branch !== "both_exposed") failures.push(...evaluateRuntimePlacementPrefixes(preset, context.result, id === "PLACE-03" ? 3 : 1));
  failures.push(...nativeProtectedTransits(context, preset));
  return [...new Set(failures)];
}

/** Retain each declared original probe's stamped command and actual endpoint. A route query alone never suffices. */
export function nativeProtectedTransits(context: ReturnType<typeof nativeScenarioContext>, preset: RuntimePresetWorldV1) {
  const capture = context.capture;
  if (!capture) return ["placement_native_transit_history_missing"];
  const failures: string[] = [];
  for (const role of ["worker-transit", "army-transit"]) {
    const commands = preset.controls?.filter((control) => control.producerFixtureActorId === role && control.action.kind === "move") ?? [];
    if (!commands.length || commands.some((command) => runtimeControlTransitFailures(
      capture, command.id, capture.frontiers?.latestTick ?? 0, "arrive").length))
      failures.push(`placement_protected_physical_transit_incomplete:${role}`);
  }
  return failures;
}
