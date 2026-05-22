import type { Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { type ProbableWaffleReplayCommandBatch, type ProbableWaffleReplayTickDigest } from "@fuzzy-waddle/api-interfaces";
import { getSceneService } from "../scene-component-helpers";
import { CommandBusService } from "../command-bus.service";
import { SimulationTickService } from "../simulation-tick.service";
import { buildReplayTickDigest } from "./replay-debug-tools";

const SUPPORTED_REPLAY_COMPATIBILITY_VERSIONS = new Set(["lockstep-v1"]);

/** Replays recorded command batches deterministically by tick in replay matches. */
export class ReplayPlaybackService {
  private tickSub?: Subscription;
  private readonly batchesByTick = new Map<number, ProbableWaffleReplayCommandBatch[]>();
  private readonly expectedTickDigests = new Map<number, ProbableWaffleReplayTickDigest>();
  private readonly authoritativeBatchPairs = new Set<string>();

  init(scene: ProbableWaffleScene): void {
    const replayData = scene.baseGameData.gameInstance.gameInstanceMetadata.data.startOptions.replayData;
    if (!scene.baseGameData.gameInstance.gameInstanceMetadata.isReplay() || !replayData) {
      return;
    }

    if (!SUPPORTED_REPLAY_COMPATIBILITY_VERSIONS.has(replayData.compatibilityVersion)) {
      throw new Error(`Unsupported replay compatibility version: ${replayData.compatibilityVersion}`);
    }

    for (const tickDigest of replayData.debugData?.tickDigests ?? []) {
      this.expectedTickDigests.set(tickDigest.tick, tickDigest);
    }

    for (const batch of replayData.commands) {
      const authoritativeKey = `${batch.tick}:${batch.playerNumber}`;
      if (this.authoritativeBatchPairs.has(authoritativeKey)) {
        throw new Error(
          `[ReplayPlayback] Duplicate authoritative replay batch detected for tick=${batch.tick} player=${batch.playerNumber}`
        );
      }
      this.authoritativeBatchPairs.add(authoritativeKey);
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

      const computedDigest = buildReplayTickDigest(tick, tickBatches);
      const expectedDigest = this.expectedTickDigests.get(tick);
      if (expectedDigest && expectedDigest.digest !== computedDigest.digest) {
        console.error(
          `[ReplayPlayback] Deterministic digest mismatch at tick=${tick}. expected=${expectedDigest.digest} actual=${computedDigest.digest}`,
          {
            expectedPlayerDigests: expectedDigest.playerDigests,
            actualPlayerDigests: computedDigest.playerDigests
          }
        );
      }

      tickBatches
        .slice()
        .sort((a, b) => a.playerNumber - b.playerNumber)
        .forEach((batch) => commandBus.playReplayBatch(batch));
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  /** Stops replay batch pumping for this scene. */
  destroy(): void {
    this.tickSub?.unsubscribe();
  }
}
