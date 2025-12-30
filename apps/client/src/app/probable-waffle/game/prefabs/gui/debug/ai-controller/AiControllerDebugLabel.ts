// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import HudProbableWaffle from "../../../../world/scenes/hud-scenes/HudProbableWaffle";
import { ProbableWaffleScene } from "../../../../core/probable-waffle.scene";
import { getPlayer } from "../../../../data/scene-data";
import { getSceneSystem } from "../../../../world/services/scene-component-helpers";
import { AiPlayerHandler } from "../../../../player/ai-controller/ai-player-handler";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import type { PlayerAiController } from "../../../../player/ai-controller/player-ai-controller";
import { getActorComponent } from "../../../../data/actor-component";
import { GathererComponent } from "../../../../entity/components/resource/gatherer-component";
/* END-USER-IMPORTS */

export default class AiControllerDebugLabel extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 200.15978001501432, y ?? 0);

    // playerName
    const playerName = scene.add.text(-0.15977986418442924, 6, "", {});
    playerName.setOrigin(1, 0);
    playerName.text = "Player Name";
    playerName.setStyle({
      align: "right",
      fontFamily: "disposabledroid",
      fontSize: "22px",
      maxLines: 1,
      resolution: 10
    });
    playerName.setWordWrapWidth(400);
    this.add(playerName);

    // playerAction
    const playerAction = scene.add.text(-0.15977986418442924, 34, "", {});
    playerAction.setOrigin(1, 0);
    playerAction.text = "Player action";
    playerAction.setStyle({
      align: "right",
      fontFamily: "disposabledroid",
      fontSize: "20px",
      maxLines: 1,
      resolution: 10
    });
    playerAction.setWordWrapWidth(400);
    this.add(playerAction);

    // telemetryText
    const telemetryText = scene.add.text(-0.15977986418442924, 60, "", {});
    telemetryText.setOrigin(1, 0);
    telemetryText.text = "Telemetry";
    telemetryText.setStyle({
      align: "right",
      fontFamily: "disposabledroid",
      fontSize: "20px",
      maxLines: 12,
      resolution: 10,
      lineSpacing: 4
    });
    telemetryText.setWordWrapWidth(400);
    this.add(telemetryText);

    this.playerName = playerName;
    this.playerAction = playerAction;
    this.telemetryText = telemetryText;

    /* START-USER-CTR-CODE */
    this.mainSceneWithActors = (this.scene as HudProbableWaffle).probableWaffleScene!;
    /* END-USER-CTR-CODE */
  }

  private playerName: Phaser.GameObjects.Text;
  private playerAction: Phaser.GameObjects.Text;
  private telemetryText: Phaser.GameObjects.Text;

  /* START-USER-CODE */
  private readonly mainSceneWithActors: ProbableWaffleScene;
  private playerNum?: number;
  private category?: string;
  private lastTelemetryAt = 0; // throttle
  private readonly telemetryIntervalMs = 500; // Update more frequently for better debugging

  setPlayer(playerNumber: number, category?: string) {
    this.playerNum = playerNumber;
    this.category = category;
    const player = getPlayer(this.mainSceneWithActors, playerNumber);
    if (player) {
      this.playerName.text = `Player ${playerNumber} - ${category ? this.getCategoryTitle(category) : "Overview"}`;
      const aiHandlerSystem = getSceneSystem(this.mainSceneWithActors, AiPlayerHandler);
      const controller = aiHandlerSystem?.getAiPlayerController(playerNumber);
      this.playerAction.text = controller?.blackboard.currentStrategy || "";
      this.refreshTelemetry(performance.now());
    } else {
      this.playerName.text = "No Player";
      this.playerAction.text = "";
      this.telemetryText.text = "";
    }
  }

  private getCategoryTitle(category: string): string {
    const titles: Record<string, string> = {
      strategy: "Strategy & Combat",
      resources: "Resources & Economy",
      production: "Production & Tech",
      logistics: "Logistics & Workers",
      intel: "Enemy Intel & Scouting",
      thresholds: "Adaptive Thresholds"
    };
    return titles[category] || category;
  }

  refreshTelemetry(now: number) {
    if (!this.playerNum) return;
    if (now - this.lastTelemetryAt < this.telemetryIntervalMs) return;
    this.lastTelemetryAt = now;
    const aiHandlerSystem = getSceneSystem(this.mainSceneWithActors, AiPlayerHandler);
    const controller = aiHandlerSystem?.getAiPlayerController(this.playerNum);
    if (!controller) return;

    const lines: string[] = [];

    if (!this.category) {
      lines.push(...this.getOverviewLines(controller, now));
    } else {
      switch (this.category) {
        case "strategy":
          lines.push(...this.getStrategyLines(controller, now));
          break;
        case "resources":
          lines.push(...this.getResourcesLines(controller, now));
          break;
        case "production":
          lines.push(...this.getProductionLines(controller, now));
          break;
        case "logistics":
          lines.push(...this.getLogisticsLines(controller, now));
          break;
        case "intel":
          lines.push(...this.getIntelLines(controller, now));
          break;
        case "thresholds":
          lines.push(...this.getThresholdsLines(controller, now));
          break;
        default:
          lines.push(...this.getOverviewLines(controller, now));
      }
    }

    this.telemetryText.text = lines.join("\n");
    this.playerAction.text = controller?.blackboard.currentStrategy || "";
  }

  private getOverviewLines(controller: PlayerAiController, now: number): string[] {
    const bb = controller.blackboard;
    const lines: string[] = [];
    lines.push(`--- Strategy: ${bb.currentStrategy} ---`);
    lines.push(`Base Size: ${bb.baseSize}`);
    lines.push(`Units: ${bb.units.length} (Workers: ${bb.workers.length})`);
    lines.push(`Military Str: ${bb.militaryStrength.toFixed(0)}`);
    lines.push(`Resources: ${bb.getTotalResources().toFixed(0)}`);
    return lines;
  }

  private getStrategyLines(controller: PlayerAiController, now: number): string[] {
    const bb = controller.blackboard;
    const agent = controller.playerAiControllerAgent;
    const lines: string[] = [];

    lines.push(`=== STRATEGY & COMBAT ===`);
    lines.push(`Current: ${bb.currentStrategy}`);
    const locked = bb.isStrategyLocked(now);
    if (locked) {
      const remainingMs = bb.strategy.modeLockedUntil - now;
      lines.push(`Locked: ${(remainingMs / 1000).toFixed(1)}s remaining`);
    } else {
      lines.push(`Locked: No`);
    }

    lines.push(``);
    lines.push(`--- Power Analysis ---`);
    lines.push(`Own Military: ${bb.militaryStrength.toFixed(0)}`);
    lines.push(`Enemy Military: ${bb.enemyMilitaryStrength.toFixed(0)}`);
    const attackPowerRatio = bb.getAttackPowerRatio(now);
    lines.push(`Power Ratio: ${attackPowerRatio.toFixed(2)}`);

    lines.push(``);
    lines.push(`--- Units ---`);
    lines.push(`Total Units: ${bb.units.length}`);
    lines.push(`Military: ${bb.units.length - bb.workers.length}`);
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

  private getResourcesLines(controller: PlayerAiController, now: number): string[] {
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

  private getProductionLines(controller: PlayerAiController, now: number): string[] {
    const bb = controller.blackboard;
    const lines: string[] = [];

    lines.push(`=== PRODUCTION & TECH ===`);

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
      lines.push(`  ${prereq.type}: ${prereq.objectName}`);
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

  private getLogisticsLines(controller: PlayerAiController, now: number): string[] {
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

  private getIntelLines(controller: PlayerAiController, now: number): string[] {
    const bb = controller.blackboard;
    const lines: string[] = [];

    lines.push(`=== ENEMY INTEL & SCOUTING ===`);

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

  private getThresholdsLines(controller: PlayerAiController, now: number): string[] {
    const bb = controller.blackboard;
    const agent = controller.playerAiControllerAgent;
    const thresholds = agent.adaptiveThresholds;
    const lines: string[] = [];

    lines.push(`=== ADAPTIVE THRESHOLDS ===`);

    lines.push(`--- Military Thresholds ---`);
    lines.push(`Heavy Attack: ${thresholds.getBaseHeavyAttackThreshold()}`);
    lines.push(`Military Power: ${thresholds.getMilitaryPowerThreshold()}`);
    lines.push(`Unit Target: ${thresholds.getMilitaryUnitTarget()}`);
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
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
