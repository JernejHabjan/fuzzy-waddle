import Phaser from "phaser";
import { Subscription } from "rxjs";
import { ProbableWaffleGameCommandTypes, type GameCommand, type GameCommandInput, type GameCommandOutcome } from
  "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { AiRuntimeProductionCapture } from "./ai-runtime-production-capture";
import type { AiMultiplayerSharedQueueWorldV1 } from "./ai-multiplayer-shared-queue-world-v1";
import { prepareAiMultiplayerSharedQueueWorld, SHARED_QUEUE_CANCEL_WINDOW_TICKS, SHARED_QUEUE_STABILITY_TICKS } from
  "./prepare-ai-multiplayer-shared-queue-world";

/** Separate explicit opt-in, inside the existing local-development multiplayer diagnostics gate. */
export function multiplayerSharedQueueWorldRequested(): AiMultiplayerSharedQueueWorldV1["branch"] | null {
  try {
    const value = typeof window === "undefined" ? null :
      window.sessionStorage.getItem("fuzzy-waddle:ai-multiplayer-shared-queue-world-v1");
    return value === "shared_contention" || value === "cancel_research" ? value : null;
  } catch {
    return null;
  }
}

/** Two distinct human socket experiments; sender-only requests and passive peer snapshots retain real authority. */
export class AiMultiplayerSharedQueueWorld {
  private readonly subscriptions = new Subscription();
  private readonly capture: AiRuntimeProductionCapture;
  private readonly ticks: SimulationTickService;
  private state: AiMultiplayerSharedQueueWorldV1["state"] = "initializing";
  private failure: string | null = null;
  private setup: AiMultiplayerSharedQueueWorldV1["setup"] = null;
  private readonly commands: AiMultiplayerSharedQueueWorldV1["commands"][number][] = [];
  private readonly requests: AiMultiplayerSharedQueueWorldV1["requests"][number][] = [];
  private readonly checkpoints: AiMultiplayerSharedQueueWorldV1["checkpoints"][number][] = [];
  private latestCapture: AiMultiplayerSharedQueueWorldV1["capture"] = null;
  private paidTick = -1;
  private refundTick = -1;
  private completedTick = -1;
  private createdActorId: string | null = null;
  private researchCompleted = false;
  private disposed = false;

  constructor(private readonly scene: ProbableWaffleScene, private readonly bus: CommandBusService,
    private readonly branch: AiMultiplayerSharedQueueWorldV1["branch"]) {
    const ticks = getSceneService(scene, SimulationTickService);
    if (!ticks) throw new Error("shared_queue_world_clock_missing");
    this.ticks = ticks;
    this.capture = new AiRuntimeProductionCapture(scene);
    this.subscriptions.add(bus.commandOutcome$.subscribe((outcome) => this.guard(() => this.observeOutcome(outcome))));
    this.subscriptions.add(bus.command$.subscribe((command) => this.guard(() => this.observeCommand(command))));
    this.subscriptions.add(ticks.tick$.subscribe((tick) => this.guard(() => this.onTick(tick))));
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
  }

  /** After both peers agree on setup, submit only through the local human's normal future socket command path. */
  start(): void {
    if (this.disposed || this.state !== "ready" || this.scene.playerOrNull?.playerNumber !== 1) {
      throw new Error("shared_queue_world_sender_not_ready");
    }
    this.guard(() => {
      this.state = "purchasing";
      if (this.branch === "shared_contention") {
        this.dispatch("train");
        this.dispatch("research");
      } else this.dispatch("purchase");
    });
    if (this.failure) throw new Error(this.failure);
  }

  /** Polling neither creates authority snapshots nor moves the clock. */
  getSnapshot(): AiMultiplayerSharedQueueWorldV1 {
    return structuredClone({ branch: this.branch, state: this.state, failure: this.failure, setup: this.setup,
      commands: this.commands, requests: this.requests, checkpoints: this.checkpoints, capture: this.latestCapture });
  }

  private onTick(tick: number): void {
    if (this.state === "initializing") {
      this.setup = prepareAiMultiplayerSharedQueueWorld(this.scene, tick, this.branch);
      this.state = "ready";
      this.checkpoint("ready");
    }
    const setup = this.setup;
    if (!setup) return;
    if (this.state === "running" && this.researchCompleted && this.effectPresent()) {
      this.completedTick = tick;
      this.state = "stabilizing";
      this.checkpoint("completed");
    }
    if (this.state === "stabilizing") {
      if (!this.effectPresent()) throw new Error("shared_queue_world_effect_lost_during_stability");
      if (tick >= this.completedTick + SHARED_QUEUE_STABILITY_TICKS) {
        this.checkpoint("stable");
        this.state = "complete";
        return;
      }
    }
    if (this.branch === "cancel_research" && this.scene.playerOrNull?.playerNumber === 1) {
      if (this.state === "paid" && tick > this.paidTick) {
        this.state = "probing";
        this.dispatch("probe");
      } else if (this.state === "probing") {
        const probe = this.requests.find((entry) => entry.role === "probe");
        if (probe && tick > probe.requestedTick && !this.requests.some((entry) => entry.role === "cancel")) {
          if (tick >= probe.command.tick) throw new Error("shared_queue_probe_applied_before_request");
          const cancellation = this.dispatch("cancel");
          if (cancellation.tick <= probe.command.tick || cancellation.tick - this.paidTick > SHARED_QUEUE_CANCEL_WINDOW_TICKS) {
            throw new Error("shared_queue_cancellation_window_invalid");
          }
          this.checkpoint("cancel_pending");
        }
      } else if (this.state === "refunded" && tick > this.refundTick) {
        this.state = "running";
        this.dispatch("resume");
      }
    }
    const first = this.checkpoints.find((entry) => entry.boundary === "paid")?.snapshot.tick;
    const duration = this.branch === "shared_contention"
      ? setup.train.durationMs + setup.research.durationMs : setup.replacement.durationMs;
    if (first !== undefined && tick > first + Math.ceil(duration / 50) + 100) {
      throw new Error("shared_queue_world_deadline_exceeded");
    }
  }

  private dispatch(role: AiMultiplayerSharedQueueWorldV1["commands"][number]["role"]): GameCommand {
    const setup = this.setup;
    if (!setup) throw new Error("shared_queue_world_setup_missing");
    const address = { playerNumber: setup.playerNumber, actorIds: [setup.producerActorId] };
    let input: GameCommandInput;
    if (role === "train") input = { ...address, type: ProbableWaffleGameCommandTypes.Production, actorName: setup.train.product };
    else if (role === "cancel") input = { ...address, type: ProbableWaffleGameCommandTypes.CancelResearch };
    else input = { ...address, type: ProbableWaffleGameCommandTypes.Research,
      researchType: role === "probe" || role === "resume" ? setup.replacement.type : setup.research.type };
    const receipt = this.bus.dispatch(input);
    if (receipt.status !== "dispatched" || !receipt.command.execution || receipt.command.tick <= this.ticks.currentTick) {
      throw new Error(`shared_queue_world_dispatch_failed:${role}`);
    }
    this.commands.push({ role, command: receipt.command });
    this.requests.push({ role, requestedTick: this.ticks.currentTick, command: receipt.command });
    return receipt.command;
  }

  private observeCommand(command: GameCommand): void {
    const setup = this.setup;
    if (!setup || command.playerNumber !== setup.playerNumber || command.actorIds.length !== 1 ||
      command.actorIds[0] !== setup.producerActorId || this.commands.some((entry) =>
        entry.command.execution?.commandId === command.execution?.commandId)) return;
    let role: AiMultiplayerSharedQueueWorldV1["commands"][number]["role"];
    if (command.type === ProbableWaffleGameCommandTypes.Production && command.actorName === setup.train.product &&
      this.branch === "shared_contention") role = "train";
    else if (command.type === ProbableWaffleGameCommandTypes.CancelResearch && this.branch === "cancel_research") role = "cancel";
    else if (command.type === ProbableWaffleGameCommandTypes.Research && command.researchType === setup.research.type) {
      role = this.branch === "shared_contention" ? "research" : "purchase";
    } else if (command.type === ProbableWaffleGameCommandTypes.Research && command.researchType === setup.replacement.type &&
      this.branch === "cancel_research") role = this.commands.some((entry) => entry.role === "probe") ? "resume" : "probe";
    else throw new Error("shared_queue_world_unexpected_command");
    if (this.commands.some((entry) => entry.role === role)) throw new Error("shared_queue_world_repeated_role");
    this.commands.push({ role, command });
  }

  private observeOutcome(outcome: GameCommandOutcome): void {
    const setup = this.setup;
    if (!setup || outcome.playerNumber !== setup.playerNumber || outcome.actorIds.length !== 1 ||
      outcome.actorIds[0] !== setup.producerActorId || outcome.kind === "dispatched" || outcome.kind === "active") return;
    if (outcome.kind === "applied" && ["ready", "purchasing"].includes(this.state)) {
      this.state = "paid";
      this.paidTick = outcome.tick;
      this.checkpoint("paid");
    } else if (outcome.kind === "applied" && this.branch === "shared_contention" && this.state === "paid") {
      this.state = "running";
      this.checkpoint("contending");
    } else if (outcome.kind === "applied" && this.branch === "cancel_research" &&
      ["refunded", "running"].includes(this.state)) {
      this.state = "running";
      this.checkpoint("resumed");
    } else if (outcome.kind === "rejected" && this.branch === "cancel_research" &&
      ["paid", "probing"].includes(this.state) && outcome.reason === "insufficient_resources") {
      this.state = "rejected";
      this.checkpoint("rejected");
    } else if (outcome.kind === "cancelled" && this.branch === "cancel_research" && this.state === "rejected") {
      const original = this.checkpoints.find((entry) => entry.boundary === "paid")?.snapshot.queues
        .flatMap((queue) => queue.lanes.flatMap((lane) => lane.items)).find((item) => item.researchType === setup.research.type);
      if (outcome.commandId === original?.commandId) return;
      if (outcome.tick - this.paidTick > SHARED_QUEUE_CANCEL_WINDOW_TICKS) throw new Error("shared_queue_refund_window_exceeded");
      this.refundTick = outcome.tick;
      this.state = "refunded";
      this.checkpoint("refunded");
    } else if (outcome.kind === "completed" && this.state === "running") {
      const research = this.branch === "shared_contention" ? setup.research.type : setup.replacement.type;
      if (outcome.worldLinkIds.length !== 1) throw new Error("shared_queue_completion_identity_missing");
      if (outcome.worldLinkIds[0] === `research:${research}`) this.researchCompleted = true;
      else if (this.branch === "shared_contention") this.createdActorId = outcome.worldLinkIds[0];
      else throw new Error("shared_queue_completion_product_mismatch");
    } else if (outcome.kind === "rejected" || outcome.kind === "failed") {
      throw new Error(`shared_queue_world_unexpected_outcome:${outcome.reason}`);
    }
  }

  /** Tech registration and indexed active world presence, rather than only a terminal command callback. */
  private effectPresent(): boolean {
    if (!this.setup) return false;
    const research = this.branch === "shared_contention" ? this.setup.research.type : this.setup.replacement.type;
    if (!getSceneService(this.scene, TechTreeService)?.isResearched(this.setup.playerNumber, research)) return false;
    if (this.branch === "cancel_research") return true;
    const actor = this.createdActorId ? getSceneService(this.scene, ActorIndexSystem)?.getActorById(this.createdActorId) : null;
    return !!actor?.active && actor.scene === this.scene && !getActorComponent(actor, HealthComponent)?.killed &&
      getActorComponent(actor, OwnerComponent)?.getOwner() === this.setup.playerNumber &&
      this.setup.train.spawnObjectNames.some((name) => name === actor.name);
  }

  private checkpoint(boundary: AiMultiplayerSharedQueueWorldV1["checkpoints"][number]["boundary"]): void {
    if (!this.setup) throw new Error("shared_queue_world_setup_missing");
    this.latestCapture = this.capture.captureHumanQueueBoundary(this.setup.playerNumber);
    const snapshot = this.latestCapture.snapshots.at(-1);
    if (!snapshot) throw new Error("shared_queue_world_snapshot_missing");
    this.checkpoints.push({ boundary, snapshot });
  }

  private guard(action: () => void): void {
    if (this.disposed || this.state === "failed" || this.state === "complete") return;
    try { action(); } catch (error) {
      this.failure = error instanceof Error ? error.message : "shared_queue_world_failed";
      this.state = "failed";
      if (this.setup) {
        try { this.latestCapture = this.capture.captureHumanQueueBoundary(this.setup.playerNumber); } catch {
          // Retain the original failure when the shared authority itself is no longer readable.
        }
      }
    }
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.subscriptions.unsubscribe();
    this.capture.dispose();
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.scene.events.off(Phaser.Scenes.Events.DESTROY, this.destroy, this);
    this.commands.length = 0;
    this.requests.length = 0;
    this.checkpoints.length = 0;
    this.latestCapture = null;
  }
}
