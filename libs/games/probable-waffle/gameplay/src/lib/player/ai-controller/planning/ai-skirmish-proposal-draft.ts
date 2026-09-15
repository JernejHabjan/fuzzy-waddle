import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import { aiDeadline, type AiAccessNodeId } from "../contracts/ai-core-types";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiBrainStateV1, AiSkirmishStateV1, AiThreatIncidentV1 } from "../contracts/ai-brain-state-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiSkirmishProposalContext } from "./ai-skirmish-proposal-context";
import {
  baseId,
  canFight,
  distance,
  homeActor,
  homeNode,
  hostileContacts,
  incidentKind,
  nextQuestion,
  ownedCombat,
  position,
  regionId,
  withTimeline
} from "./ai-skirmish-support";

const THREAT_EXPIRY_TICKS = 240;
const LAST_SEEN_PURSUIT_TICKS = 1200;

export function createAiSkirmishProposalContext(
  observation: AiObservationV1,
  state: AiBrainStateV1,
  catalog: AiCapabilityCatalogV1
): AiSkirmishProposalContext {
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
  const activeDefense = state.squads.find(
    (squad) => squad.role === "defense" && squad.state !== "completed" && squad.state !== "cancelled"
  );
  const activeAttack = state.squads.find(
    (squad) => squad.role === "attack" && squad.state !== "completed" && squad.state !== "cancelled"
  );
  const activeScout = state.squads.find(
    (squad) => squad.role === "scout" && squad.state !== "completed" && squad.state !== "cancelled"
  );
  const protectedActorIds = new Set<ActorId>([
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
  return {
    observation,
    state,
    catalog,
    combat,
    visibleEnemies,
    rememberedEnemies,
    homeBaseActor,
    home,
    homeAccess,
    incidents,
    liveIncidents,
    currentQuestion,
    questions,
    activeDefense,
    activeAttack,
    activeScout,
    localThreat,
    primaryOwnedActors: new Set(),
    intents: [],
    nextSquads: [],
    skirmish,
    opponent: undefined,
    attackPlanId: undefined
  };
}
