import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { GameSessionState, ProbableWafflePlayerType } from "@fuzzy-waddle/api-interfaces";
import { getCommunicator } from "../../data/scene-data";
import type { Subscription } from "rxjs";
import Phaser from "phaser";

/**
 * Coordinates the "all players loaded" barrier before the game starts.
 *
 * Each player sends a "player.scene-ready" signal when their scene finishes
 * loading. The host counts received signals; once all human players have
 * signalled (or the timeout elapses), the host broadcasts StartingTheGame.
 *
 * Non-host clients simply wait for the StartingTheGame event which is handled
 * by SceneGameState (already wired up there).
 *
 * The barrier is reusable: construct a new instance for each wait point.
 * Timeout defaults to 30 s to gracefully handle a player that loaded but
 * whose ready signal was lost.
 */
export class ReadyBarrier {
  static readonly READY_PROPERTY = "player.scene-ready" as const;
  private static readonly TIMEOUT_MS = 30_000;

  private readyCount = 0;
  private subscriptions: Subscription[] = [];
  private timer?: number;

  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly onAllReady: () => void
  ) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.init();
  }

  private init(): void {
    const communicator = getCommunicator(this.scene);
    if (!communicator.playerChanged) {
      // No multiplayer communicator — single-player path, fire immediately
      this.onAllReady();
      return;
    }

    const expectedCount = this.countExpectedHumanPlayers();

    if (this.scene.isHost) {
      this.subscriptions.push(
        communicator.playerChanged.on.subscribe((event) => {
          if (event.property !== ReadyBarrier.READY_PROPERTY) return;
          this.readyCount++;
          if (this.readyCount >= expectedCount) {
            this.fireAllReady();
          }
        })
      );

      // Count the host itself as ready immediately
      this.readyCount++;
      if (this.readyCount >= expectedCount) {
        // Only one human (the host) — fire straight away
        this.fireAllReady();
        return;
      }

      // Safety timeout: don't wait forever for a late/crashed peer
      this.timer = window.setTimeout(() => {
        console.warn(
          `[ReadyBarrier] Timeout after ${ReadyBarrier.TIMEOUT_MS}ms — only ${this.readyCount}/${expectedCount} players ready. Starting anyway.`
        );
        this.fireAllReady();
      }, ReadyBarrier.TIMEOUT_MS);
    } else {
      // Non-host: announce readiness to the host
      communicator.playerChanged.send({
        property: ReadyBarrier.READY_PROPERTY,
        gameInstanceId: this.scene.gameInstanceId,
        emitterUserId: this.scene.userId,
        data: {}
      });
    }
  }

  private fireAllReady(): void {
    clearTimeout(this.timer);
    this.destroy();
    this.onAllReady();
  }

  private countExpectedHumanPlayers(): number {
    const players = this.scene.baseGameData.gameInstance.players;
    return players.filter(
      (p) => p.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.Human
    ).length;
  }

  private destroy(): void {
    clearTimeout(this.timer);
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
  }
}
