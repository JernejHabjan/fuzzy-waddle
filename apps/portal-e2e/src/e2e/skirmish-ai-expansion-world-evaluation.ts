import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import type { ExpansionBranch } from "./skirmish-ai-expansion-branch";
import { runtimeClosedHistoryFailures } from "./skirmish-ai-runtime-closed-history";
import { hasNativeSourceDelivery } from "./skirmish-ai-source-delivery";
import { expansionServiceFailures } from "./skirmish-ai-expansion-service-evaluation";
import { expansionPressureFailures } from "./skirmish-ai-expansion-pressure-evaluation";

/** Native land owner outcomes, including fair premises, real paid construction and useful delivered service. */
export function evaluateExpansionWorld(
  branch: ExpansionBranch,
  result: Pick<RuntimeVariantResultV1, "productionCapture" | "presetCreatedActorIds" | "aiFaction">,
  human: AiRuntimeProductionCaptureV1 | undefined
): string[] {
  const capture = result.productionCapture;
  const failures = [...runtimeClosedHistoryFailures(capture, 3000), ...runtimeClosedHistoryFailures(human, 3000)];
  if (!capture || !human || failures.length) return failures;
  const setup = capture.setup, roles = result.presetCreatedActorIds;
  if (capture.playerNumber !== 2 || human.playerNumber !== 1 || setup?.tick !== 0) return ["expansion_native_setup_missing"];
  const sourceId = roles["safe-source"], unsafeId = roles["unsafe-source"], towerId = roles["unsafe-defense"];
  const homeId = roles["original-home"], mainName = result.aiFaction === "Tivara" ? "Sandhold" : "FrostForge";
  const serviceNames = new Set([mainName, "WorkMill"]);
  const local = Object.entries(roles).filter(([role]) => role.startsWith("inherited-source-")).map(([, id]) =>
    setup.actors.find((actor) => actor.actorId === id)
  );
  const safe = setup.actors.find((actor) => actor.actorId === sourceId);
  const unsafe = setup.actors.find((actor) => actor.actorId === unsafeId);
  const initialField = setup.actors.find((actor) => actor.actorId === roles["ready-field"]);
  if (local.length !== 8 || local.some((actor) => actor?.definition.resourceSource?.currentResources !== 0) ||
      initialField?.definition.resourceSource?.currentResources !== 0 ||
      !safe || !unsafe || (safe.definition.resourceSource?.currentResources ?? 0) <= 0 ||
      (unsafe.definition.resourceSource?.currentResources ?? 0) <= (safe.definition.resourceSource?.currentResources ?? Infinity)) {
    failures.push("expansion_depletion_or_richer_alternative_premise_missing");
  }
  const decisions = capture.facts.flatMap((fact) => fact.kind === "decision_selected" && fact.tick <= 3000 ? [fact] : []);
  const fair = decisions.find((fact) => {
    const input = fact.decision.input;
    return input?.observation?.tick === fact.tick && !input.snapshotRestoreInProgress && !input.gaps.length &&
      [sourceId, unsafeId, towerId].every((id) => input.observation?.actors.some((actor) =>
        actor.actorId === id && actor.visibility === "visible" && actor.logicalPosition.status === "known"
      ));
  });
  const source = fair?.decision.input?.observation?.actors.find((actor) => actor.actorId === sourceId);
  const tower = fair?.decision.input?.observation?.actors.find((actor) => actor.actorId === towerId);
  const dangerousSource = fair?.decision.input?.observation?.actors.find((actor) => actor.actorId === unsafeId);
  const home = fair?.decision.input?.observation?.actors.find((actor) => actor.actorId === homeId);
  if (source?.logicalPosition.status !== "known" || tower?.logicalPosition.status !== "known" ||
      dangerousSource?.logicalPosition.status !== "known" || home?.logicalPosition.status !== "known" ||
      tower.combatProfile?.status !== "known") return [...failures, "expansion_fair_remote_choices_or_real_weapon_threat_missing"];
  const sourcePosition = source.logicalPosition.value, homePosition = home.logicalPosition.value;
  const towerPosition = tower.logicalPosition.value, dangerousPosition = dangerousSource.logicalPosition.value;
  const towerProfile = tower.combatProfile.value;
  if (!towerProfile.attacks.some((attack) => attack.targetDomains.includes("ground") && attack.damage > 0 &&
    Math.hypot(towerPosition.x - dangerousPosition.x, towerPosition.y - dangerousPosition.y) <= attack.range
  )) return [...failures, "expansion_richer_source_has_no_real_observed_weapon_risk"];
  const distance = (point: { x: number; y: number }) =>
    Math.abs(point.x - sourcePosition.x) + Math.abs(point.y - sourcePosition.y);
  const accepted = decisions.flatMap((fact) => fact.decision.acceptedIntents.flatMap((intent) =>
    intent.kind === "construct" && serviceNames.has(intent.objectName) ? [{ fact, intent }] : []
  ));
  const placements = capture.facts.flatMap((fact) => fact.kind === "spatial_authority" && fact.spatial.kind === "placement" &&
    fact.tick <= 3000 && serviceNames.has(fact.spatial.site.canonicalObjectName ?? "") ? [{ fact, value: fact.spatial }] : []
  );
  let productive = 0;
  for (const { fact, value } of placements) {
    const id = value.site.actorId, execution = value.command.execution;
    const applied = capture.facts.some((entry) => entry.kind === "outcome" && entry.outcome.kind === "applied" &&
      entry.outcome.commandId === execution?.commandId && entry.outcome.worldLinkIds.includes(id ?? "")
    );
    if (branch === "served" && execution?.source === "ai" && applied && distance(value.command.tileVec3) <= 12) {
      failures.push("expansion_duplicate_deposit_at_already_served_resource");
    }
    const selected = accepted.find((entry) => entry.intent.effectId === execution?.effectId && entry.fact.sequence < fact.sequence);
    if (!id || !execution || !selected || execution.source !== "ai" || Object.values(roles).includes(id)) continue;
    if (!value.legal || !value.footprint?.length || value.gaps.length || !value.sceneActive ||
        value.snapshotRestoreInProgress || value.clockTick !== fact.tick) {
      failures.push("expansion_native_placement_boundary_invalid");
      continue;
    }
    const nativeTower = human.frontiers?.intervals.find((interval) =>
      interval.closedFromTick <= fact.tick && interval.closedThroughTick >= fact.tick
    )?.actors.find((actor) => actor.identity.actorId === towerId && actor.identity.active && actor.identity.alive);
    const range = Math.max(...towerProfile.attacks.filter((attack) => attack.targetDomains.includes("ground"))
      .map((attack) => attack.range + attack.highGroundRangeBonus));
    if (nativeTower && value.footprint.some((tile) => Math.hypot(tile.x - towerPosition.x, tile.y - towerPosition.y) <= range + 1)) {
      failures.push("expansion_committed_inside_live_observed_enemy_weapon_range");
    }
    if (distance(value.command.tileVec3) > 12) continue;
    if (branch === "served") {
      failures.push("expansion_duplicate_deposit_at_already_served_resource");
      continue;
    }
    if (distance(value.command.tileVec3) >= distance(homePosition)) failures.push("expansion_does_not_improve_service_distance");
    const builderId = selected.intent.builderIds[0];
    const input = selected.fact.decision.input;
    const builder = input?.observation?.actors.find((actor) => actor.actorId === builderId);
    if (!input || input.gaps.length || input.snapshotRestoreInProgress || input.observation?.tick !== selected.fact.tick ||
        !builderId || !value.command.actorIds.includes(builderId) || builder?.relation !== "self" ||
        builder.carriedResourceAmount !== 0 || builder.resourceTransferInFlight !== false || builder.activeOrder?.status !== "known" ||
        (builder.activeOrder.value !== null && !["Gather", "Move"].includes(builder.activeOrder.value.orderType))) {
      failures.push("expansion_builder_busy_or_native_selection_unavailable");
      continue;
    }
    const serviceFailures = expansionServiceFailures(result, id, execution.commandId, builderId);
    failures.push(...serviceFailures);
    if (!serviceFailures.length) productive++;
  }
  if ((branch === "expand" || branch === "pressure_withdrawn") && productive === 0) {
    failures.push("expansion_has_no_productive_new_safe_deposit");
  }
  if (branch === "served") {
    const existingId = roles["existing-expansion"];
    if (capture.frontiers?.intervals.some((interval) => !interval.actors.some(({ identity }) => identity.actorId === existingId &&
      identity.active && identity.alive && identity.finished && identity.indexed
    ))) failures.push("expansion_served_control_original_service_lost");
    if (!existingId || !setup.actors.some((actor) => actor.actorId === existingId &&
      actor.definition.name !== undefined && serviceNames.has(actor.definition.name)) ||
        !sourceId || !hasNativeSourceDelivery(capture.facts, { sourceActorId: sourceId, sourceOwner: null, playerNumber: 2,
          resourceType: ResourceType.Wood, fromTick: 0, throughTick: 3000, depositActorId: existingId })) {
      failures.push("expansion_served_control_has_no_native_existing_deposit_delivery");
    }
  }
  failures.push(...expansionPressureFailures(branch, result, human));
  return [...new Set(failures)];
}
