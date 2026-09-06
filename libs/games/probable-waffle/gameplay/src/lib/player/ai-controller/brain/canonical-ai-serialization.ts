import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";

type JsonPrimitive = string | number | boolean | null;
type CanonicalValue = JsonPrimitive | readonly CanonicalValue[] | { readonly [key: string]: CanonicalValue };

/** Recursively sorts object keys and rejects values that cannot cross a deterministic boundary. */
export function canonicalizeAiValue(value: unknown, path = "$"): CanonicalValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`invalid_ai_number:${path}`);
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) return value.map((entry, index) => canonicalizeAiValue(entry, `${path}[${index}]`));
  if (typeof value !== "object") throw new Error(`invalid_ai_value:${path}`);

  const record = value as Record<string, unknown>;
  const output: Record<string, CanonicalValue> = {};
  for (const key of Object.keys(record).sort()) {
    const entry = record[key];
    if (entry === undefined) throw new Error(`invalid_ai_undefined:${path}.${key}`);
    output[key] = canonicalizeAiValue(entry, `${path}.${key}`);
  }
  return output;
}

/** Canonicalizes observation arrays that have set semantics before serialization. */
export function canonicalizeAiObservationV1(observation: AiObservationV1): AiObservationV1 {
  return {
    ...observation,
    actors: [...observation.actors]
      .map((actor) => ({
        ...actor,
        capabilities: [...actor.capabilities]
          .map((capability) => ({
            ...capability,
            domains: [...capability.domains].sort(),
            targetDomains: [...capability.targetDomains].sort()
          }))
          .sort((left, right) => left.id.localeCompare(right.id)),
        activeEffectIds: [...actor.activeEffectIds].sort()
      }))
      .sort((left, right) => left.actorId.localeCompare(right.actorId)),
    resources: [...observation.resources].sort((left, right) => left.resourceType.localeCompare(right.resourceType)),
    accessProducts: [...observation.accessProducts].sort((left, right) => left.queryId.localeCompare(right.queryId)),
    effects: [...observation.effects]
      .map((effect) => ({ ...effect, targetDomains: [...effect.targetDomains].sort() }))
      .sort((left, right) => left.effectId.localeCompare(right.effectId)),
    modeGoals: [...observation.modeGoals]
      .map((goal) => ({
        ...goal,
        targetActorIds: [...goal.targetActorIds].sort(),
        targetAccessNodeIds: [...goal.targetAccessNodeIds].sort()
      }))
      .sort((left, right) => left.id.localeCompare(right.id))
  };
}

/** Canonicalizes persisted arrays that represent keyed sets while preserving ordered RNG/history sequences. */
export function canonicalizeAiBrainStateV1(state: AiBrainStateV1): AiBrainStateV1 {
  return {
    ...state,
    strategy: { ...state.strategy, evidenceIds: [...state.strategy.evidenceIds].sort() },
    opening: {
      ...state.opening,
      plan: {
        ...state.opening.plan,
        steps: [...state.opening.plan.steps]
          .map((step) => ({ ...step, demandIds: [...step.demandIds].sort() }))
          .sort((left, right) => left.stepId.localeCompare(right.stepId))
      }
    },
    knowledge: {
      ...state.knowledge,
      evidence: [...state.knowledge.evidence].sort((left, right) => left.evidenceId.localeCompare(right.evidenceId)),
      questions: [...state.knowledge.questions].sort((left, right) => left.questionId.localeCompare(right.questionId))
    },
    bases: [...state.bases]
      .map((base) => ({ ...base, memberActorIds: [...base.memberActorIds].sort() }))
      .sort((left, right) => left.baseId.localeCompare(right.baseId)),
    economyProduction: {
      demands: [...state.economyProduction.demands]
        .map((demand) => ({
          ...demand,
          satisfiedActorIds: [...demand.satisfiedActorIds].sort(),
          queuedIds: [...demand.queuedIds].sort(),
          constructingIds: [...demand.constructingIds].sort(),
          acceptedNotObservedEffectIds: [...demand.acceptedNotObservedEffectIds].sort(),
          preferredObjectNames: [...demand.preferredObjectNames].sort()
        }))
        .sort((left, right) => left.demandId.localeCompare(right.demandId)),
      forecasts: [...state.economyProduction.forecasts].sort(
        (left, right) => left.resourceType.localeCompare(right.resourceType) || left.horizonTick - right.horizonTick
      )
    },
    reservations: [...state.reservations]
      .map((reservation) => ({
        ...reservation,
        prerequisites: [...reservation.prerequisites].sort((left, right) =>
          serializeCanonicalAiValue(left).localeCompare(serializeCanonicalAiValue(right))
        )
      }))
      .sort((left, right) => left.claimId.localeCompare(right.claimId)),
    waitEdges: [...state.waitEdges].sort((left, right) => left.edgeId.localeCompare(right.edgeId)),
    pendingOutcomes: [...state.pendingOutcomes].sort(
      (left, right) =>
        left.identity.authorityEpoch - right.identity.authorityEpoch ||
        left.identity.sequence - right.identity.sequence ||
        left.kind.localeCompare(right.kind)
    ),
    authority: { ...state.authority, pendingCommandIds: [...state.authority.pendingCommandIds].sort() },
    squads: [...state.squads]
      .map((squad) => ({ ...squad, actorIds: [...squad.actorIds].sort() }))
      .sort((left, right) => left.squadId.localeCompare(right.squadId)),
    transport: [...state.transport]
      .map((plan) => ({
        ...plan,
        passengerIds: [...plan.passengerIds].sort(),
        transportIds: [...plan.transportIds].sort(),
        queryIds: [...plan.queryIds].sort()
      }))
      .sort((left, right) => left.planId.localeCompare(right.planId)),
    fortifications: [...state.fortifications]
      .map((plan) => ({
        ...plan,
        nodeIds: [...plan.nodeIds].sort(),
        completedNodeIds: [...plan.completedNodeIds].sort(),
        protectedBaseIds: [...plan.protectedBaseIds].sort()
      }))
      .sort((left, right) => left.planId.localeCompare(right.planId)),
    support: [...state.support]
      .map((plan) => ({ ...plan, actorIds: [...plan.actorIds].sort(), targetIds: [...plan.targetIds].sort() }))
      .sort((left, right) => left.planId.localeCompare(right.planId)),
    progress: [...state.progress].sort((left, right) => left.planId.localeCompare(right.planId)),
    blockers: [...state.blockers].sort((left, right) => left.blockerId.localeCompare(right.blockerId)),
    recoveryEpisodes: [...state.recoveryEpisodes].sort((left, right) => left.episodeId.localeCompare(right.episodeId)),
    lanes: [...state.lanes].sort((left, right) => left.lane.localeCompare(right.lane)),
    queries: [...state.queries].sort((left, right) => left.queryId.localeCompare(right.queryId)),
    scheduler: {
      ...state.scheduler,
      continuationCursors: [...state.scheduler.continuationCursors].sort((left, right) =>
        left.owner.localeCompare(right.owner)
      )
    }
  };
}

/** Stable JSON representation used by saves, traces and fixture comparison. */
export function serializeCanonicalAiValue(value: unknown): string {
  return JSON.stringify(canonicalizeAiValue(value));
}

/** Browser-safe FNV-1a digest for deterministic comparisons; not a security hash. */
export function digestCanonicalAiValue(value: unknown): string {
  const input = serializeCanonicalAiValue(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
