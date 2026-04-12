import type {
  PlayerNumber,
  ProbableWafflePlayerDisconnectedEvent,
  ProbableWafflePlayerReconnectedEvent
} from "@fuzzy-waddle/api-interfaces";
import type { Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { getCommunicator } from "../../data/scene-data";
import { SceneDialogHelper } from "../scenes/scene-dialog-helper";
import type ReconnectRecoveryDialog from "../scenes/hud-scenes/ReconnectRecoveryDialog";
import { getSceneService } from "./scene-component-helpers";
import { SimulationTickService } from "./simulation-tick.service";

type PendingReconnect = {
  timer: Phaser.Time.TimerEvent;
  local: boolean;
  reconnectWindowSeconds?: number;
};

type LocalConnectionLostEvent = {
  playerNumber?: PlayerNumber | null;
  reason?: string;
};

type SnapshotAppliedEvent = {
  reason?: "reconnect" | "spectator-catch-up" | "desync-correction";
};

export class ConnectionRecoveryService {
  private static readonly PAUSE_AFTER_MS = 3000;

  private disconnectSub?: Subscription;
  private reconnectSub?: Subscription;
  private dialog?: ReconnectRecoveryDialog;
  private readonly pendingReconnects = new Map<PlayerNumber, PendingReconnect>();
  private readonly activeReconnects = new Set<PlayerNumber>();
  private readonly reconnectGenerations = new Map<PlayerNumber, number>();
  private probableWaffleScene?: ProbableWaffleScene;
  private hudScene?: Phaser.Scene;

  init(hudScene: Phaser.Scene, probableWaffleScene: ProbableWaffleScene): void {
    this.hudScene = hudScene;
    this.probableWaffleScene = probableWaffleScene;

    const communicator = getCommunicator(probableWaffleScene);
    this.disconnectSub = communicator.playerDisconnected?.on.subscribe((event) => {
      this.onPlayerDisconnected(event, false);
    });
    this.reconnectSub = communicator.playerReconnected?.on.subscribe((event) => {
      this.onPlayerReconnected(event.playerNumber, false);
    });

    probableWaffleScene.events.on("local-connection-lost", this.onLocalConnectionLost, this);
    probableWaffleScene.events.on("reconnect-snapshot-applied", this.onSnapshotApplied, this);
  }

  destroy(): void {
    this.disconnectSub?.unsubscribe();
    this.reconnectSub?.unsubscribe();
    for (const pending of this.pendingReconnects.values()) {
      pending.timer.remove(false);
    }
    this.pendingReconnects.clear();
    this.activeReconnects.clear();
    this.closeDialog();

    this.probableWaffleScene?.events.off("local-connection-lost", this.onLocalConnectionLost, this);
    this.probableWaffleScene?.events.off("reconnect-snapshot-applied", this.onSnapshotApplied, this);
  }

  private onPlayerDisconnected(event: ProbableWafflePlayerDisconnectedEvent, local: boolean): void {
    if (!this.hudScene) return;

    const generation = (this.reconnectGenerations.get(event.playerNumber) ?? 0) + 1;
    this.reconnectGenerations.set(event.playerNumber, generation);
    const existing = this.pendingReconnects.get(event.playerNumber);
    existing?.timer.remove(false);

    const timer = this.hudScene.time.delayedCall(ConnectionRecoveryService.PAUSE_AFTER_MS, () => {
      if (this.reconnectGenerations.get(event.playerNumber) !== generation) {
        return;
      }

      this.pendingReconnects.delete(event.playerNumber);
      this.activeReconnects.add(event.playerNumber);
      this.pauseAndShowDialog();
      console.warn(
        `[Reconnect] Pausing for disconnected player ${event.playerNumber}. reconnectWindowSeconds=${event.reconnectWindowSeconds}`
      );
    });

    this.pendingReconnects.set(event.playerNumber, {
      timer,
      local,
      reconnectWindowSeconds: event.reconnectWindowSeconds
    });
  }

  private onPlayerReconnected(playerNumber: PlayerNumber, local: boolean): void {
    this.reconnectGenerations.set(playerNumber, (this.reconnectGenerations.get(playerNumber) ?? 0) + 1);
    this.pendingReconnects.get(playerNumber)?.timer.remove(false);
    this.pendingReconnects.delete(playerNumber);

    const hadActiveReconnect = this.activeReconnects.delete(playerNumber);
    if (!hadActiveReconnect && !local) {
      return;
    }

    console.info(`[Reconnect] Player ${playerNumber} recovered. Resuming reconnect flow.`);
    this.updateDialogAndPause();
  }

  private pauseAndShowDialog(): void {
    const simTick = this.probableWaffleScene && getSceneService(this.probableWaffleScene, SimulationTickService);
    simTick?.pauseTick("reconnect");
    this.ensureDialog();
    this.dialog?.setup(this.buildMessage());
  }

  private updateDialogAndPause(): void {
    if (!this.activeReconnects.size) {
      const simTick = this.probableWaffleScene && getSceneService(this.probableWaffleScene, SimulationTickService);
      simTick?.resumeTick("reconnect");
      this.closeDialog();
      return;
    }

    this.ensureDialog();
    this.dialog?.setup(this.buildMessage());
  }

  private ensureDialog(): void {
    if (this.dialog || !this.hudScene) return;
    this.dialog = SceneDialogHelper.showDialog<ReconnectRecoveryDialog>(this.hudScene, "ReconnectRecoveryDialog");
  }

  private closeDialog(): void {
    this.dialog?.close();
    this.dialog = undefined;
  }

  private buildMessage(): string {
    const playerNumbers = [...this.activeReconnects].sort((a, b) => a - b);
    const localPlayerNumber = this.probableWaffleScene?.playerOrNull?.playerNumber ?? undefined;
    const localDisconnect = localPlayerNumber !== undefined && playerNumbers.includes(localPlayerNumber);

    if (localDisconnect) {
      return "Your connection dropped.\nRejoining the match and waiting for a fresh snapshot from the host.";
    }

    if (playerNumbers.length === 1) {
      return `Player ${playerNumbers[0]} disconnected.\nWaiting for them to reconnect before continuing the match.`;
    }

    return `Players ${playerNumbers.join(", ")} disconnected.\nWaiting for them to reconnect before continuing the match.`;
  }

  private readonly onLocalConnectionLost = (event: LocalConnectionLostEvent) => {
    const playerNumber = event.playerNumber ?? this.probableWaffleScene?.playerOrNull?.playerNumber;
    if (playerNumber === undefined || playerNumber === null) {
      return;
    }

    this.onPlayerDisconnected(
      {
        gameInstanceId: this.probableWaffleScene!.gameInstanceId,
        emitterUserId: null,
        playerNumber,
        reconnectWindowSeconds: 0
      },
      true
    );
    console.warn(`[Reconnect] Local socket disconnected. reason=${event.reason ?? "unknown"}`);
  };

  private readonly onSnapshotApplied = (event: SnapshotAppliedEvent) => {
    if (event.reason !== "reconnect") {
      return;
    }
    const playerNumber = this.probableWaffleScene?.playerOrNull?.playerNumber;
    if (playerNumber === undefined || playerNumber === null) {
      return;
    }

    this.onPlayerReconnected(playerNumber, true);
  };
}
