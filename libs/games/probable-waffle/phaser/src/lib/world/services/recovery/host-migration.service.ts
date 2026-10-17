import Phaser from "phaser";
import type { Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { type ProbableWaffleHostMigratedEvent } from "@fuzzy-waddle/probable-waffle-protocol";
import { getCommunicator } from "../../../data/scene-data";
import { getSceneService, getSceneSystem } from "../scene-component-helpers";
import { SnapshotService } from "./snapshot.service";
import { AiPlayerHandler } from "../../../player/ai-controller/ai-player-handler";
import { createMultiplayerClientLogger } from "../multiplayer/multiplayer-client-logger";
import { CommandBusService } from "../multiplayer/command-bus.service";

/** Handles ownership handoff so a newly promoted host immediately starts serving snapshots. */
export class HostMigrationService {
  private hostMigrationSub?: Subscription;
  private snapshotService?: SnapshotService;
  private readonly logger = createMultiplayerClientLogger("HostMigration");

  init(scene: ProbableWaffleScene, snapshotService: SnapshotService): void {
    this.snapshotService = snapshotService;
    const communicator = getCommunicator(scene);
    if (!communicator.hostMigrated || scene.baseGameData.gameInstance.gameInstanceMetadata.isReplay()) {
      return;
    }

    this.hostMigrationSub = communicator.hostMigrated.on.subscribe((event: ProbableWaffleHostMigratedEvent) => {
      const commandBus = getSceneService(scene, CommandBusService);
      const authorityEpoch = commandBus?.getAuthorityState().authorityEpoch ?? 0;
      commandBus?.advanceAuthorityEpoch(authorityEpoch + 1);
      const isLocalHost = event.currentHostUserId === scene.userId;
      getSceneSystem(scene, AiPlayerHandler)?.setHostAuthorityActive(isLocalHost);
      if (!isLocalHost) {
        snapshotService.destroy();
        return;
      }

      this.logger.info(
        `[HostMigration] Host moved from ${event.previousHostUserId ?? "unknown"} to ${event.currentHostUserId}.`
      );

      snapshotService.init(scene, true);
    });

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  /** Releases socket listeners and nested snapshot service state. */
  destroy(): void {
    this.hostMigrationSub?.unsubscribe();
    this.snapshotService?.destroy();
  }
}
