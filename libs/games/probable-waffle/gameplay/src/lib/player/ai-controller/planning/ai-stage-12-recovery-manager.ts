import type { ActorId, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBaseStateV1, AiBrainStateV1, AiRecoveryStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "./ai-manager-proposal";

/** The H1 default is shared by every Stage-12 domain; it is a backoff floor, never a deadline reset. */
export const AI_STAGE_12_NO_PROGRESS_TICKS = 200;
const AI_STAGE_12_PHASE_DEADLINE_TICKS = 1200;
const MAX_RECOVERY_RECORDS = 64;
const MAX_RECOVERY_ATTEMPTS = 2;

type RecoveryRecord = AiRecoveryStateV1["records"][number];

function owned(observation: AiObservationV1): AiObservedActorV1[] {
  return observation.actors.filter((actor) => actor.relation === "self" && actor.visibility === "owned").sort((a, b) => a.actorId.localeCompare(b.actorId));
}

function position(actor: AiObservedActorV1 | undefined): Vector3Simple | null {
  return actor?.logicalPosition.status === "known" ? actor.logicalPosition.value : null;
}

function distance(left: Vector3Simple, right: Vector3Simple): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y) + Math.abs(left.z - right.z);
}

function ids(state: AiBrainStateV1, key: string): Pick<AiIntentV1, "intentId" | "effectId"> & { claimId: AiIntentV1["claims"][number]["claimId"] } {
  const ordinal = `${state.scheduler.decisionSequence}:${key}`;
  return {
    intentId: `intent:recovery:${ordinal}` as AiIntentV1["intentId"],
    effectId: `effect:recovery:${ordinal}` as AiIntentV1["effectId"],
    claimId: `claim:recovery:${ordinal}` as AiIntentV1["claims"][number]["claimId"]
  };
}

function record(
  prior: RecoveryRecord | undefined,
  input: Omit<RecoveryRecord, "enteredTick" | "lastProgressTick" | "phaseDeadline" | "attempt" | "releasedClaimIds">
): RecoveryRecord {
  return {
    ...input,
    enteredTick: prior?.enteredTick ?? input.nextRetryTick,
    lastProgressTick: prior?.lastProgressTick ?? input.nextRetryTick,
    phaseDeadline: prior?.phaseDeadline ?? aiDeadline(input.nextRetryTick + AI_STAGE_12_PHASE_DEADLINE_TICKS),
    attempt: prior && prior.state !== "watching" ? prior.attempt + 1 : prior?.attempt ?? 0,
    releasedClaimIds: prior?.releasedClaimIds ?? []
  };
}

function isGatherer(actor: AiObservedActorV1, catalog: AiCapabilityCatalogV1): boolean {
  return catalog.entries.some((entry) => entry.sourceObjectName === actor.objectName && entry.gathers.length > 0);
}

function sourceActors(observation: AiObservationV1): AiObservedActorV1[] {
  return observation.actors
    .filter((actor) => actor.relation !== "enemy" && actor.visibility !== "last_seen")
    .filter((actor) => actor.resourceState.status === "known" && actor.resourceState.value.available.status === "known" && actor.resourceState.value.available.value > 0)
    .filter((actor) => position(actor) !== null)
    .sort((a, b) => a.actorId.localeCompare(b.actorId));
}

function isTerminalOutcomeFor(outcomes: readonly AiBrainStateV1["pendingOutcomes"][number], effectId: string): boolean {
  return outcomes.some((outcome) => outcome.identity.effectId === effectId && ["rejected", "failed", "cancelled"].includes(outcome.kind));
}

/**
 * Completes the recovery ladder over existing command and manager ownership. The manager never
 * mutates actors or invents placement authority: it records observed failure, backs off stable
 * effects, chooses a legal alternative and releases only its own provisional claims.
 */
export class AiStage12RecoveryManagerV1 implements AiProposalManagerV1 {
  readonly managerId = "stage-12-recovery";

  constructor(private readonly getCatalog: () => AiCapabilityCatalogV1 | undefined) {}

  propose(observation: AiObservationV1, state: AiBrainStateV1): AiManagerProposalV1 {
    const catalog = this.getCatalog();
    if (!catalog || catalog.generation !== observation.generation) {
      return { managerId: this.managerId, lane: "essential_economy", evaluated: false, intents: [], reasons: ["catalog_not_ready"] };
    }
    const self = owned(observation);
    const prior = new Map(state.recovery.records.map((entry) => [entry.recoveryKey, entry]));
    const records: RecoveryRecord[] = [];
    const intents: AiIntentV1[] = [];
    const reasons: string[] = [];

    // Stage 6 owns the generic progress contract; Stage 12 turns an overdue observed milestone
    // into one causal recovery episode without considering a repeated command or new plan ID to
    // be evidence. Domain managers retain their own concrete alternate action ownership.
    for (const progress of state.progress.filter((entry) => entry.milestoneDeadline.dueTick <= observation.tick)) {
      const key = `progress:${progress.planId}`;
      const old = prior.get(key);
      const evidenceTick = progress.lastUsefulProgress?.tick ?? old?.lastProgressTick ?? state.lastCommittedTick;
      if (observation.tick - evidenceTick < AI_STAGE_12_NO_PROGRESS_TICKS) continue;
      const domain: RecoveryRecord["domain"] = state.transport.some((plan) => `plan:${plan.planId}` === progress.planId)
        ? "transport"
        : state.fortifications.some((plan) => `plan:${plan.planId}` === progress.planId)
          ? "fortification"
          : state.squads.some((squad) => `plan:${squad.squadId}` === progress.planId)
            ? "squad"
            : "economy";
      records.push({
        recoveryKey: key, domain, planId: progress.planId, actorId: null, cause: "overdue_useful_progress",
        enteredTick: old?.enteredTick ?? observation.tick, lastProgressTick: evidenceTick,
        nextRetryTick: observation.tick + AI_STAGE_12_NO_PROGRESS_TICKS,
        phaseDeadline: old?.phaseDeadline ?? aiDeadline(observation.tick + AI_STAGE_12_PHASE_DEADLINE_TICKS),
        attempt: old ? old.attempt + 1 : 1, state: "backoff", alternate: "owning_domain_alternate", releasedClaimIds: old?.releasedClaimIds ?? []
      });
      reasons.push(`progress_recovery:${progress.planId}`);
    }

    // Outcome-driven expansion retry: rejected sites are recorded by site key and require a new
    // candidate selected by Stage 10. This avoids same-site spam while preserving shared authority.
    let placementChanged = false;
    const bases: AiBaseStateV1[] = state.bases.map((base) => {
      if (!base.reservedSiteKey) return base;
      const effect = `effect:expansion:${state.identities.nextIntent}`;
      const rejected = isTerminalOutcomeFor(state.pendingOutcomes, effect);
      if (!rejected) return base;
      const key = `placement:${base.reservedSiteKey}`;
      const old = prior.get(key);
      const retryAfterTick = observation.tick + AI_STAGE_12_NO_PROGRESS_TICKS * Math.min(4, (old?.attempt ?? 0) + 1);
      records.push(record(old, {
        recoveryKey: key, domain: "placement", planId: `plan:expansion:${base.baseId}` as RecoveryRecord["planId"], actorId: null,
        cause: "construction_rejected", nextRetryTick: retryAfterTick, state: "backoff", alternate: "stage10_next_visible_candidate"
      }));
      placementChanged = true;
      reasons.push(`placement_backoff:${base.reservedSiteKey}`);
      return {
        ...base,
        lifecycle: "reserved",
        rejectedSiteKeys: [...(base.rejectedSiteKeys ?? []), { siteKey: base.reservedSiteKey, retryAfterTick, reason: "outcome_rejected" }],
        reservedSiteKey: null
      };
    });

    // H5: a zero-delivery economy with legal sources receives one bounded reassignment. A worker
    // already in a transport stays owned by that plan, preventing rescue from stealing cargo.
    const lowIncome = observation.resources.some((entry) => entry.deliveredIncomePerMinute.status === "known" && entry.deliveredIncomePerMinute.value <= 0);
    const source = sourceActors(observation)[0];
    const workers = self.filter((actor) => isGatherer(actor, catalog) && (actor.containedInActorId === null || actor.containedInActorId === undefined));
    if (lowIncome && source && workers.length > 0) {
      const key = `economy:source:${source.actorId}`;
      const old = prior.get(key);
      const eligible = !old || observation.tick >= old.nextRetryTick;
      if (eligible) {
        const selected = workers.slice(0, Math.max(1, Math.min(2, Math.floor(workers.length / 2) || 1)));
        const actionIds = ids(state, key);
        intents.push({
          ...actionIds, kind: "assign_gatherers", planId: "plan:recovery:economy" as AiIntentV1["planId"], demandId: null,
          lane: "essential_economy", proposedTick: observation.tick, urgencyClass: 0, utility: 940,
          preconditions: selected.map((worker) => ({ kind: "actor_exists" as const, actorId: worker.actorId })),
          claims: [...selected.map((worker, index) => ({ claimId: `${actionIds.claimId}:worker:${index}` as AiIntentV1["claims"][number]["claimId"], kind: "actor" as const, actorId: worker.actorId })), { claimId: `${actionIds.claimId}:effect` as AiIntentV1["claims"][number]["claimId"], kind: "effect", effectId: actionIds.effectId }],
          reasonCode: "recovery:economy:replace_depleted_or_unreachable_source",
          actorIds: selected.map((worker) => worker.actorId), resourceType: source.resourceState.status === "known" ? source.resourceState.value.resourceType : (observation.resources[0]?.resourceType ?? ResourceType.Food), sourceActorId: source.actorId
        });
        records.push(record(old, { recoveryKey: key, domain: "economy", planId: "plan:recovery:economy" as RecoveryRecord["planId"], actorId: source.actorId, cause: "zero_delivered_income", nextRetryTick: observation.tick + AI_STAGE_12_NO_PROGRESS_TICKS, state: "recovering", alternate: "eligible_visible_source" }));
        reasons.push(`gatherer_reassignment:${source.actorId}`);
      }
    }

    // A visible hostile dynamic obstacle near an owned base is targetable; an unobserved obstacle
    // is represented as an access question by existing scouting rather than leaking an actor ID.
    for (const base of bases.filter((candidate) => candidate.active && candidate.anchorPosition).slice(0, 4)) {
      const blocker = observation.actors
        .filter((actor) => actor.relation === "enemy" && actor.visibility === "visible" && position(actor))
        .filter((actor) => distance(base.anchorPosition!, position(actor)!) <= 10)
        .sort((a, b) => a.actorId.localeCompare(b.actorId))[0];
      if (!blocker) continue;
      const squad = state.squads
        .filter((candidate) => candidate.role === "defense" && candidate.actorIds.length > 0)
        .filter((candidate) => candidate.actorIds.some((actorId) => self.find((actor) => actor.actorId === actorId)?.capabilities.some((capability) => capability.targetDomains.includes("ground"))))
        .sort((a, b) => a.squadId.localeCompare(b.squadId))[0];
      if (!squad) continue;
      const key = `blocker:${base.baseId}:${blocker.actorId}`;
      const old = prior.get(key);
      if (old && observation.tick < old.nextRetryTick) continue;
      const actionIds = ids(state, key);
      intents.push({
        ...actionIds, kind: "attack", planId: `plan:${squad.squadId}` as AiIntentV1["planId"], demandId: null, lane: "army_threat", proposedTick: observation.tick,
        urgencyClass: 0, utility: 930, preconditions: [{ kind: "target_visible", actorId: blocker.actorId }],
        claims: [{ claimId: actionIds.claimId, kind: "effect", effectId: actionIds.effectId }], reasonCode: "recovery:visible_proxy_or_egress_blocker",
        actorIds: squad.actorIds, targetActorId: blocker.actorId, targetPosition: null
      });
      records.push(record(old, { recoveryKey: key, domain: "blocker", planId: `plan:${squad.squadId}` as RecoveryRecord["planId"], actorId: blocker.actorId, cause: "visible_hostile_egress_blocker", nextRetryTick: observation.tick + AI_STAGE_12_NO_PROGRESS_TICKS, state: "recovering", alternate: "compatible_defense_squad" }));
      reasons.push(`visible_blocker:${blocker.actorId}`);
    }

    // Repair is intentionally capped so the recovery itself cannot destroy the economy. Runtime
    // definition support remains the final repair validator and absence simply produces no order.
    const damaged = self.filter((actor) => actor.healthPermille?.status === "known" && actor.healthPermille.value < 700).sort((a, b) => a.actorId.localeCompare(b.actorId))[0];
    const repairerLimit = damaged?.mainBuilding?.status === "known" && damaged.mainBuilding.value
      ? Math.max(1, Math.min(2, workers.length))
      : Math.min(2, Math.floor(workers.length / 4));
    const repairers = workers.slice(0, repairerLimit);
    if (damaged && repairers.length > 0) {
      const actionIds = ids(state, `repair:${damaged.actorId}`);
      intents.push({ ...actionIds, kind: "repair", planId: "plan:recovery:repair" as AiIntentV1["planId"], demandId: null, lane: "essential_economy", proposedTick: observation.tick, urgencyClass: 0, utility: 900, preconditions: [{ kind: "actor_exists", actorId: damaged.actorId }], claims: [...repairers.map((actor, index) => ({ claimId: `${actionIds.claimId}:repairer:${index}` as AiIntentV1["claims"][number]["claimId"], kind: "actor" as const, actorId: actor.actorId })), { claimId: `${actionIds.claimId}:effect` as AiIntentV1["claims"][number]["claimId"], kind: "effect", effectId: actionIds.effectId }], reasonCode: "recovery:critical_asset_repair_triage", actorIds: repairers.map((actor) => actor.actorId), targetActorId: damaged.actorId });
      records.push(record(prior.get(`repair:${damaged.actorId}`), { recoveryKey: `repair:${damaged.actorId}`, domain: "repair", planId: "plan:recovery:repair" as RecoveryRecord["planId"], actorId: damaged.actorId, cause: "observed_damage", nextRetryTick: observation.tick + AI_STAGE_12_NO_PROGRESS_TICKS, state: "recovering", alternate: "return_workers_to_economy_after_completion" }));
    }

    // Preserve cumulative age and terminally abandon optional failures after two real alternatives.
    for (const old of state.recovery.records) {
      if (records.some((entry) => entry.recoveryKey === old.recoveryKey)) continue;
      const overdue = observation.tick >= old.phaseDeadline.dueTick || observation.tick - old.lastProgressTick >= AI_STAGE_12_PHASE_DEADLINE_TICKS;
      if (overdue && old.attempt >= MAX_RECOVERY_ATTEMPTS) {
        records.push({ ...old, state: "abandoned", alternate: "release_optional_commitments", releasedClaimIds: state.reservations.filter((reservation) => reservation.ownerPlanId === old.planId && reservation.state.kind === "provisional").map((reservation) => reservation.claimId).sort(), nextRetryTick: observation.tick });
      } else {
        records.push(old);
      }
    }
    return { managerId: this.managerId, lane: "essential_economy", evaluated: true, intents, reasons: reasons.length ? reasons : ["recovery:watching"], statePatch: { ...(placementChanged ? { bases } : {}), recovery: { records: records.slice(0, MAX_RECOVERY_RECORDS).sort((a, b) => a.recoveryKey.localeCompare(b.recoveryKey)) } } };
  }
}
