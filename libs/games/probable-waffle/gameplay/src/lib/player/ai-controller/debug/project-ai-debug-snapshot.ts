import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiDebugSnapshotV1, AiDebugSectionStateV1 } from "../contracts/ai-debug-snapshot-v1";
import type { AiIntentDecisionV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";

const later = (ownerStage: number): AiDebugSectionStateV1 => ({
  status: "not_ready",
  ownerStage,
  reason: `owned_by_stage_${ownerStage}`
});

/** Projects Stage 2 decision facts and honest typed not-ready sections for later owners. */
export function projectAiDebugSnapshot(
  observation: AiObservationV1,
  state: AiBrainStateV1,
  decisions: readonly AiIntentDecisionV1[]
): AiDebugSnapshotV1 {
  const rejected = decisions.filter((decision) => decision.outcome === "rejected");
  const accepted = decisions.filter((decision) => decision.outcome === "accepted");
  const topReasons = [...new Set(decisions.map((decision) => decision.reason))].slice(0, 3);
  const blocker = state.blockers[0] ?? null;
  const graph = observation.map?.accessGraph;
  const transportOperations = state.transport.slice(0, 16).map((plan) => {
    const lifecycle = plan.lifecycle;
    const route = lifecycle?.route;
    const pickup = route && (route.kind === "water_transport" || route.kind === "air_transport")
      ? route.pickupCandidates.find((point) => point.transferId === lifecycle.pickupTransferId)
      : undefined;
    const landing = route && (route.kind === "water_transport" || route.kind === "air_transport")
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
      role: squad.role,
      state: squad.state,
      members: squad.actorIds.length,
      objectiveId: squad.objectiveId,
      targetPlayerNumber: squad.lifecycle?.targetPlayerNumber ?? null,
      assemblyDeadlineTick: squad.lifecycle?.assemblyDeadline.dueTick ?? null,
      effectDeadlineTick: squad.lifecycle?.effectDeadline.dueTick ?? null
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
    whyNot: rejected.slice(0, 32).map((decision) => ({
      subjectId: decision.intent.intentId,
      status: "rejected" as const,
      reason: `${decision.reason}:${decision.detail}`
    })),
    transportOperations,
    skirmish,
    bases,
    fortifications,
    recovery,
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
      alternatives: "complete",
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
        ownerStage: 7,
        reason: state.economyProduction.demands.map((demand) => `${demand.capabilityOrRole}:${demand.desired}`).join(",") || null
      },
      economyLabor: {
        status: "ready",
        ownerStage: 7,
        reason: state.economyProduction.forecasts.length ? "600_tick_forecast_committed" : "no_macro_forecast"
      },
      intelligenceEnvironment: { status: "ready", ownerStage: 9, reason: skirmish.questions[0]?.questionId ?? "no_open_question" },
      squadsSupport: { status: "ready", ownerStage: 9, reason: skirmish.squads[0]?.squadId ?? "no_active_squad" },
      transport: {
        status: "ready",
        ownerStage: 8,
        reason: transportOperations.map((operation) => `${operation.planId}:${operation.phase}`).join(",") || "no_active_transport_plan"
      },
      basesFortifications: {
        status: "ready",
        ownerStage: 11,
        reason: [...bases.map((base) => `${base.baseId}:${base.lifecycle}`), ...fortifications.map((plan) => `${plan.planId}:${plan.lifecycle}`)].join(",") || "main_structure_not_observed"
      },
      decisionsRecovery: { status: "ready", ownerStage: 12, reason: recovery[0] ? `${recovery[0].domain}:${recovery[0].state}` : "no_active_recovery" },
      runtimeLimits: later(6)
    }
  };
}
