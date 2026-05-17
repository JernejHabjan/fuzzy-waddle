import type { Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { type ProbableWaffleHostMigratedEvent } from "@fuzzy-waddle/api-interfaces";
import { getCommunicator } from "../../../data/scene-data";
import { getSceneSystem } from "../scene-component-helpers";
import { SnapshotService } from "./snapshot.service";
import { AiPlayerHandler } from "../../../player/ai-controller/ai-player-handler";

/** Handles ownership handoff so a newly promoted host immediately starts serving snapshots. */
export class HostMigrationService {
  private hostMigrationSub?: Subscription;
  private snapshotService?: SnapshotService;

  init(scene: ProbableWaffleScene): void {
    const communicator = getCommunicator(scene);
    if (!communicator.hostMigrated || scene.baseGameData.gameInstance.gameInstanceMetadata.isReplay()) {
      return;
    }

    this.hostMigrationSub = communicator.hostMigrated.on.subscribe((event: ProbableWaffleHostMigratedEvent) => {
      if (event.currentHostUserId !== scene.userId) {
        return;
      }

      console.info(
        `[HostMigration] Host moved from ${event.previousHostUserId ?? "unknown"} to ${event.currentHostUserId}.`
      );

      this.snapshotService ??= new SnapshotService();
      this.snapshotService.init(scene);
      getSceneSystem(scene, AiPlayerHandler)?.createAiPlayerControllersForAiPlayers();
    });

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  /** Releases socket listeners and nested snapshot service state. */
  destroy(): void {
    this.hostMigrationSub?.unsubscribe();
    this.snapshotService?.destroy();
  }
}
