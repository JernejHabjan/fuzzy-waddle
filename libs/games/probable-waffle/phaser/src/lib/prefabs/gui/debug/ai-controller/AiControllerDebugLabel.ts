import Phaser from "phaser";
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import HudProbableWaffle from "../../../../world/scenes/hud-scenes/HudProbableWaffle";
import { ProbableWaffleScene } from "../../../../core/probable-waffle.scene";
import { getPlayer } from "../../../../data/scene-data";
import { getSceneService, getSceneSystem } from "../../../../world/services/scene-component-helpers";
import { AiPlayerHandler } from "../../../../player/ai-controller/ai-player-handler";
import { type PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { PlayerAiController } from "../../../../player/ai-controller/player-ai-controller";
import { NavigationService } from "../../../../world/services/navigation.service";
import { AiLegacyDebugStrategicLines } from "./AiLegacyDebugStrategicLines";
import { AiLegacyDebugEconomicLines } from "./AiLegacyDebugEconomicLines";
import { AiCommittedDebugLines } from "./AiCommittedDebugLines";
import { selectAiDebugSnapshot } from "./select-ai-debug-snapshot";
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
      maxLines: 24,
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
    this.once(Phaser.GameObjects.Events.DESTROY, this.destroyTransportOverlay, this);
    this.telemetryText.setInteractive();
    this.telemetryText.on("wheel", this.onTelemetryWheel, this);
    const panelBackground = scene.add.rectangle(-250, 0, 500, 320, 0x111827, 0.74);
    panelBackground.setOrigin(0.5, 0);
    this.addAt(panelBackground, 0);
    this.playerName.setPosition(-490, 8).setOrigin(0, 0).setWordWrapWidth(480, true);
    this.playerName.setStyle({ align: "left", color: "#fff1cc", fontSize: "18px" });
    this.playerAction.setPosition(-490, 34).setOrigin(0, 0).setWordWrapWidth(480, true);
    this.playerAction.setStyle({ align: "left", color: "#d8e6ff", fontSize: "16px", maxLines: 2 });
    this.telemetryText.setPosition(-490, 78).setOrigin(0, 0).setWordWrapWidth(480, true);
    this.telemetryText.setStyle({ align: "left", color: "#ffffff", fontSize: "16px", lineSpacing: 1, maxLines: 16 });
    // Preserve generated-label compatibility references without executing the legacy mutable readers.
    void [
      AiLegacyDebugStrategicLines.getOverviewLines,
      AiLegacyDebugStrategicLines.getStrategyLines,
      AiLegacyDebugEconomicLines.getResourcesLines,
      AiLegacyDebugEconomicLines.getProductionLines,
      AiLegacyDebugEconomicLines.getLogisticsLines,
      AiLegacyDebugStrategicLines.getIntelLines,
      AiLegacyDebugStrategicLines.getThresholdsLines
    ];
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

  setPlayer(playerNumber: PlayerNumber, category?: string) {
    this.playerNum = playerNumber;
    this.category = category;
    this.pageIndex = 0;
    this.historyOffset = 0;
    const player = getPlayer(this.mainSceneWithActors, playerNumber);
    if (player) {
      this.playerName.text = `Player ${playerNumber} - ${category ? this.getCategoryTitle(category) : "Overview"}`;
      const aiHandlerSystem = getSceneSystem(this.mainSceneWithActors, AiPlayerHandler);
      const controller = aiHandlerSystem?.getAiPlayerController(playerNumber);
      const brain = controller ? this.getSelectedBrainSnapshot(controller) : undefined;
      this.playerAction.text = brain ? brain.strategicIntentSummary.headline : "Awaiting committed planner snapshot";
      this.refreshTelemetry(performance.now());
    } else {
      this.playerName.text = "No Player";
      this.playerAction.text = "";
      this.telemetryText.text = "";
    }
  }

  private getCategoryTitle(category: string): string {
    const titles: Record<string, string> = {
      overview: "Overview & Reasons",
      strategy: "Strategy & Combat",
      squads: "Squads & Support",
      resources: "Resources & Economy",
      production: "Production & Tech",
      commands: "Command Authority",
      transport: "Routes & Transport",
      bases: "Bases & Placement",
      logistics: "Logistics & Workers",
      intel: "Enemy Intel & Scouting",
      thresholds: "Adaptive Thresholds",
      runtime: "Runtime & Limits"
    };
    return titles[category] || category;
  }

  refreshTelemetry(now: number) {
    if (this.playerNum === undefined) return;
    if (now - this.lastTelemetryAt < this.telemetryIntervalMs) return;
    this.lastTelemetryAt = now;
    const aiHandlerSystem = getSceneSystem(this.mainSceneWithActors, AiPlayerHandler);
    const controller = aiHandlerSystem?.getAiPlayerController(this.playerNum);
    if (!controller) return;

    const lines: string[] = [];
    if (this.category !== "transport") this.clearTransportOverlay();
    if (this.category !== "bases") this.clearFortificationOverlay();
    if (this.category !== "squads") this.clearTacticalOverlay();

    if (!this.category) {
      lines.push(...this.getCommittedPlanningLines(controller, "overview"));
    } else {
      switch (this.category) {
        case "overview":
          lines.push(...this.getCommittedPlanningLines(controller, "overview"));
          break;
        case "strategy":
          lines.push(...this.getCommittedPlanningLines(controller, "strategy"));
          break;
        case "squads":
          lines.push(...this.getSquadSupportLines(controller));
          break;
        case "resources":
          lines.push(...this.getCommittedPlanningLines(controller, "resources"));
          break;
        case "production":
          lines.push(...this.getCommittedPlanningLines(controller, "production"));
          break;
        case "commands":
          lines.push(...this.getCommandAuthorityLines(controller));
          break;
        case "transport":
          lines.push(...this.getTransportLines(controller));
          break;
        case "bases":
          lines.push(...this.getBaseLines(controller));
          lines.push(...this.getFortificationLines(controller));
          break;
        case "logistics":
          lines.push(...this.getCommittedPlanningLines(controller, "logistics"));
          lines.push(...this.getRecoveryLines(controller));
          break;
        case "intel":
          lines.push(...this.getCommittedPlanningLines(controller, "intel"));
          break;
        case "thresholds":
          lines.push(...this.getCommittedPlanningLines(controller, "thresholds"));
          break;
        case "runtime":
          lines.push(...this.getRuntimeLines(controller));
          break;
        default:
          lines.push(...this.getCommittedPlanningLines(controller, "overview"));
      }
    }

    const pages = Math.max(1, Math.ceil(lines.length / this.linesPerPage));
    this.pageIndex = Math.min(this.pageIndex, pages - 1);
    const page = lines.slice(this.pageIndex * this.linesPerPage, (this.pageIndex + 1) * this.linesPerPage);
    this.telemetryText.text = [
      ...page,
      pages > 1 ? `Page ${this.pageIndex + 1}/${pages} — mouse wheel to scroll` : "",
      `Snapshot ${this.historyOffset === 0 ? "latest" : `-${this.historyOffset}`} — Shift+wheel changes history`
    ]
      .filter(Boolean)
      .join("\n");
    const brain = this.getSelectedBrainSnapshot(controller);
    this.playerAction.text = brain ? brain.strategicIntentSummary.headline : "Awaiting committed planner snapshot";
  }

  private pageIndex = 0;
  private historyOffset = 0;
  private readonly linesPerPage = 7;

  private onTelemetryWheel(
    pointer: Phaser.Input.Pointer,
    _deltaX: number,
    deltaY: number,
    _deltaZ: number,
    _event: Phaser.Types.Input.EventData
  ): void {
    if ((pointer.event as WheelEvent | undefined)?.shiftKey) {
      this.historyOffset = Math.max(0, this.historyOffset + (deltaY > 0 ? 1 : -1));
      this.pageIndex = 0;
      this.lastTelemetryAt = 0;
      return;
    }
    this.pageIndex = Math.max(0, this.pageIndex + (deltaY > 0 ? 1 : -1));
    this.lastTelemetryAt = 0;
  }

  private getSelectedBrainSnapshot(controller: PlayerAiController) {
    const selection = selectAiDebugSnapshot(controller, this.historyOffset);
    this.historyOffset = selection.historyOffset;
    return selection.snapshot;
  }

  private getCommittedPlanningLines(
    controller: PlayerAiController,
    category: "overview" | "strategy" | "resources" | "production" | "logistics" | "intel" | "thresholds"
  ): string[] {
    return AiCommittedDebugLines.getCommittedPlanningLines(
      controller,
      this.getSelectedBrainSnapshot(controller),
      this.historyOffset,
      category
    );
  }
  private getSquadSupportLines(controller: PlayerAiController): string[] {
    const brain = this.getSelectedBrainSnapshot(controller);
    const lines = AiCommittedDebugLines.getSquadSupportLines(brain);
    this.renderTacticalOverlay(brain?.skirmish.squads ?? []);
    return lines;
  }

  private getRuntimeLines(controller: PlayerAiController): string[] {
    return AiCommittedDebugLines.getRuntimeLines(
      this.getSelectedBrainSnapshot(controller),
      controller.getBrainDebugHistory().length
    );
  }

  private getTransportLines(controller: PlayerAiController): string[] {
    const brain = this.getSelectedBrainSnapshot(controller);
    const observation = this.historyOffset === 0 ? controller.getCommittedObservation() : undefined;
    const lines = AiCommittedDebugLines.getTransportLines(brain, observation);
    if (brain?.transportOperations.length) this.renderTransportOverlay(brain.transportOperations);
    else this.clearTransportOverlay();
    return lines;
  }

  /** Renders only the saved Stage-10 base snapshot; it never asks the live scene to score placement. */
  private getBaseLines(controller: PlayerAiController): string[] {
    const brain = this.getSelectedBrainSnapshot(controller);
    const lines = ["=== BASES & PLACEMENT ==="];
    if (!brain?.bases.length) return [...lines, "No committed main-structure base identity"];
    for (const base of brain.bases) {
      lines.push(
        `${base.baseId}: ${base.lifecycle}, anchor ${base.anchorActorId ?? "pending"}, members ${base.memberCount}`
      );
      lines.push(
        `  access ${base.accessNodeId ?? "pending"}, reserved ${base.reservedSiteKey ?? "none"}, rejected ${base.rejectedSiteCount}`
      );
      if (base.expansionTrigger) lines.push(`  expansion trigger: ${base.expansionTrigger}`);
    }
    return lines;
  }

  /** Reads only committed graph facts and renders no hidden or freshly queried topology. */
  private getFortificationLines(controller: PlayerAiController): string[] {
    const fortifications = this.getSelectedBrainSnapshot(controller)?.fortifications ?? [];
    if (!fortifications.length) {
      this.clearFortificationOverlay();
      return ["", "No justified fortification graph"];
    }
    const lines = ["", "=== FORTIFICATIONS ==="];
    for (const plan of fortifications) {
      const finished = plan.nodes.filter((node) => node.lifecycle === "finished").length;
      lines.push(`${plan.planId}: ${plan.lifecycle}, ${finished}/${plan.nodes.length}`);
      lines.push(
        `  paths whole=${plan.wholeConnectivity}, prefixes=${plan.incrementalConnectivity}, cap=${plan.spendPermille ?? "?"}‰`
      );
      lines.push(
        `  anchors ${plan.terrainAnchorTileKeys.join(" ↔ ") || "unknown"}, protects ${plan.protectedAssetCount}`
      );
      lines.push(
        `  budget ${plan.budgetRemaining.map((entry) => `${entry.resourceType}:${entry.amount}`).join(",") || "none"}`
      );
      lines.push(
        `  opening ${plan.openingNodeId ?? "legacy"}, breach ${plan.breachReason ?? "none"} ` +
          `(${plan.breachRisk}), recovery ${plan.recoveryAttempts}`
      );
      lines.push(`  defender posts ${plan.reachableDefenderPosts}/${plan.defenderPosts} reachable`);
      for (const tower of plan.nodes.filter((node) => node.kind === "tower")) {
        lines.push(`  tower +${tower.marginalCoverage} [${tower.targetDomains.join(",") || "none"}]`);
      }
    }
    this.renderFortificationOverlay(fortifications);
    return lines;
  }

  /** Stage-12 facts are read from the committed snapshot, so inspecting recovery cannot advance it. */
  private getRecoveryLines(controller: PlayerAiController): string[] {
    const recovery = this.getSelectedBrainSnapshot(controller)?.recovery ?? [];
    if (!recovery.length) return ["", "=== RECOVERY ===", "No active causal recovery episodes"];
    const lines = ["", "=== RECOVERY ==="];
    for (const entry of recovery) {
      lines.push(`${entry.domain}:${entry.cause} — ${entry.state} #${entry.attempt}`);
      lines.push(
        `  retry ${entry.nextRetryTick}, deadline ${entry.phaseDeadlineTick}, ` +
          `alternate ${entry.alternate ?? "none"}, released ${entry.releasedClaimCount}`
      );
    }
    return lines;
  }

  private transportOverlay?: Phaser.GameObjects.Graphics;
  private fortificationOverlay?: Phaser.GameObjects.Graphics;
  private tacticalOverlay?: Phaser.GameObjects.Graphics;

  /** Draws only positions saved by the tactical decision; it never requests a fresh formation or route. */
  private renderTacticalOverlay(
    squads: NonNullable<ReturnType<PlayerAiController["getBrainDebugSnapshot"]>>["skirmish"]["squads"]
  ): void {
    this.clearTacticalOverlay();
    const navigation = getSceneService(this.mainSceneWithActors, NavigationService);
    if (!navigation) return;
    const graphics = this.mainSceneWithActors.add.graphics().setDepth(Number.MAX_SAFE_INTEGER);
    for (const squad of squads) {
      for (const assignment of squad.assignedPositions) {
        const world = navigation.getTileWorldCenter(assignment.position);
        if (!world) continue;
        const color = squad.state === "retreat" ? 0xff5252 : squad.role === "defense" ? 0x40c4ff : 0xffd740;
        graphics.lineStyle(2, color, 0.9).strokeCircle(world.x, world.y, 6);
      }
    }
    this.tacticalOverlay = graphics;
  }

  /** Draws the saved graph, including a distinct green opening node. */
  private renderFortificationOverlay(
    plans: NonNullable<ReturnType<PlayerAiController["getBrainDebugSnapshot"]>>["fortifications"]
  ): void {
    this.clearFortificationOverlay();
    const navigation = getSceneService(this.mainSceneWithActors, NavigationService);
    if (!navigation) return;
    const graphics = this.mainSceneWithActors.add.graphics().setDepth(Number.MAX_SAFE_INTEGER);
    for (const plan of plans) {
      for (const node of plan.nodes) {
        const world = navigation.getTileWorldCenter(node.position);
        if (!world) continue;
        const color =
          node.kind === "gate_slot"
            ? 0x4caf50
            : node.kind === "tower"
              ? 0xff9800
              : node.kind === "stair"
                ? 0x40c4ff
                : 0xffffff;
        graphics
          .fillStyle(color, node.lifecycle === "finished" ? 0.95 : 0.55)
          .fillCircle(world.x, world.y, node.kind === "tower" ? 7 : 5);
      }
    }
    this.fortificationOverlay = graphics;
  }

  /** Draws only recorded transfer anchors; opening the panel never invokes route work. */
  private renderTransportOverlay(
    operations: NonNullable<ReturnType<PlayerAiController["getBrainDebugSnapshot"]>>["transportOperations"]
  ): void {
    this.clearTransportOverlay();
    const navigation = getSceneService(this.mainSceneWithActors, NavigationService);
    if (!navigation) return;
    const graphics = this.mainSceneWithActors.add.graphics().setDepth(Number.MAX_SAFE_INTEGER);
    for (const operation of operations) {
      if (!operation.pickupPosition || !operation.landingPosition) continue;
      const pickup = navigation.getTileWorldCenter(operation.pickupPosition);
      const landing = navigation.getTileWorldCenter(operation.landingPosition);
      if (!pickup || !landing) continue;
      graphics.lineStyle(3, 0x40c4ff, 0.8).lineBetween(pickup.x, pickup.y, landing.x, landing.y);
      graphics.fillStyle(0x4caf50, 0.9).fillCircle(pickup.x, pickup.y, 7);
      graphics.fillStyle(0xff9800, 0.9).fillCircle(landing.x, landing.y, 7);
    }
    this.transportOverlay = graphics;
  }

  private clearTransportOverlay(): void {
    this.transportOverlay?.destroy();
    this.transportOverlay = undefined;
  }

  private clearFortificationOverlay(): void {
    this.fortificationOverlay?.destroy();
    this.fortificationOverlay = undefined;
  }

  private clearTacticalOverlay(): void {
    this.tacticalOverlay?.destroy();
    this.tacticalOverlay = undefined;
  }

  private destroyTransportOverlay(): void {
    this.telemetryText.off("wheel", this.onTelemetryWheel, this);
    this.clearTransportOverlay();
    this.clearFortificationOverlay();
    this.clearTacticalOverlay();
  }


  private getCommandAuthorityLines(controller: PlayerAiController): string[] {
    return AiCommittedDebugLines.getCommandAuthorityLines(
      controller,
      this.getSelectedBrainSnapshot(controller),
      this.historyOffset
    );
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
