import type { Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { type ProbableWaffleReplayCommandBatch } from "@fuzzy-waddle/api-interfaces";
import { getSceneService } from "./scene-component-helpers";
import { CommandBusService } from "./command-bus.service";
import { SimulationTickService } from "./simulation-tick.service";

const SUPPORTED_REPLAY_COMPATIBILITY_VERSIONS = new Set(["lockstep-v1"]);

export class ReplayPlaybackService {
  private tickSub?: Subscription;
  private readonly batchesByTick = new Map<number, ProbableWaffleReplayCommandBatch[]>();

  init(scene: ProbableWaffleScene): void {
    const replayData = scene.baseGameData.gameInstance.gameInstanceMetadata.data.startOptions.replayData;
    if (!scene.baseGameData.gameInstance.gameInstanceMetadata.isReplay() || !replayData) {
      return;
    }

    if (!SUPPORTED_REPLAY_COMPATIBILITY_VERSIONS.has(replayData.compatibilityVersion)) {
      throw new Error(`Unsupported replay compatibility version: ${replayData.compatibilityVersion}`);
    }

    for (const batch of replayData.commands) {
      const existing = this.batchesByTick.get(batch.tick) ?? [];
      existing.push(batch);
      this.batchesByTick.set(batch.tick, existing);
    }

    const commandBus = getSceneService(scene, CommandBusService);
    const tickService = getSceneService(scene, SimulationTickService);
    if (!commandBus || !tickService) {
      throw new Error("ReplayPlaybackService requires CommandBusService and SimulationTickService");
    }

    this.tickSub = tickService.tick$.subscribe((tick) => {
      const tickBatches = this.batchesByTick.get(tick);
      if (!tickBatches?.length) {
        return;
      }

      tickBatches
        .slice()
        .sort((a, b) => a.playerNumber - b.playerNumber)
        .forEach((batch) => commandBus.playReplayBatch(batch));
    });
  }

  destroy(): void {
    this.tickSub?.unsubscribe();
  }
}
