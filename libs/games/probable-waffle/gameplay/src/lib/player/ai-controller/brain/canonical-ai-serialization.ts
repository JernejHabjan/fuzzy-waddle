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
        activeEffectIds: [...actor.activeEffectIds].sort(),
        ...(actor.combatProfile?.status === "known"
          ? {
              combatProfile: {
                ...actor.combatProfile,
                value: {
                  ...actor.combatProfile.value,
                  attacks: [...actor.combatProfile.value.attacks]
                    .map((attack) => ({ ...attack, targetDomains: [...attack.targetDomains].sort() }))
                    .sort((left, right) => serializeCanonicalAiValue(left).localeCompare(serializeCanonicalAiValue(right))),
                  spells: [...actor.combatProfile.value.spells]
                    .map((spell) => ({ ...spell, targetDomains: [...spell.targetDomains].sort() }))
                    .sort((left, right) => left.spellType.localeCompare(right.spellType)),
                  statuses: [...actor.combatProfile.value.statuses]
                    .sort((left, right) => left.type.localeCompare(right.type) || left.remainingTicks - right.remainingTicks)
                }
              }
            }
          : actor.combatProfile ? { combatProfile: actor.combatProfile } : {}),
        ...(actor.containerState?.status === "known"
          ? {
              containerState: {
                ...actor.containerState,
                value: {
                  ...actor.containerState.value,
                  passengerIds: [...actor.containerState.value.passengerIds].sort(),
                  pendingPassengerIds: [...actor.containerState.value.pendingPassengerIds].sort(),
                  mobileDomains: [...actor.containerState.value.mobileDomains].sort()
                }
              }
            }
          : actor.containerState
            ? { containerState: actor.containerState }
            : {})
      }))
      .sort((left, right) => left.actorId.localeCompare(right.actorId)),
    resources: [...observation.resources].sort((left, right) => left.resourceType.localeCompare(right.resourceType)),
    accessProducts: [...observation.accessProducts].sort((left, right) => left.queryId.localeCompare(right.queryId)),
    effects: [...observation.effects]
      .map((effect) => ({ ...effect, targetDomains: [...effect.targetDomains].sort() }))
      .sort((left, right) => left.effectId.localeCompare(right.effectId)),
    researchCandidates: [...observation.researchCandidates]
      .map((candidate) => ({
        ...candidate,
        cost: Object.fromEntries(Object.entries(candidate.cost).sort(([left], [right]) => left.localeCompare(right)))
      }))
      .sort((left, right) => left.producerId.localeCompare(right.producerId) || left.researchType.localeCompare(right.researchType)),
    modeGoals: [...observation.modeGoals]
      .map((goal) => ({
        ...goal,
        targetActorIds: [...goal.targetActorIds].sort(),
        targetAccessNodeIds: [...goal.targetAccessNodeIds].sort()
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    threatSummary: {
      ...observation.threatSummary,
      visibleEnemyActorIds: [...observation.threatSummary.visibleEnemyActorIds].sort(),
      rememberedEnemyActorIds: [...observation.threatSummary.rememberedEnemyActorIds].sort(),
      observedCapabilityFamilies: [...observation.threatSummary.observedCapabilityFamilies].sort()
    },
    ...(observation.map
      ? {
          map: {
            ...observation.map,
            frontierAccessNodeIds: [...observation.map.frontierAccessNodeIds].sort(),
            scoutCoverageAccessNodeIds: [...observation.map.scoutCoverageAccessNodeIds].sort(),
            dynamicObstacleActorIds: [...observation.map.dynamicObstacleActorIds].sort(),
            ...(observation.map.constructionCells
              ? { constructionCells: [...observation.map.constructionCells].sort((left, right) => left.tileKey.localeCompare(right.tileKey)) }
              : {}),
            ...(observation.map.accessGraph
              ? {
                  accessGraph: {
                    ...observation.map.accessGraph,
                    nodes: [...observation.map.accessGraph.nodes].sort((left, right) => left.nodeId.localeCompare(right.nodeId)),
                    links: [...observation.map.accessGraph.links].sort((left, right) => left.linkId.localeCompare(right.linkId)),
                    transferPoints: [...observation.map.accessGraph.transferPoints].sort((left, right) =>
                      left.transferId.localeCompare(right.transferId)
                    ),
                    unknownNodeIds: [...observation.map.accessGraph.unknownNodeIds].sort()
                  }
                }
              : {})
          }
        }
      : {})
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
    skirmish: {
      ...state.skirmish,
      incidents: [...state.skirmish.incidents]
        .map((incident) => ({ ...incident, hostileActorIds: [...incident.hostileActorIds].sort() }))
        .sort((left, right) => left.incidentId.localeCompare(right.incidentId)),
      timeline: [...state.skirmish.timeline]
        .sort((left, right) => left.tick - right.tick || left.eventId.localeCompare(right.eventId))
    },
    bases: [...state.bases]
      .map((base) => ({
        ...base,
        memberActorIds: [...base.memberActorIds].sort(),
        ...(base.rejectedSiteKeys
          ? { rejectedSiteKeys: [...base.rejectedSiteKeys].sort((left, right) => left.siteKey.localeCompare(right.siteKey)) }
          : {})
      }))
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
      ),
      adaptation: {
        ...state.economyProduction.adaptation,
        evidence: [...state.economyProduction.adaptation.evidence]
          .map((evidence) => ({ ...evidence, permittedFacts: [...evidence.permittedFacts].sort() }))
          .sort((left, right) => left.evidenceId.localeCompare(right.evidenceId)),
        activeRoleTargets: [...state.economyProduction.adaptation.activeRoleTargets]
          .map((target) => ({ ...target, evidenceIds: [...target.evidenceIds].sort() }))
          .sort((left, right) => left.role.localeCompare(right.role))
      }
    },
    recovery: {
      records: [...state.recovery.records]
        .map((record) => ({ ...record, releasedClaimIds: [...record.releasedClaimIds].sort() }))
        .sort((left, right) => left.recoveryKey.localeCompare(right.recoveryKey))
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
      .map((squad) => ({
        ...squad,
        actorIds: [...squad.actorIds].sort(),
        ...(squad.tactics
          ? {
              tactics: {
                ...squad.tactics,
                orderedActorIds: [...squad.tactics.orderedActorIds].sort(),
                assignedPositions: [...squad.tactics.assignedPositions].sort((left, right) => left.actorId.localeCompare(right.actorId)),
                damageReservations: [...squad.tactics.damageReservations].sort(
                  (left, right) => left.impactTick - right.impactTick || left.actorId.localeCompare(right.actorId)
                ),
                protectedRouteNodeIds: [...squad.tactics.protectedRouteNodeIds].sort(),
                mobileReserveActorIds: [...squad.tactics.mobileReserveActorIds].sort(),
                objectiveAlternatives: [...squad.tactics.objectiveAlternatives].sort(
                  (left, right) => right.score - left.score || left.objectiveId.localeCompare(right.objectiveId)
                )
              }
            }
          : {})
      }))
      .sort((left, right) => left.squadId.localeCompare(right.squadId)),
    transport: [...state.transport]
      .map((plan) => ({
        ...plan,
        passengerIds: [...plan.passengerIds].sort(),
        transportIds: [...plan.transportIds].sort(),
        queryIds: [...plan.queryIds].sort(),
        ...(plan.lifecycle
          ? {
              lifecycle: {
                ...plan.lifecycle,
                manifest: [...plan.lifecycle.manifest].sort((left, right) => left.actorId.localeCompare(right.actorId)),
                assignedTransportIds: [...plan.lifecycle.assignedTransportIds].sort(),
                seatAssignments: [...plan.lifecycle.seatAssignments]
                  .map((assignment) => ({ ...assignment, passengerIds: [...assignment.passengerIds].sort() }))
                  .sort((left, right) => left.transportId.localeCompare(right.transportId)),
                escortIds: [...plan.lifecycle.escortIds].sort(),
                pendingIntentIds: [...plan.lifecycle.pendingIntentIds].sort(),
                capacityDemand: plan.lifecycle.capacityDemand
                  ? {
                      ...plan.lifecycle.capacityDemand,
                      satisfiedActorIds: [...plan.lifecycle.capacityDemand.satisfiedActorIds].sort(),
                      queuedIds: [...plan.lifecycle.capacityDemand.queuedIds].sort(),
                      constructingIds: [...plan.lifecycle.capacityDemand.constructingIds].sort(),
                      acceptedNotObservedEffectIds: [...plan.lifecycle.capacityDemand.acceptedNotObservedEffectIds].sort(),
                      preferredObjectNames: [...plan.lifecycle.capacityDemand.preferredObjectNames].sort()
                    }
                  : null
              }
            }
          : {})
      }))
      .sort((left, right) => left.planId.localeCompare(right.planId)),
    fortifications: [...state.fortifications]
      .map((plan) => ({
        ...plan,
        nodeIds: [...plan.nodeIds].sort(),
        completedNodeIds: [...plan.completedNodeIds].sort(),
        protectedBaseIds: [...plan.protectedBaseIds].sort(),
        ...(plan.graph
          ? {
              graph: {
                ...plan.graph,
                terrainAnchorTileKeys: [...plan.graph.terrainAnchorTileKeys].sort(),
                protectedAssetIds: [...plan.graph.protectedAssetIds].sort(),
                nodes: [...plan.graph.nodes]
                  .map((node) => ({
                    ...node,
                    footprintTileKeys: [...node.footprintTileKeys].sort(),
                    targetDomains: [...node.targetDomains].sort()
                  }))
                  .sort((left, right) => left.nodeId.localeCompare(right.nodeId)),
                defenderPosts: [...plan.graph.defenderPosts]
                  .map((post) => ({ ...post, assignedActorIds: [...post.assignedActorIds].sort() }))
                  .sort((left, right) => left.nodeId.localeCompare(right.nodeId)),
                breach: { ...plan.graph.breach, missingNodeIds: [...plan.graph.breach.missingNodeIds].sort() }
              }
            }
          : {})
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
