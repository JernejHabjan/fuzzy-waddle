import Phaser from "phaser";
import type { Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import {
  type CampaignMissionRuntimeEvent,
  type GameCommandOutcome,
  type ProbableWaffleReplayCommandBatch,
  type ProbableWaffleReplayData,
  type ProbableWaffleReplayTickDigest
} from "@fuzzy-waddle/probable-waffle-protocol";
import { getSceneService } from "../scene-component-helpers";
import { CommandBusService } from "../multiplayer/command-bus.service";
import { SimulationTickService } from "../simulation-tick.service";
import { buildReplayTickDigest } from "./replay-debug-tools";
import {
  AOTA_CAMPAIGN_CONTENT_REGISTRY,
  serializeCampaignMissionRuntimeState
} from "@fuzzy-waddle/probable-waffle-campaign";
import { CampaignMissionDirector } from "../../../campaign/campaign-mission-director";

const SUPPORTED_REPLAY_COMPATIBILITY_VERSIONS = new Set(["lockstep-v1", "campaign-lockstep-v2"]);
const SUPPORTED_REPLAY_FORMAT_VERSIONS = new Set(["1", "2"]);

/**
 * Reconstructs a completed run from a versioned archive. It verifies campaign identity,
 * revision, deterministic random continuation, and snapshot compatibility before it
 * allows recorded commands to advance the scene, so a replay cannot silently execute
 * against changed content.
 */
export class ReplayPlaybackService {
  private tickSub?: Subscription;
  private outcomeSub?: Subscription;
  private readonly batchesByTick = new Map<number, ProbableWaffleReplayCommandBatch[]>();
  private readonly campaignEventsByTick = new Map<number, Array<Omit<CampaignMissionRuntimeEvent, "sequence">>>();
  private readonly expectedTickDigests = new Map<number, ProbableWaffleReplayTickDigest>();
  private readonly authoritativeBatchPairs = new Set<string>();
  private expectedCommandOutcomes: GameCommandOutcome[] = [];
  private compareRecordedCommandOutcomes = false;

  /**
   * Initializes replay playback from a validated archive, restoring deterministic random
   * and campaign state before command advancement. It verifies archive format, authored
   * mission identity/revision, launch context, random continuation, and the canonical
   * initial runtime snapshot before subscribing to ticks.
   *
   * ```text
   * archive -> compatibility checks -> initial state/RNG check -> ordered tick batches -> digest diagnostics
   * ```
   *
   * Compatibility failures surface before the scene consumes commands, preventing a
   * replay from silently running against different authored content.
   *
   * @see {@link ReplayRecorderService} for the paired archive writer.
   * @see {@link CampaignMissionDirector} for injected campaign events and integrity.
   */
  init(scene: ProbableWaffleScene): void {
    const replayData = scene.baseGameData.gameInstance.gameInstanceMetadata.data.startOptions.replayData;
    if (!scene.baseGameData.gameInstance.gameInstanceMetadata.isReplay() || !replayData) {
      return;
    }

    if (!SUPPORTED_REPLAY_COMPATIBILITY_VERSIONS.has(replayData.compatibilityVersion)) {
      throw new Error(`Unsupported replay compatibility version: ${replayData.compatibilityVersion}`);
    }
    if (!SUPPORTED_REPLAY_FORMAT_VERSIONS.has(replayData.version)) {
      throw new Error(`Unsupported replay format version: ${replayData.version}`);
    }

    const expectedCampaignMission = replayData.campaignMissionInitialState;
    const actualCampaignMission = scene.baseGameData.gameInstance.gameState?.data.campaignMission;
    if (
      expectedCampaignMission &&
      (!actualCampaignMission ||
        serializeCampaignMissionRuntimeState(expectedCampaignMission) !==
          serializeCampaignMissionRuntimeState(actualCampaignMission))
    ) {
      throw new Error("Campaign replay mission state does not match its recorded initial snapshot");
    }
    if (expectedCampaignMission) {
      const currentRevision = replayData.campaignContext
        ? AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission(replayData.campaignContext.missionId).revision
        : undefined;
      const compatibilityError = campaignReplayCompatibilityError(replayData, currentRevision);
      if (compatibilityError) throw new Error(compatibilityError);
      const configuredRandomState = scene.baseGameData.gameInstance.gameState?.data.randomState;
      if (stableReplayValue(configuredRandomState) !== stableReplayValue(replayData.randomInitialState)) {
        throw new Error("Campaign replay random state does not match its recorded initial snapshot");
      }
      const launchContext = scene.baseGameData.gameInstance.gameInstanceMetadata.data.campaignContext;
      const archiveContext = replayData.campaignContext;
      if (!archiveContext) throw new Error("Campaign replay context is missing");
      if (
        !launchContext ||
        launchContext.campaignId !== archiveContext.campaignId ||
        launchContext.missionId !== archiveContext.missionId
      ) {
        throw new Error("Campaign replay launch context does not match its archive metadata");
      }
      const director = getSceneService(scene, CampaignMissionDirector);
      director?.invalidateRewardIntegrity("replay-playback");
      for (const event of replayData.campaignEvents ?? []) {
        const playbackTick = event.tick + 1;
        const existing = this.campaignEventsByTick.get(playbackTick) ?? [];
        existing.push(campaignEventWithoutSequence(event));
        this.campaignEventsByTick.set(playbackTick, existing);
      }
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

    this.compareRecordedCommandOutcomes = replayData.commandOutcomes !== undefined;
    this.expectedCommandOutcomes = (replayData.commandOutcomes ?? [])
      .filter((outcome) => outcome.kind !== "dispatched")
      .map((outcome) => structuredClone(outcome));
    this.outcomeSub = commandBus.commandOutcome$.subscribe((actual) => this.compareCommandOutcome(actual));

    this.tickSub = tickService.tick$.subscribe((tick) => {
      const tickBatches = this.batchesByTick.get(tick);
      if (tickBatches?.length) {
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
      }
      const director = getSceneService(scene, CampaignMissionDirector);
      for (const event of this.campaignEventsByTick.get(tick) ?? []) director?.queueEvent(structuredClone(event));
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  /** Documents the destroy member and its declared contract at this boundary. */
  destroy(): void {
    this.tickSub?.unsubscribe();
    this.outcomeSub?.unsubscribe();
    if (this.compareRecordedCommandOutcomes && this.expectedCommandOutcomes.length > 0) {
      console.error(`[ReplayPlayback] ${this.expectedCommandOutcomes.length} recorded command outcomes were not observed`);
    }
  }

  private compareCommandOutcome(actual: GameCommandOutcome): void {
    if (actual.kind === "dispatched" || !this.compareRecordedCommandOutcomes) return;
    const expected = this.expectedCommandOutcomes.shift();
    if (!expected) {
      console.error("[ReplayPlayback] Unexpected command outcome", { actual });
      return;
    }
    if (stableReplayValue(expected) !== stableReplayValue(actual)) {
      console.error("[ReplayPlayback] Command outcome mismatch", { expected, actual });
    }
  }
}

export function campaignReplayCompatibilityError(
  replayData: ProbableWaffleReplayData,
  currentMissionRevision: number | undefined
): string | undefined {
  const mission = replayData.campaignMissionInitialState;
  if (!mission) return replayData.campaignContext ? "Campaign replay mission state is missing" : undefined;
  const context = replayData.campaignContext;
  if (replayData.version !== "2" || replayData.compatibilityVersion !== "campaign-lockstep-v2") {
    return `Campaign replay format ${replayData.version}/${replayData.compatibilityVersion} is not supported`;
  }
  if (!context) return "Campaign replay context is missing";
  if (!replayData.randomInitialState) return "Campaign replay deterministic random state is missing";
  if (context.campaignId !== mission.campaignId || context.missionId !== mission.missionId) {
    return "Campaign replay identity does not match its recorded mission state";
  }
  if (context.missionRevision !== mission.missionRevision) {
    return "Campaign replay revision does not match its recorded mission state";
  }
  if (currentMissionRevision !== context.missionRevision) {
    return `Campaign replay revision ${context.missionRevision} is incompatible with current revision ${currentMissionRevision ?? "missing"}`;
  }
  if (stableReplayValue(context.progressionSnapshot) !== stableReplayValue(mission.progression ?? null)) {
    return "Campaign replay progression snapshot does not match its recorded mission state";
  }
  if (
    stableReplayValue(context.participantProgressionSnapshots ?? []) !==
    stableReplayValue(mission.participantProgressionSnapshots ?? [])
  ) {
    return "Campaign replay participant progression snapshots do not match its recorded mission state";
  }
  return undefined;
}

function stableReplayValue(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? String(value);
  if (Array.isArray(value)) return `[${value.map(stableReplayValue).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableReplayValue(record[key])}`)
    .join(",")}}`;
}

function campaignEventWithoutSequence(
  event: CampaignMissionRuntimeEvent
): Omit<CampaignMissionRuntimeEvent, "sequence"> {
  const { sequence: _sequence, ...input } = event;
  return input;
}
