import { AI_RUNTIME_PRESET_CONTROL_EVENT, type AiRuntimePresetControlEvent } from "./ai-runtime-preset-control-event";
import { AiRuntimeProductionWorldCapture } from "./ai-runtime-production-world-capture";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import Phaser from "phaser";
import { Subscription } from "rxjs";
import { ProbableWafflePlayerType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { getPlayer, isSnapshotApplyInProgress } from "../../../data/scene-data";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { captureAiRuntimeProductionQueue } from "./ai-runtime-production-queues";
import type { AiRuntimeProductionCaptureV1 } from "./ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from "./ai-runtime-production-fact-v1";
import {
  AI_INTENT_COMMAND_DISPATCH_EVENT,
  type AiIntentCommandDispatchEvent
} from "../ai-intent-command-dispatch-event";
import { AiRuntimePendingCommands } from "./ai-runtime-pending-commands";

import { AI_DECISION_DISPATCH_EVENT, type AiDecisionDispatchEvent } from "../ai-decision-dispatch-event";
import { AiRuntimeUnspentClaims } from "./ai-runtime-unspent-claims";
import { projectAiRuntimeProductionBoundaryState } from "./project-ai-runtime-production-boundary-state";
import { captureAiRuntimeProductionSnapshot } from "./capture-ai-runtime-production-snapshot";
import { AiRuntimeProductionSpatialCapture } from "./ai-runtime-production-spatial-capture";
import { captureAiRuntimeInitialConstruction } from "./capture-ai-runtime-initial-construction";
import type { AiRuntimeInitialConstructionV1 } from "./ai-runtime-initial-construction-v1";
import { AiRuntimeResourceCoverageCapture } from "./ai-runtime-resource-coverage-capture";
import type { AiRuntimeResourceServiceIntervalV1 } from "./ai-runtime-resource-service-interval-v1";
import { AiRuntimeRecipientResourceCapture } from "./ai-runtime-recipient-resource-capture";
import { AiRuntimeResourceInputCapture } from "./ai-runtime-resource-input-capture";
import { AI_RUNTIME_MAX_FACTS as MAX_FACTS, appendAiRuntimeProductionFact } from "./append-ai-runtime-production-fact";

import {
  CONSTRUCTION_AUTHORITY_EVENT,
  type ConstructionAuthorityEvent
} from "../../../entity/components/construction/construction-authority-event";
import { AiRuntimeProductionProofCapture } from "./ai-runtime-production-proof-capture";

import { AiRuntimeProductionQueueCapture } from "./ai-runtime-production-queue-capture";

const MAX_SNAPSHOTS = 256;

/** Test-owned passive subscriptions. It retains callback order and actual money without inferring refund attribution. */
export class AiRuntimeProductionCapture {
  private readonly subscriptions = new Subscription();
  private readonly queueSubscriptions = new Map<Phaser.GameObjects.GameObject, Subscription>();
  private readonly localItemIds = new WeakMap<UnifiedQueueItem, string>();
  private readonly facts: AiRuntimeProductionFactV1[] = [];
  private readonly snapshots = new Map<number, AiRuntimeProductionCaptureV1["snapshots"][number][]>();
  private readonly snapshotDrops = new Map<number, number>();
  private readonly startedTick: number;
  private nextItemId = 1;
  private nextSequence = 1;
  private readonly factDrops = new Map<number, number>();
  private readonly pendingCommands = new AiRuntimePendingCommands();
  private readonly unspentClaims = new AiRuntimeUnspentClaims();
  private disposed = false;
  private readonly spatialCapture: AiRuntimeProductionSpatialCapture;
  private readonly initialConstruction: Map<number, AiRuntimeInitialConstructionV1>;
  private readonly resourceCoverage: AiRuntimeResourceCoverageCapture;
  private readonly resourceIntervalDeclaration: AiRuntimeProductionCaptureV1["resourceIntervalDeclaration"];
  private readonly recipientResources: AiRuntimeRecipientResourceCapture;
  private readonly resourceInputs: AiRuntimeResourceInputCapture;
  private readonly proof: AiRuntimeProductionProofCapture;
  private queueAuthority?: AiRuntimeProductionQueueCapture;
  private worldAuthority?: AiRuntimeProductionWorldCapture;

  constructor(
    private readonly scene: ProbableWaffleScene,
    intervals: readonly AiRuntimeResourceServiceIntervalV1[] = []
  ) {
    const ticks = getSceneService(scene, SimulationTickService);
    const bus = getSceneService(scene, CommandBusService);
    const index = getSceneService(scene, ActorIndexSystem);
    const tech = getSceneService(scene, TechTreeService);
    const playerChanged = scene.communicator.playerChanged;
    if (!ticks || !bus || !index || !tech || !playerChanged) throw new Error("production_capture_authority_missing");
    this.startedTick = ticks.currentTick;
    this.proof = new AiRuntimeProductionProofCapture(scene, this.identify, () => this.nextSequence - 1);
    this.resourceIntervalDeclaration = structuredClone({
      boundary: { tick: this.startedTick, captureSequence: 0 },
      overflow: intervals.length > 256,
      intervals: intervals.length > 256 ? [] : intervals
    });
    this.resourceCoverage = new AiRuntimeResourceCoverageCapture(this.startedTick, () => {
      const clock = getSceneService(scene, SimulationTickService);
      if (clock !== ticks) this.resourceCoverage.lose("clock_service_replaced");
      return { tick: clock?.currentTick ?? this.startedTick, captureSequence: this.nextSequence - 1 };
    });
    const initialActors = index.getAllIdActors();
    try {
      this.recipientResources = new AiRuntimeRecipientResourceCapture(
        scene,
        this.resourceCoverage,
        (playerNumber) => this.boundary(playerNumber),
        () => this.nextSequence - 1,
        (fact) => this.append(fact)
      );
      this.resourceInputs = new AiRuntimeResourceInputCapture(
        scene,
        this.resourceCoverage,
        () => this.recipientResources.reconcile(),
        () => this.nextSequence - 1,
        (playerNumber) => this.boundary(playerNumber),
        (fact) => this.append(fact),
        (playerNumber) => this.unspentClaims.snapshot(playerNumber)
      );
      this.initialConstruction = captureAiRuntimeInitialConstruction(scene, initialActors, this.startedTick);
      this.spatialCapture = new AiRuntimeProductionSpatialCapture(
        scene,
        this.identify,
        (playerNumber, spatial) => {
          if (spatial.kind === "placement" && spatial.site.actorId && spatial.legal) {
            this.unspentClaims.observePlacement(spatial.command, spatial.site.actorId);
          }
          this.append({ ...this.boundary(playerNumber), kind: "spatial_authority", spatial });
        },
        this.resourceCoverage
      );
      this.queueAuthority = new AiRuntimeProductionQueueCapture(
        scene,
        this.identify,
        this.unspentClaims,
        (player) => this.boundary(player),
        (fact, item) => this.append(fact, item)
      );
      scene.events.on(AI_RUNTIME_PRESET_CONTROL_EVENT, this.observeControl, this);
      scene.events.on(AI_DECISION_DISPATCH_EVENT, this.observeDecision, this);
      scene.events.on(AI_INTENT_COMMAND_DISPATCH_EVENT, this.observeDispatch, this);
      scene.events.on(CONSTRUCTION_AUTHORITY_EVENT, this.observeConstruction, this);
      this.subscriptions.add(
        bus.commandOutcome$.subscribe((outcome) => {
          const boundary = this.boundary(outcome.playerNumber);
          const boundaryStateBefore =
            this.facts.length < MAX_FACTS ? this.sampleBoundaryState(outcome.playerNumber) : undefined;
          this.pendingCommands.observeOutcome(outcome, boundary.tick);
          this.unspentClaims.observeOutcome(outcome);
          this.append({
            ...boundary,
            kind: "outcome",
            outcome,
            boundaryStateBefore,
            scheduledTick: outcome.kind === "dispatched" ? outcome.tick : null
          });
        })
      );
      this.subscriptions.add(
        bus.command$.subscribe((command) =>
          this.append({
            ...this.boundary(command.playerNumber),
            kind: "command_delivered",
            command
          })
        )
      );
      this.worldAuthority = new AiRuntimeProductionWorldCapture(scene, {
        resources: (player) => this.resources(player),
        boundary: (player) => this.boundary(player),
        append: (fact) => this.append(fact),
        watchQueue: (actor) => this.watchQueue(actor),
        unwatchActor: (actor) => {
          this.queueSubscriptions.get(actor)?.unsubscribe();
          this.queueSubscriptions.delete(actor);
          this.spatialCapture.unwatchActor(actor);
        }
      });
      // Components can finish initialization after index registration. This test-only scan attaches missing listeners.
      this.subscriptions.add(
        ticks.tick$.subscribe(() => {
          this.resourceCoverage.tick(ticks.currentTick);
          try {
            this.recipientResources.reconcile();
          } catch {
            this.resourceCoverage.lose("recipient_reconcile_failed");
          }
          index.getAllIdActors().forEach((actor) => this.watchQueue(actor));
        })
      );
      initialActors.forEach((actor) => this.watchQueue(actor));
      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.dispose, this);
      scene.events.once(Phaser.Scenes.Events.DESTROY, this.dispose, this);
    } catch (error) {
      this.resourceCoverage.lose("capture_installation_failed");
      try {
        this.dispose();
      } catch {
        /* Preserve the original installation error after owned cleanup. */
      }
      throw error;
    }
  }

  /** Appends one detached snapshot at a settled decision boundary; tick zero permits no committed AI input yet. */
  capture(playerNumber: number, latestTick?: number): AiRuntimeProductionCaptureV1 {
    if (latestTick !== undefined) {
      const clock = getSceneService(this.scene, SimulationTickService);
      if (clock?.currentTick === 0 && clock.isPaused) this.worldAuthority?.syncSetupBalances();
      this.proof.arm(playerNumber, latestTick);
    }
    return this.captureBoundary(playerNumber, true);
  }

  /** Human queue authority has no AI decision input. Test-owned callbacks choose and name these exact boundaries. */
  captureHumanQueueBoundary(playerNumber: number): AiRuntimeProductionCaptureV1 {
    const player = getPlayer(this.scene, playerNumber);
    if (player?.playerController.data.playerDefinition?.playerType !== ProbableWafflePlayerType.Human) {
      throw new Error("production_capture_human_boundary_required");
    }
    return this.captureBoundary(playerNumber, false);
  }

  private captureBoundary(playerNumber: number, requireDecision: boolean): AiRuntimeProductionCaptureV1 {
    if (this.disposed) throw new Error("production_capture_disposed");
    try {
      return this.readBoundary(playerNumber, requireDecision);
    } catch (error) {
      this.resourceCoverage.lose("boundary_read_failed");
      throw error;
    }
  }

  private readBoundary(playerNumber: number, requireDecision: boolean): AiRuntimeProductionCaptureV1 {
    this.recipientResources.reconcile();
    if (isSnapshotApplyInProgress(this.scene)) this.resourceCoverage.lose("snapshot_restore");
    const { snapshot, pending } = captureAiRuntimeProductionSnapshot(this.scene, playerNumber, requireDecision, {
      startedTick: this.startedTick,
      afterSequence: this.facts.reduce(
        (sequence, fact) => (fact.playerNumber === playerNumber ? fact.sequence : sequence),
        0
      ),
      resources: this.resources(playerNumber),
      resourceCoverage: this.resourceCoverage.read(),
      pendingCommands: this.pendingCommands,
      identify: this.identify,
      watchQueue: (actor) => this.watchQueue(actor)
    });
    const snapshots = this.snapshots.get(playerNumber) ?? [];
    if (snapshots.length < MAX_SNAPSHOTS) snapshots.push(structuredClone(snapshot));
    else {
      this.resourceCoverage.lose("snapshot_overflow");
      this.snapshotDrops.set(playerNumber, (this.snapshotDrops.get(playerNumber) ?? 0) + 1);
    }
    this.snapshots.set(playerNumber, snapshots);
    return structuredClone({
      schemaVersion: 1,
      kind: "production_authority_capture",
      startedTick: this.startedTick,
      playerNumber,
      ...this.proof.read(playerNumber),
      droppedFactCount: this.factDrops.get(playerNumber) ?? 0,
      droppedSnapshotCount: this.snapshotDrops.get(playerNumber) ?? 0,
      initialConstruction: this.initialConstruction.get(playerNumber),
      resourceCoverage: this.resourceCoverage.read(),
      resourceIntervalDeclaration: this.resourceIntervalDeclaration,
      gaps: [
        "resource_item_attribution",
        "queue_resource_runtime_authority_unverified",
        "pending_dispatch_before_capture_or_restore",
        "navigation_placement_authority",
        "pre_registration_queue_events",
        "capture_local_identity_restore",
        "initial_paid_item_provenance",
        "decision_snapshot_cadence",
        ...pending.gaps
      ],
      facts: this.facts.filter((fact) => fact.playerNumber === playerNumber),
      snapshots,
      recipientResourceFacts: this.facts.filter(
        (fact) =>
          fact.kind === "recipient_resources_installed" ||
          fact.kind === "recipient_resource_mutation" ||
          fact.kind === "resource_input_read" ||
          fact.kind === "resource_need_fence"
      )
    } satisfies AiRuntimeProductionCaptureV1);
  }

  /** Idempotent scene teardown fences retained handles and unsubscribes even while a callback is awaiting a boundary. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.resourceCoverage.lose("capture_disposed");
    this.proof.dispose();
    this.queueAuthority?.dispose();
    this.worldAuthority?.dispose();
    this.recipientResources?.dispose();
    this.resourceInputs?.dispose();
    this.spatialCapture?.dispose();
    this.subscriptions.unsubscribe();
    this.queueSubscriptions.forEach((subscription) => subscription.unsubscribe());
    this.queueSubscriptions.clear();
    this.initialConstruction?.clear();
    this.snapshots.clear();
    this.facts.length = 0;
    this.pendingCommands.dispose();
    this.unspentClaims.dispose();
    this.scene.events.off(AI_RUNTIME_PRESET_CONTROL_EVENT, this.observeControl, this);
    this.scene.events.off(AI_DECISION_DISPATCH_EVENT, this.observeDecision, this);
    this.scene.events.off(AI_INTENT_COMMAND_DISPATCH_EVENT, this.observeDispatch, this);
    this.scene.events.off(CONSTRUCTION_AUTHORITY_EVENT, this.observeConstruction, this);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.dispose, this);
    this.scene.events.off(Phaser.Scenes.Events.DESTROY, this.dispose, this);
  }

  /** Command context is the durable lineage; legacy/uncommanded handles retain identity only within this capture. */
  private readonly identify = (actorId: string, item: UnifiedQueueItem): string => {
    const commandId = item.commandContext?.execution.commandId;
    if (commandId) return `queue:${actorId}:${commandId}`;
    let id = this.localItemIds.get(item);
    if (!id) {
      id = `capture-item:${actorId}:${this.nextItemId++}`;
      this.localItemIds.set(item, id);
    }
    return id;
  };

  private watchQueue(actor: Phaser.GameObjects.GameObject): void {
    this.spatialCapture.watchActor(actor);
    if (this.disposed || actor.scene !== this.scene || this.queueSubscriptions.has(actor)) return;
    const queue = getActorComponent(actor, QueueComponent);
    if (!queue) return;
    this.queueSubscriptions.set(
      actor,
      queue.queueChangedObservable.subscribe(() => {
        const playerNumber = getActorComponent(actor, OwnerComponent)?.getOwner();
        const captured = captureAiRuntimeProductionQueue(actor, this.identify);
        if (playerNumber !== undefined && captured) {
          this.unspentClaims.observeQueue(playerNumber, captured);
          this.append({ ...this.boundary(playerNumber), kind: "queue_changed", queue: captured });
        }
      })
    );
  }

  private resources(playerNumber: number): Record<ResourceType, number> {
    const resources = getPlayer(this.scene, playerNumber)?.getResources();
    if (!resources) throw new Error("production_capture_player_missing");
    return { ...resources };
  }

  /** Explicit test-controller provenance enters the same bounded sequence as native callbacks. */
  private readonly observeControl = (control: AiRuntimePresetControlEvent): void => {
    this.append({ ...this.boundary(control.playerNumber), kind: "preset_control", control });
  };

  /** The selected result precedes dispatch, even when the saved brain/debug view still names the prior decision. */
  private readonly observeDecision = (decision: AiDecisionDispatchEvent): void => {
    if (this.disposed) return;
    const unspentClaimsBeforeSelection = this.unspentClaims.snapshot(decision.identity.playerNumber);
    this.unspentClaims.observeDecision(decision);
    this.append({
      ...this.boundary(decision.identity.playerNumber),
      kind: "decision_selected",
      decision,
      unspentClaimsBeforeSelection
    });
  };

  private sampleBoundaryState(playerNumber: number, exhaustedProgressItem?: UnifiedQueueItem) {
    return projectAiRuntimeProductionBoundaryState(
      this.scene,
      playerNumber,
      this.pendingCommands,
      this.identify,
      this.unspentClaims.snapshot(playerNumber),
      exhaustedProgressItem
    );
  }

  private readonly observeDispatch = (event: AiIntentCommandDispatchEvent): void => {
    if (this.disposed) return;
    const boundary = this.boundary(event.playerNumber);
    const boundaryStateBefore =
      this.facts.length < MAX_FACTS ? this.sampleBoundaryState(event.playerNumber) : undefined;
    this.pendingCommands.observeDispatch(event, boundary.tick);
    this.unspentClaims.observeDispatch(event);
    this.append({ ...boundary, kind: "intent_dispatch", event, boundaryStateBefore });
  };

  private readonly observeConstruction = (event: ConstructionAuthorityEvent): void => {
    if (this.disposed || event.site.scene !== this.scene) return;
    const { site: liveSite, ...record } = event;
    const site = captureAiRuntimeCreatedActor(liveSite);
    if (site.playerNumber === null) return;
    this.unspentClaims.observeConstruction(site.playerNumber, {
      ...record,
      site,
      clockTick: getSceneService(this.scene, SimulationTickService)?.currentTick ?? null,
      sceneActive: this.scene.sys?.isActive() ?? false
    });
    this.append({
      ...this.boundary(site.playerNumber),
      kind: "construction_authority",
      construction: {
        ...record,
        site,
        clockTick: getSceneService(this.scene, SimulationTickService)?.currentTick ?? null,
        sceneActive: this.scene.sys?.isActive() ?? false
      }
    });
  };

  private boundary(playerNumber: number) {
    return { sequence: 0, tick: getSceneService(this.scene, SimulationTickService)?.currentTick ?? 0, playerNumber };
  }

  private append(fact: AiRuntimeProductionFactV1, exhaustedProgressItem?: UnifiedQueueItem): void {
    if (this.disposed) return;
    this.proof.observe({ ...fact, sequence: this.nextSequence });
    appendAiRuntimeProductionFact(
      this.facts,
      fact,
      this.nextSequence++,
      () => this.sampleBoundaryState(fact.playerNumber, exhaustedProgressItem),
      this.resourceCoverage.lose,
      () => {
        this.factDrops.set(fact.playerNumber, (this.factDrops.get(fact.playerNumber) ?? 0) + 1);
      }
    );
  }
}
