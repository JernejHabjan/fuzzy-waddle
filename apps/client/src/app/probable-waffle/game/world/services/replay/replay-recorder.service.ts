import {
  type ProbableWaffleGameInstanceData,
  type ProbableWaffleGameInstanceSaveData,
  ProbableWaffleGameInstanceType,
  type ProbableWaffleReplayCommandBatch,
  type ProbableWaffleReplayData
} from "@fuzzy-waddle/api-interfaces";
import type { Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { GameInstanceIndexeddbStorageService } from "../../../../communicators/storage/game-instance-indexeddb-storage.service";
import { getSceneExternalComponent, getSceneService } from "../scene-component-helpers";
import { CommandBusService } from "../command-bus.service";

const REPLAY_FORMAT_VERSION = "1";
const REPLAY_COMPATIBILITY_VERSION = "lockstep-v1";

/** Captures lockstep command batches and persists a replay record when the match ends. */
export class ReplayRecorderService {
  private batchSub?: Subscription;
  private initialGameInstanceData?: ProbableWaffleGameInstanceData;
  private readonly recordedBatches: ProbableWaffleReplayCommandBatch[] = [];
  private replayPersistStarted = false;

  init(scene: ProbableWaffleScene): void {
    if (scene.baseGameData.gameInstance.gameInstanceMetadata.isReplay()) {
      return;
    }

    const commandBus = getSceneService(scene, CommandBusService);
    if (!commandBus) {
      throw new Error("ReplayRecorderService requires CommandBusService");
    }

    this.initialGameInstanceData = structuredClone(scene.baseGameData.gameInstance.data);
    this.batchSub = commandBus.commandBatch$.subscribe((batch) => {
      this.recordedBatches.push(batch);
    });

    scene.onShutdown.subscribe(() => {
      void this.persistReplay(scene);
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  private async persistReplay(scene: ProbableWaffleScene): Promise<void> {
    if (this.replayPersistStarted || !this.initialGameInstanceData || this.recordedBatches.length === 0) {
      return;
    }
    this.replayPersistStarted = true;

    const storage = getSceneExternalComponent(scene, GameInstanceIndexeddbStorageService);
    if (!storage) {
      console.warn("[ReplayRecorder] Storage service unavailable; replay not persisted.");
      return;
    }

    const replayData: ProbableWaffleReplayData = {
      version: REPLAY_FORMAT_VERSION,
      compatibilityVersion: REPLAY_COMPATIBILITY_VERSION,
      seed: scene.baseGameData.gameInstance.gameInstanceMetadata.data.rndSeed,
      mapId: scene.baseGameData.gameInstance.gameMode?.data.map,
      players: scene.players
        .filter(
          (
            player
          ): player is typeof player & {
            playerNumber: number;
          } => player.playerNumber !== undefined
        )
        .map((player) => ({
          playerNumber: player.playerNumber,
          playerName: player.playerController.data.playerDefinition?.player.playerName,
          userId: player.playerController.data.userId
        })),
      commands: structuredClone(this.recordedBatches)
    };

    const replayGameInstanceData = structuredClone(this.initialGameInstanceData);
    replayGameInstanceData.gameInstanceMetadataData!.type = ProbableWaffleGameInstanceType.Replay;
    replayGameInstanceData.gameInstanceMetadataData!.updatedOn = new Date();
    replayGameInstanceData.gameInstanceMetadataData!.startOptions = {
      ...replayGameInstanceData.gameInstanceMetadataData!.startOptions,
      replayData
    };

    const created = new Date();
    const replayRecord: ProbableWaffleGameInstanceSaveData = {
      saveName: `${replayGameInstanceData.gameInstanceMetadataData!.name} Replay ${created.toISOString()} ${scene.gameInstanceId}`,
      created,
      gameInstanceData: replayGameInstanceData,
      thumbnail: ""
    };

    await storage.saveToStorage(replayRecord).catch((error: unknown) => {
      console.error("[ReplayRecorder] Failed to save replay.", error);
    });
  }

  /** Releases subscriptions after replay capture lifecycle ends. */
  destroy(): void {
    this.batchSub?.unsubscribe();
  }
}
