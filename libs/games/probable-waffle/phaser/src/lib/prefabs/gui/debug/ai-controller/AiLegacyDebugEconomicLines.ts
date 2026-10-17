import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { PlayerAiController } from "../../../../player/ai-controller/player-ai-controller";
import { getActorComponent } from "../../../../data/actor-component";
import { GathererComponent } from "../../../../entity/components/resource/gatherer-component";

/** Dormant legacy diagnostics retained for generated-label compatibility, never used by the committed panel. */
export class AiLegacyDebugEconomicLines {
  static getResourcesLines(controller: PlayerAiController, now: number): string[] {
    const bb = controller.blackboard;
    const lines: string[] = [];

    lines.push(`=== RESOURCES & ECONOMY ===`);

    lines.push(`--- Current Resources ---`);
    const resources = bb.economy.resources;
    for (const key in resources) {
      const r = key as ResourceType;
      const current = resources[r];
      const reserved = bb.economy.reserved[r] || 0;
      const available = bb.economy.available[r];
      lines.push(`${r}: ${current} (avail: ${available}, res: ${reserved})`);
    }

    lines.push(``);
    lines.push(`--- Income (instant/smoothed) ---`);
    for (const key in resources) {
      const r = key as ResourceType;
      const instant = (bb.economy.incomeInstant[r] || 0).toFixed(1);
      const smoothed = (bb.economy.incomeSmoothed[r] || 0).toFixed(1);
      lines.push(`${r}: ${instant} / ${smoothed} per sec`);
    }

    lines.push(``);
    lines.push(`--- Totals ---`);
    lines.push(`Total Resources: ${bb.getTotalResources().toFixed(0)}`);
    const totalReserved = Object.values(bb.economy.reserved).reduce((a, b) => a + (b || 0), 0);
    lines.push(`Total Reserved: ${totalReserved.toFixed(0)}`);
    const totalAvailable = Object.values(bb.economy.available).reduce((a, b) => a + (b || 0), 0);
    lines.push(`Total Available: ${totalAvailable.toFixed(0)}`);

    lines.push(``);
    lines.push(`--- Projections ---`);
    const income30s = bb.getAggregateIncomeEstimate(30000, now);
    lines.push(`Est Income (30s): ${income30s.toFixed(0)}`);

    lines.push(``);
    lines.push(`--- Diagnostics ---`);
    lines.push(`Reservations Granted: ${bb.diagnostics.reservationsGranted || 0}`);
    lines.push(`Reservations Denied: ${bb.diagnostics.reservationsDenied || 0}`);

    return lines;
  }


  static getProductionLines(controller: PlayerAiController, now: number): string[] {
    const bb = controller.blackboard;
    const brainState = controller.getBrainState();
    const lines: string[] = [];

    lines.push(`=== PRODUCTION & TECH ===`);
    if (brainState) {
      lines.push(`--- Stage 7 Macro Plan ---`);
      lines.push(`Opening step: ${brainState.opening.plan.currentStepId ?? "transition"}`);
      for (const demand of brainState.economyProduction.demands.slice(0, 4)) {
        lines.push(
          `  ${demand.purpose}: ${demand.satisfiedActorIds.length}/${demand.desired} ${demand.capabilityOrRole}`
        );
      }
      lines.push(`Macro reservations: ${brainState.reservations.length}`);
      lines.push(``);
    }

    lines.push(`--- Buildings ---`);
    lines.push(`Training: ${bb.trainingBuildings.length}`);
    lines.push(`Production: ${bb.productionBuildings.length}`);
    lines.push(`Defensive: ${bb.defensiveStructures.length}`);
    lines.push(`Gathering: ${bb.gatheringStructures.length}`);
    lines.push(`Base Size: ${bb.baseSize}`);

    lines.push(``);
    lines.push(`--- Supply ---`);
    lines.push(`Used: ${bb.production.supply.used}`);
    lines.push(`Max: ${bb.production.supply.max}`);
    lines.push(`Headroom: ${bb.production.supply.max - bb.production.supply.used}`);
    lines.push(`Pending: ${bb.production.supply.pendingFromQueued}`);
    const forecast = bb.forecastSupplyUsage(0);
    lines.push(`Forecast: ${forecast}`);

    lines.push(``);
    lines.push(`--- Production Queue ---`);
    const latest = bb.production.queueSnapshots.at(-1);
    if (latest) {
      lines.push(`Queued Items: ${latest.queued.length}`);
      if (latest.queued.length > 0) {
        lines.push(`Next: ${latest.queued.slice(0, 3).join(", ")}`);
      }
    } else {
      lines.push(`Queued Items: 0`);
    }

    lines.push(``);
    lines.push(`--- Planned Structures ---`);
    lines.push(`Count: ${bb.production.plannedStructures.length}`);
    bb.production.plannedStructures.slice(0, 3).forEach((plan) => {
      const age = ((now - plan.reservedAt) / 1000).toFixed(1);
      lines.push(`  ${plan.name} (${age}s ago)`);
    });

    lines.push(``);
    lines.push(`--- Prerequisites Queue ---`);
    lines.push(`Pending: ${bb.production.prereqQueue.length}`);
    bb.production.prereqQueue.slice(0, 2).forEach((prereq) => {
      let target = "unknown";
      if (prereq.preRequirement.prereqs.objectNames.length > 0) {
        target = prereq.preRequirement.prereqs.objectNames[0]!;
      } else if (prereq.preRequirement.prereqs.researchTypes.length > 0) {
        target = prereq.preRequirement.prereqs.researchTypes[0]!;
      } else if (prereq.preRequirement.prereqs.supply !== null) {
        target = `supply(${prereq.preRequirement.prereqs.supply})`;
      }
      lines.push(`  ${prereq.type}: ${target}`);
    });

    lines.push(``);
    lines.push(`--- Tech Upgrades ---`);
    lines.push(`Active: ${bb.activeTechUpgrades}`);
    if (bb.lastTechUpgradeAt > 0) {
      const timeSince = (now - bb.lastTechUpgradeAt) / 1000;
      lines.push(`Last: ${timeSince.toFixed(1)}s ago`);
    }

    return lines;
  }


  static getLogisticsLines(controller: PlayerAiController, now: number): string[] {
    const bb = controller.blackboard;
    const agent = controller.playerAiControllerAgent;
    const lines: string[] = [];

    lines.push(`=== LOGISTICS & WORKERS ===`);

    lines.push(`--- Workers ---`);
    lines.push(`Total: ${bb.workers.length}`);
    const idle = bb.getIdleWorkers();
    lines.push(`Idle: ${idle.length}`);
    lines.push(`Gathering: ${bb.workers.length - idle.length}`);

    lines.push(``);
    lines.push(`--- Gatherer Distribution ---`);
    const gatherersByResource = { wood: 0, stone: 0, minerals: 0, idle: 0 };
    bb.workers.forEach((worker) => {
      const gatherer = getActorComponent(worker, GathererComponent);
      if (gatherer?.isGathering && gatherer.currentResourceSource) {
        const sourceName = gatherer.currentResourceSource.name.toLowerCase();
        if (sourceName.includes("wood") || sourceName.includes("tree")) {
          gatherersByResource.wood++;
        } else if (sourceName.includes("stone") || sourceName.includes("rock")) {
          gatherersByResource.stone++;
        } else if (sourceName.includes("mineral") || sourceName.includes("gold")) {
          gatherersByResource.minerals++;
        }
      } else {
        gatherersByResource.idle++;
      }
    });
    lines.push(`Wood: ${gatherersByResource.wood}`);
    lines.push(`Stone: ${gatherersByResource.stone}`);
    lines.push(`Minerals: ${gatherersByResource.minerals}`);
    lines.push(`Idle: ${gatherersByResource.idle}`);

    lines.push(``);
    lines.push(`--- Resource Needs ---`);
    const constrained = agent.logisticsManager?.getMostConstrainedResource();
    if (constrained) {
      lines.push(`Most Constrained: ${constrained}`);
    } else {
      lines.push(`Most Constrained: None`);
    }

    lines.push(``);
    lines.push(`--- Building Needs ---`);
    const needs = agent.basePlanner?.getCurrentNeeds() || [];
    lines.push(`Building Needs: ${needs.length}`);
    needs.slice(0, 3).forEach((need) => {
      lines.push(`  ${need.type} (${need.reason})`);
    });

    const reserved = agent.basePlanner?.getReservedBuilding();
    if (reserved) {
      lines.push(``);
      lines.push(`Reserved Building:`);
      lines.push(`  ${reserved.objectName} at ${reserved.tile.x},${reserved.tile.y}`);
    }

    return lines;
  }

}
