import Phaser from "phaser";
import { Subscription } from "rxjs";
import {
  ProbableWaffleGameCommandTypes,
  type GameCommand,
  type GameCommandInput,
  type GameCommandOutcome
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { AiRuntimeProductionCapture } from "./ai-runtime-production-capture";
import type { AiMultiplayerQueueWorldV1 } from "./ai-multiplayer-queue-world-v1";
import { prepareAiMultiplayerQueueWorld } from "./prepare-ai-multiplayer-queue-world";

export function multiplayerQueueWorldRequested(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      window.sessionStorage.getItem("fuzzy-waddle:ai-multiplayer-queue-world-v1") === "cancel-refund"
    );
  } catch {
    return false;
  }
}

/** Local marked harness only. Both peers observe; only human slot one's real bus drives the experiment. */
export class AiMultiplayerQueueWorld {
  private readonly subscriptions = new Subscription();
  private readonly capture: AiRuntimeProductionCapture;
  private readonly ticks: SimulationTickService;
  private state: AiMultiplayerQueueWorldV1["state"] = "initializing";
  private failure: string | null = null;
  private setup: AiMultiplayerQueueWorldV1["setup"] = null;
  private readonly commands: AiMultiplayerQueueWorldV1["commands"][number][] = [];
  private readonly requests: AiMultiplayerQueueWorldV1["requests"][number][] = [];
  private readonly checkpoints: AiMultiplayerQueueWorldV1["checkpoints"][number][] = [];
  private latestCapture: AiMultiplayerQueueWorldV1["capture"] = null;
  private paidTick = -1;
  private refundTick = -1;
  private producedActorId: string | null = null;
  private disposed = false;

  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly bus: CommandBusService
  ) {
    const ticks = getSceneService(scene, SimulationTickService);
    if (!ticks) throw new Error("multiplayer_queue_world_clock_missing");
    this.ticks = ticks;
    this.capture = new AiRuntimeProductionCapture(scene);
    this.subscriptions.add(bus.commandOutcome$.subscribe((outcome) => this.guard(() => this.observeOutcome(outcome))));
    this.subscriptions.add(bus.command$.subscribe((command) => this.guard(() => this.observeCommand(command))));
    this.subscriptions.add(ticks.tick$.subscribe((tick) => this.guard(() => this.onTick(tick))));
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
  }

  /** Called once by Playwright after both peers report the same definition-derived ready world. */
  start(): void {
    if (this.disposed || this.state !== "ready" || this.scene.playerOrNull?.playerNumber !== 1) {
      throw new Error("multiplayer_queue_world_sender_not_ready");
    }
    this.guard(() => {
      this.state = "purchasing";
      this.dispatch("purchase");
    });
    if (this.failure) throw new Error(this.failure);
  }

  /** Reading is passive: poll frequency neither samples authority nor schedules gameplay. */
  getSnapshot(): AiMultiplayerQueueWorldV1 {
    return structuredClone({
      state: this.state,
      failure: this.failure,
      setup: this.setup,
      commands: this.commands,
      requests: this.requests,
      checkpoints: this.checkpoints,
      capture: this.latestCapture
    });
  }

  private onTick(tick: number): void {
    if (this.state === "initializing") {
      this.setup = prepareAiMultiplayerQueueWorld(this.scene, tick);
      this.state = "ready";
      this.checkpoint("ready");
    }
    // Spawning can await navigation/object initialization. A completion callback alone is not indexed world presence.
    if (this.state === "finishing" && this.producedActorId) {
      const actor = getSceneService(this.scene, ActorIndexSystem)?.getActorById(this.producedActorId);
      if (actor?.active && actor.scene === this.scene) {
        this.state = "complete";
        this.checkpoint("complete");
        return;
      }
    }
    if (this.scene.playerOrNull?.playerNumber !== 1 || !this.setup) return;
    if (this.state === "paid" && tick > this.paidTick) {
      this.state = "probing";
      this.dispatch("probe");
    } else if (this.state === "probing") {
      const probe = this.requests.find((request) => request.role === "probe");
      if (probe && tick > probe.requestedTick && !this.requests.some((request) => request.role === "cancel")) {
        if (tick >= probe.command.tick) throw new Error("multiplayer_queue_probe_applied_before_cancel_request");
        const cancellation = this.dispatch("cancel");
        if (cancellation.tick <= probe.command.tick) throw new Error("multiplayer_queue_commands_not_separate_ticks");
        this.checkpoint("cancel_pending");
      }
    } else if (this.state === "refunded" && tick > this.refundTick) {
      this.state = "resuming";
      this.dispatch("resume");
    }
    const purchase = this.requests.find((request) => request.role === "purchase");
    if (
      purchase &&
      this.state !== "complete" &&
      tick > purchase.requestedTick + Math.ceil(this.setup.durationMs / 50) + 80
    ) {
      throw new Error("multiplayer_queue_world_deadline_exceeded");
    }
  }

  private dispatch(role: AiMultiplayerQueueWorldV1["commands"][number]["role"]): GameCommand {
    const setup = this.setup;
    if (!setup) throw new Error("multiplayer_queue_world_setup_missing");
    const address = { playerNumber: setup.playerNumber, actorIds: [setup.producerActorId] };
    const input =
      role === "cancel"
        ? ({
            ...address,
            type: ProbableWaffleGameCommandTypes.CancelProduction,
            queueIndex: 0
          } satisfies GameCommandInput)
        : ({
            ...address,
            type: ProbableWaffleGameCommandTypes.Production,
            actorName: setup.product
          } satisfies GameCommandInput);
    const receipt = this.bus.dispatch(input);
    if (
      receipt.status !== "dispatched" ||
      !receipt.command.execution ||
      receipt.command.tick <= this.ticks.currentTick
    ) {
      throw new Error(`multiplayer_queue_world_dispatch_failed:${role}`);
    }
    this.commands.push({ role, command: receipt.command });
    this.requests.push({ role, command: receipt.command, requestedTick: this.ticks.currentTick });
    return receipt.command;
  }

  private observeCommand(command: GameCommand): void {
    const setup = this.setup;
    if (
      !setup ||
      command.playerNumber !== setup.playerNumber ||
      command.actorIds.length !== 1 ||
      command.actorIds[0] !== setup.producerActorId ||
      this.commands.some((entry) => entry.command.execution?.commandId === command.execution?.commandId)
    )
      return;
    if (command.type === ProbableWaffleGameCommandTypes.CancelProduction) {
      this.commands.push({ role: "cancel", command });
    } else if (command.type === ProbableWaffleGameCommandTypes.Production && command.actorName === setup.product) {
      const roles = ["purchase", "probe", "resume"] as const;
      const role = roles[this.commands.filter((entry) => entry.role !== "cancel").length];
      if (!role) throw new Error("multiplayer_queue_world_unexpected_command");
      this.commands.push({ role, command });
    }
  }

  private observeOutcome(outcome: GameCommandOutcome): void {
    const setup = this.setup;
    if (
      !setup ||
      outcome.playerNumber !== setup.playerNumber ||
      outcome.actorIds.length !== 1 ||
      outcome.actorIds[0] !== setup.producerActorId ||
      outcome.kind === "dispatched" ||
      outcome.kind === "active"
    )
      return;
    if (outcome.kind === "applied" && ["ready", "purchasing"].includes(this.state)) {
      this.state = "paid";
      this.paidTick = outcome.tick;
      this.checkpoint("paid");
    } else if (
      outcome.kind === "rejected" &&
      ["paid", "probing"].includes(this.state) &&
      outcome.reason === "insufficient_resources"
    ) {
      this.state = "rejected";
      this.checkpoint("rejected");
    } else if (outcome.kind === "cancelled" && ["rejected", "probing"].includes(this.state)) {
      const purchase = this.commands.find((entry) => entry.role === "purchase");
      if (outcome.commandId === purchase?.command.execution?.commandId) return;
      this.state = "refunded";
      this.refundTick = outcome.tick;
      this.checkpoint("refunded");
    } else if (outcome.kind === "applied" && ["refunded", "resuming"].includes(this.state)) {
      this.state = "resuming";
      this.checkpoint("resumed");
    } else if (outcome.kind === "completed" && this.state === "resuming") {
      const producedActorId = outcome.worldLinkIds[0];
      if (outcome.worldLinkIds.length !== 1 || producedActorId === undefined) {
        throw new Error("multiplayer_queue_spawn_identity_missing");
      }
      this.producedActorId = producedActorId;
      this.state = "finishing";
    } else if (["rejected", "failed"].includes(outcome.kind)) {
      throw new Error(`multiplayer_queue_world_unexpected_outcome:${outcome.reason}`);
    }
  }

  private checkpoint(boundary: AiMultiplayerQueueWorldV1["checkpoints"][number]["boundary"]): void {
    if (!this.setup) throw new Error("multiplayer_queue_world_setup_missing");
    this.latestCapture = this.capture.captureHumanQueueBoundary(this.setup.playerNumber);
    const snapshot = this.latestCapture.snapshots.at(-1);
    if (!snapshot) throw new Error("multiplayer_queue_world_snapshot_missing");
    this.checkpoints.push({ boundary, snapshot });
  }

  private guard(action: () => void): void {
    if (this.disposed || this.state === "failed" || this.state === "complete") return;
    try {
      action();
    } catch (error) {
      this.failure = error instanceof Error ? error.message : "multiplayer_queue_world_failed";
      this.state = "failed";
      if (this.setup) {
        try {
          this.latestCapture = this.capture.captureHumanQueueBoundary(this.setup.playerNumber);
        } catch {
          // Preserve the original failure and last detached capture if authority itself is no longer readable.
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
