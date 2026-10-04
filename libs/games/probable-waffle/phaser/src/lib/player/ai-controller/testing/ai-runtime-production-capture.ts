import { QUEUE_MUTATION_EVENT, type QueueMutationEvent } from "../../../entity/components/queue/queue-mutation-event";
import { projectAiRuntimeQueueMutation } from "./project-ai-runtime-queue-mutation";
import Phaser from "phaser";
import { Subscription } from "rxjs";
import { ProbableWafflePlayerType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { getPlayer, isSnapshotApplyInProgress } from "../../../data/scene-data";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { getSceneService, getSceneSystem } from "../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { AiPlayerHandler } from "../ai-player-handler";
import { projectAiProductionObligations } from "../observation/ai-production-obligations";
import { captureAiRuntimeProductionQueue } from "./ai-runtime-production-queues";
import type { AiRuntimeProductionCaptureV1 } from "./ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from "./ai-runtime-production-fact-v1";
import { AI_INTENT_COMMAND_DISPATCH_EVENT, type AiIntentCommandDispatchEvent } from "../ai-intent-command-dispatch-event";
import { AiRuntimePendingCommands } from "./ai-runtime-pending-commands";
import { QUEUE_RESOURCE_EMISSION_EVENT, type QueueResourceEmissionEvent } from "../../../data/queue-resource-emission-event";
import { projectAiRuntimeQueueResource } from "./project-ai-runtime-queue-resource";

import { AI_DECISION_DISPATCH_EVENT, type AiDecisionDispatchEvent } from "../ai-decision-dispatch-event";
import { AiRuntimeUnspentClaims } from "./ai-runtime-unspent-claims";
import { QUEUE_PROGRESS_EVENT, type QueueProgressEvent } from "../../../entity/components/queue/queue-progress-event";
import { projectAiRuntimeProductionBoundaryState } from "./project-ai-runtime-production-boundary-state";

const MAX_FACTS = 8192;
const MAX_SNAPSHOTS = 256;

/** Test-owned passive subscriptions. It retains callback order and actual money without inferring refund attribution. */
export class AiRuntimeProductionCapture {
  private readonly subscriptions = new Subscription();
  private readonly queueSubscriptions = new Map<Phaser.GameObjects.GameObject, Subscription>();
  private readonly localItemIds = new WeakMap<UnifiedQueueItem, string>();
  private readonly lastBalances = new Map<number, Record<ResourceType, number>>();
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

  constructor(private readonly scene: ProbableWaffleScene) {
    const ticks = getSceneService(scene, SimulationTickService);
    const bus = getSceneService(scene, CommandBusService);
    const index = getSceneService(scene, ActorIndexSystem);
    const tech = getSceneService(scene, TechTreeService);
    const playerChanged = scene.communicator.playerChanged;
    if (!ticks || !bus || !index || !tech || !playerChanged) throw new Error("production_capture_authority_missing");
    this.startedTick = ticks.currentTick;
    for (const player of scene.players) {
      if (player.playerNumber !== undefined) this.lastBalances.set(player.playerNumber, this.resources(player.playerNumber));
    }
    scene.events.on(AI_DECISION_DISPATCH_EVENT, this.observeDecision, this);
    scene.events.on(AI_INTENT_COMMAND_DISPATCH_EVENT, this.observeDispatch, this);
    scene.events.on(QUEUE_MUTATION_EVENT, this.observeMutation, this);
    scene.events.on(QUEUE_PROGRESS_EVENT, this.observeProgress, this);
    scene.events.on(QUEUE_RESOURCE_EMISSION_EVENT, this.observeQueueResource, this);
    this.subscriptions.add(bus.commandOutcome$.subscribe((outcome) => {
      const boundary = this.boundary(outcome.playerNumber);
      const boundaryStateBefore = this.facts.length < MAX_FACTS ? this.sampleBoundaryState(outcome.playerNumber) : undefined;
      this.pendingCommands.observeOutcome(outcome, boundary.tick);
      this.unspentClaims.observeOutcome(outcome);
      this.append({ ...boundary, kind: "outcome", outcome, boundaryStateBefore,
        scheduledTick: outcome.kind === "dispatched" ? outcome.tick : null });
    }));
    this.subscriptions.add(bus.command$.subscribe((command) => this.append({
      ...this.boundary(command.playerNumber), kind: "command_delivered", command
    })));
    this.subscriptions.add(playerChanged.on.subscribe((event) => {
      if (event.property !== "resource.added" && event.property !== "resource.removed") return;
      const playerNumber = event.data.playerNumber;
      if (playerNumber === undefined) return;
      const after = this.resources(playerNumber);
      const before = this.lastBalances.get(playerNumber) ?? after;
      const amounts = { ...event.data.playerStateData?.resources };
      const sign = event.property === "resource.added" ? 1 : -1;
      const balanceMatches = Object.values(ResourceType).every((resource) =>
        after[resource] === before[resource] + sign * (amounts[resource] ?? 0));
      this.lastBalances.set(playerNumber, after);
      this.append({ ...this.boundary(playerNumber), kind: "resources_applied", action: event.property,
        amounts, before, after, balanceMatches });
    }));
    this.subscriptions.add(tech.researchCompleted.subscribe(({ playerNumber, researchType }) => this.append({
      ...this.boundary(playerNumber), kind: "research_completed", researchType
    })));
    this.subscriptions.add(index.actorRegistered.subscribe((actor) => this.watchQueue(actor)));
    this.subscriptions.add(index.actorUnregistered.subscribe((actor) => {
      const playerNumber = getActorComponent(actor, OwnerComponent)?.getOwner();
      const actorId = getActorComponent(actor, IdComponent)?.id;
      if (playerNumber !== undefined && actorId) this.append({
        ...this.boundary(playerNumber), kind: "actor_unregistered", actorId, objectName: actor.name
      });
      this.queueSubscriptions.get(actor)?.unsubscribe();
      this.queueSubscriptions.delete(actor);
    }));
    // Components can finish initialization after index registration. This test-only scan attaches missing listeners.
    this.subscriptions.add(ticks.tick$.subscribe(() => index.getAllIdActors().forEach((actor) => this.watchQueue(actor))));
    index.getAllIdActors().forEach((actor) => this.watchQueue(actor));
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.dispose, this);
    scene.events.once(Phaser.Scenes.Events.DESTROY, this.dispose, this);
  }

  /** Appends one detached snapshot at a settled decision boundary; tick zero permits no committed AI input yet. */
  capture(playerNumber: number): AiRuntimeProductionCaptureV1 {
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
    const tick = getSceneService(this.scene, SimulationTickService)?.currentTick ?? this.startedTick;
    const controller = requireDecision
      ? getSceneSystem(this.scene, AiPlayerHandler)?.getAiPlayerController(playerNumber) : undefined;
    if (requireDecision && tick > 0 && (!controller || !controller.isDecisionBoundarySettled())) {
      throw new Error("production_capture_boundary_unsettled");
    }
    const actors = (getSceneService(this.scene, ActorIndexSystem)?.getOwnedActors(playerNumber) ?? [])
      .filter((actor) => actor.scene === this.scene && actor.active && !getActorComponent(actor, HealthComponent)?.killed)
      .sort((a, b) => (getActorComponent(a, IdComponent)?.id ?? "").localeCompare(getActorComponent(b, IdComponent)?.id ?? ""));
    actors.forEach((actor) => this.watchQueue(actor));
    const queues = actors.flatMap((actor) => {
      const queue = captureAiRuntimeProductionQueue(actor, this.identify);
      return queue ? [queue] : [];
    });
    const state = controller?.getBrainState();
    const pending = this.pendingCommands.snapshot(playerNumber);
    const snapshot = {
      tick, observation: controller?.getCommittedObservation() ?? null,
      capabilityCatalog: controller?.getCommittedCapabilityCatalog() ?? null,
      ownedActors: actors.flatMap((actor) => {
        const actorId = getActorComponent(actor, IdComponent)?.id;
        return actorId ? [{ actorId, objectName: actor.name }] : [];
      }),
      economyProduction: state?.economyProduction ?? null, reservations: state?.reservations ?? [],
      resources: this.resources(playerNumber),
      pendingCommands: pending.commands, pendingResourceClaims: pending.resources,
      obligations: projectAiProductionObligations(actors.flatMap((actor) => getActorComponent(actor, QueueComponent)?.allItems ?? [])),
      queues, completedResearch: [...(getSceneService(this.scene, TechTreeService)?.getPlayerResearch(playerNumber) ?? [])].sort()
    } satisfies AiRuntimeProductionCaptureV1["snapshots"][number];
    const snapshots = this.snapshots.get(playerNumber) ?? [];
    if (snapshots.length < MAX_SNAPSHOTS) snapshots.push(structuredClone(snapshot));
    else this.snapshotDrops.set(playerNumber, (this.snapshotDrops.get(playerNumber) ?? 0) + 1);
    this.snapshots.set(playerNumber, snapshots);
    return structuredClone({
      schemaVersion: 1, kind: "production_authority_capture", startedTick: this.startedTick, playerNumber,
      droppedFactCount: this.factDrops.get(playerNumber) ?? 0,
      droppedSnapshotCount: this.snapshotDrops.get(playerNumber) ?? 0,
      gaps: ["resource_item_attribution", "queue_resource_runtime_authority_unverified",
        "pending_dispatch_before_capture_or_restore", "navigation_placement_authority",
        "pre_registration_queue_events", "capture_local_identity_restore", "initial_paid_item_provenance",
        "decision_snapshot_cadence", ...pending.gaps],
      facts: this.facts.filter((fact) => fact.playerNumber === playerNumber), snapshots
    } satisfies AiRuntimeProductionCaptureV1);
  }

  /** Idempotent scene teardown fences retained handles and unsubscribes even while a callback is awaiting a boundary. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.subscriptions.unsubscribe();
    this.queueSubscriptions.forEach((subscription) => subscription.unsubscribe());
    this.queueSubscriptions.clear();
    this.lastBalances.clear();
    this.snapshots.clear();
    this.facts.length = 0;
    this.pendingCommands.dispose();
    this.unspentClaims.dispose();
    this.scene.events.off(AI_DECISION_DISPATCH_EVENT, this.observeDecision, this);
    this.scene.events.off(AI_INTENT_COMMAND_DISPATCH_EVENT, this.observeDispatch, this);
    this.scene.events.off(QUEUE_MUTATION_EVENT, this.observeMutation, this);
    this.scene.events.off(QUEUE_PROGRESS_EVENT, this.observeProgress, this);
    this.scene.events.off(QUEUE_RESOURCE_EMISSION_EVENT, this.observeQueueResource, this);
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
    if (this.disposed || actor.scene !== this.scene || this.queueSubscriptions.has(actor)) return;
    const queue = getActorComponent(actor, QueueComponent);
    if (!queue) return;
    this.queueSubscriptions.set(actor, queue.queueChangedObservable.subscribe(() => {
      const playerNumber = getActorComponent(actor, OwnerComponent)?.getOwner();
      const captured = captureAiRuntimeProductionQueue(actor, this.identify);
      if (playerNumber !== undefined && captured) {
        this.unspentClaims.observeQueue(playerNumber, captured);
        this.append({ ...this.boundary(playerNumber), kind: "queue_changed", queue: captured });
      }
    }));
  }

  private resources(playerNumber: number): Record<ResourceType, number> {
    const resources = getPlayer(this.scene, playerNumber)?.getResources();
    if (!resources) throw new Error("production_capture_player_missing");
    return { ...resources };
  }

  /** The selected result precedes dispatch, even when the saved brain/debug view still names the prior decision. */
  private readonly observeDecision = (decision: AiDecisionDispatchEvent): void => {
    if (this.disposed) return;
    this.unspentClaims.observeDecision(decision);
    this.append({ ...this.boundary(decision.identity.playerNumber), kind: "decision_selected", decision });
  };

  private sampleBoundaryState(playerNumber: number, exhaustedProgressItem?: UnifiedQueueItem) {
    return projectAiRuntimeProductionBoundaryState(this.scene, playerNumber, this.pendingCommands, this.identify,
      this.unspentClaims.snapshot(playerNumber), exhaustedProgressItem);
  }

  private readonly observeDispatch = (event: AiIntentCommandDispatchEvent): void => {
    if (this.disposed) return;
    const boundary = this.boundary(event.playerNumber);
    this.pendingCommands.observeDispatch(event, boundary.tick);
    this.unspentClaims.observeDispatch(event);
    this.append({ ...boundary, kind: "intent_dispatch", event });
  };

  /** The live item can be outside the queue; projecting now preserves its actual handle identity and lineage. */
  private readonly observeQueueResource = (event: QueueResourceEmissionEvent): void => {
    if (this.disposed) return;
    const boundary = this.boundary(event.scope.playerNumber);
    const resource = projectAiRuntimeQueueResource(event, this.identify, boundary.tick);
    this.unspentClaims.observeResource(event.scope.playerNumber, resource);
    this.append({ ...boundary, kind: "queue_resource", resource });
  };

  /** Earliest physical insertion transfers future charges; removal callbacks retain their actual terminal ordering. */
  private readonly observeMutation = (event: QueueMutationEvent): void => {
    if (this.disposed) return;
    const playerNumber = getActorComponent(event.producer, OwnerComponent)?.getOwner();
    if (playerNumber === undefined) return;
    const mutation = projectAiRuntimeQueueMutation(event, this.identify);
    if (event.operation === "enqueue" && event.phase === "after") {
      const queue = captureAiRuntimeProductionQueue(event.producer, this.identify);
      if (queue) this.unspentClaims.observeQueue(playerNumber, queue);
    }
    // A completing head has already consumed its actual last progress attempt before this splice.
    const exhausted = event.operation === "complete_remove" && event.phase === "before" && event.item.remainingTime === 0
      ? event.item : undefined;
    this.append({ ...this.boundary(playerNumber), kind: "queue_mutation", mutation }, exhausted);
  };

  /** Samples the actual live head after shared decrement, before progress subscribers or async completion can mutate it. */
  private readonly observeProgress = (event: QueueProgressEvent): void => {
    if (this.disposed) return;
    const playerNumber = getActorComponent(event.producer, OwnerComponent)?.getOwner();
    if (playerNumber === undefined) return;
    let queue: ReturnType<typeof captureAiRuntimeProductionQueue> = null;
    try { queue = captureAiRuntimeProductionQueue(event.producer, this.identify); }
    catch { /* Missing authority stays explicit. */ }
    const itemId = queue ? this.identify(queue.actorId, event.item) : null;
    const lane = queue?.lanes.find((candidate) => candidate.items[0]?.itemId === itemId);
    const item = lane?.items[0] ?? null;
    const progress = {
      attemptId: event.attemptId, phase: event.phase, actorId: queue?.actorId ?? null, item,
      laneId: lane?.laneId ?? null, deltaMs: event.deltaMs, remainingBeforeMs: event.remainingBeforeMs,
      snapshotRestoreInProgress: isSnapshotApplyInProgress(this.scene),
      gaps: item ? [] : ["production_progress_live_head_missing"]
    };
    const exhausted = item && event.phase === "advanced" && event.item.remainingTime === 0 ? event.item : undefined;
    this.append({ ...this.boundary(playerNumber), kind: "queue_progress", progress }, exhausted);
  };

  private boundary(playerNumber: number) {
    return { sequence: 0, tick: getSceneService(this.scene, SimulationTickService)?.currentTick ?? 0, playerNumber };
  }

  private append(fact: AiRuntimeProductionFactV1, exhaustedProgressItem?: UnifiedQueueItem): void {
    if (this.disposed) return;
    const sequence = this.nextSequence++;
    if (this.facts.length < MAX_FACTS) {
      const boundaryState = [
        "decision_selected", "intent_dispatch", "outcome", "queue_resource", "queue_changed", "command_delivered",
        "queue_progress", "queue_mutation"
      ]
        .includes(fact.kind) ? this.sampleBoundaryState(fact.playerNumber, exhaustedProgressItem) : undefined;
      this.facts.push(structuredClone({ ...fact, sequence, ...(boundaryState ? { boundaryState } : {}) }));
    } else this.factDrops.set(fact.playerNumber, (this.factDrops.get(fact.playerNumber) ?? 0) + 1);
  }
}
