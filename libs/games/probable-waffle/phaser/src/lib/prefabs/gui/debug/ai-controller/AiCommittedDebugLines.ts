import type { PlayerAiController } from "../../../../player/ai-controller/player-ai-controller";

/** Formats committed decision facts; historical views never borrow current observation or state. */
export class AiCommittedDebugLines {
  static getCommittedPlanningLines(
    controller: PlayerAiController,
    brain: ReturnType<PlayerAiController["getBrainDebugSnapshot"]> | undefined,
    historyOffset: number,
    category: "overview" | "strategy" | "resources" | "production" | "logistics" | "intel" | "thresholds"
  ): string[] {
    if (!brain) return ["=== COMMITTED PLANNER ===", "No committed decision snapshot"];
    if (historyOffset > 0 && ["resources", "production", "logistics", "intel"].includes(category)) {
      return [
        `=== ${category.toUpperCase()} ===`,
        `Selected historical decision ${brain.decisionSequence} at tick ${brain.tick}`,
        "Detailed observation/state rows were not retained in this bounded snapshot",
        "Capture a decision bundle for exact offline inspection"
      ];
    }
    if (category === "overview") {
      return [
        "=== OVERVIEW & REASONS ===",
        `Purpose: ${brain.strategicIntentSummary.objective} (${brain.profileDifficulty})`,
        `Force: ${brain.strategicIntentSummary.force}`,
        `Production: ${brain.strategicIntentSummary.production}`,
        `Economy: ${brain.strategicIntentSummary.economy}`,
        `Next: ${brain.strategicIntentSummary.nextAction}`,
        `Blocker: ${brain.strategicIntentSummary.blocker ?? "none"}`,
        `Tick ${brain.tick}; commitment through ${brain.commitmentUntilTick}; health ${brain.progressHealth}`,
        ...brain.topReasons.slice(0, 6).map((reason) => `Reason: ${reason}`),
        `Recorded decisions: ${brain.decisions.length}; why-not entries: ${brain.whyNot.length}`
      ];
    }
    if (category === "strategy") {
      return [
        "=== STRATEGY & COMBAT ===",
        `Stance: ${brain.stance}; goal ${brain.goalId ?? "none"}`,
        `Commitment until tick: ${brain.commitmentUntilTick}`,
        ...(brain.strategicAssessment
          ? [
              `Choice: ${brain.strategicAssessment.choice}; ${brain.strategicAssessment.reason}`,
              `Force: ${brain.strategicAssessment.readyForce}/${brain.strategicAssessment.requiredForce} compatible units; ` +
                `route ${brain.strategicAssessment.routeDomain ?? "unknown"}; ` +
                `confidence ${brain.strategicAssessment.confidencePermille}‰`,
              `Expected effect by tick ${brain.strategicAssessment.expectedEffectTick ?? "unknown"}; ` +
                `reconsider at ${brain.strategicAssessment.reconsiderTick}`,
              ...brain.strategicAssessment.alternatives.map(
                (alternative) => `Alternative ${alternative.targetActorId}: ${alternative.reason}`
              )
            ]
          : []),
        `Squads: ${brain.skirmish.squads.length}; incidents: ${brain.skirmish.incidents.length}`,
        ...brain.skirmish.squads
          .slice(0, 6)
          .map(
            (squad) =>
              `${squad.squadId}: ${squad.role}/${squad.state}/${squad.script ?? "basic"} → ${squad.objectiveId ?? "none"}`
          ),
        `Why not: ${brain.whyNot[0]?.reason ?? "no rejected or unevaluated alternative recorded"}`
      ];
    }
    if (category === "thresholds") {
      return [
        "=== ADAPTIVE THRESHOLDS ===",
        `Difficulty profile: ${brain.profileDifficulty} (${brain.profileVersion})`,
        `Archetype: ${brain.archetypeId}; adaptation every ${historyOffset === 0 ? "committed eligible decision" : "recorded decision"}`,
        "Engage band: ≥1200‰ local estimate with sufficient confidence",
        "Retreat band: <800‰ local estimate or critical health",
        "Target switch: ≥20% score improvement",
        "Values shown are committed policy, not live recalculation"
      ];
    }
    const state = controller.getBrainState();
    const observation = controller.getCommittedObservation();
    if (!state || !observation) return [`=== ${category.toUpperCase()} ===`, "Current detailed state unavailable"];
    if (category === "resources") {
      return [
        "=== RESOURCES & ECONOMY ===",
        ...observation.resources.map(
          (resource) =>
            `${resource.resourceType}: stock ${resource.stockpile}, reserved ${resource.reservedUnspent}, due ${resource.obligationsDue}`
        ),
        `Macro forecasts: ${state.economyProduction.forecasts.length}`,
        ...state.economyProduction.forecasts
          .slice(0, 6)
          .map(
            (forecast) =>
              `${forecast.resourceType}: ${forecast.amount} by tick ${forecast.horizonTick} @ ${forecast.confidencePermille}‰`
          ),
        `Reservations: ${state.reservations.length}`
      ];
    }
    if (category === "production") {
      return [
        "=== PRODUCTION & TECH ===",
        `Opening: ${state.opening.archetypeId} / ${state.opening.plan.currentStepId ?? "transition"}`,
        ...state.economyProduction.demands
          .slice(0, 10)
          .map(
            (demand) =>
              `${demand.purpose}: ${demand.satisfiedActorIds.length}/${demand.desired} ${demand.capabilityOrRole}`
          ),
        `Adaptation: ${brain.adaptation.lastTransitionReason ?? "no confirmed transition"} ` +
          `@ ${brain.adaptation.lastTransitionTick ?? "n/a"}`,
        ...brain.adaptation.evidence.map(
          (evidence) =>
            `  evidence ${evidence.kind}: ${evidence.sourceContactId} ` +
            `${evidence.consecutiveEvaluations}/2 (${evidence.permittedFacts.join(",")})`
        ),
        ...brain.adaptation.roleTargets.map(
          (target) => `  counter ${target.role}: ${target.desired} (${target.evidenceIds.join(",")})`
        ),
        `Research: ${brain.adaptation.selectedResearchType ?? "no positive legal candidate"} ` +
          `(${brain.adaptation.selectedResearchScore ?? "n/a"})`,
        `Committed production: ${brain.adaptation.cancellationPolicy}`,
        `Active reservations: ${state.reservations.length}`
      ];
    }
    if (category === "logistics") {
      const workers = observation.actors.filter(
        (actor) => actor.relation === "self" && actor.capabilities.some((capability) => capability.family === "gather")
      );
      return [
        "=== LOGISTICS & WORKERS ===",
        `Observed workers: ${workers.length}`,
        `Recovery records: ${brain.recovery.length}`,
        ...brain.recovery
          .slice(0, 8)
          .map((record) => `${record.domain}:${record.cause} attempt ${record.attempt} → ${record.state}`)
      ];
    }
    if (category === "intel") {
      return [
        "=== ENEMY INTEL & SCOUTING ===",
        `Generation ${observation.generation}, tick ${observation.tick}`,
        `Visible: ${observation.threatSummary.visibleEnemyActorIds.length}; ` +
          `remembered: ${observation.threatSummary.rememberedEnemyActorIds.length}`,
        `Capabilities: ${observation.threatSummary.observedCapabilityFamilies.join(", ") || "none observed"}`,
        ...brain.skirmish.questions
          .slice(0, 5)
          .map((question) => `${question.kind}: ${question.state} (${question.questionId})`),
        ...brain.skirmish.incidents
          .slice(0, 5)
          .map(
            (incident) => `${incident.kind}: severity ${incident.severity}, confidence ${incident.confidencePermille}`
          )
      ];
    }
    return ["No committed detail for this category"];
  }

  static getCommandAuthorityLines(
    controller: PlayerAiController,
    brain: ReturnType<PlayerAiController["getBrainDebugSnapshot"]> | undefined,
    historyOffset: number
  ): string[] {
    if (historyOffset > 0) {
      if (!brain) return ["=== COMMAND AUTHORITY ===", "Historical decision not retained"];
      return [
        "=== RECORDED PLAN / COMMAND DRILLDOWN ===",
        ...brain.decisions
          .slice(-10)
          .flatMap((decision) => [
            `${decision.outcome}: ${decision.intent.intentId}`,
            `  plan ${decision.intent.planId}; effect ${decision.intent.effectId}`,
            `  ${decision.reason}${decision.outcome === "rejected" ? `:${decision.detail}` : ""}; claims ${decision.intent.claims.length}`
          ]),
        ...brain.whyNot
          .slice(0, 5)
          .map((entry) => `why-not ${entry.subjectId}: ${entry.status}/${entry.reason ?? "not recorded"}`)
      ];
    }
    const state = controller.getCommandReconciliationSnapshot();
    if (!state) return ["=== COMMAND AUTHORITY ===", "Unavailable"];
    const lines = [
      "=== COMMAND AUTHORITY ===",
      `Health: ${state.health}`,
      `Epoch: ${state.authorityEpoch}`,
      `Terminal Watermark: ${state.processedSequenceWatermark}`,
      `Pending: ${state.pendingCommandIds.length}`
    ];
    for (const commandId of state.pendingCommandIds.slice(-6)) lines.push(`… ${commandId}`);
    lines.push("", `Recent Outcomes: ${state.recentOutcomes.length}`);
    for (const outcome of state.recentOutcomes.slice(-8)) {
      lines.push(
        `#${outcome.sequence} ${outcome.kind}/${outcome.reason} ${outcome.commandId} ` +
          `[${outcome.actorIds.join(",") || "scene"}] → [${outcome.worldLinkIds.join(",") || "none"}]`
      );
      if (outcome.detail) lines.push(`  ${outcome.detail}`);
    }
    for (const decision of brain?.decisions.slice(-6) ?? []) {
      lines.push(`${decision.outcome}: ${decision.intent.kind} ${decision.intent.planId}`);
      lines.push(`  ${decision.intent.intentId} / ${decision.intent.effectId}`);
    }
    return lines;
  }

  static getSquadSupportLines(brain: ReturnType<PlayerAiController["getBrainDebugSnapshot"]> | undefined): string[] {
    const lines = ["=== SQUADS & SUPPORT ==="];
    if (!brain?.skirmish.squads.length) lines.push("No active squads");
    for (const squad of brain?.skirmish.squads ?? []) {
      lines.push(`${squad.squadId}: ${squad.state}/${squad.script ?? "basic"} [${squad.domain}] ${squad.members}`);
      lines.push(
        `  task force ${squad.taskForceId ?? "none"}, objective ${squad.objectiveId ?? "none"}, target ${squad.targetActorId ?? "none"}`
      );
      lines.push(
        `  local ${squad.engagementRatioPermille ?? "?"}‰ @ ${squad.confidencePermille ?? "?"}‰; ` +
          `predicted loss ${squad.predictedFriendlyLossPermille ?? "?"}‰`
      );
      lines.push(
        `  observed losses ${squad.observedLossCount}; last useful effect ${squad.lastUsefulEffectTick ?? "none"}`
      );
      lines.push(
        `  orders ${squad.orderedActorCount}/${squad.members}, damage claims ${squad.damageReservationCount}, ` +
          `reserve ${squad.mobileReserveCount}, oscillation ${squad.oscillationCount}`
      );
      const alternative = squad.objectiveAlternatives[0];
      if (alternative)
        lines.push(`  best alternative ${alternative.objectiveId}=${alternative.score} (${alternative.reason})`);
    }
    lines.push("", "--- Support windows ---");
    if (!brain?.support.length) lines.push("No manual support window (autocast may remain runtime-owned)");
    for (const plan of brain?.support ?? []) {
      lines.push(`${plan.planId}: ${plan.kind}/${plan.state}, useful ${plan.usefulCapacity}`);
      lines.push(
        `  ${plan.spellType ?? "heal"} ${plan.actorIds.join(",")} → ${plan.targetIds.join(",")} until ${plan.expiresAtTick ?? "outcome"}`
      );
      lines.push(`  ${plan.reason}; effect ${plan.effectId ?? "none"}`);
    }
    return lines;
  }

  static getRuntimeLines(
    brain: ReturnType<PlayerAiController["getBrainDebugSnapshot"]> | undefined,
    historyLength: number
  ): string[] {
    if (!brain) return ["=== RUNTIME & LIMITS ===", "No committed decision snapshot"];
    const lines = [
      "=== RUNTIME & LIMITS ===",
      `Tick ${brain.tick}, generation ${brain.generation}, decision ${brain.runtimeLimits.decisionSequence}`,
      `History ${historyLength}, trace decisions ${brain.runtimeLimits.retainedTraceDecisions}`,
      `Completeness o=${brain.completeness.observation}/s=${brain.completeness.priorState}/` +
        `r=${brain.completeness.outcomes}/a=${brain.completeness.alternatives}`,
      `Truncated events ${brain.completeness.truncatedEventCount}`,
      "--- Lane service ---"
    ];
    for (const lane of brain.runtimeLimits.laneService)
      lines.push(`${lane.lane}: deficit ${lane.deficit}, serviced ${lane.lastServicedTick}`);
    lines.push("--- Cursors ---");
    for (const cursor of brain.runtimeLimits.continuationCursors) lines.push(`${cursor.owner}: ${cursor.cursor}`);
    lines.push("JSON export: PlayerAiController.exportBrainDebugHistory() (explicit developer action)");
    lines.push("Live history is read-only; stepping/what-if is available only in the isolated replay workbench.");
    return lines;
  }

  static getTransportLines(
    brain: ReturnType<PlayerAiController["getBrainDebugSnapshot"]> | undefined,
    observation: ReturnType<PlayerAiController["getCommittedObservation"]> | undefined
  ): string[] {
    const graph = observation?.map?.accessGraph;
    const lines = [
      "=== ROUTES & TRANSPORT ===",
      graph
        ? `Graph: ${graph.status} g${graph.generation} s${graph.staticRevision}/d${graph.dynamicRevision}/t${graph.threatRevision}`
        : "Graph: not committed",
      graph
        ? `Regions: ${graph.nodes.length}, links: ${graph.links.length}, transfers: ${graph.transferPoints.length}`
        : "Regions: unavailable"
    ];
    if (!brain?.transportOperations.length) {
      lines.push("", "No active or retained transport plans");
      return lines;
    }
    lines.push("");
    for (const operation of brain.transportOperations) {
      lines.push(`${operation.planId}: ${operation.phase} (${operation.routeKind})`);
      lines.push(`  cargo ${operation.passengers}, carriers ${operation.transports}, seats ${operation.capacity}`);
      lines.push(
        `  route g${operation.routeGeneration}/${operation.graphGeneration ?? "?"}, ` +
          `due ${operation.deadlineTick}, recovery ${operation.recoveryAttempt}`
      );
      if (operation.terminalReason) lines.push(`  reason: ${operation.terminalReason}`);
    }
    return lines;
  }
}
