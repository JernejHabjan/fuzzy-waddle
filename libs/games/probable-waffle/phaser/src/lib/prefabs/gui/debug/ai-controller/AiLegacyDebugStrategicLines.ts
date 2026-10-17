import type { PlayerAiController } from "../../../../player/ai-controller/player-ai-controller";

/** Dormant legacy diagnostics retained for generated-label compatibility, never used by the committed panel. */
export class AiLegacyDebugStrategicLines {
  static getOverviewLines(controller: PlayerAiController, now: number): string[] {
    const bb = controller.blackboard;
    const trace = controller.playerAiControllerAgent.getDebugSnapshot();
    const brain = controller.getBrainDebugSnapshot();
    const lastDecision = trace.events.at(-1);
    const lines: string[] = [];
    lines.push(`--- Strategy: ${bb.currentStrategy} ---`);
    lines.push(`Base Size: ${bb.baseSize}`);
    lines.push(`Units: ${bb.units.length} (Workers: ${bb.workers.length})`);
    lines.push(`Military Str: ${bb.militaryStrength.toFixed(0)}`);
    lines.push(`Resources: ${bb.getTotalResources().toFixed(0)}`);
    lines.push(`Decision Trace: ${trace.events.length}/${trace.eventLimit}`);
    lines.push(
      brain
        ? `Purpose: ${brain.stance} → ${brain.goalId ?? "none"} (${brain.profileDifficulty})`
        : "Purpose: planner not yet committed"
    );
    if (brain) lines.push(`Next: ${brain.nextActions.join(", ") || "awaiting domain proposal"}`);
    const reconciliation = controller.getCommandReconciliationSnapshot();
    lines.push(
      reconciliation
        ? `Command Health: ${reconciliation.health} (${reconciliation.pendingCommandIds.length} pending)`
        : "Command Health: unavailable"
    );
    lines.push(
      lastDecision
        ? `Last Decision: ${lastDecision.action} → ${lastDecision.outcome} (${lastDecision.reason})`
        : "Last Decision: not recorded"
    );
    return lines;
  }

  static getStrategyLines(controller: PlayerAiController, now: number): string[] {
    const bb = controller.blackboard;
    const agent = controller.playerAiControllerAgent;
    const lines: string[] = [];

    lines.push(`=== STRATEGY & COMBAT ===`);
    lines.push(`Current: ${bb.currentStrategy}`);
    const brain = controller.getBrainDebugSnapshot();
    if (brain) {
      lines.push(`Planner stance: ${brain.stance}`);
      lines.push(`Commitment until tick: ${brain.commitmentUntilTick}`);
      lines.push(`Why not: ${brain.whyNot[0]?.reason ?? "not recorded"}`);
    }
    const locked = bb.isStrategyLocked(now);
    if (locked) {
      const remainingMs = bb.strategy.modeLockedUntil - now;
      lines.push(`Locked: ${(remainingMs / 1000).toFixed(1)}s remaining`);
    } else {
      lines.push(`Locked: No`);
    }

    lines.push(``);
    lines.push(`--- Power Analysis ---`);
    lines.push(`Own Military Strength: ${bb.militaryStrength.toFixed(0)}`);
    lines.push(`Enemy Military Strength: ${bb.enemyMilitaryStrength.toFixed(0)}`);
    const attackPowerRatio = bb.getAttackPowerRatio(now);
    lines.push(`Power Ratio: ${attackPowerRatio.toFixed(2)}`);

    lines.push(``);
    lines.push(`--- Units ---`);
    lines.push(`Total Units: ${bb.units.length}`);
    lines.push(`Military: ${bb.units.length - bb.workers.length}`);
    lines.push(`Workers: ${bb.workers.length}`);
    lines.push(`Defending: ${bb.defendingUnits.length}`);
    lines.push(`In Combat: ${bb.enemiesInCombat.length}`);

    lines.push(``);
    lines.push(`--- Targets ---`);
    if (bb.primaryTarget) {
      lines.push(`Primary: ${bb.primaryTarget.name}`);
    } else {
      lines.push(`Primary: None`);
    }
    lines.push(`Visible Enemies: ${bb.visibleEnemies.length}`);
    lines.push(`Enemies Near Base: ${bb.enemiesNearBase.length}`);

    lines.push(``);
    lines.push(`--- Combat Engagements ---`);
    lines.push(`Active: ${bb.combat.engagements.length}`);
    if (bb.combat.lastEngagementAt > 0) {
      const timeSince = (now - bb.combat.lastEngagementAt) / 1000;
      lines.push(`Last: ${timeSince.toFixed(1)}s ago`);
    }

    return lines;
  }


  static getIntelLines(controller: PlayerAiController, now: number): string[] {
    const bb = controller.blackboard;
    const lines: string[] = [];
    const observation = controller.getCommittedObservation();
    const observationDebug = controller.getObservationDebugSnapshot();

    lines.push(`=== ENEMY INTEL & SCOUTING ===`);

    lines.push(`--- Fair Observation ---`);
    lines.push(`Policy: ${observationDebug.policy}`);
    lines.push(
      `Generation: ${observationDebug.committedGeneration}/${observationDebug.requestedGeneration} ` +
        `at tick ${observationDebug.committedTick ?? "pending"}; ` +
        `age ${observationDebug.observationAgeTicks ?? "unknown"}`
    );
    lines.push(
      `Visible / remembered: ${observationDebug.visibleContactCount} / ${observationDebug.rememberedContactCount}`
    );
    lines.push(`Unknown facts: ${observationDebug.unknownFactCount}`);
    lines.push(
      `Access revision / cursor: ${observationDebug.queryInputRevision} / ${observationDebug.queryContinuationCursor}`
    );
    lines.push(`Invalidation debt: ${observationDebug.invalidationDebt}`);
    if (observationDebug.lastCommitError) lines.push(`Observation error: ${observationDebug.lastCommitError}`);
    if (observation) {
      const accessStates = observation.accessProducts.reduce<Record<string, number>>((counts, product) => {
        counts[product.status] = (counts[product.status] ?? 0) + 1;
        return counts;
      }, {});
      lines.push(
        `Access products: ${
          Object.entries(accessStates)
            .map(([status, count]) => `${status}:${count}`)
            .join(", ") || "none"
        }`
      );
      lines.push(
        `Threat evidence: visible ${observation.threatSummary.visibleEnemyActorIds.length}, ` +
          `remembered ${observation.threatSummary.rememberedEnemyActorIds.length}; ` +
          `${observation.threatSummary.observedCapabilityFamilies.join(", ") || "none"}`
      );
      lines.push(`Scout coverage sources: ${observation.map?.scoutCoverageAccessNodeIds.length ?? "unknown"}`);
    }
    const brain = controller.getBrainDebugSnapshot();
    if (brain) {
      lines.push(`--- Stage 9 Questions & Threats ---`);
      for (const question of brain.skirmish.questions.slice(0, 3)) {
        lines.push(`Question ${question.questionId}: ${question.kind} (${question.state})`);
      }
      if (!brain.skirmish.questions.length) lines.push("Question: none recorded");
      for (const incident of brain.skirmish.incidents.slice(0, 3)) {
        lines.push(
          `Threat ${incident.kind}: severity ${incident.severity}, ` +
            `confidence ${incident.confidencePermille}, expires ${incident.expiresAtTick}`
        );
      }
      if (!brain.skirmish.incidents.length) lines.push("Threat: none recorded");
      lines.push(`Mode: ${brain.skirmish.mode.state}; ${brain.skirmish.mode.reason ?? "no mode reason"}`);
      lines.push(`--- Missions ---`);
      for (const squad of brain.skirmish.squads.slice(0, 4)) {
        lines.push(
          `${squad.squadId}: ${squad.role}/${squad.state}, ${squad.members} members, target ${squad.objectiveId ?? "none"}`
        );
      }
      if (!brain.skirmish.squads.length) lines.push("Mission: none recorded");
    }

    lines.push(`--- Map Exploration ---`);
    lines.push(`Fully Explored: ${bb.mapFullyExplored ? "Yes" : "No"}`);
    if (bb.intel.lastScoutedAt > 0) {
      const timeSince = (now - bb.intel.lastScoutedAt) / 1000;
      lines.push(`Last Scouted: ${timeSince.toFixed(1)}s ago`);
    } else {
      lines.push(`Last Scouted: Never`);
    }

    lines.push(``);
    lines.push(`--- Enemy Intelligence ---`);
    const enemyCount = Object.keys(bb.enemyIntel).length;
    lines.push(`Known Enemies: ${enemyCount}`);
    for (const playerNum in bb.enemyIntel) {
      const intel = bb.enemyIntel[playerNum]!;
      lines.push(`Player ${playerNum}:`);
      lines.push(`  Strength: ${intel.strength.toFixed(0)}`);
      lines.push(`  In Combat: ${intel.unitsInCombat}`);
      lines.push(`  Flank Open: ${intel.flankOpen ? "Yes" : "No"}`);
    }

    lines.push(``);
    lines.push(`--- Enemy Power Trend ---`);
    const trends = bb.intel.enemyPowerTrend.slice(-3);
    if (trends.length > 0) {
      trends.forEach((trend) => {
        const age = ((now - trend.at) / 1000).toFixed(0);
        lines.push(`  ${age}s ago: Own ${trend.own} vs Enemy ${trend.enemy}`);
      });
    } else {
      lines.push(`  No data`);
    }

    lines.push(``);
    lines.push(`--- Enemy Base ---`);
    if (bb.enemyBase) {
      lines.push(`Located: Yes (${bb.enemyBase.name})`);
      lines.push(`Flank Open: ${bb.enemyFlankOpen ? "Yes" : "No"}`);
    } else {
      lines.push(`Located: No`);
    }

    lines.push(``);
    lines.push(`--- Visible Threats ---`);
    lines.push(`Visible Enemies: ${bb.visibleEnemies.length}`);
    lines.push(`Near Base: ${bb.enemiesNearBase.length}`);

    return lines;
  }

  static getThresholdsLines(controller: PlayerAiController, now: number): string[] {
    const bb = controller.blackboard;
    const agent = controller.playerAiControllerAgent;
    const thresholds = agent.adaptiveThresholds;
    const lines: string[] = [];

    lines.push(`=== ADAPTIVE THRESHOLDS ===`);

    lines.push(`--- Military Thresholds ---`);
    lines.push(`Heavy Attack: ${thresholds.getBaseHeavyAttackThreshold()}`);
    lines.push(`Military Power Strength: ${thresholds.getMilitaryPowerStrengthThreshold()}`);
    lines.push(`Unit Target Strength: ${thresholds.getMilitaryUnitTargetStrength()}`);
    lines.push(`Military Unit Cost: ${thresholds.getHasEnoughResourcesForMilitaryUnitThreshold()}`);

    lines.push(``);
    lines.push(`--- Resource Thresholds ---`);
    lines.push(`Surplus: ${thresholds.getResourceSurplusThreshold()}`);
    lines.push(`Gathering: ${thresholds.getResourceGatheringThreshold()}`);
    lines.push(`Need More: ${thresholds.getNeedMoreResourcesThreshold()}`);
    lines.push(`Sufficient: ${thresholds.getHasSufficientResourcesThreshold()}`);

    lines.push(``);
    lines.push(`--- Production Thresholds ---`);
    lines.push(`Worker Cost: ${thresholds.getHasEnoughResourcesForWorkerThreshold()}`);
    lines.push(`Upgrade Cost: ${thresholds.getSufficientResourcesForUpgradeThreshold()}`);

    lines.push(``);
    lines.push(`--- Current Values (for comparison) ---`);
    lines.push(`Total Resources: ${bb.getTotalResources().toFixed(0)}`);
    lines.push(`Military Strength: ${bb.militaryStrength.toFixed(0)}`);
    lines.push(`Unit Count: ${bb.units.length - bb.workers.length}`);
    lines.push(`Base Size: ${bb.baseSize}`);
    lines.push(`Supply: ${bb.production.supply.used}/${bb.production.supply.max}`);

    return lines;
  }
}
