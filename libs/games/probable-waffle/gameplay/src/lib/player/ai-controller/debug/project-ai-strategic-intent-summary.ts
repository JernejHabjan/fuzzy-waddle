import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiIntentDecisionV1, AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiStrategicIntentSummary } from "../contracts/ai-strategic-intent-summary";

const inactiveSquadStates = new Set(["completed", "cancelled", "failed"]);

function humanize(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/gu, "$1 $2")
    .replace(/[_:.-]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .toLowerCase();
}

function sentence(value: string): string {
  const normalized = humanize(value);
  return normalized ? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}` : "None";
}

function countNoun(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function primarySquad(state: AiBrainStateV1) {
  const priority: Readonly<Record<string, number>> = { defense: 0, attack: 1, reinforcement: 2, escort: 3, scout: 4 };
  return state.squads
    .filter((squad) => !inactiveSquadStates.has(squad.state))
    .sort(
      (left, right) =>
        (priority[left.role] ?? 9) - (priority[right.role] ?? 9) || left.squadId.localeCompare(right.squadId)
    )[0];
}

function describeObjective(
  observation: AiObservationV1,
  state: AiBrainStateV1,
  squad: AiBrainStateV1["squads"][number] | undefined
): string {
  if (state.skirmish.mode.state === "conceding") {
    return `Conceding: ${sentence(state.skirmish.mode.lastReason ?? "position is no longer recoverable")}`;
  }
  if (!squad) {
    const transport = state.transport.find((plan) => !["completed", "cancelled", "failed"].includes(plan.phase));
    if (transport) {
      const kind = transport.lifecycle?.missionKind ?? "transfer";
      const route = transport.lifecycle?.route.kind;
      const medium = route === "air_transport" ? "air" : route === "water_transport" ? "water" : "unconfirmed";
      return `${sentence(kind)} by ${medium} transport`;
    }
    return `${sentence(state.strategy.stance)} with no active squad mission`;
  }
  const targetId = squad.tactics?.targetActorId ?? squad.objectiveId;
  const target = targetId ? observation.actors.find((actor) => actor.actorId === targetId) : undefined;
  const targetName = target
    ? `${target.visibility === "last_seen" ? "last known " : ""}${sentence(String(target.objectName))}`
    : squad.lifecycle?.targetRegionId
      ? "assigned region"
      : "assigned area";
  const player = squad.lifecycle?.targetPlayerNumber;
  const ownership = player === null || player === undefined ? "" : ` belonging to Player ${player}`;
  const action =
    squad.role === "defense"
      ? "Defending against"
      : squad.role === "scout"
        ? "Scouting"
        : squad.role === "escort"
          ? "Escorting toward"
          : squad.role === "reserve"
            ? "Holding near"
            : "Attacking";
  return `${action} ${targetName}${ownership}`;
}

function describeForce(state: AiBrainStateV1, squad: AiBrainStateV1["squads"][number] | undefined): string {
  if (!squad) {
    const transport = state.transport.find((plan) => !["completed", "cancelled", "failed"].includes(plan.phase));
    if (!transport) return "No active combat force";
    return (
      `${countNoun(transport.passengerIds.length, "passenger")}, ` +
      `${countNoun(transport.transportIds.length, "carrier")}; ${humanize(transport.phase)}; ` +
      `deadline tick ${transport.lifecycle?.phaseDeadline.dueTick ?? "unknown"}`
    );
  }
  const ordered = squad.tactics?.orderedActorIds.length ?? 0;
  const assembling = ["forming", "assemble", "rally"].includes(squad.state);
  const deadline = assembling ? squad.lifecycle?.assemblyDeadline.dueTick : squad.lifecycle?.effectDeadline.dueTick;
  const force = `${squad.actorIds.length} ${squad.domain} units; ${humanize(squad.state)}`;
  return (
    `${force}; ${ordered}/${squad.actorIds.length} ordered; ` +
    `${assembling ? "assembly" : "effect"} deadline tick ${deadline ?? "unknown"}`
  );
}

function describeProduction(observation: AiObservationV1, state: AiBrainStateV1): string {
  const demand = state.economyProduction.demands
    .map((candidate) => ({
      candidate,
      committed:
        candidate.satisfiedActorIds.length +
        candidate.queuedIds.length +
        candidate.constructingIds.length +
        candidate.acceptedNotObservedEffectIds.length
    }))
    .filter(({ candidate, committed }) => committed < candidate.desired)
    .sort(
      (left, right) =>
        right.candidate.desired - right.committed - (left.candidate.desired - left.committed) ||
        left.candidate.demandId.localeCompare(right.candidate.demandId)
    )[0];
  if (!demand) return "Production goals currently satisfied";
  const remaining = demand.candidate.desired - demand.committed;
  const need = `Need ${remaining} more ${humanize(demand.candidate.capabilityOrRole)}`;
  const purpose = `for ${humanize(demand.candidate.purpose)}`;
  const queues = observation.actors.flatMap((actor) =>
    actor.relation === "self" && actor.queue.status === "known" ? [actor.queue.value] : []
  );
  const freeSlots = queues.reduce((total, queue) => total + Math.max(0, queue.capacity - queue.occupied), 0);
  const capacity = queues.length ? `; ${freeSlots} observed free queue slots (eligibility varies)` : "; queue capacity unknown";
  const evidence = state.economyProduction.adaptation.activeRoleTargets.find(
    (target) => target.role === demand.candidate.capabilityOrRole && target.evidenceIds.length
  );
  const rationale = evidence ? `; supported by ${countNoun(evidence.evidenceIds.length, "committed evidence item")}` : "";
  return `${need} ${purpose} (${demand.committed}/${demand.candidate.desired} committed)${capacity}${rationale}`;
}

function describeEconomy(observation: AiObservationV1, decisions: readonly AiIntentDecisionV1[]): string {
  const gather = decisions.find(
    (
      decision
    ): decision is Extract<AiIntentDecisionV1, { outcome: "accepted" }> & {
      readonly intent: Extract<AiIntentV1, { kind: "assign_gatherers" }>;
    } => decision.outcome === "accepted" && decision.intent.kind === "assign_gatherers"
  );
  if (gather) {
    return `Assigning ${countNoun(gather.intent.actorIds.length, "worker")} to ${humanize(String(gather.intent.resourceType))}`;
  }
  const workers = observation.actors.filter(
    (actor) => actor.relation === "self" && actor.capabilities.some((capability) => capability.family === "gather")
  ).length;
  const shortage = observation.resources
    .map((resource) => ({
      resource,
      deficit: Math.max(0, resource.obligationsDue + resource.reservedUnspent - resource.stockpile)
    }))
    .sort(
      (left, right) =>
        right.deficit - left.deficit ||
        String(left.resource.resourceType).localeCompare(String(right.resource.resourceType))
    )[0];
  if (shortage?.deficit) {
    return `${workers} workers; short ${shortage.deficit} ${humanize(String(shortage.resource.resourceType))} for commitments`;
  }
  return `${workers} workers; current commitments are funded`;
}

function describeNextAction(decisions: readonly AiIntentDecisionV1[]): string {
  const intent = decisions.find((decision) => decision.outcome === "accepted")?.intent;
  if (!intent) return "Waiting for the next eligible strategic action";
  if (intent.kind === "attack") return `Attack with ${intent.actorIds.length} units`;
  if (intent.kind === "produce") return `Train ${sentence(String(intent.objectName))}`;
  if (intent.kind === "construct") return `Build ${sentence(String(intent.objectName))}`;
  if (intent.kind === "assign_gatherers") {
    return `Gather ${humanize(String(intent.resourceType))} with ${countNoun(intent.actorIds.length, "worker")}`;
  }
  if (intent.kind === "research") return `Research ${sentence(String(intent.researchType))}`;
  if (intent.kind === "board") return `Board ${countNoun(intent.actorIds.length, "passenger")}`;
  if (intent.kind === "unload") return `Unload ${countNoun(intent.passengerIds.length, "passenger")}`;
  return sentence(intent.kind);
}

function describeBlocker(state: AiBrainStateV1, decisions: readonly AiIntentDecisionV1[]): string | null {
  const blocker = state.blockers.find((entry) => entry.status === "technical_fault") ??
    state.blockers.find((entry) => entry.status !== "failed_optional");
  if (blocker) {
    const recovery = state.recovery.records.find((record) => record.planId === blocker.planId);
    const alternative = recovery?.alternate ? ` via ${humanize(recovery.alternate)}` : "";
    const retry = recovery
      ? `; ${humanize(recovery.state)}, retry tick ${recovery.nextRetryTick}${alternative}`
      : "; awaiting recovery";
    const affected =
      blocker.planId === state.opening.plan.planId
        ? "opening build order"
        : state.transport.some((plan) => String(plan.planId) === String(blocker.planId))
          ? "transport operation"
          : blocker.planId === state.strategy.goalId
            ? "strategic objective"
            : "current plan";
    return `${sentence(blocker.cause)} blocks ${affected} until tick ${blocker.deadline.dueTick}${retry}`;
  }
  const rejected = decisions.find(
    (decision): decision is Extract<AiIntentDecisionV1, { outcome: "rejected" }> => decision.outcome === "rejected"
  );
  if (!rejected) return null;
  const explanations: Readonly<Record<typeof rejected.reason, string>> = {
    claim_conflict: "Claim conflict: another action already claimed the same actor or capacity",
    invalid_numeric_input: "A proposed action contained an invalid value",
    precondition_failed: "A required actor, resource, route, or target is not yet available",
    profile_limit: "The current difficulty's action budget deferred this proposal",
    resource_conflict: "Available resources were committed to a higher-priority action"
  };
  return explanations[rejected.reason];
}

/** Builds presentation-ready meaning from committed state without querying or advancing gameplay. */
export function projectAiStrategicIntentSummary(
  observation: AiObservationV1,
  state: AiBrainStateV1,
  decisions: readonly AiIntentDecisionV1[]
): AiStrategicIntentSummary {
  const squad = primarySquad(state);
  const objective = describeObjective(observation, state, squad);
  const force = describeForce(state, squad);
  const headlineForce = squad
    ? `${countNoun(squad.actorIds.length, "unit")} in ${humanize(squad.state)}`
    : state.transport.some((plan) => !["completed", "cancelled", "failed"].includes(plan.phase))
      ? "transport operation active"
      : "no active force";
  return {
    headline: `${sentence(state.strategy.stance)}: ${objective}; ${headlineForce}`,
    objective,
    force,
    production: describeProduction(observation, state),
    economy: describeEconomy(observation, decisions),
    blocker: describeBlocker(state, decisions),
    nextAction: describeNextAction(decisions)
  };
}
