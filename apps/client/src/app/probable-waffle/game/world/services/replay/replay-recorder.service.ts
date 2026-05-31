import {
  type ProbableWaffleGameInstanceData,
  type ProbableWaffleGameInstanceSaveData,
  ProbableWaffleGameInstanceType,
  type ProbableWaffleReplayCommandBatch,
  type ProbableWaffleReplayDesyncDiagnostic,
  type ProbableWaffleReplayData
} from "@fuzzy-waddle/api-interfaces";
import type { Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { GameInstanceIndexeddbStorageService } from "../../../../communicators/storage/game-instance-indexeddb-storage.service";
import { getSceneExternalComponent, getSceneService } from "../scene-component-helpers";
import { CommandBusService } from "../multiplayer/command-bus.service";
import { buildReplayTickDigest } from "./replay-debug-tools";
import { ProbableWaffleSceneEventName } from "../recovery/probable-waffle-scene-events";

const REPLAY_FORMAT_VERSION = "1";
const REPLAY_COMPATIBILITY_VERSION = "lockstep-v1";

/** Captures lockstep command batches and persists a replay record when the match ends. */
export class ReplayRecorderService {
  private static readonly MAX_DESYNC_DIAGNOSTICS = 256;
  private batchSub?: Subscription;
  private initialGameInstanceData?: ProbableWaffleGameInstanceData;
  private readonly recordedBatches: ProbableWaffleReplayCommandBatch[] = [];
  private readonly desyncDiagnostics: ProbableWaffleReplayDesyncDiagnostic[] = [];
  private replayPersistStarted = false;
  private scene?: ProbableWaffleScene;

  private readonly onDesyncDiagnostics = (event: ProbableWaffleReplayDesyncDiagnostic): void => {
    this.desyncDiagnostics.push(structuredClone(event));
    if (this.desyncDiagnostics.length > ReplayRecorderService.MAX_DESYNC_DIAGNOSTICS) {
      this.desyncDiagnostics.splice(0, this.desyncDiagnostics.length - ReplayRecorderService.MAX_DESYNC_DIAGNOSTICS);
    }
  };

  init(scene: ProbableWaffleScene): void {
    if (scene.baseGameData.gameInstance.gameInstanceMetadata.isReplay()) {
      return;
    }
    this.scene = scene;

    const commandBus = getSceneService(scene, CommandBusService);
    if (!commandBus) {
      throw new Error("ReplayRecorderService requires CommandBusService");
    }

    this.initialGameInstanceData = structuredClone(scene.baseGameData.gameInstance.data);
    this.batchSub = commandBus.commandBatch$.subscribe((batch) => {
      this.recordedBatches.push(batch);
    });
    scene.events.on(ProbableWaffleSceneEventName.DesyncDiagnostics, this.onDesyncDiagnostics);

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
    const tickDigests = this.buildTickDigests();
    if (tickDigests.length > 0 || this.desyncDiagnostics.length > 0) {
      replayData.debugData = {
        tickDigests,
        desyncDiagnostics: structuredClone(this.desyncDiagnostics)
      };
    }

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
    this.scene?.events.off(ProbableWaffleSceneEventName.DesyncDiagnostics, this.onDesyncDiagnostics);
  }

  /** Builds deterministic per-tick digests for fast replay integrity checks. */
  private buildTickDigests() {
    const batchesByTick = new Map<number, ProbableWaffleReplayCommandBatch[]>();
    for (const batch of this.recordedBatches) {
      const existing = batchesByTick.get(batch.tick) ?? [];
      existing.push(batch);
      batchesByTick.set(batch.tick, existing);
    }

    return [...batchesByTick.entries()]
      .sort(([leftTick], [rightTick]) => leftTick - rightTick)
      .map(([tick, tickBatches]) => buildReplayTickDigest(tick, tickBatches));
  }
}
