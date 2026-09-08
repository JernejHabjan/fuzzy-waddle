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
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { PlayerAiController } from "../../../../player/ai-controller/player-ai-controller";
import { getActorComponent } from "../../../../data/actor-component";
import { GathererComponent } from "../../../../entity/components/resource/gatherer-component";
import { NavigationService } from "../../../../world/services/navigation.service";
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
    // Preserve generated-label compatibility references without executing the legacy mutable readers.
    void [
      this.getOverviewLines,
      this.getStrategyLines,
      this.getResourcesLines,
      this.getProductionLines,
      this.getLogisticsLines,
      this.getIntelLines,
      this.getThresholdsLines
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
      this.playerAction.text = brain ? `${brain.stance} → ${brain.goalId ?? "no goal"}` : "Awaiting committed planner snapshot";
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
    ].filter(Boolean).join("\n");
    const brain = this.getSelectedBrainSnapshot(controller);
    this.playerAction.text = brain ? `${brain.stance} → ${brain.goalId ?? "no goal"}` : "Awaiting committed planner snapshot";
  }

  private pageIndex = 0;
  private historyOffset = 0;
  private readonly linesPerPage = 21;

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
    const history = controller.getBrainDebugHistory();
    this.historyOffset = Math.min(this.historyOffset, Math.max(0, history.length - 1));
    return this.historyOffset === 0 ? controller.getBrainDebugSnapshot() : history.at(-1 - this.historyOffset);
  }

  private getCommittedPlanningLines(
    controller: PlayerAiController,
    category: "overview" | "strategy" | "resources" | "production" | "logistics" | "intel" | "thresholds"
  ): string[] {
    const brain = this.getSelectedBrainSnapshot(controller);
    const state = controller.getBrainState();
    const observation = controller.getCommittedObservation();
    if (!brain || !state || !observation) return ["=== COMMITTED PLANNER ===", "No committed decision snapshot"];
    if (this.historyOffset > 0 && ["resources", "production", "logistics", "intel"].includes(category)) {
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
        `Purpose: ${brain.stance} → ${brain.goalId ?? "none"} (${brain.profileDifficulty})`,
        `Tick ${brain.tick}; commitment through ${brain.commitmentUntilTick}; health ${brain.progressHealth}`,
        `Next: ${brain.nextActions.join(", ") || "awaiting proposal"}`,
        `Blocker: ${brain.mainBlockingReason ?? "none"}`,
        ...brain.topReasons.slice(0, 6).map((reason) => `Reason: ${reason}`),
        `Recorded decisions: ${brain.decisions.length}; why-not entries: ${brain.whyNot.length}`
      ];
    }
    if (category === "strategy") {
      return [
        "=== STRATEGY & COMBAT ===",
        `Stance: ${brain.stance}; goal ${brain.goalId ?? "none"}`,
        `Commitment until tick: ${brain.commitmentUntilTick}`,
        `Squads: ${brain.skirmish.squads.length}; incidents: ${brain.skirmish.incidents.length}`,
        ...brain.skirmish.squads.slice(0, 6).map((squad) => `${squad.squadId}: ${squad.role}/${squad.state}/${squad.script ?? "basic"} → ${squad.objectiveId ?? "none"}`),
        `Why not: ${brain.whyNot[0]?.reason ?? "no rejected or unevaluated alternative recorded"}`
      ];
    }
    if (category === "resources") {
      return [
        "=== RESOURCES & ECONOMY ===",
        ...observation.resources.map((resource) => `${resource.resourceType}: stock ${resource.stockpile}, reserved ${resource.reservedUnspent}, due ${resource.obligationsDue}`),
        `Macro forecasts: ${state.economyProduction.forecasts.length}`,
        ...state.economyProduction.forecasts.slice(0, 6).map((forecast) => `${forecast.resourceType}: ${forecast.amount} by tick ${forecast.horizonTick} @ ${forecast.confidencePermille}‰`),
        `Reservations: ${state.reservations.length}`
      ];
    }
    if (category === "production") {
      return [
        "=== PRODUCTION & TECH ===",
        `Opening: ${state.opening.archetypeId} / ${state.opening.plan.currentStepId ?? "transition"}`,
        ...state.economyProduction.demands.slice(0, 10).map((demand) => `${demand.purpose}: ${demand.satisfiedActorIds.length}/${demand.desired} ${demand.capabilityOrRole}`),
        `Adaptation: ${brain.adaptation.lastTransitionReason ?? "no confirmed transition"} @ ${brain.adaptation.lastTransitionTick ?? "n/a"}`,
        ...brain.adaptation.evidence.map((evidence) => `  evidence ${evidence.kind}: ${evidence.sourceContactId} ${evidence.consecutiveEvaluations}/2 (${evidence.permittedFacts.join(",")})`),
        ...brain.adaptation.roleTargets.map((target) => `  counter ${target.role}: ${target.desired} (${target.evidenceIds.join(",")})`),
        `Research: ${brain.adaptation.selectedResearchType ?? "no positive legal candidate"} (${brain.adaptation.selectedResearchScore ?? "n/a"})`,
        `Committed production: ${brain.adaptation.cancellationPolicy}`,
        `Active reservations: ${state.reservations.length}`
      ];
    }
    if (category === "logistics") {
      const workers = observation.actors.filter((actor) => actor.relation === "self" && actor.capabilities.some((capability) => capability.family === "gather"));
      return [
        "=== LOGISTICS & WORKERS ===",
        `Observed workers: ${workers.length}`,
        `Recovery records: ${brain.recovery.length}`,
        ...brain.recovery.slice(0, 8).map((record) => `${record.domain}:${record.cause} attempt ${record.attempt} → ${record.state}`)
      ];
    }
    if (category === "intel") {
      return [
        "=== ENEMY INTEL & SCOUTING ===",
        `Generation ${observation.generation}, tick ${observation.tick}`,
        `Visible: ${observation.threatSummary.visibleEnemyActorIds.length}; remembered: ${observation.threatSummary.rememberedEnemyActorIds.length}`,
        `Capabilities: ${observation.threatSummary.observedCapabilityFamilies.join(", ") || "none observed"}`,
        ...brain.skirmish.questions.slice(0, 5).map((question) => `${question.kind}: ${question.state} (${question.questionId})`),
        ...brain.skirmish.incidents.slice(0, 5).map((incident) => `${incident.kind}: severity ${incident.severity}, confidence ${incident.confidencePermille}`)
      ];
    }
    return [
      "=== ADAPTIVE THRESHOLDS ===",
      `Difficulty profile: ${brain.profileDifficulty} (${brain.profileVersion})`,
      `Archetype: ${brain.archetypeId}; adaptation every ${this.historyOffset === 0 ? "committed eligible decision" : "recorded decision"}`,
      "Engage band: ≥1200‰ local estimate with sufficient confidence",
      "Retreat band: <800‰ local estimate or critical health",
      "Target switch: ≥20% score improvement",
      "Values shown are committed policy, not live recalculation"
    ];
  }

  private getSquadSupportLines(controller: PlayerAiController): string[] {
    const brain = this.getSelectedBrainSnapshot(controller);
    const lines = ["=== SQUADS & SUPPORT ==="];
    if (!brain?.skirmish.squads.length) lines.push("No active squads");
    for (const squad of brain?.skirmish.squads ?? []) {
      lines.push(`${squad.squadId}: ${squad.state}/${squad.script ?? "basic"} [${squad.domain}] ${squad.members}`);
      lines.push(`  task force ${squad.taskForceId ?? "none"}, objective ${squad.objectiveId ?? "none"}, target ${squad.targetActorId ?? "none"}`);
      lines.push(`  local ${squad.engagementRatioPermille ?? "?"}‰ @ ${squad.confidencePermille ?? "?"}‰; predicted loss ${squad.predictedFriendlyLossPermille ?? "?"}‰`);
      lines.push(`  observed losses ${squad.observedLossCount}; last useful effect ${squad.lastUsefulEffectTick ?? "none"}`);
      lines.push(`  orders ${squad.orderedActorCount}/${squad.members}, damage claims ${squad.damageReservationCount}, reserve ${squad.mobileReserveCount}, oscillation ${squad.oscillationCount}`);
      const alternative = squad.objectiveAlternatives[0];
      if (alternative) lines.push(`  best alternative ${alternative.objectiveId}=${alternative.score} (${alternative.reason})`);
    }
    lines.push("", "--- Support windows ---");
    if (!brain?.support.length) lines.push("No manual support window (autocast may remain runtime-owned)");
    for (const plan of brain?.support ?? []) {
      lines.push(`${plan.planId}: ${plan.kind}/${plan.state}, useful ${plan.usefulCapacity}`);
      lines.push(`  ${plan.spellType ?? "heal"} ${plan.actorIds.join(",")} → ${plan.targetIds.join(",")} until ${plan.expiresAtTick ?? "outcome"}`);
      lines.push(`  ${plan.reason}; effect ${plan.effectId ?? "none"}`);
    }
    this.renderTacticalOverlay(brain?.skirmish.squads ?? []);
    return lines;
  }

  private getRuntimeLines(controller: PlayerAiController): string[] {
    const brain = this.getSelectedBrainSnapshot(controller);
    if (!brain) return ["=== RUNTIME & LIMITS ===", "No committed decision snapshot"];
    const history = controller.getBrainDebugHistory();
    const lines = [
      "=== RUNTIME & LIMITS ===",
      `Tick ${brain.tick}, generation ${brain.generation}, decision ${brain.runtimeLimits.decisionSequence}`,
      `History ${history.length}, trace decisions ${brain.runtimeLimits.retainedTraceDecisions}`,
      `Completeness o=${brain.completeness.observation}/s=${brain.completeness.priorState}/r=${brain.completeness.outcomes}/a=${brain.completeness.alternatives}`,
      `Truncated events ${brain.completeness.truncatedEventCount}`,
      "--- Lane service ---"
    ];
    for (const lane of brain.runtimeLimits.laneService) lines.push(`${lane.lane}: deficit ${lane.deficit}, serviced ${lane.lastServicedTick}`);
    lines.push("--- Cursors ---");
    for (const cursor of brain.runtimeLimits.continuationCursors) lines.push(`${cursor.owner}: ${cursor.cursor}`);
    lines.push("JSON export: PlayerAiController.exportBrainDebugHistory() (explicit developer action)");
    lines.push("Live history is read-only; stepping/what-if is available only in the isolated replay workbench.");
    return lines;
  }

  private getTransportLines(controller: PlayerAiController): string[] {
    const brain = this.getSelectedBrainSnapshot(controller);
    const observation = this.historyOffset === 0 ? controller.getCommittedObservation() : undefined;
    const graph = observation?.map?.accessGraph;
    const lines = [
      "=== ROUTES & TRANSPORT ===",
      graph
        ? `Graph: ${graph.status} g${graph.generation} s${graph.staticRevision}/d${graph.dynamicRevision}/t${graph.threatRevision}`
        : "Graph: not committed",
      graph ? `Regions: ${graph.nodes.length}, links: ${graph.links.length}, transfers: ${graph.transferPoints.length}` : "Regions: unavailable"
    ];
    if (!brain?.transportOperations.length) {
      lines.push("", "No active or retained transport plans");
      this.clearTransportOverlay();
      return lines;
    }
    lines.push("");
    for (const operation of brain.transportOperations) {
      lines.push(`${operation.planId}: ${operation.phase} (${operation.routeKind})`);
      lines.push(`  cargo ${operation.passengers}, carriers ${operation.transports}, seats ${operation.capacity}`);
      lines.push(`  route g${operation.routeGeneration}/${operation.graphGeneration ?? "?"}, due ${operation.deadlineTick}, recovery ${operation.recoveryAttempt}`);
      if (operation.terminalReason) lines.push(`  reason: ${operation.terminalReason}`);
    }
    this.renderTransportOverlay(brain.transportOperations);
    return lines;
  }

  /** Renders only the saved Stage-10 base snapshot; it never asks the live scene to score placement. */
  private getBaseLines(controller: PlayerAiController): string[] {
    const brain = this.getSelectedBrainSnapshot(controller);
    const lines = ["=== BASES & PLACEMENT ==="];
    if (!brain?.bases.length) return [...lines, "No committed main-structure base identity"];
    for (const base of brain.bases) {
      lines.push(`${base.baseId}: ${base.lifecycle}, anchor ${base.anchorActorId ?? "pending"}, members ${base.memberCount}`);
      lines.push(`  access ${base.accessNodeId ?? "pending"}, reserved ${base.reservedSiteKey ?? "none"}, rejected ${base.rejectedSiteCount}`);
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
      lines.push(`  paths whole=${plan.wholeConnectivity}, prefixes=${plan.incrementalConnectivity}, cap=${plan.spendPermille ?? "?"}‰`);
      lines.push(`  anchors ${plan.terrainAnchorTileKeys.join(" ↔ ") || "unknown"}, protects ${plan.protectedAssetCount}`);
      lines.push(`  budget ${plan.budgetRemaining.map((entry) => `${entry.resourceType}:${entry.amount}`).join(",") || "none"}`);
      lines.push(`  opening ${plan.openingNodeId ?? "legacy"}, breach ${plan.breachReason ?? "none"} (${plan.breachRisk}), recovery ${plan.recoveryAttempts}`);
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
      lines.push(`  retry ${entry.nextRetryTick}, deadline ${entry.phaseDeadlineTick}, alternate ${entry.alternate ?? "none"}, released ${entry.releasedClaimCount}`);
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
        const color = node.kind === "gate_slot" ? 0x4caf50 : node.kind === "tower" ? 0xff9800 : node.kind === "stair" ? 0x40c4ff : 0xffffff;
        graphics.fillStyle(color, node.lifecycle === "finished" ? 0.95 : 0.55).fillCircle(world.x, world.y, node.kind === "tower" ? 7 : 5);
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

  private getOverviewLines(controller: PlayerAiController, now: number): string[] {
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

  private getCommandAuthorityLines(controller: PlayerAiController): string[] {
    const brain = this.getSelectedBrainSnapshot(controller);
    if (this.historyOffset > 0) {
      if (!brain) return ["=== COMMAND AUTHORITY ===", "Historical decision not retained"];
      return [
        "=== RECORDED PLAN / COMMAND DRILLDOWN ===",
        ...brain.decisions.slice(-10).flatMap((decision) => [
          `${decision.outcome}: ${decision.intent.intentId}`,
          `  plan ${decision.intent.planId}; effect ${decision.intent.effectId}`,
          `  ${decision.reason}${decision.outcome === "rejected" ? `:${decision.detail}` : ""}; claims ${decision.intent.claims.length}`
        ]),
        ...brain.whyNot.slice(0, 5).map((entry) => `why-not ${entry.subjectId}: ${entry.status}/${entry.reason ?? "not recorded"}`)
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

  private getStrategyLines(controller: PlayerAiController, now: number): string[] {
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
    const brainState = controller.getBrainState();
    const lines: string[] = [];

    lines.push(`=== PRODUCTION & TECH ===`);
    if (brainState) {
      lines.push(`--- Stage 7 Macro Plan ---`);
      lines.push(`Opening step: ${brainState.opening.plan.currentStepId ?? "transition"}`);
      for (const demand of brainState.economyProduction.demands.slice(0, 4)) {
        lines.push(`  ${demand.purpose}: ${demand.satisfiedActorIds.length}/${demand.desired} ${demand.capabilityOrRole}`);
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
    const observation = controller.getCommittedObservation();
    const observationDebug = controller.getObservationDebugSnapshot();

    lines.push(`=== ENEMY INTEL & SCOUTING ===`);

    lines.push(`--- Fair Observation ---`);
    lines.push(`Policy: ${observationDebug.policy}`);
    lines.push(
      `Generation: ${observationDebug.committedGeneration}/${observationDebug.requestedGeneration} at tick ${observationDebug.committedTick ?? "pending"}; age ${observationDebug.observationAgeTicks ?? "unknown"}`
    );
    lines.push(`Visible / remembered: ${observationDebug.visibleContactCount} / ${observationDebug.rememberedContactCount}`);
    lines.push(`Unknown facts: ${observationDebug.unknownFactCount}`);
    lines.push(`Access revision / cursor: ${observationDebug.queryInputRevision} / ${observationDebug.queryContinuationCursor}`);
    lines.push(`Invalidation debt: ${observationDebug.invalidationDebt}`);
    if (observationDebug.lastCommitError) lines.push(`Observation error: ${observationDebug.lastCommitError}`);
    if (observation) {
      const accessStates = observation.accessProducts.reduce<Record<string, number>>((counts, product) => {
        counts[product.status] = (counts[product.status] ?? 0) + 1;
        return counts;
      }, {});
      lines.push(`Access products: ${Object.entries(accessStates).map(([status, count]) => `${status}:${count}`).join(", ") || "none"}`);
      lines.push(
        `Threat evidence: visible ${observation.threatSummary.visibleEnemyActorIds.length}, remembered ${observation.threatSummary.rememberedEnemyActorIds.length}; ${observation.threatSummary.observedCapabilityFamilies.join(", ") || "none"}`
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
        lines.push(`Threat ${incident.kind}: severity ${incident.severity}, confidence ${incident.confidencePermille}, expires ${incident.expiresAtTick}`);
      }
      if (!brain.skirmish.incidents.length) lines.push("Threat: none recorded");
      lines.push(`Mode: ${brain.skirmish.mode.state}; ${brain.skirmish.mode.reason ?? "no mode reason"}`);
      lines.push(`--- Missions ---`);
      for (const squad of brain.skirmish.squads.slice(0, 4)) {
        lines.push(`${squad.squadId}: ${squad.role}/${squad.state}, ${squad.members} members, target ${squad.objectiveId ?? "none"}`);
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

  private getThresholdsLines(controller: PlayerAiController, now: number): string[] {
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
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
