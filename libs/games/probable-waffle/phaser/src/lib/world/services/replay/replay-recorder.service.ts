import { GameSessionState } from "@fuzzy-waddle/platform-game-sessions";
import {
  GameSaveKind,
  GameSaveScope,
  type ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceType,
  type ProbableWaffleReplayCommandBatch,
  type ProbableWaffleReplayData,
  type ProbableWaffleReplayDesyncDiagnostic,
  type CampaignMissionRuntimeEvent
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { GameSavePort } from "@fuzzy-waddle/probable-waffle-gameplay";
import { getSceneExternalComponent, getSceneService } from "../scene-component-helpers";
import { CommandBusService } from "../multiplayer/command-bus.service";
import { buildReplayTickDigest } from "./replay-debug-tools";
import { ProbableWaffleSceneEventName } from "../recovery/probable-waffle-scene-events";
import { CampaignMissionDirector } from "../../../campaign/campaign-mission-director";

const REPLAY_FORMAT_VERSION = "2";
const REPLAY_COMPATIBILITY_VERSION = "lockstep-v1";
const CAMPAIGN_REPLAY_COMPATIBILITY_VERSION = "campaign-lockstep-v2";

/**
 * Captures authoritative lockstep command batches and persists a replay record
 * when the match ends. The initial game data plus command stream are enough to
 * reconstruct deterministic gameplay; optional debug data helps diagnose replay
 * drift without affecting playback behavior.
 */
export class ReplayRecorderService {
  private static readonly MAX_DESYNC_DIAGNOSTICS = 256;
  private batchSub?: Subscription;
  private campaignEventSub?: Subscription;
  private initialGameInstanceData?: ProbableWaffleGameInstanceData;
  private readonly recordedBatches: ProbableWaffleReplayCommandBatch[] = [];
  private readonly recordedCampaignEvents: CampaignMissionRuntimeEvent[] = [];
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
    this.campaignEventSub = getSceneService(scene, CampaignMissionDirector)?.events$.subscribe((event) => {
      if (event.kind === "dialogue.acknowledged" || event.kind === "cinematic.finished") {
        this.recordedCampaignEvents.push(structuredClone(event));
      }
    });
    scene.events.on(ProbableWaffleSceneEventName.DesyncDiagnostics, this.onDesyncDiagnostics);

    scene.onShutdown.subscribe(() => {
      void this.persistReplay(scene);
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  private async persistReplay(scene: ProbableWaffleScene): Promise<void> {
    if (this.replayPersistStarted || !this.initialGameInstanceData) {
      return;
    }
    this.replayPersistStarted = true;

    const gameSaveService = getSceneExternalComponent(scene, GameSavePort);
    if (!gameSaveService) {
      console.warn("[ReplayRecorder] Game save service unavailable; replay not persisted.");
      return;
    }

    const campaignContext = this.initialGameInstanceData.gameInstanceMetadataData?.campaignContext;
    const initialMission = this.initialGameInstanceData.gameStateData?.campaignMission;
    const progressionSnapshot = campaignContext?.progressionSnapshot ?? initialMission?.progression;
    if (campaignContext && (!initialMission || !progressionSnapshot)) {
      console.warn("[ReplayRecorder] Campaign replay context is incomplete; replay not persisted.");
      return;
    }
    const replayData: ProbableWaffleReplayData = {
      version: REPLAY_FORMAT_VERSION,
      compatibilityVersion: campaignContext ? CAMPAIGN_REPLAY_COMPATIBILITY_VERSION : REPLAY_COMPATIBILITY_VERSION,
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
      commands: structuredClone(this.recordedBatches),
      campaignEvents: structuredClone(this.recordedCampaignEvents),
      campaignMissionInitialState: this.initialGameInstanceData.gameStateData?.campaignMission
        ? structuredClone(this.initialGameInstanceData.gameStateData.campaignMission)
        : undefined,
      randomInitialState: this.initialGameInstanceData.gameStateData?.randomState
        ? structuredClone(this.initialGameInstanceData.gameStateData.randomState)
        : undefined,
      campaignContext:
        campaignContext && progressionSnapshot
          ? {
              campaignId: campaignContext.campaignId,
              missionId: campaignContext.missionId,
              missionRevision: campaignContext.missionRevision,
              difficulty: campaignContext.difficulty ?? "normal",
              progressionSnapshot: structuredClone(progressionSnapshot)
            }
          : undefined
    };
    const tickDigests = this.buildTickDigests();
    if (tickDigests.length > 0 || this.desyncDiagnostics.length > 0) {
      replayData.debugData = {
        tickDigests,
        desyncDiagnostics: structuredClone(this.desyncDiagnostics)
      };
    }

    const replayGameInstanceData = structuredClone(this.initialGameInstanceData);
    const metadataData = replayGameInstanceData.gameInstanceMetadataData;
    if (!metadataData) {
      console.warn("[ReplayRecorder] Game instance metadata unavailable; replay not persisted.");
      return;
    }
    metadataData.type = ProbableWaffleGameInstanceType.Replay;
    metadataData.updatedOn = new Date();
    metadataData.sessionState = GameSessionState.InProgress;
    metadataData.startOptions = {
      ...metadataData.startOptions,
      replayData
    };

    await gameSaveService
      .save({
        scope: campaignContext ? GameSaveScope.Campaign : GameSaveScope.Skirmish,
        kind: campaignContext ? GameSaveKind.Archive : GameSaveKind.Manual,
        name: `${metadataData.name} Replay ${new Date().toISOString()} ${scene.gameInstanceId}`,
        gameInstanceData: replayGameInstanceData,
        thumbnail: "",
        ...(campaignContext && initialMission
          ? {
              campaign: {
                campaignId: campaignContext.campaignId,
                chapterId: campaignContext.chapterId,
                missionId: campaignContext.missionId,
                runId: campaignContext.runId,
                missionRevision: campaignContext.missionRevision,
                runtimeSchemaVersion: initialMission.schemaVersion,
                profileRevision: progressionSnapshot?.baseProfileRevision ?? 0,
                participantCount: Math.max(1, replayData.players.length)
              }
            }
          : {})
      })
      .catch((error: unknown) => {
        console.error("[ReplayRecorder] Failed to save replay.", error);
      });
  }

  /** Releases subscriptions after replay capture lifecycle ends. */
  destroy(): void {
    this.batchSub?.unsubscribe();
    this.campaignEventSub?.unsubscribe();
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
