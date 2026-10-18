import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import type { ExpansionBranch } from "./skirmish-ai-expansion-branch";
import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import { runtimeControlTransitFailures } from "./skirmish-ai-runtime-control-transit";
import { normalizeRuntimeMovement } from "./skirmish-ai-runtime-movement-normalization";
import { expansionServiceFailures } from "./skirmish-ai-expansion-service-evaluation";

/** Actual scripted attack, fair danger and damaged surviving home precede suppression; full acceptance also needs a positive safe pair. */
export function expansionPressureFailures(
  branch: ExpansionBranch,
  result: Pick<RuntimeVariantResultV1, "productionCapture" | "presetCreatedActorIds">,
  human: AiRuntimeProductionCaptureV1
): string[] {
  if (branch !== "home_pressure" && branch !== "pressure_withdrawn") return [];
  const capture = result.productionCapture, homeId = result.presetCreatedActorIds["original-home"];
  const raiderId = result.presetCreatedActorIds["home-raider"], failures: string[] = [];
  if (!capture || !homeId || !raiderId) return ["expansion_pressure_original_roles_missing"];
  const source = capture.facts.flatMap((fact) => fact.kind === "decision_selected"
    ? fact.decision.input?.observation?.actors.filter((actor) =>
      actor.actorId === result.presetCreatedActorIds["safe-source"] && actor.logicalPosition.status === "known") ?? [] : []
  )[0];
  if (source?.logicalPosition.status !== "known") return ["expansion_pressure_fair_remote_source_missing"];
  const sourcePosition = source.logicalPosition.value;
  const homeName = capture.setup?.actors.find((actor) => actor.actorId === homeId)?.definition.name;
  const remoteService = (intent: AiIntentV1) => intent.kind === "construct" &&
    (intent.objectName === "WorkMill" || intent.objectName === homeName) &&
    Math.abs(intent.logicalPosition.x - sourcePosition.x) + Math.abs(intent.logicalPosition.y - sourcePosition.y) <= 12;
  const attack = human.facts.find((fact) => fact.kind === "preset_control" && fact.control.id === "attack-original-home" &&
    fact.control.phase === "applied"
  );
  if (attack?.kind !== "preset_control" || attack.control.command?.type !== "ACTOR_ACTION" ||
      attack.control.actorId !== raiderId || attack.control.command.execution?.source !== "human" ||
      attack.control.command.playerNumber !== 1 || attack.control.command.actorIds.length !== 1 ||
      attack.control.command.actorIds[0] !== raiderId ||
      attack.control.command.orderType !== "Attack" || !attack.control.command.targetObjectIds?.includes(homeId) ||
      !attack.control.outcomes.some((outcome) => outcome.kind === "applied" && outcome.reason === "applied" &&
        outcome.commandId === attack.control.command?.execution?.commandId)) {
    failures.push("expansion_pressure_native_attack_not_applied");
  }
  const pressured = capture.facts.flatMap((fact) => {
    if (fact.kind !== "decision_selected" || fact.tick > 3000) return [];
    const input = fact.decision.input, observation = input?.observation;
    if (!input || input.gaps.length || input.snapshotRestoreInProgress || observation?.tick !== fact.tick) return [];
    const raider = observation?.actors.find((actor) => actor.actorId === raiderId && actor.visibility === "visible");
    const home = observation?.actors.find((actor) => actor.actorId === homeId && actor.relation === "self");
    if (raider?.logicalPosition.status !== "known" || home?.logicalPosition.status !== "known" ||
        raider.combatProfile?.status !== "known" || !raider.combatProfile.value.attacks.length ||
        Math.abs(raider.logicalPosition.value.x - home.logicalPosition.value.x) +
          Math.abs(raider.logicalPosition.value.y - home.logicalPosition.value.y) > 12) return [];
    return [{ fact, home }];
  });
  if (!pressured.length) failures.push("expansion_pressure_has_no_fair_danger_window");
  if (!pressured.some(({ home }) => home.healthPermille?.status === "known" && home.healthPermille.value < 1000)) {
    failures.push("expansion_pressure_original_home_not_actually_damaged");
  }
  if (pressured.some(({ fact }) => fact.decision.acceptedIntents.some(remoteService))) {
    failures.push("expansion_spent_on_overextension_during_home_pressure");
  }
  if (capture.frontiers?.intervals.some((interval) => !interval.actors.some(({ identity }) =>
    identity.actorId === homeId && identity.active && identity.alive && identity.finished && identity.indexed
  ))) failures.push("expansion_pressure_original_home_lost");
  if (branch === "pressure_withdrawn") {
    const withdrawal = human.facts.find((fact) => fact.kind === "preset_control" &&
      fact.control.id === "withdraw-home-pressure" && fact.control.phase !== "requested"
    );
    const loss = human.facts.find((fact) => fact.kind === "actor_unregistered" &&
      fact.actorId === raiderId && fact.tick <= 3000 && fact.actor?.alive === false
    );
    let resolvedTick = loss?.tick;
    if (withdrawal?.kind !== "preset_control") failures.push("expansion_pressure_removal_control_missing");
    else if (withdrawal.control.phase === "unavailable") {
      if (!loss || loss.tick > 200) failures.push("expansion_pressure_removal_unavailable_without_native_loss");
    } else if (!loss) {
      const transit = runtimeControlTransitFailures(human, "withdraw-home-pressure", 3000, "arrive");
      failures.push(...transit);
      if (!transit.length) {
        const commandId = withdrawal.control.command?.execution?.commandId;
        const arrival = normalizeRuntimeMovement(human).movements.find((movement) =>
          movement.callerAttributed && !movement.gaps.length && movement.arrival === "original_destination" &&
          movement.returned === "true" &&
          movement.started.spatial.caller?.order?.commandContext?.execution.commandId === commandId
        );
        resolvedTick = arrival?.observations.find((entry) => entry.spatial.phase === "arrived")?.tick;
      }
    }
    const resumed = capture.facts.flatMap((fact) => fact.kind === "decision_selected" && fact.tick > 200 &&
      resolvedTick !== undefined && fact.tick > resolvedTick &&
      !pressured.some((entry) => entry.fact.sequence === fact.sequence)
      ? fact.decision.acceptedIntents.flatMap((intent) => intent.kind === "construct" && remoteService(intent)
        ? [{ fact, intent }] : []) : []
    );
    if (!resumed.some(({ fact, intent }) => capture.facts.some((placement) => {
      if (placement.kind !== "spatial_authority" || placement.spatial.kind !== "placement" ||
          placement.sequence <= fact.sequence) return false;
      const siteId = placement.spatial.site.actorId, command = placement.spatial.command.execution;
      const builderId = intent.builderIds[0];
      return !!siteId && !!builderId && command?.source === "ai" && command.effectId === intent.effectId &&
        !Object.values(result.presetCreatedActorIds).includes(siteId) &&
        expansionServiceFailures(result, siteId, command.commandId, builderId).length === 0;
    }))) failures.push("expansion_did_not_resume_productive_service_after_pressure_removed");
  }
  return failures;
}
