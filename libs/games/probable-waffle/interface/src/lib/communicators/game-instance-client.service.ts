import { Injectable } from "@angular/core";
import {
  CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION,
  GameSaveKind,
  GameSaveScope,
  ProbableWaffleGameInstance,
  type ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { GameSessionState } from "@fuzzy-waddle/platform-game-sessions";
import { type GameInstanceClientServiceInterface } from "./game-instance-client.service.interface";
import type { SaveGamePayload } from "@fuzzy-waddle/probable-waffle-phaser/data/save-game-payload";
import { SaveGameDialogComponent } from "../gui/save-game-dialog/save-game-dialog.component";
import type { SaveGameDialogResult } from "../gui/save-game-dialog/save-game-dialog-result";
import { GameInstanceLobbyClient } from "./game-instance-lobby-client";
/** Public root facade; save/replay and exit orchestration retain the same injected instance and inherited API. */
@Injectable({ providedIn: "root" })
export class GameInstanceClientService extends GameInstanceLobbyClient implements GameInstanceClientServiceInterface {
  async loadSavedGameData(
    gameInstanceData: ProbableWaffleGameInstanceData,
    campaignSaveContext?: import("@fuzzy-waddle/probable-waffle-protocol").CampaignGameSaveContext
  ): Promise<void> {
    const restoredData = structuredClone(gameInstanceData);
    if (!restoredData.gameInstanceMetadataData) throw new Error("Save metadata is required");
    restoredData.gameInstanceMetadataData.startOptions.loadFromSave = true;
    if (restoredData.gameInstanceMetadataData.campaignContext && campaignSaveContext) {
      restoredData.gameInstanceMetadataData.campaignContext.restoredSaveContext = structuredClone(campaignSaveContext);
    }
    const restored = new ProbableWaffleGameInstance(restoredData);
    this.gameInstance = restored;
    this.syncCurrentPlayerNumberFromGameInstance();
    await this.startListeningToGameInstanceEvents();
    if (this.gameInstance !== restored) return;
    await this.navigateDirectlyToGame();
  }

  /**
   * Persists the scene's detached boundary, copied before awaiting the name dialog or storage.
   * Campaign metadata and searchable save context derive from that same world, never later live state.
   */
  async saveGameInstance(data: SaveGamePayload): Promise<void> {
    const gameInstanceData = structuredClone(data.gameInstanceData ?? this.gameInstance!.data);
    const requestedSave =
      data.kind === "autosave" || data.kind === "quicksave"
        ? undefined
        : data.name?.trim()
          ? { kind: "manual" as const, name: data.name.trim() }
          : await this.requestManualSaveName(gameInstanceData);
    const saveKind =
      data.kind === "autosave"
        ? GameSaveKind.Autosave
        : data.kind === "quicksave" || requestedSave?.kind === "quicksave"
          ? GameSaveKind.Quicksave
          : GameSaveKind.Manual;
    const manualSaveName = requestedSave?.kind === "manual" ? requestedSave.name : undefined;
    const saveName = saveKind === GameSaveKind.Quicksave ? "Quick Save" : manualSaveName;
    if (saveKind === GameSaveKind.Manual && !saveName) return;
    const campaign = gameInstanceData.gameInstanceMetadataData?.campaignContext;
    if (campaign) {
      await this.gameSaveService.save({
        scope: GameSaveScope.Campaign,
        kind: saveKind,
        name: saveName,
        overwriteSaveId: requestedSave?.kind === "manual" ? requestedSave.overwriteSaveId : undefined,
        thumbnail: data.thumbnail,
        gameInstanceData,
        campaign: {
          campaignId: campaign.campaignId,
          chapterId: campaign.chapterId,
          missionId: campaign.missionId,
          missionRevision: campaign.missionRevision,
          runId: campaign.runId,
          runtimeSchemaVersion:
            gameInstanceData.gameStateData?.campaignMission?.schemaVersion ?? CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION,
          profileRevision:
            gameInstanceData.gameStateData?.campaignMission?.progression?.baseProfileRevision ??
            campaign.progressionSnapshot?.baseProfileRevision ??
            0,
          selectedLoadoutIds: [...(campaign.selectedLoadoutIds ?? [])],
          loadoutSnapshotHash: campaign.loadoutSnapshotHash ?? "",
          ...(data.checkpointId ? { checkpointId: data.checkpointId } : {}),
          participantCount: Math.max(1, gameInstanceData.players?.length ?? 1),
          participantProgressionSnapshots: structuredClone(campaign.participantProgressionSnapshots ?? [])
        }
      });
      return;
    }
    await this.gameSaveService.save({
      scope: GameSaveScope.Skirmish,
      kind: saveKind,
      name: saveName,
      overwriteSaveId: requestedSave?.kind === "manual" ? requestedSave.overwriteSaveId : undefined,
      thumbnail: data.thumbnail,
      gameInstanceData
    });
  }

  /** Name/filter the captured world's save; a later match must not supply its campaign scope or pause event bus. */
  private async requestManualSaveName(boundary: ProbableWaffleGameInstanceData): Promise<SaveGameDialogResult | undefined> {
    const events = this.probableWaffleCommunicatorService.allScenes;
    events.emit({
      name: "external-modal-pause-changed",
      data: { paused: true }
    });
    try {
      const modal = this.modalService.open(SaveGameDialogComponent, { centered: true, backdrop: "static" });
      const component = modal.componentInstance as SaveGameDialogComponent;
      const campaign = boundary.gameInstanceMetadataData?.campaignContext;
      await component.configure(campaign ? GameSaveScope.Campaign : GameSaveScope.Skirmish, campaign?.missionId);
      return (await modal.result) as SaveGameDialogResult;
    } catch {
      return undefined;
    } finally {
      events.emit({
        name: "external-modal-pause-changed",
        data: { paused: false }
      });
    }
  }

  /**
   * todo this is a prototype
   */
  async startReplay(gameInstanceData: ProbableWaffleGameInstanceData): Promise<void> {
    const replayGameInstanceData = structuredClone(gameInstanceData);
    this.normalizeReplayMetadata(replayGameInstanceData);
    this.gameInstance = new ProbableWaffleGameInstance(replayGameInstanceData);
    this.syncCurrentPlayerNumberFromGameInstance();
    await this.startListeningToGameInstanceEvents();
    await this.navigateToLobbyOrDirectlyToGame();
  }

  closeExternalModal(): void {
    if (this.externalModalRef) {
      this.externalModalRef.close();
    }
  }

  async leaveLobby(): Promise<void> {
    const isSkirmish = this.gameInstance?.gameInstanceMetadata?.data.type === ProbableWaffleGameInstanceType.Skirmish;
    const isOffline = !this.authService.isAuthenticated || !this.serverHealthService.serverAvailable;
    await this.disconnectSelfFromCurrentGame();

    if (isOffline || isSkirmish) {
      await this.stopGameInstance();
    } else {
      await this.cleanupLocalGameState();
    }

    await this.router.navigate(["aota"]);
  }

  async leaveScoreScreen(navigateHome: boolean = true): Promise<void> {
    // Leaving results means this player is done consuming the finished match.
    // The server's existing player.left handling tears the instance down only
    // after the last human has left, so avoid sending global Stopped here.
    await this.disconnectSelfFromCurrentGame();
    await this.cleanupLocalGameState();

    if (navigateHome) {
      await this.router.navigate(["aota"]);
    }
  }

  private normalizeReplayMetadata(replayGameInstanceData: ProbableWaffleGameInstanceData): void {
    const metadata = replayGameInstanceData.gameInstanceMetadataData;
    if (!metadata) {
      throw new Error("Replay metadata is required to start replay playback");
    }
    metadata.type = ProbableWaffleGameInstanceType.Replay;
    // Persisted replays can carry the original pre-game state from the recorded
    // match. Playback should always boot directly into simulation instead of
    // reusing live-session waiting UI such as "Waiting for players to join...".
    metadata.sessionState = GameSessionState.InProgress;
  }

}
