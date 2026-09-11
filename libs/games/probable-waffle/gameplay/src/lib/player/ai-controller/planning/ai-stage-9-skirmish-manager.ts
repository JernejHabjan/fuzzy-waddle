import type { ActorId, PlayerNumber, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiRouteCapabilityV1, AiRouteRequestV1 } from "../contracts/ai-access-graph-v1";
import type {
  AiBrainStateV1,
  AiKnowledgeStateV1,
  AiSkirmishStateV1,
  AiSquadStateV1,
  AiThreatIncidentV1
} from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import { aiDeadline, type AiAccessNodeId, type AiPlanId, type AiSquadId } from "../contracts/ai-core-types";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiDomainV1, AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "./ai-manager-proposal";
import { queryAiAccessRouteV1 } from "./ai-access-graph-v1";
import { createAiTransportPlanV1 } from "./ai-stage-8-transport-manager";

export const AI_STAGE_9_ASSEMBLY_TIMEOUT_TICKS = 1200;
export const AI_STAGE_9_CONCESSION_HOPELESS_TICKS = 1200;
export const AI_STAGE_9_PURSUIT_LEASH_TICKS = 200;
const MAX_TIMELINE_ENTRIES = 128;
const THREAT_EXPIRY_TICKS = 240;
const LAST_SEEN_PURSUIT_TICKS = 1200;

type MissionRole = AiSquadStateV1["role"];

function position(actor: AiObservedActorV1 | undefined): Vector3Simple | undefined {
  return actor?.logicalPosition.status === "known" ? actor.logicalPosition.value : undefined;
}

function node(actor: AiObservedActorV1 | undefined): AiAccessNodeId | undefined {
  return actor?.accessNodeId.status === "known" ? actor.accessNodeId.value : undefined;
}

function domains(actor: AiObservedActorV1): readonly AiDomainV1[] {
  return [...new Set(actor.capabilities.flatMap((capability) => capability.domains))].sort();
}

function targetDomains(actor: AiObservedActorV1): readonly AiDomainV1[] {
  return [...new Set(actor.capabilities.flatMap((capability) => capability.targetDomains))].sort();
}

function canFight(actor: AiObservedActorV1): boolean {
  return actor.housingCost.status === "known" && actor.housingCost.value > 0 && targetDomains(actor).length > 0;
}

/** Both sides of the domain check are required: a ranged ground unit is not anti-air by name alone. */
function canTarget(attacker: AiObservedActorV1, target: AiObservedActorV1): boolean {
  const supported = new Set(targetDomains(attacker));
  const targetMovementDomains = domains(target);
  const effectiveTargetDomains: readonly AiDomainV1[] =
    targetMovementDomains.length > 0 ? targetMovementDomains : ["ground"];
  return effectiveTargetDomains.some((domain) => supported.has(domain));
}

function ownedCombat(observation: AiObservationV1, catalog: AiCapabilityCatalogV1): AiObservedActorV1[] {
  return observation.actors
    .filter(
      (actor) =>
        actor.relation === "self" &&
        actor.visibility === "owned" &&
        (actor.containedInActorId === undefined || actor.containedInActorId === null)
    )
    .filter(canFight)
    .filter(
      (actor) =>
        !catalog.entries.some((entry) => entry.sourceObjectName === actor.objectName && entry.gathers.length > 0)
    )
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
}

function hostileContacts(observation: AiObservationV1): AiObservedActorV1[] {
  return observation.actors
    .filter((actor) => actor.relation === "enemy")
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
}

function regionId(actor: AiObservedActorV1): string | null {
  return node(actor) ?? null;
}

function incidentKind(actor: AiObservedActorV1): AiThreatIncidentV1["kind"] {
  const movement = domains(actor);
  if (movement.includes("air")) return "flyer";
  if (movement.includes("water")) return actor.containerState?.status === "known" ? "transport_landing" : "naval";
  if (canFight(actor)) return "army_pressure";
  if (actor.housingCost.status === "known" && actor.housingCost.value > 0) return "worker_harassment";
  return "unknown";
}

function baseId(state: AiBrainStateV1): `base:${string}` {
  return state.bases.find((base) => base.active)?.baseId ?? "base:home";
}

function homeActor(observation: AiObservationV1): AiObservedActorV1 | undefined {
  return observation.actors
    .filter((actor) => actor.relation === "self" && actor.visibility === "owned")
    .sort((left, right) => {
      const leftMain = left.mainBuilding?.status === "known" && left.mainBuilding.value ? 0 : 1;
      const rightMain = right.mainBuilding?.status === "known" && right.mainBuilding.value ? 0 : 1;
      return leftMain - rightMain || left.actorId.localeCompare(right.actorId);
    })[0];
}

function homePosition(observation: AiObservationV1): Vector3Simple | undefined {
  return position(homeActor(observation));
}

function homeNode(observation: AiObservationV1): AiAccessNodeId | undefined {
  return node(homeActor(observation));
}

function distance(left: Vector3Simple, right: Vector3Simple): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y) + Math.abs(left.z - right.z);
}

function intentBase(
  state: AiBrainStateV1,
  planId: AiPlanId,
  tick: number,
  suffix: string,
  lane: AiIntentV1["lane"],
  utility: number
) {
  const ordinal = state.scheduler.decisionSequence;
  return {
    intentId: `intent:stage9:${ordinal}:${suffix}` as AiIntentV1["intentId"],
    effectId: `effect:stage9:${ordinal}:${suffix}` as AiIntentV1["effectId"],
    planId,
    demandId: null,
    lane,
    proposedTick: tick,
    urgencyClass: lane === "army_threat" ? 1 : 4,
    utility,
    preconditions: [{ kind: "plan_active" as const, planId }],
    claims: [],
    reasonCode: `stage9:${suffix}`
  };
}

function withTimeline(
  current: AiSkirmishStateV1,
  tick: number,
  kind: AiSkirmishStateV1["timeline"][number]["kind"],
  subjectId: string,
  detail: string
): AiSkirmishStateV1 {
  const eventId = `timeline:${tick}:${kind}:${subjectId}`;
  const event = { eventId, tick, kind, subjectId, detail } as const;
  return {
    ...current,
    timeline: [
      ...current.timeline.filter(
        (candidate) =>
          candidate.eventId !== eventId &&
          (candidate.kind !== kind || candidate.subjectId !== subjectId || candidate.detail !== detail)
      ),
      event
    ]
      .sort((left, right) => left.tick - right.tick || left.eventId.localeCompare(right.eventId))
      .slice(-MAX_TIMELINE_ENTRIES)
  };
}

function routeCapability(observation: AiObservationV1, members: readonly AiObservedActorV1[]): AiRouteCapabilityV1 {
  const transports = observation.actors.filter(
    (actor) => actor.relation === "self" && actor.containerState?.status === "known"
  );
  const waterTransportSeats = transports
    .filter(
      (actor) => actor.containerState?.status === "known" && actor.containerState.value.mobileDomains.includes("water")
    )
    .reduce(
      (total, actor) => total + (actor.containerState?.status === "known" ? actor.containerState.value.capacity : 0),
      0
    );
  const airTransportSeats = transports
    .filter(
      (actor) => actor.containerState?.status === "known" && actor.containerState.value.mobileDomains.includes("air")
    )
    .reduce(
      (total, actor) => total + (actor.containerState?.status === "known" ? actor.containerState.value.capacity : 0),
      0
    );
  return {
    moverDomains: [...new Set(members.flatMap(domains))].sort(),
    targetDomains: [...new Set(members.flatMap(targetDomains))].sort(),
    waterTransportSeats,
    airTransportSeats,
    requiredPassengerSeats: Math.max(1, members.length),
    requiredClearance: 1
  };
}

function nextQuestion(
  observation: AiObservationV1,
  knowledge: AiKnowledgeStateV1
): AiKnowledgeStateV1["questions"][number] | undefined {
  const covered = new Set(observation.map?.scoutCoverageAccessNodeIds ?? []);
  const frontier = [...(observation.map?.frontierAccessNodeIds ?? [])]
    .filter((candidate) => !covered.has(candidate))
    .sort()[0];
  if (!frontier) return undefined;
  const questionId = `question:frontier:${frontier}` as AiKnowledgeStateV1["questions"][number]["questionId"];
  return (
    knowledge.questions.find((question) => question.questionId === questionId) ?? {
      questionId,
      kind: `safe_route:${frontier}`,
      createdTick: observation.tick,
      state: "open"
    }
  );
}

/**
 * Owns the first complete strategic loop: player-fair information questions, bounded incidents,
 * durable squad missions, and a mode-safe concession proposal. Tactical target scoring remains
 * intentionally small until Stage 13, but every emitted action already has a persisted purpose.
 */
export class AiStage9SkirmishManagerV1 implements AiProposalManagerV1 {
  readonly managerId = "stage9.skirmish";

  constructor(
    private readonly profile: AiProfileConfigV1,
    private readonly getCatalog: () => AiCapabilityCatalogV1 | undefined
  ) {}

  propose(observation: AiObservationV1, state: AiBrainStateV1): AiManagerProposalV1 {
    const catalog = this.getCatalog();
    if (!catalog || catalog.generation !== observation.generation) {
      return {
        managerId: this.managerId,
        lane: "army_threat",
        evaluated: false,
        intents: [],
        reasons: ["catalog_not_ready"]
      };
    }

    const combat = ownedCombat(observation, catalog);
    const visibleEnemies = hostileContacts(observation).filter((actor) => actor.visibility === "visible");
    const rememberedEnemies = hostileContacts(observation).filter(
      (actor) =>
        actor.visibility === "last_seen" &&
        observation.tick -
          (actor.logicalPosition.status === "known" ? actor.logicalPosition.observedTick : actor.observedTick) <=
          LAST_SEEN_PURSUIT_TICKS
    );
    const homeBaseActor = homeActor(observation);
    const home = position(homeBaseActor);
    const homeAccess = homeNode(observation);
    const incidents = visibleEnemies.map(
      (enemy) =>
        ({
          incidentId: `incident:${baseId(state)}:${regionId(enemy) ?? enemy.actorId}`,
          baseId: baseId(state),
          regionId: regionId(enemy),
          hostileActorIds: [enemy.actorId],
          kind: incidentKind(enemy),
          confidencePermille: 1000,
          severity: Math.min(1000, canFight(enemy) ? 600 : 250),
          createdTick: observation.tick,
          expiresAt: aiDeadline(observation.tick + THREAT_EXPIRY_TICKS)
        }) satisfies AiThreatIncidentV1
    );
    const incidentById = new Map(
      state.skirmish.incidents
        .filter((incident) => incident.expiresAt.dueTick > observation.tick)
        .map((incident) => [incident.incidentId, incident] as const)
    );
    for (const incident of incidents) incidentById.set(incident.incidentId, incident);
    const liveIncidents = [...incidentById.values()].sort((left, right) =>
      left.incidentId.localeCompare(right.incidentId)
    );
    const currentQuestion = nextQuestion(observation, state.knowledge);
    const coveredScoutNodes = new Set(observation.map?.scoutCoverageAccessNodeIds ?? []);
    const questions = [
      ...state.knowledge.questions
        .filter((question) => question.state === "open" || question.state === "answered")
        .map((question) => {
          const nodeId = question.kind.startsWith("safe_route:")
            ? (question.kind.slice("safe_route:".length) as AiAccessNodeId)
            : null;
          return nodeId && coveredScoutNodes.has(nodeId) ? { ...question, state: "answered" as const } : question;
        }),
      ...(currentQuestion ? [currentQuestion] : [])
    ]
      .filter(
        (question, index, all) => all.findIndex((candidate) => candidate.questionId === question.questionId) === index
      )
      .sort((left, right) => left.questionId.localeCompare(right.questionId));

    let skirmish: AiSkirmishStateV1 = { ...state.skirmish, incidents: liveIncidents };
    for (const incident of incidents)
      skirmish = withTimeline(skirmish, observation.tick, "threat", incident.incidentId, incident.kind);
    if (currentQuestion)
      skirmish = withTimeline(skirmish, observation.tick, "question", currentQuestion.questionId, currentQuestion.kind);

    const intents: AiIntentV1[] = [];
    const nextSquads: AiSquadStateV1[] = [];
    const primaryOwnedActors = new Set<ActorId>();
    const activeDefense = state.squads.find(
      (squad) => squad.role === "defense" && squad.state !== "completed" && squad.state !== "cancelled"
    );
    const activeAttack = state.squads.find(
      (squad) => squad.role === "attack" && squad.state !== "completed" && squad.state !== "cancelled"
    );
    const activeScout = state.squads.find(
      (squad) => squad.role === "scout" && squad.state !== "completed" && squad.state !== "cancelled"
    );
    const protectedActorIds = new Set([
      ...(homeBaseActor ? [homeBaseActor.actorId] : []),
      ...state.bases
        .filter((base) => base.active)
        .flatMap((base) => [base.anchorActorId, ...base.memberActorIds])
        .filter((actorId): actorId is ActorId => actorId !== null)
    ]);
    const localThreat = home
      ? visibleEnemies.find((candidate) => {
          const candidatePosition = position(candidate);
          const targetsProtectedAsset =
            candidate.activeOrder?.status === "known" &&
            candidate.activeOrder.value?.targetActorId !== null &&
            candidate.activeOrder.value?.targetActorId !== undefined &&
            protectedActorIds.has(candidate.activeOrder.value.targetActorId);
          const mobileThreat = candidate.housingCost.status === "known" && candidate.housingCost.value > 0;
          return (
            targetsProtectedAsset ||
            (mobileThreat && candidatePosition !== undefined && distance(home, candidatePosition) <= 12)
          );
        })
      : undefined;

    if (localThreat && combat.length > 0) {
      const defenders = combat.slice(0, Math.max(1, Math.ceil(combat.length * 0.25)));
      defenders.forEach((actor) => primaryOwnedActors.add(actor.actorId));
      const targetPosition = position(localThreat);
      const defenseId = activeDefense?.squadId ?? ("squad:defense:home" as AiSquadId);
      const defensePlanId = `plan:${defenseId}` as AiPlanId;
      const existingLifecycle = activeDefense?.lifecycle;
      const defense: AiSquadStateV1 = {
        squadId: defenseId,
        role: "defense",
        domain: domains(defenders[0] ?? combat[0]!).includes("air") ? "air" : "ground",
        actorIds: defenders.map((actor) => actor.actorId),
        objectiveId: localThreat.actorId,
        state: targetPosition ? "engaged" : "searching",
        lifecycle: {
          targetPlayerNumber: localThreat.owner,
          targetRegionId: regionId(localThreat),
          protectedBaseId: baseId(state),
          rallyNodeId: homeAccess ?? null,
          retreatNodeId: homeAccess ?? null,
          createdTick: existingLifecycle?.createdTick ?? observation.tick,
          assemblyDeadline:
            existingLifecycle?.assemblyDeadline ?? aiDeadline(observation.tick + AI_STAGE_9_ASSEMBLY_TIMEOUT_TICKS),
          effectDeadline: aiDeadline(observation.tick + AI_STAGE_9_PURSUIT_LEASH_TICKS),
          lastUsefulEffectTick: existingLifecycle?.lastUsefulEffectTick ?? null,
          recoveryAttempt: existingLifecycle?.recoveryAttempt ?? 0,
          terminalReason: null
        }
      };
      nextSquads.push(defense);
      if (!activeDefense?.tactics && targetPosition && canTarget(defenders[0] ?? combat[0]!, localThreat)) {
        intents.push({
          ...intentBase(state, defensePlanId, observation.tick, `defend:${localThreat.actorId}`, "army_threat", 940),
          kind: "attack",
          actorIds: defense.actorIds,
          targetActorId: localThreat.actorId,
          targetPosition: null
        });
      } else if (!activeDefense?.tactics && targetPosition) {
        intents.push({
          ...intentBase(state, defensePlanId, observation.tick, `intercept:${localThreat.actorId}`, "army_threat", 900),
          kind: "move",
          actorIds: defense.actorIds,
          logicalPosition: targetPosition
        });
      }
      skirmish = withTimeline(skirmish, observation.tick, "mission", defense.squadId, `defend:${localThreat.actorId}`);
    }

    const focusedPlayer = activeAttack?.lifecycle?.targetPlayerNumber;
    const opponent =
      focusedPlayer === null || focusedPlayer === undefined
        ? (visibleEnemies[0] ?? rememberedEnemies[0])
        : (visibleEnemies.find((candidate) => candidate.owner === focusedPlayer) ??
          rememberedEnemies.find((candidate) => candidate.owner === focusedPlayer) ??
          visibleEnemies[0] ??
          rememberedEnemies[0]);
    const minimumAttack = 6;
    const reserveCount = combat.length >= 8 ? Math.ceil(combat.length * 0.25) : 0;
    const reserveMembers = combat.filter((actor) => !primaryOwnedActors.has(actor.actorId)).slice(0, reserveCount);
    if (reserveMembers.length > 0) {
      reserveMembers.forEach((actor) => primaryOwnedActors.add(actor.actorId));
      const reserveId = "squad:reserve:home" as AiSquadId;
      nextSquads.push({
        squadId: reserveId,
        role: "reserve",
        domain: domains(reserveMembers[0]!).includes("air")
          ? "air"
          : domains(reserveMembers[0]!).includes("water")
            ? "water"
            : "ground",
        actorIds: reserveMembers.map((actor) => actor.actorId),
        objectiveId: null,
        state: "ready",
        lifecycle: {
          targetPlayerNumber: null,
          targetRegionId: null,
          protectedBaseId: baseId(state),
          rallyNodeId: homeAccess ?? null,
          retreatNodeId: homeAccess ?? null,
          createdTick:
            state.squads.find((squad) => squad.squadId === reserveId)?.lifecycle?.createdTick ?? observation.tick,
          assemblyDeadline: aiDeadline(observation.tick + AI_STAGE_9_ASSEMBLY_TIMEOUT_TICKS),
          effectDeadline: aiDeadline(observation.tick + 2400),
          lastUsefulEffectTick: null,
          recoveryAttempt: 0,
          terminalReason: null
        }
      });
    }
    const attackers = combat.filter((actor) => !primaryOwnedActors.has(actor.actorId));
    const attackId = activeAttack?.squadId ?? ("squad:attack:primary" as AiSquadId);
    const attackPlanId = `plan:${attackId}` as AiPlanId;
    if (opponent && attackers.length > 0) {
      const targetNode = node(opponent);
      const sourceNode = node(attackers[0]);
      const route =
        sourceNode && targetNode && observation.map?.accessGraph
          ? queryAiAccessRouteV1(observation.map.accessGraph, {
              queryId: `query:mission:${attackId}:${observation.generation}`,
              kind: "firing_position",
              fromNodeId: sourceNode,
              toNodeId: targetNode,
              capabilities: routeCapability(observation, attackers),
              firingNodeIds: [targetNode]
            } satisfies AiRouteRequestV1)
          : undefined;
      const isReachable = route?.kind === "direct" || route?.kind === "air_or_naval_objective";
      const assemblyExpired =
        activeAttack?.lifecycle?.assemblyDeadline.dueTick !== undefined &&
        activeAttack.lifecycle.assemblyDeadline.dueTick <= observation.tick;
      const readyCount = attackers.length;
      const requiredForVisibleThreat = Math.max(minimumAttack, Math.ceil(visibleEnemies.length * 1.2));
      const fullEngagement =
        readyCount >= requiredForVisibleThreat && readyCount * 1000 >= requiredForVisibleThreat * 750;
      const attackState: AiSquadStateV1["state"] =
        isReachable && (fullEngagement || assemblyExpired) ? "moving" : "forming";
      const attack: AiSquadStateV1 = {
        squadId: attackId,
        role: "attack",
        domain: domains(attackers[0]!).includes("air")
          ? "air"
          : domains(attackers[0]!).includes("water")
            ? "water"
            : "ground",
        actorIds: attackers.map((actor) => actor.actorId),
        objectiveId: opponent.visibility === "visible" ? opponent.actorId : `hypothesis:${opponent.evidenceId}`,
        state: attackState,
        lifecycle: {
          targetPlayerNumber: activeAttack?.lifecycle?.targetPlayerNumber ?? opponent.owner,
          targetRegionId: activeAttack?.lifecycle?.targetRegionId ?? regionId(opponent),
          protectedBaseId: null,
          rallyNodeId: sourceNode ?? null,
          retreatNodeId: homeAccess ?? null,
          createdTick: activeAttack?.lifecycle?.createdTick ?? observation.tick,
          assemblyDeadline:
            activeAttack?.lifecycle?.assemblyDeadline ??
            aiDeadline(observation.tick + AI_STAGE_9_ASSEMBLY_TIMEOUT_TICKS),
          effectDeadline: activeAttack?.lifecycle?.effectDeadline ?? aiDeadline(observation.tick + 2400),
          lastUsefulEffectTick: activeAttack?.lifecycle?.lastUsefulEffectTick ?? null,
          recoveryAttempt: activeAttack?.lifecycle?.recoveryAttempt ?? 0,
          terminalReason: route?.kind === "impossible" ? route.reason : null
        },
        ...(activeAttack?.tactics ? { tactics: activeAttack.tactics } : {})
      };
      nextSquads.push(attack);
      const voluntaryMissions = state.squads.filter(
        (squad) => squad.role === "attack" && squad.state !== "completed"
      ).length;
      const launchRecorded = state.skirmish.timeline.some(
        (event) => event.kind === "mission" && event.subjectId === attackId && event.detail.startsWith("launch:")
      );
      if (route?.kind === "water_transport" || route?.kind === "air_transport") {
        const transportPlanId = `transport:mission:${attackId}` as const;
        if (!state.transport.some((transport) => transport.planId === transportPlanId)) {
          const passengers = attackers.slice(0, Math.max(1, Math.min(attackers.length, 6))).map((actor, index) => ({
            actorId: actor.actorId,
            role: "combat" as const,
            indispensable: index === 0,
            handoff: "squad" as const
          }));
          return {
            managerId: this.managerId,
            lane: "army_threat",
            evaluated: true,
            intents,
            reasons: ["transport_child_seeded", route.kind],
            statePatch: {
              knowledge: {
                ...state.knowledge,
                questions,
                revision: state.knowledge.revision + (currentQuestion ? 1 : 0)
              },
              squads: nextSquads,
              strategy: {
                ...state.strategy,
                stance: "pressure",
                goalId: attackPlanId,
                objectiveId: attack.objectiveId
              },
              skirmish: withTimeline(skirmish, observation.tick, "mission", attackId, `transport:${route.kind}`),
              transportAppend: [
                createAiTransportPlanV1({
                  planId: transportPlanId,
                  routeRequest: {
                    queryId: route.queryId,
                    kind: "movement",
                    fromNodeId: sourceNode!,
                    toNodeId: targetNode!,
                    capabilities: routeCapability(observation, attackers),
                    firingNodeIds: []
                  },
                  route,
                  tick: observation.tick,
                  missionKind: "army_transfer",
                  estimatedTravelTicks: Math.max(1, route.distanceCost),
                  passengers
                })
              ]
            }
          };
        }
      } else if (
        !launchRecorded &&
        attackState === "moving" &&
        route &&
        voluntaryMissions < this.profile.voluntaryOffensiveMissionLimit + 1
      ) {
        const targetPosition = position(opponent);
        if (opponent.visibility === "visible" && canTarget(attackers[0]!, opponent)) {
          intents.push({
            ...intentBase(state, attackPlanId, observation.tick, `attack:${opponent.actorId}`, "army_threat", 760),
            kind: "attack",
            actorIds: attack.actorIds,
            targetActorId: opponent.actorId,
            targetPosition: null
          });
        } else if (targetPosition) {
          intents.push({
            ...intentBase(state, attackPlanId, observation.tick, `search:${opponent.evidenceId}`, "scouting", 650),
            kind: "scout",
            actorIds: attack.actorIds,
            logicalPosition: targetPosition
          });
        }
        skirmish = withTimeline(skirmish, observation.tick, "mission", attackId, `launch:${route.kind}`);
      }
    }

    const neutral = observation.actors
      .filter(
        (actor) => actor.relation === "neutral" && actor.visibility === "visible" && position(actor) !== undefined
      )
      .sort((left, right) => left.actorId.localeCompare(right.actorId))[0];
    const existingNeutralClaim = state.squads.find(
      (squad) =>
        squad.role === "scout" &&
        squad.objectiveId === `neutral:${neutral?.actorId ?? "none"}` &&
        squad.state !== "completed"
    );
    if (neutral && combat[0] && !existingNeutralClaim && !opponent) {
      const claimantId = "squad:scout:neutral" as AiSquadId;
      const claimantPlanId = `plan:${claimantId}` as AiPlanId;
      const claimant: AiSquadStateV1 = {
        squadId: claimantId,
        role: "scout",
        domain: domains(combat[0]!).includes("air")
          ? "air"
          : domains(combat[0]!).includes("water")
            ? "water"
            : "ground",
        actorIds: [combat[0].actorId],
        objectiveId: `neutral:${neutral.actorId}`,
        state: "moving",
        lifecycle: {
          targetPlayerNumber: null,
          targetRegionId: regionId(neutral),
          protectedBaseId: baseId(state),
          rallyNodeId: node(combat[0]!) ?? null,
          retreatNodeId: homeAccess ?? null,
          createdTick: observation.tick,
          assemblyDeadline: aiDeadline(observation.tick + 200),
          effectDeadline: aiDeadline(observation.tick + 800),
          lastUsefulEffectTick: null,
          recoveryAttempt: 0,
          terminalReason: null
        }
      };
      nextSquads.push(claimant);
      intents.push({
        ...intentBase(state, claimantPlanId, observation.tick, `neutral:${neutral.actorId}`, "scouting", 620),
        kind: "move",
        actorIds: claimant.actorIds,
        logicalPosition: position(neutral)!,
        claims: [
          {
            claimId: `claim:neutral:${neutral.actorId}` as AiIntentV1["claims"][number]["claimId"],
            kind: "actor",
            actorId: claimant.actorIds[0]!
          }
        ]
      });
      skirmish = withTimeline(
        skirmish,
        observation.tick,
        "mission",
        claimant.squadId,
        `neutral_claim:${neutral.actorId}`
      );
    }

    if (!opponent && currentQuestion && combat[0] && observation.map?.accessGraph) {
      const target = observation.map.accessGraph.nodes.find(
        (candidate) => candidate.nodeId === currentQuestion.kind.replace("safe_route:", "")
      );
      const scoutPosition = target?.representativePosition;
      if (scoutPosition) {
        const scoutId = activeScout?.squadId ?? ("squad:scout:primary" as AiSquadId);
        const scoutPlanId = `plan:${scoutId}` as AiPlanId;
        const continuingScout = activeScout?.objectiveId === currentQuestion.questionId;
        const retainedScoutMembers = continuingScout && activeScout
          ? combat.filter((actor) => activeScout.actorIds.includes(actor.actorId))
          : [];
        const scoutMembers =
          retainedScoutMembers.length > 0
            ? retainedScoutMembers
            : combat.slice(0, Math.min(3, combat.length));
        const scout: AiSquadStateV1 = {
          squadId: scoutId,
          role: "scout",
          domain: domains(scoutMembers[0] ?? combat[0]!).includes("air")
            ? "air"
            : domains(scoutMembers[0] ?? combat[0]!).includes("water")
              ? "water"
              : "ground",
          actorIds: scoutMembers.map((actor) => actor.actorId),
          objectiveId: currentQuestion.questionId,
          state: "moving",
          lifecycle: {
            targetPlayerNumber: null,
            targetRegionId: target.nodeId,
            protectedBaseId: baseId(state),
            rallyNodeId: node(combat[0]!) ?? null,
            retreatNodeId: homeAccess ?? null,
            createdTick: continuingScout ? (activeScout?.lifecycle?.createdTick ?? observation.tick) : observation.tick,
            assemblyDeadline:
              continuingScout ? (activeScout?.lifecycle?.assemblyDeadline ?? aiDeadline(observation.tick + 200)) : aiDeadline(observation.tick + 200),
            effectDeadline:
              continuingScout ? (activeScout?.lifecycle?.effectDeadline ?? aiDeadline(observation.tick + 800)) : aiDeadline(observation.tick + 800),
            lastUsefulEffectTick: continuingScout ? (activeScout?.lifecycle?.lastUsefulEffectTick ?? null) : null,
            recoveryAttempt: continuingScout ? (activeScout?.lifecycle?.recoveryAttempt ?? 0) : 0,
            terminalReason: null
          },
          ...(continuingScout && activeScout?.tactics ? { tactics: activeScout.tactics } : {})
        };
        nextSquads.push(scout);
        if (!continuingScout || !activeScout?.tactics)
          intents.push({
            ...intentBase(state, scoutPlanId, observation.tick, `scout:${currentQuestion.questionId}`, "scouting", 700),
            kind: "scout",
            actorIds: scout.actorIds,
            logicalPosition: scoutPosition
          });
      }
    }

    const ownModeComplete = observation.modeGoals.some(
      (goal) => goal.owner === observation.playerNumber && goal.state === "completed"
    );
    const ownModeFailed = observation.modeGoals.some(
      (goal) => goal.owner === observation.playerNumber && goal.state === "failed"
    );
    const hasRecovery = observation.actors.some((actor) => actor.relation === "self" && actor.visibility === "owned");
    const hopelessSince =
      ownModeComplete || (hasRecovery && !ownModeFailed)
        ? null
        : (state.skirmish.mode.hopelessSinceTick ?? observation.tick);
    const concessionDue =
      hopelessSince !== null && observation.tick - hopelessSince >= AI_STAGE_9_CONCESSION_HOPELESS_TICKS;
    let mode = {
      state:
        ownModeComplete || ownModeFailed
          ? "finished"
          : concessionDue
            ? "conceding"
            : hopelessSince !== null
              ? "hopeless"
              : "active",
      hopelessSinceTick: hopelessSince,
      concessionIntentId: state.skirmish.mode.concessionIntentId,
      lastReason: ownModeComplete
        ? "authoritative_mode_completed"
        : ownModeFailed
          ? "authoritative_mode_failed"
          : hopelessSince !== null
            ? "no_recoverable_owned_asset"
            : "recovery_route_available"
    } as const;
    if (!ownModeComplete && !ownModeFailed && concessionDue && mode.concessionIntentId === null) {
      const concedePlanId = "plan:mode:concession" as AiPlanId;
      const base = intentBase(state, concedePlanId, observation.tick, "concede", "army_threat", 1000);
      const concede: AiIntentV1 = { ...base, kind: "concede", reason: "sustained_no_recoverable_route" };
      intents.push(concede);
      mode = { ...mode, concessionIntentId: concede.intentId };
      skirmish = withTimeline(
        skirmish,
        observation.tick,
        "mode",
        concede.intentId,
        "concede_after_sustained_hopelessness"
      );
    }

    const retainedSquads = state.squads.filter(
      (squad) =>
        !["defense", "attack", "reserve", "scout"].includes(squad.role) &&
        squad.state !== "completed" &&
        squad.state !== "cancelled"
    );
    const squads = [...retainedSquads, ...nextSquads]
      .filter((squad, index, all) => all.findIndex((candidate) => candidate.squadId === squad.squadId) === index)
      .sort((left, right) => left.squadId.localeCompare(right.squadId));
    const resultSkirmish = { ...skirmish, mode } satisfies AiSkirmishStateV1;
    return {
      managerId: this.managerId,
      lane: "army_threat",
      evaluated: true,
      intents,
      reasons: [
        `question:${currentQuestion?.questionId ?? "none"}`,
        `incidents:${liveIncidents.length}`,
        `combat:${combat.length}`,
        `mode:${mode.state}`
      ],
      statePatch: {
        knowledge: { ...state.knowledge, questions, revision: state.knowledge.revision + (currentQuestion ? 1 : 0) },
        squads,
        strategy: opponent
          ? {
              ...state.strategy,
              stance: localThreat ? "defend" : "pressure",
              goalId: attackPlanId,
              objectiveId: opponent.actorId
            }
          : state.strategy,
        skirmish: resultSkirmish
      }
    };
  }
}
