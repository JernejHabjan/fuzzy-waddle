import Phaser from "phaser";
import type { Subscription } from "rxjs";
import { ProbableWafflePlayerType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getCommunicator } from "../../../data/scene-data";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { AiMultiplayerQueueWorld, multiplayerQueueWorldRequested } from "./ai-multiplayer-queue-world";

import { AiMultiplayerSharedQueueWorld, multiplayerSharedQueueWorldRequested } from "./ai-multiplayer-shared-queue-world";

const marker = "fuzzy-waddle:ai-multiplayer-browser-test-v1";

export function multiplayerDiagnosticsRequested(): boolean {
  if (typeof window === "undefined" || !["localhost", "127.0.0.1"].includes(window.location.hostname)) return false;
  try {
    return window.sessionStorage.getItem(marker) === "1";
  } catch {
    return false;
  }
}

/** Test-only relay/hash observer. A separate explicit queue-world opt-in owns the shared-command experiment. */
export class AiMultiplayerDiagnostics {
  readonly kind = "ai-multiplayer-browser-diagnostics";
  private readonly subscriptions: Subscription[] = [];
  private readonly observedHumanBatches = new Set<number>();
  private readonly lastReceivedRelaySequenceByPlayer = new Map<number, number>();
  private readonly localHashes = new Map<number, string>();
  private readonly humanPlayerNumbers: number[];
  private readonly queueWorld: AiMultiplayerQueueWorld | null;
  private readonly sharedQueueWorld: AiMultiplayerSharedQueueWorld | null;

  constructor(private readonly scene: ProbableWaffleScene, private readonly commandBus: CommandBusService) {
    const sharedBranch = multiplayerSharedQueueWorldRequested();
    const queueRequested = multiplayerQueueWorldRequested();
    if (sharedBranch && queueRequested) throw new Error("multiplayer_queue_world_opt_ins_conflict");
    this.queueWorld = queueRequested ? new AiMultiplayerQueueWorld(scene, commandBus) : null;
    this.sharedQueueWorld = sharedBranch ? new AiMultiplayerSharedQueueWorld(scene, commandBus, sharedBranch) : null;
    this.humanPlayerNumbers = scene.baseGameData.gameInstance.players
      .filter((player) => player.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.Human)
      .map((player) => player.playerNumber)
      .filter((playerNumber): playerNumber is number => playerNumber !== undefined)
      .sort((left, right) => left - right);
    this.subscriptions.push(commandBus.commandBatch$.subscribe((batch) => {
      if (this.humanPlayerNumbers.includes(batch.playerNumber)) this.observedHumanBatches.add(batch.playerNumber);
    }));
    const communicator = getCommunicator(scene);
    if (communicator.gameCommandChanged) {
      this.subscriptions.push(communicator.gameCommandChanged.on.subscribe((event) => {
        const sequence = event.transportMeta?.serverRelaySequence;
        if (sequence !== undefined) {
          this.lastReceivedRelaySequenceByPlayer.set(event.playerNumber, Math.max(
            sequence, this.lastReceivedRelaySequenceByPlayer.get(event.playerNumber) ?? 0
          ));
        }
      }));
    }
    if (communicator.stateHashChanged) {
      this.subscriptions.push(communicator.stateHashChanged.on.subscribe((event) => {
        if (event.emitterUserId !== scene.userId) return;
        this.localHashes.set(event.tick, event.hash);
        while (this.localHashes.size > 12) this.localHashes.delete(this.localHashes.keys().next().value!);
      }));
    }
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  getSnapshot(aiPlayerNumber: number) {
    return {
      relay: {
        active: this.humanPlayerNumbers.length > 1 &&
          this.humanPlayerNumbers.every((playerNumber) => this.observedHumanBatches.has(playerNumber)),
        localPlayerNumber: this.scene.playerOrNull?.playerNumber ?? null,
        humanPlayerNumbers: [...this.humanPlayerNumbers],
        authorityEpoch: this.commandBus.getAuthorityState().authorityEpoch,
        lastReceivedRelaySequenceByPlayer: Object.fromEntries(this.lastReceivedRelaySequenceByPlayer)
      },
      processedAiCommandIds: this.commandBus.getAuthorityState().processedCommandIds
        .filter((id) => id.startsWith(`${aiPlayerNumber}:`)).slice(-16),
      hashes: [...this.localHashes].map(([tick, hash]) => ({ tick, hash })),
      queueWorld: this.queueWorld?.getSnapshot() ?? null,
      sharedQueueWorld: this.sharedQueueWorld?.getSnapshot() ?? null
    };
  }

  destroy(): void {
    this.queueWorld?.destroy();
    this.sharedQueueWorld?.destroy();
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions.length = 0;
    this.observedHumanBatches.clear();
    this.lastReceivedRelaySequenceByPlayer.clear();
    this.localHashes.clear();
  }

  startSharedQueueWorld(): void {
    if (!this.sharedQueueWorld) throw new Error("multiplayer_shared_queue_world_not_enabled");
    this.sharedQueueWorld.start();
  }

  startQueueWorld(): void {
    if (!this.queueWorld) throw new Error("multiplayer_queue_world_not_enabled");
    this.queueWorld.start();
  }
}
