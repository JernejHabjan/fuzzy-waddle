import type { nativeScenarioContext } from "../../contracts/skirmish-ai-native-scenario-context";
import { nativeRetreats, nativeWeaponHits } from "../effects/skirmish-ai-native-combat-effects";
import type { RuntimeVariant } from "../../setup/skirmish-ai-runtime-variant";

/** Require an original outgoing raid and tie the response to those raiders and the observed defenders. */
export function evaluateNativeRaidWithdrawal(
  branch: string,
  context: ReturnType<typeof nativeScenarioContext>,
  variant: RuntimeVariant
): string[] {
  const target = context.role("raid-target");
  const reinforcementTick = Math.min(
    ...(variant.presetWorld?.controls ?? [])
      .filter((entry) => entry.id.startsWith("raid-guard-"))
      .map((entry) => entry.applicationTick)
  );
  const firstRaid = context.frames
    .filter((frame) => frame.tick < reinforcementTick)
    .flatMap((frame) => (frame.decision.missionState?.squads ?? []).map((squad) => ({ frame, squad })))
    .find(
      ({ squad }) =>
        squad.role === "attack" &&
        squad.squadId.startsWith("squad:attack:raid:") &&
        squad.objectiveId === target &&
        squad.actorIds.length > 0 &&
        !["cancelled", "completed"].includes(squad.state)
    );
  if (!firstRaid) return ["raid_withdrawal_original_raid_missing"];
  const raiders = new Set<string>(firstRaid.squad.actorIds);
  const hits = nativeWeaponHits(context, target, firstRaid.frame.tick).filter(
    (fact) => !!fact.damage.initiator?.actorId && raiders.has(fact.damage.initiator.actorId)
  );
  if (!hits.some((fact) => fact.tick < reinforcementTick)) return ["raid_withdrawal_original_raid_never_hit_target"];
  const abort = context.frames.find((frame) =>
    frame.decision.missionState?.squads.some(
      (squad) =>
        squad.squadId === firstRaid.squad.squadId && squad.lifecycle?.terminalReason === "raid_counterforce_abort"
    )
  );
  if (branch === "quiet") return abort ? ["raid_withdrawal_uncontested_raid_aborted"] : [];
  if (!abort || abort.tick < reinforcementTick) return ["raid_withdrawal_no_abort_after_reinforcement"];

  const failures: string[] = [];
  const guards = new Set(
    Object.entries(context.roles)
      .filter(([role]) => role.startsWith("raid-guard-"))
      .map(([, id]) => id)
  );
  const seen = new Set(
    context.frames
      .filter((frame) => frame.tick >= reinforcementTick && frame.tick <= abort.tick)
      .flatMap((frame) =>
        (frame.tacticalBoundary?.actors ?? [])
          .filter((actor) => actor.visible && actor.identity.alive && guards.has(actor.identity.actorId ?? ""))
          .map((actor) => actor.identity.actorId)
      )
  );
  if (seen.size <= raiders.size) failures.push("raid_withdrawal_did_not_face_larger_visible_force");
  const withdrawal = nativeRetreats(context, abort.tick).find((movement) => {
    const actorId = movement.observations[0]?.spatial.source.actorId;
    return !!actorId && raiders.has(actorId);
  });
  const arrival = withdrawal?.observations.find((entry) => entry.spatial.phase === "arrived");
  if (!arrival) failures.push("raid_withdrawal_no_original_raider_reached_safety");
  else if (
    context.frames.some(
      (frame) =>
        frame.tick > arrival.tick &&
        frame.decision.acceptedIntents.some(
          (intent) =>
            intent.kind === "attack" && intent.targetActorId === target && intent.actorIds.some((id) => raiders.has(id))
        )
    )
  )
    failures.push("raid_withdrawal_original_raiders_recommitted_to_countered_target");
  return failures;
}
