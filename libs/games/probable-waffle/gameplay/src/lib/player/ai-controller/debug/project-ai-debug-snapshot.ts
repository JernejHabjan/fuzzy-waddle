import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiDebugSnapshotV1 } from "../contracts/ai-debug-snapshot-v1";
import type { AiIntentDecisionV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiManagerProposalV1 } from "../planning/ai-manager-proposal";

/** Exact recorded answer for a saved subject; absence is explicit and never recomputed from live state. */
export function findAiWhyNotExplanationV1(
  snapshot: AiDebugSnapshotV1,
  subjectId: string
): AiDebugSnapshotV1["whyNot"][number] {
  return (
    snapshot.whyNot.find((entry) => entry.subjectId === subjectId) ?? {
      subjectId,
      status: "not_recorded",
      reason: null
    }
  );
}

/** Projects Stage 2 decision facts and honest typed not-ready sections for later owners. */
export function projectAiDebugSnapshot(
  observation: AiObservationV1,
  state: AiBrainStateV1,
  decisions: readonly AiIntentDecisionV1[],
  proposals: readonly AiManagerProposalV1[] = []
): AiDebugSnapshotV1 {
  const rejected = decisions.filter((decision) => decision.outcome === "rejected");
  const accepted = decisions.filter((decision) => decision.outcome === "accepted");
  const topReasons = [
    ...new Set([...decisions.map((decision) => decision.reason), ...proposals.flatMap((proposal) => proposal.reasons)])
  ].slice(0, 3);
  const blocker = state.blockers[0] ?? null;
  const graph = observation.map?.accessGraph;
  const transportOperations = state.transport.slice(0, 16).map((plan) => {
    const lifecycle = plan.lifecycle;
    const route = lifecycle?.route;
    const pickup =
      route && (route.kind === "water_transport" || route.kind === "air_transport")
        ? route.pickupCandidates.find((point) => point.transferId === lifecycle.pickupTransferId)
        : undefined;
    const landing =
      route && (route.kind === "water_transport" || route.kind === "air_transport")
        ? route.landingCandidates.find((point) => point.transferId === lifecycle.landingTransferId)
        : undefined;
    return {
      planId: plan.planId,
      phase: plan.phase,
      routeKind: route?.kind ?? "legacy",
      routeGeneration: lifecycle?.routeGeneration ?? 0,
      graphGeneration: graph?.generation ?? null,
      passengers: plan.passengerIds.length,
      transports: plan.transportIds.length,
      capacity: lifecycle ? `${lifecycle.assignedCapacity}/${lifecycle.requiredCapacity}` : "unknown",
      deadlineTick: lifecycle?.phaseDeadline.dueTick ?? observation.tick,
      recoveryAttempt: lifecycle?.recoveryAttempt ?? 0,
      terminalReason: lifecycle?.terminalReason ?? null,
      pickupPosition: pickup?.passengerPosition ?? null,
      landingPosition: landing?.passengerPosition ?? null
    };
  });
  const skirmish = {
    questions: state.knowledge.questions.slice(0, 16).map((question) => ({ ...question })),
    incidents: state.skirmish.incidents.slice(0, 16).map((incident) => ({
      incidentId: incident.incidentId,
      kind: incident.kind,
      severity: incident.severity,
      confidencePermille: incident.confidencePermille,
      expiresAtTick: incident.expiresAt.dueTick
    })),
    squads: state.squads.slice(0, 16).map((squad) => ({
      squadId: squad.squadId,
      taskForceId: squad.tactics?.taskForceId ?? null,
      role: squad.role,
      domain: squad.domain,
      state: squad.state,
      members: squad.actorIds.length,
      objectiveId: squad.objectiveId,
      targetActorId: squad.tactics?.targetActorId ?? null,
      targetPlayerNumber: squad.lifecycle?.targetPlayerNumber ?? null,
      assemblyDeadlineTick: squad.lifecycle?.assemblyDeadline.dueTick ?? null,
      effectDeadlineTick: squad.lifecycle?.effectDeadline.dueTick ?? null,
      script: squad.tactics?.script ?? null,
      engagementRatioPermille: squad.tactics?.engagementRatioPermille ?? null,
      confidencePermille: squad.tactics?.confidencePermille ?? null,
      predictedFriendlyLossPermille: squad.tactics?.predictedFriendlyLossPermille ?? null,
      observedLossCount: squad.tactics?.observedLossCount ?? 0,
      lastUsefulEffectTick: squad.lifecycle?.lastUsefulEffectTick ?? null,
      targetSwitchReason:
        squad.tactics?.targetActorId === squad.objectiveId
          ? "committed_or_best_by_20_percent"
          : "objective_target_differs",
      damageReservationCount: squad.tactics?.damageReservations.length ?? 0,
      orderedActorCount: squad.tactics?.orderedActorIds.length ?? 0,
      oscillationCount: squad.tactics?.oscillationCount ?? 0,
      mobileReserveCount: squad.tactics?.mobileReserveActorIds.length ?? 0,
      assignedPositions: squad.tactics?.assignedPositions ?? [],
      objectiveAlternatives: squad.tactics?.objectiveAlternatives ?? []
    })),
    mode: {
      state: state.skirmish.mode.state,
      hopelessSinceTick: state.skirmish.mode.hopelessSinceTick,
      concessionIntentId: state.skirmish.mode.concessionIntentId,
      reason: state.skirmish.mode.lastReason
    },
    timeline: state.skirmish.timeline.slice(-32).map((event) => ({ ...event }))
  };
  const bases = state.bases.slice(0, 16).map((base) => ({
    baseId: base.baseId,
    lifecycle: base.lifecycle ?? (base.active ? "active" : "lost"),
    anchorActorId: base.anchorActorId,
    memberCount: base.memberActorIds.length,
    accessNodeId: base.accessNodeId ?? null,
    reservedSiteKey: base.reservedSiteKey ?? null,
    rejectedSiteCount: base.rejectedSiteKeys?.length ?? 0,
    expansionTrigger: base.expansion?.trigger ?? null
  }));
  const fortifications = state.fortifications.slice(0, 16).map((plan) => ({
    planId: plan.planId,
    baseId: plan.graph?.baseId ?? plan.protectedBaseIds[0] ?? null,
    lifecycle: plan.lifecycle,
    nodes: (plan.graph?.nodes ?? []).slice(0, 24).map((node) => ({
      nodeId: node.nodeId,
      kind: node.kind,
      lifecycle: node.lifecycle,
      position: node.position,
      marginalCoverage: node.marginalCoverage,
      targetDomains: node.targetDomains,
      defenderPostReachable: node.defenderPostReachable,
      componentId: node.componentId,
      dependsOnNodeId: node.dependsOnNodeId
    })),
    terrainAnchorTileKeys: plan.graph?.terrainAnchorTileKeys ?? [],
    protectedAssetCount: plan.graph?.protectedAssetIds.length ?? 0,
    openingNodeId: plan.graph?.openingNodeId ?? null,
    wholeConnectivity: plan.graph?.wholeConnectivity ?? "unknown",
    incrementalConnectivity: plan.graph?.incrementalConnectivity ?? "unknown",
    spendPermille: plan.graph?.budget.spendPermille ?? null,
    breachReason: plan.graph?.breach.reason ?? null,
    breachRisk: plan.graph?.breach.risk ?? "unknown",
    recoveryAttempts: plan.graph?.breach.recoveryAttempts ?? 0,
    defenderPosts: plan.graph?.defenderPosts.length ?? 0,
    reachableDefenderPosts: plan.graph?.defenderPosts.filter((post) => post.reachable).length ?? 0,
    budgetRemaining: Object.entries(plan.graph?.budget.remainingByResource ?? {})
      .filter((entry): entry is [string, number] => entry[1] !== undefined)
      .map(([resourceType, amount]) => ({ resourceType, amount }))
      .sort((left, right) => left.resourceType.localeCompare(right.resourceType))
  }));
  const recovery = state.recovery.records.slice(0, 32).map((entry) => ({
    recoveryKey: entry.recoveryKey,
    domain: entry.domain,
    cause: entry.cause,
    attempt: entry.attempt,
    state: entry.state,
    nextRetryTick: entry.nextRetryTick,
    phaseDeadlineTick: entry.phaseDeadline.dueTick,
    alternate: entry.alternate,
    releasedClaimCount: entry.releasedClaimIds.length
  }));
  const support = state.support.slice(0, 32).map((plan) => ({
    planId: plan.planId,
    kind: plan.kind ?? "legacy",
    actorIds: [...plan.actorIds],
    targetIds: [...plan.targetIds],
    spellType: plan.spellType ?? null,
    state: plan.state ?? "reserved",
    effectId: plan.effectId ?? null,
    usefulCapacity: plan.usefulCapacity ?? 0,
    expiresAtTick: plan.expiresAt?.dueTick ?? null,
    reason: plan.reason ?? "legacy_support_assignment"
  }));
  const adaptation = {
    evidence: state.economyProduction.adaptation.evidence
      .slice(0, 16)
      .map((entry) => ({ ...entry, permittedFacts: [...entry.permittedFacts] })),
    roleTargets: state.economyProduction.adaptation.activeRoleTargets
      .slice(0, 8)
      .map((target) => ({ ...target, evidenceIds: [...target.evidenceIds] })),
    lastTransitionTick: state.economyProduction.adaptation.lastTransitionTick,
    lastTransitionReason: state.economyProduction.adaptation.lastTransitionReason,
    selectedResearchType: state.economyProduction.adaptation.selectedResearchType,
    selectedResearchScore: state.economyProduction.adaptation.selectedResearchScore,
    cancellationPolicy: state.economyProduction.adaptation.cancellationPolicy
  };

  return {
    schemaVersion: 1,
    playerNumber: state.playerNumber,
    faction: state.faction,
    profileVersion: state.profileVersion,
    profileDifficulty: state.profileDifficulty ?? "unknown",
    archetypeId: state.opening.archetypeId,
    tick: observation.tick,
    generation: observation.generation,
    decisionSequence: state.scheduler.decisionSequence,
    stance: state.strategy.stance,
    goalId: state.strategy.goalId,
    commitmentUntilTick: state.strategy.commitmentDeadline.dueTick,
    topReasons,
    decisions,
    nextActions: accepted.slice(0, 3).map((decision) => `${decision.intent.kind}:${decision.intent.reasonCode}`),
    mainBlockingReason: blocker?.cause ?? rejected[0]?.reason ?? null,
    whyNot: [
      ...rejected.slice(0, 24).map((decision) => ({
        subjectId: decision.intent.intentId,
        status: "rejected" as const,
        reason: `${decision.reason}:${decision.detail}`
      })),
      ...state.pendingOutcomes
        .filter((outcome) => outcome.kind === "dispatched" || outcome.kind === "applied" || outcome.kind === "active")
        .slice(0, 8)
        .map((outcome) => ({
          subjectId: outcome.identity.commandId,
          status: "outcome_unresolved" as const,
          reason: outcome.kind
        })),
      ...proposals
        .filter((proposal) => !proposal.evaluated)
        .slice(0, 8)
        .map((proposal) => ({
          subjectId: proposal.managerId,
          status: "not_evaluated" as const,
          reason: proposal.reasons.join(",") || "not_recorded"
        }))
    ],
    transportOperations,
    skirmish,
    bases,
    fortifications,
    recovery,
    support,
    adaptation,
    runtimeLimits: {
      decisionSequence: state.scheduler.decisionSequence,
      continuationCursors: state.scheduler.continuationCursors,
      laneService: state.lanes.map((lane) => ({
        lane: lane.lane,
        deficit: lane.deficit,
        lastServicedTick: lane.lastServicedTick
      })),
      retainedTraceDecisions: decisions.length
    },
    progressHealth:
      state.authority.health === "technical_fault"
        ? "technical_fault"
        : blocker?.status === "recovering"
          ? "recovering"
          : blocker?.status === "failed_optional"
            ? "failed_optional"
            : blocker
              ? "waiting"
              : "healthy",
    causalIndex: decisions.slice(0, 64).map((decision) => ({
      causeId: decision.intent.intentId,
      causeKind: "intent",
      relatedIds: [
        decision.intent.planId,
        decision.intent.effectId,
        ...decision.intent.claims.map((claim) => claim.claimId)
      ].sort(),
      tick: observation.tick
    })),
    completeness: {
      observation: "complete",
      priorState: "complete",
      outcomes: "complete",
      alternatives: proposals.every((proposal) => proposal.evaluated) ? "complete" : "not_recorded",
      missingRanges: [],
      truncatedEventCount: Math.max(0, decisions.length - 64)
    },
    sections: {
      buildOrder: {
        status: "ready",
        ownerStage: 7,
        reason: state.opening.plan.currentStepId ?? "opening_transition"
      },
      productionComposition: {
        status: "ready",
        ownerStage: 14,
        reason:
          adaptation.lastTransitionReason ??
          (state.economyProduction.demands.map((demand) => `${demand.capabilityOrRole}:${demand.desired}`).join(",") ||
            null)
      },
      economyLabor: {
        status: "ready",
        ownerStage: 7,
        reason: state.economyProduction.forecasts.length ? "600_tick_forecast_committed" : "no_macro_forecast"
      },
      intelligenceEnvironment: {
        status: "ready",
        ownerStage: 9,
        reason: skirmish.questions[0]?.questionId ?? "no_open_question"
      },
      squadsSupport: { status: "ready", ownerStage: 13, reason: skirmish.squads[0]?.squadId ?? "no_active_squad" },
      transport: {
        status: "ready",
        ownerStage: 8,
        reason:
          transportOperations.map((operation) => `${operation.planId}:${operation.phase}`).join(",") ||
          "no_active_transport_plan"
      },
      basesFortifications: {
        status: "ready",
        ownerStage: 11,
        reason:
          [
            ...bases.map((base) => `${base.baseId}:${base.lifecycle}`),
            ...fortifications.map((plan) => `${plan.planId}:${plan.lifecycle}`)
          ].join(",") || "main_structure_not_observed"
      },
      decisionsRecovery: {
        status: "ready",
        ownerStage: 12,
        reason: recovery[0] ? `${recovery[0].domain}:${recovery[0].state}` : "no_active_recovery"
      },
      runtimeLimits: { status: "ready", ownerStage: 13, reason: `decision:${state.scheduler.decisionSequence}` }
    }
  };
}
