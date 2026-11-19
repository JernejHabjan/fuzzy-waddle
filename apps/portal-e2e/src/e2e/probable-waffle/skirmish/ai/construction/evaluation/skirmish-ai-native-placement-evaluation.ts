import type { nativeScenarioContext } from "../../contracts/skirmish-ai-native-scenario-context";
import type { RuntimePresetWorld } from "../../setup/skirmish-ai-runtime-preset-world";
import { nativeCompletedPlacements, nativeInitialFieldSites } from "./skirmish-ai-native-construction-evidence";
import { evaluateRuntimePlacementPrefixes } from "./skirmish-ai-placement-prefix-evaluation";
import { evaluateFieldPlacementWorld } from "./skirmish-ai-field-placement-evaluation";
import { runtimeControlTransitFailures } from "../../navigation/skirmish-ai-runtime-control-transit";
import { isWithinObservedGroundWeaponRange } from "../../combat/effects/skirmish-ai-native-weapon-range";

/** Every build prefix uses fresh native clearance; physical transit and useful production/income remain separate checks. */
export function evaluateNativePlacement(
  id: string,
  branch: string,
  context: ReturnType<typeof nativeScenarioContext>,
  preset: RuntimePresetWorld
): string[] {
  const failures: string[] = [],
    placed = nativeCompletedPlacements(context);
  if (id === "PLACE-01" || (id === "PLACE-02" && branch !== "both_exposed")) {
    const history = context.capture?.frontiers;
    const through = history?.closedThroughTick ?? 0;
    failures.push(
      ...evaluateFieldPlacementWorld(
        context.result,
        id === "PLACE-01" && branch === "room" ? 2 : 1,
        through,
        through === history?.latestTick ? undefined : (history?.latestTick ?? undefined)
      )
    );
    if (branch === "constrained" && nativeInitialFieldSites(context)?.length !== 1)
      failures.push("placement_constrained_world_does_not_have_exactly_one_native_unreserved_field_site");
  }
  if (id === "PLACE-02") {
    const fields = placed.filter((placement) => placement.value.site.canonicalObjectName === "Field");
    if (
      fields.some((field) =>
        field.value.footprint?.some((tile) =>
          visibleGroundThreatCovers(field.selected, { ...tile, z: field.value.command.tileVec3.z })
        )
      )
    )
      failures.push("placement_field_inside_observed_native_enemy_weapon_coverage");
    if (
      branch !== "safe" &&
      !context.frames.some((frame) =>
        frame.decision.input?.observation?.actors.some(
          (actor) => actor.actorId === context.roles["outer-threat"] && actor.visibility === "visible"
        )
      )
    )
      failures.push("placement_exposed_outer_threat_not_fairly_observed");
    if (
      branch === "both_exposed" &&
      !context.frames.some(
        (frame) =>
          frame.decision.decisions.some(
            (decision) =>
              decision.intent.kind === "construct" &&
              decision.intent.objectName === "Field" &&
              decision.outcome === "rejected"
          ) ||
          frame.decision.missionState?.recoveryEpisodes.some((episode) => JSON.stringify(episode).includes("placement"))
      )
    )
      failures.push("placement_both_exposed_has_no_explicit_constrained_decision");
  }
  if (id === "PLACE-03") {
    const completions = placed.toSorted((a, b) => a.completionTick - b.completionTick);
    const third = completions[2];
    const firstType = completions[0]?.value.site.canonicalObjectName;
    const differentType = completions.find((placement) => placement.value.site.canonicalObjectName !== firstType);
    if (!third || !differentType) failures.push("placement_competing_useful_building_layout_missing");
    else failures.push(...postLayoutTransits(context, Math.max(third.completionTick, differentType.completionTick)));
    if (
      branch === "concurrent" &&
      !context.frames.some(
        (frame) => frame.decision.decisions.filter((decision) => decision.intent.kind === "construct").length >= 2
      )
    )
      failures.push("placement_actual_competing_proposals_missing");
    if (
      !context.capture?.facts.some(
        (fact) =>
          fact.kind === "spatial_authority" &&
          fact.spatial.kind === "spawn" &&
          fact.spatial.producer.actorId === context.roles["ready-producer"] &&
          fact.spatial.tile
      )
    )
      failures.push("placement_native_production_exit_spawn_missing");
    if (
      branch === "loss" &&
      !context.result.perturbations.some(
        (event) => event.id === "loss-perimeter-wall" && event.affectedActorId === context.roles["perimeter-wall"]
      )
    )
      failures.push("placement_original_obstacle_loss_missing");
  }
  if (branch !== "both_exposed")
    failures.push(...evaluateRuntimePlacementPrefixes(preset, context.result, id === "PLACE-03" ? 3 : 1));
  const opening =
    id === "PLACE-03"
      ? { ...preset, controls: preset.controls?.filter((control) => control.requestTick === 1) }
      : preset;
  failures.push(...nativeProtectedTransits(context, opening));
  return [...new Set(failures)];
}

/** Use the weapon profile actually permitted at the construction decision, including native range. */
export function visibleGroundThreatCovers(
  frame: ReturnType<typeof nativeScenarioContext>["frames"][number],
  tile: { readonly x: number; readonly y: number; readonly z: number },
  threatId?: string
): boolean {
  return (
    frame.decision.input?.observation?.actors.some(
      (actor) =>
        actor.relation === "enemy" &&
        actor.visibility === "visible" &&
        (!threatId || actor.actorId === threatId) &&
        actor.logicalPosition.status === "known" &&
        actor.combatProfile?.status === "known" &&
        isWithinObservedGroundWeaponRange(actor.logicalPosition.value, tile, actor.combatProfile.value.attacks)
    ) ?? false
  );
}

/** A late order only proves a crossing when it starts on the declared side of the finished layout. */
function postLayoutTransits(context: ReturnType<typeof nativeScenarioContext>, layoutReadyTick: number): string[] {
  const capture = context.capture;
  const routes = context.result.productionPreset?.placementBaseline?.routes;
  if (!capture || !routes || !Number.isFinite(layoutReadyTick)) return ["placement_post_layout_scope_missing"];
  const bindings = [
    { role: "worker-transit", route: routes.find((entry) => entry.declaration.id === "worker-service") },
    {
      role: "army-transit",
      route: routes.find((entry) => ["production-army", "army-transit"].includes(entry.declaration.id))
    }
  ];
  return bindings.flatMap(({ role, route }) => {
    const controlId = "post-layout-cross-" + role;
    const applied = capture.facts.find(
      (fact) => fact.kind === "preset_control" && fact.control.id === controlId && fact.control.phase === "applied"
    );
    if (
      !route ||
      !applied ||
      applied.kind !== "preset_control" ||
      applied.tick <= layoutReadyTick ||
      applied.control.actorId !== context.role(role) ||
      applied.control.command?.type !== "MOVE" ||
      applied.control.command.tileVec3.x !== route.toTile.x ||
      applied.control.command.tileVec3.y !== route.toTile.y
    )
      return ["placement_post_layout_crossing_not_bound:" + role];
    return runtimeControlTransitFailures(
      capture,
      controlId,
      capture.frontiers?.closedThroughTick ?? 0,
      "arrive",
      route.fromTile
    );
  });
}

/** Retain each declared original probe's stamped command and actual endpoint. A route query alone never suffices. */
export function nativeProtectedTransits(
  context: ReturnType<typeof nativeScenarioContext>,
  preset: RuntimePresetWorld,
  requiredRoles: string[] = ["worker-transit", "army-transit"],
  allowInterruptedAttempts = false
) {
  const capture = context.capture;
  if (!capture) return ["placement_native_transit_history_missing"];
  const failures: string[] = [];
  for (const role of requiredRoles) {
    const commands =
      preset.controls?.filter((control) => control.producerFixtureActorId === role && control.action.kind === "move") ??
      [];
    const arrivals = commands.filter(
      (command) =>
        !runtimeControlTransitFailures(capture, command.id, capture.frontiers?.closedThroughTick ?? 0, "arrive").length
    );
    if (!commands.length || (allowInterruptedAttempts ? !arrivals.length : arrivals.length !== commands.length))
      failures.push(`placement_protected_physical_transit_incomplete:${role}`);
  }
  return failures;
}
