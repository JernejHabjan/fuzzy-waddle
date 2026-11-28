import type { nativeScenarioContext } from "../../contracts/skirmish-ai-native-scenario-context";
import type { RuntimePresetWorld } from "../../setup/skirmish-ai-runtime-preset-world";
import { nativeCompletedPlacements, nativeInitialFieldSites } from "./skirmish-ai-native-construction-evidence";
import { evaluateRuntimePlacementPrefixes } from "./skirmish-ai-placement-prefix-evaluation";
import { evaluateFieldPlacementWorld } from "./skirmish-ai-field-placement-evaluation";
import { hasNativeFieldFoodDelivery } from "../../economy/policy/skirmish-ai-field-food-delivery";
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
  if (id === "PLACE-01") {
    const history = context.capture?.frontiers;
    const through = history?.closedThroughTick ?? 0;
    const anchor =
      branch === "room"
        ? context.capture?.setup?.actors.find((actor) => actor.actorId === context.roles["field-anchor"])
        : undefined;
    const footprint = anchor?.footprint;
    const alignmentAnchors = footprint?.length
      ? [
          {
            x: (Math.min(...footprint.map((tile) => tile.x)) + Math.max(...footprint.map((tile) => tile.x))) / 2,
            y: (Math.min(...footprint.map((tile) => tile.y)) + Math.max(...footprint.map((tile) => tile.y))) / 2
          }
        ]
      : [];
    if (branch === "room" && alignmentAnchors.length !== 1) failures.push("placement_aligned_field_anchor_missing");
    failures.push(
      ...evaluateFieldPlacementWorld(
        context.result,
        branch === "room" ? 2 : 1,
        through,
        through === history?.latestTick ? undefined : (history?.latestTick ?? undefined),
        alignmentAnchors
      )
    );
    if (branch === "constrained" && nativeInitialFieldSites(context)?.length !== 1)
      failures.push("placement_constrained_world_does_not_have_exactly_one_native_unreserved_field_site");
  }
  if (id === "PLACE-02") {
    const fields = placed.filter((placement) => placement.value.site.canonicalObjectName === "Field");
    const first = fields[0];
    if (
      branch !== "both_exposed" &&
      (!first ||
        !context.capture ||
        !hasNativeFieldFoodDelivery(
          context.capture.facts,
          first.siteId,
          first.completionTick,
          context.capture.playerNumber
        ))
    )
      failures.push("placement_selected_field_has_no_native_first_harvest");
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
    if (branch === "both_exposed") {
      const stillNeeded = context.frames.some((frame) =>
        frame.decision.economyProduction.demands.some(
          (demand) =>
            demand.capabilityOrRole === "Field" &&
            demand.desired > 0 &&
            !demand.satisfiedActorIds.length &&
            !demand.constructingIds.length
        )
      );
      const built = context.facts.some(
        (fact) =>
          fact.kind === "spatial_authority" &&
          fact.spatial.kind === "placement" &&
          fact.spatial.site.canonicalObjectName === "Field" &&
          fact.spatial.legal &&
          fact.spatial.command.execution?.source === "ai"
      );
      if (!stillNeeded || built) failures.push("placement_both_exposed_did_not_leave_unsafe_field_unbuilt");
    }
    // The native first delivery proves the selected field's worker access.
    return failures;
  }
  if (id === "PLACE-03") {
    const completions = placed.toSorted((a, b) => a.completionTick - b.completionTick),
      measuredLayout =
        branch === "layout" ? placed.toSorted((a, b) => a.fact.tick - b.fact.tick).slice(0, 2) : completions;
    const layoutTail = branch === "layout" ? measuredLayout[1] : measuredLayout[2];
    const firstType = measuredLayout[0]?.value.site.canonicalObjectName;
    const differentType = measuredLayout.find((placement) => placement.value.site.canonicalObjectName !== firstType);
    const requiredLayoutSize = branch === "layout" ? 2 : 3;
    const requiresDifferentTypes = branch !== "concurrent";
    const layoutCompleteTick =
      layoutTail && measuredLayout.length >= requiredLayoutSize && (!requiresDifferentTypes || differentType)
        ? Math.max(layoutTail.completionTick, differentType?.completionTick ?? layoutTail.completionTick)
        : Number.POSITIVE_INFINITY;
    if (measuredLayout.length < requiredLayoutSize || (requiresDifferentTypes && !differentType))
      failures.push("placement_competing_useful_building_layout_missing");
    else
      failures.push(
        ...postLayoutTransits(
          context,
          preset,
          layoutCompleteTick,
          ["layout", "concurrent"].includes(branch) ? ["worker-transit"] : undefined
        )
      );
    const routeObservedPlacements = completions.slice(0, 2);
    if (
      branch !== "layout" &&
      (routeObservedPlacements.length < 2 ||
        routeObservedPlacements.some((placement) => !observesActiveArmyRoute(placement, context, preset, branch)))
    )
      failures.push("placement_active_army_route_not_observed_at_first_two_decisions");
    if (
      branch === "concurrent" &&
      !context.frames.some(
        (frame) => frame.decision.decisions.filter((decision) => decision.intent.kind === "construct").length >= 2
      )
    )
      failures.push("placement_actual_competing_proposals_missing");
    const producerName = preset.actors.find((actor) => actor.fixtureActorId === "ready-producer")?.actorName;
    const producerSpawn = context.capture?.facts.some((fact) => {
      if (
        fact.kind !== "spatial_authority" ||
        fact.spatial.kind !== "spawn" ||
        fact.tick <= layoutCompleteTick ||
        !producerName ||
        fact.spatial.producer.canonicalObjectName !== producerName ||
        fact.spatial.producer.playerNumber !== context.capture?.playerNumber ||
        !fact.spatial.tile ||
        fact.spatial.gaps.length
      )
        return false;
      const spawn = fact.spatial;
      return context.capture?.facts.some(
        (entry) =>
          entry.kind === "queue_completion" &&
          entry.tick > layoutCompleteTick &&
          entry.completion.phase === "after" &&
          entry.completion.actorId === spawn.producer.actorId &&
          entry.completion.item?.itemId === spawn.item?.itemId &&
          entry.completion.createdActorInProducerScene === true &&
          entry.completion.originatingCommandContext?.execution.source === "ai" &&
          entry.completion.createdActor?.playerNumber === context.capture?.playerNumber &&
          entry.completion.createdActor?.active === true &&
          entry.completion.createdActor?.alive === true &&
          entry.completion.createdActor?.indexed === true
      );
    });
    if (!producerSpawn) failures.push("placement_native_production_exit_spawn_missing");
    if (
      branch === "loss" &&
      !context.result.perturbations.some(
        (event) => event.id === "loss-perimeter-wall" && event.affectedActorId === context.roles["perimeter-wall"]
      )
    )
      failures.push("placement_original_obstacle_loss_missing");
  }
  // Non-layout PLACE-03 variants check route clearance while the probe's move order is
  // still present in the first two construction decisions; later construction is covered
  // by the separate physical post-layout crossings after strategic reassignment.
  if (branch !== "both_exposed")
    failures.push(
      ...evaluateRuntimePlacementPrefixes(
        preset,
        context.result,
        id === "PLACE-03" ? 2 : 1,
        id === "PLACE-03" ? 2 : undefined
      )
    );
  if (!(id === "PLACE-03" && branch === "layout"))
    failures.push(
      ...nativeProtectedTransits(
        context,
        preset,
        id === "PLACE-03" && branch === "concurrent" ? ["worker-transit"] : undefined
      )
    );
  return [...new Set(failures)];
}

/** A live own-unit Move must target the protected corridor when construction evaluates it. */
function observesActiveArmyRoute(
  placement: ReturnType<typeof nativeCompletedPlacements>[number],
  context: ReturnType<typeof nativeScenarioContext>,
  preset: RuntimePresetWorld,
  branch: string
): boolean {
  const actorId = context.roles["scout-probe"],
    routeId = branch === "layout" ? "worker-service" : branch === "completion" ? "retreat" : "production-army",
    route = context.result.productionPreset?.placementBaseline?.routes.find(
      (entry) => entry.declaration.id === routeId
    );
  if (!actorId || !route) return false;
  const observation = placement.selected.decision.input?.observation,
    actor = observation?.actors.find((entry) => entry.actorId === actorId),
    order = actor?.activeOrder,
    current = actor?.logicalPosition;
  if (order?.status !== "known" || order.value?.orderType !== "Move" || order.value.targetActorId !== null)
    return false;
  if (current?.status !== "known" || !order.value.targetPosition) return false;
  const path = route.path;
  const onRoute = (position: { readonly x: number; readonly y: number }) =>
    !!path?.some((tile) => Math.abs(position.x - tile.x) <= 1 && Math.abs(position.y - tile.y) <= 1);
  return onRoute(order.value.targetPosition);
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
function postLayoutTransits(
  context: ReturnType<typeof nativeScenarioContext>,
  preset: RuntimePresetWorld,
  layoutReadyTick: number,
  requiredRoles: readonly string[] = ["worker-transit", "army-transit"]
): string[] {
  const capture = context.capture;
  const routes = context.result.productionPreset?.placementBaseline?.routes;
  if (!capture || !routes || !Number.isFinite(layoutReadyTick)) return ["placement_post_layout_scope_missing"];
  const bindings = [
    { role: "worker-transit", route: routes.find((entry) => entry.declaration.id === "worker-service") },
    {
      role: "army-transit",
      route: routes.find((entry) => ["production-army", "army-transit"].includes(entry.declaration.id))
    }
  ].filter((binding) => requiredRoles.includes(binding.role));
  return bindings.flatMap(({ role, route }) => {
    const controlId = "post-layout-cross-" + role;
    const owner = preset.actors.find((actor) => actor.fixtureActorId === role)?.owner;
    const actorCapture =
      owner === capture.playerNumber
        ? capture
        : owner === context.opponent?.playerNumber
          ? context.opponent
          : undefined;
    const applied = actorCapture?.facts.find(
      (fact) => fact.kind === "preset_control" && fact.control.id === controlId && fact.control.phase === "applied"
    );
    if (
      !route ||
      !actorCapture ||
      !applied ||
      applied.kind !== "preset_control" ||
      applied.tick <= layoutReadyTick ||
      applied.control.actorId !== context.role(role) ||
      applied.control.command?.type !== "MOVE" ||
      applied.control.command.tileVec3.x !== route.toTile.x ||
      applied.control.command.tileVec3.y !== route.toTile.y
    )
      return ["placement_post_layout_crossing_not_bound:" + role];
    return runtimeControlTransitFailures(actorCapture, controlId, capture.frontiers?.closedThroughTick ?? 0, "arrive");
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
    const owner = preset.actors.find((actor) => actor.fixtureActorId === role)?.owner,
      actorCapture =
        owner === capture.playerNumber
          ? capture
          : owner === context.opponent?.playerNumber
            ? context.opponent
            : undefined;
    const commands =
      preset.controls?.filter((control) => control.producerFixtureActorId === role && control.action.kind === "move") ??
      [];
    if (!actorCapture) {
      failures.push(`placement_transit_owner_capture_missing:${role}`);
      continue;
    }
    const arrivals = commands.filter(
      (command) =>
        !runtimeControlTransitFailures(
          actorCapture,
          command.id,
          actorCapture.frontiers?.closedThroughTick ?? 0,
          "arrive"
        ).length
    );
    if (!commands.length || (allowInterruptedAttempts ? !arrivals.length : arrivals.length !== commands.length))
      failures.push(`placement_protected_physical_transit_incomplete:${role}`);
  }
  return failures;
}
