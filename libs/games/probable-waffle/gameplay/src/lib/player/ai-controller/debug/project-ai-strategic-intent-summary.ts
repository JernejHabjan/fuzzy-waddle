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
  if (!squad) return `${sentence(state.strategy.stance)} with no active squad mission`;
  const targetId = squad.tactics?.targetActorId ?? squad.objectiveId;
  const target = targetId ? observation.actors.find((actor) => actor.actorId === targetId) : undefined;
  const targetName = target ? sentence(String(target.objectName)) : targetId ? `target ${targetId}` : "assigned area";
  const player = squad.lifecycle?.targetPlayerNumber;
  const ownership = player === null || player === undefined ? "" : ` belonging to Player ${player}`;
  const action = squad.role === "defense" ? "Defending against" : squad.role === "scout" ? "Scouting" : "Attacking";
  return `${action} ${targetName}${ownership}`;
}

function describeForce(state: AiBrainStateV1, squad: AiBrainStateV1["squads"][number] | undefined): string {
  if (!squad) return "No active combat force";
  const ordered = squad.tactics?.orderedActorIds.length ?? 0;
  const deadline = squad.lifecycle?.effectDeadline.dueTick ?? squad.lifecycle?.assemblyDeadline.dueTick;
  const force = `${squad.actorIds.length} ${squad.domain} units; ${sentence(squad.state)}`;
  return `${force}; ${ordered}/${squad.actorIds.length} ordered; deadline tick ${deadline ?? "none"}`;
}

function describeProduction(state: AiBrainStateV1): string {
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
  return `${need} ${purpose} (${demand.committed}/${demand.candidate.desired} committed)`;
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
    return `Assigning ${gather.intent.actorIds.length} workers to ${humanize(String(gather.intent.resourceType))}`;
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
    return `Gather ${humanize(String(intent.resourceType))} with ${intent.actorIds.length} workers`;
  }
  if (intent.kind === "research") return `Research ${sentence(String(intent.researchType))}`;
  if (intent.kind === "board") return `Board ${intent.actorIds.length} passengers`;
  if (intent.kind === "unload") return `Unload ${intent.passengerIds.length} passengers`;
  return sentence(intent.kind);
}

function describeBlocker(state: AiBrainStateV1, decisions: readonly AiIntentDecisionV1[]): string | null {
  const blocker = state.blockers[0];
  if (blocker) {
    const recovery = state.recovery.records.find((record) => record.cause === blocker.cause);
    const retry = recovery ? `; ${sentence(recovery.state)}, retry tick ${recovery.nextRetryTick}` : "";
    return `${sentence(blocker.cause)} (${blocker.status})${retry}`;
  }
  const rejected = decisions.find((decision) => decision.outcome === "rejected");
  return rejected ? `${sentence(rejected.reason)}: ${sentence(rejected.detail)}` : null;
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
  return {
    headline: `${sentence(state.strategy.stance)} — ${objective}; ${force}`,
    objective,
    force,
    production: describeProduction(state),
    economy: describeEconomy(observation, decisions),
    blocker: describeBlocker(state, decisions),
    nextAction: describeNextAction(decisions)
  };
}
