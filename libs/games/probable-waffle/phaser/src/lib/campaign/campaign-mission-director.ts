import Phaser from "phaser";
import { Subject, type Subscription } from "rxjs";
import {
  AOTA_CAMPAIGN_CONTENT_REGISTRY,
  asCampaignContentId,
  CampaignMissionRuntime,
  type CampaignMissionRuntimeEffect
} from "@fuzzy-waddle/probable-waffle-campaign";
import type {
  CampaignMissionOutcome,
  CampaignMissionRuntimeEvent,
  CampaignMissionRuntimeState
} from "@fuzzy-waddle/probable-waffle-protocol";
import { ProbableWafflePlayerType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { getSceneService } from "../world/services/scene-component-helpers";
import { SimulationPauseReason, SimulationTickService } from "../world/services/simulation-tick.service";
import {
  ProbableWaffleSceneEventName,
  type ReconnectSnapshotAppliedSceneEvent
} from "../world/services/recovery/probable-waffle-scene-events";
import { CampaignPhaserWorldAdapter } from "./actions/campaign-phaser-world-adapter";
import { CampaignTrustedHookRegistry } from "./actions/campaign-trusted-hook-registry";
import { CampaignWorldEventAdapter } from "./campaign-world-event-adapter";
import { CampaignObjectiveProjectionStore } from "./objectives/campaign-objective-projection-store";
import {
  LocalCampaignSeenCinematicStore,
  PhaserCampaignCinematicPresentationService
} from "./presentation/campaign-cinematic-presentation.service";
import { IndexedScenarioReferenceRegistry } from "./scenario/scenario-reference-registry";
import {
  DefaultCampaignDiagnosticsService,
  type CampaignDeveloperCommand,
  type CampaignDeveloperCommandResult,
  type CampaignDiagnosticsService
} from "@fuzzy-waddle/probable-waffle-campaign";
import { environment } from "@fuzzy-waddle/environments/environment";
import { evaluateCampaignSaveEligibility } from "../data/campaign-save-eligibility";

export interface CampaignMissionOutcomeHandler {
  resolveCampaignMissionOutcome(outcome: Extract<CampaignMissionOutcome, "victory" | "defeat">): void;
}

/** Phaser integration boundary for the pure campaign mission runtime. */
export class CampaignMissionDirector {
  readonly effects$ = new Subject<readonly CampaignMissionRuntimeEffect[]>();
  private activeControlPlayerNumber?: number;
  readonly events$ = new Subject<CampaignMissionRuntimeEvent>();
  readonly objectiveProjection: CampaignObjectiveProjectionStore;
  readonly cinematicPresentation: PhaserCampaignCinematicPresentationService;
  readonly diagnostics: CampaignDiagnosticsService;
  private runtime: CampaignMissionRuntime;
  private readonly worldAdapter: CampaignPhaserWorldAdapter;
  private readonly eventAdapter: CampaignWorldEventAdapter;
  private readonly presentationSubscription: Subscription;
  private readonly objectiveNarrationSubscription: Subscription;
  private readonly pendingCheckpointSaves: string[] = [];
  private tickSubscription?: Subscription;
  private started = false;

  static create(
    scene: ProbableWaffleScene,
    outcomeHandler: CampaignMissionOutcomeHandler,
    trustedHooks = new CampaignTrustedHookRegistry()
  ): CampaignMissionDirector | undefined {
    const context = scene.baseGameData.gameInstance.gameInstanceMetadata.data.campaignContext;
    if (!context) return undefined;
    const content = AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission(context.missionId);
    if (content.revision !== context.missionRevision) {
      throw new Error(
        `Campaign mission revision mismatch for ${context.missionId}: launch=${context.missionRevision} content=${content.revision}`
      );
    }
    return new CampaignMissionDirector(scene, outcomeHandler, trustedHooks);
  }

  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly outcomeHandler: CampaignMissionOutcomeHandler,
    trustedHooks: CampaignTrustedHookRegistry
  ) {
    this.worldAdapter = new CampaignPhaserWorldAdapter(scene, trustedHooks);
    this.runtime = this.createRuntimeFromGameState();
    this.worldAdapter.restoreParticipantTeams(this.runtime.state.participantTeams);
    this.eventAdapter = new CampaignWorldEventAdapter(scene, this);
    const context = scene.baseGameData.gameInstance.gameInstanceMetadata.data.campaignContext;
    if (!context) throw new Error("CampaignMissionDirector requires campaignContext");
    if (context.developerOverride) {
      this.runtime.invalidateRewardIntegrity("developer-content-override");
      this.syncGameState();
    }
    const content = AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission(context.missionId);
    const dialogue = AOTA_CAMPAIGN_CONTENT_REGISTRY.getDialogue(context.missionId);
    const rewards = AOTA_CAMPAIGN_CONTENT_REGISTRY.getRewards(context.missionId);
    this.diagnostics = new DefaultCampaignDiagnosticsService(
      content,
      () => this.runtime.snapshot(),
      {
        invalidateRewards: (reason) => this.runtime.invalidateRewardIntegrity(reason),
        execute: (command) => this.executeDeveloperCommand(command)
      },
      !environment.production,
      {
        cinematicIds: dialogue.cinematics.map((cinematic) => cinematic.id),
        rewardIds: rewards.rewards.map((reward) => reward.id)
      }
    );
    this.objectiveProjection = new CampaignObjectiveProjectionStore(
      content.objectives,
      dialogue,
      this.runtime.snapshot(),
      scene.game.device.os.android || scene.game.device.os.iOS || scene.game.device.input.touch
        ? "touch"
        : "keyboard-mouse"
    );
    const seenCinematics = new LocalCampaignSeenCinematicStore();
    for (const cinematicId of context.seenCinematicIds ?? []) {
      seenCinematics.markSeen(context.campaignId, asCampaignContentId<"cinematic">(cinematicId));
    }
    this.cinematicPresentation = new PhaserCampaignCinematicPresentationService(
      scene,
      context.campaignId,
      AOTA_CAMPAIGN_CONTENT_REGISTRY.getDialogue(context.missionId),
      this.runtime.snapshot(),
      {
        dialoguePresented: (lineId, ownerToken) => this.dialoguePresented(lineId, ownerToken),
        dialogueAcknowledged: (lineId, ownerToken) => this.acknowledgeDialogue(lineId, ownerToken),
        cinematicCue: (cinematicId, cueIndex) => this.cinematicCue(cinematicId, cueIndex),
        cinematicFinished: (cinematicId, skipped) => this.finishCinematic(cinematicId, skipped)
      },
      seenCinematics
    );
    this.presentationSubscription = this.worldAdapter.presentationRequests$.subscribe((request) => {
      if (request.kind === "checkpoint") this.pendingCheckpointSaves.push(request.id);
      else this.cinematicPresentation.handleRequest(request);
    });
    this.objectiveNarrationSubscription = this.objectiveProjection.notifications$.subscribe((notification) => {
      if (notification.narrationLineId) {
        this.worldAdapter.requestObjectiveNarration(notification.narrationLineId, notification.id);
      }
    });
    scene.events.on(ProbableWaffleSceneEventName.ReconnectSnapshotApplied, this.onSnapshotApplied, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /** Called after initial actors have been indexed so fresh phase entry can safely resolve actor references. */
  startAfterActorIndexing(): void {
    if (this.started) return;
    this.started = true;
    const tickService = getSceneService(this.scene, SimulationTickService);
    if (!tickService) throw new Error("CampaignMissionDirector requires SimulationTickService");
    this.worldAdapter.activateRestoredResources();
    this.eventAdapter.start();
    if (this.runtime.state.initialized) {
      tickService.fastForwardTo(this.runtime.state.integrity.lastProcessedTick);
    }
    const checkpointId =
      this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.campaignContext?.restoredSaveContext?.checkpointId;
    if (checkpointId) this.publish(this.runtime.retryFromCheckpoint(checkpointId, tickService.currentTick).effects);
    const initialResult = this.runtime.start(tickService.currentTick);
    this.publish(initialResult.effects);
    this.tickSubscription = tickService.tick$.subscribe((tick) => {
      const result = this.runtime.advanceTo(tick);
      this.publish(result.effects);
    });
    this.cinematicPresentation.restoreRuntimePresentation(this.runtime.snapshot());
    this.presentCheckpointResume();
  }

  queueEvent(event: Omit<CampaignMissionRuntimeEvent, "sequence"> & { readonly sequence?: number }): number {
    const sequence = this.runtime.enqueueEvent(event);
    this.events$.next({ ...event, sequence } as CampaignMissionRuntimeEvent);
    this.syncGameState();
    this.objectiveProjection.rebuild(this.runtime.snapshot());
    this.cinematicPresentation.syncState(this.runtime.snapshot());
    return sequence;
  }

  snapshot(): CampaignMissionRuntimeState {
    return this.runtime.snapshot();
  }

  diagnosticEnvironment(): {
    readonly pauseReasons: readonly string[];
    readonly saveEligibility: ReturnType<typeof evaluateCampaignSaveEligibility>;
    readonly references: ReadonlyArray<ReturnType<IndexedScenarioReferenceRegistry["debugGeometry"]>[number]>;
  } {
    const tickService = getSceneService(this.scene, SimulationTickService);
    return {
      pauseReasons: tickService?.getPauseReasons() ?? [],
      saveEligibility: evaluateCampaignSaveEligibility({
        sceneActive: this.scene.scene.isActive(),
        sessionState: this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.sessionState,
        runtime: this.runtime.snapshot(),
        pauseReasons: tickService?.getPauseReasons() ?? [],
        request: { kind: "manual" }
      }),
      references: getSceneService(this.scene, IndexedScenarioReferenceRegistry)?.debugGeometry() ?? []
    };
  }

  invalidateRewardIntegrity(reason: string): void {
    this.runtime.invalidateRewardIntegrity(reason);
    this.syncGameState();
  }

  focusObjective(objectiveId: string): boolean {
    const context = this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.campaignContext;
    if (!context) return false;
    const objective = AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission(context.missionId).objectives.find(
      (candidate) => candidate.id === objectiveId
    );
    const focus = objective?.display.focus;
    if (!focus) return false;
    const position = getSceneService(this.scene, IndexedScenarioReferenceRegistry)?.debugFocus(
      focus.kind === "actor" ? focus.actorId : focus.regionId
    );
    if (!position) return false;
    this.scene.cameras.main.centerOn(position.x, position.y - position.z);
    return true;
  }

  acknowledgeDialogue(lineId: string, ownerToken?: string, initiatorPlayerNumber?: number): void {
    if (this.isReplay()) return;
    this.eventAdapter.dialogueAcknowledged(lineId, ownerToken, initiatorPlayerNumber);
  }

  finishCinematic(cinematicId: string, skipped = false, initiatorPlayerNumber?: number): void {
    if (this.isReplay()) return;
    this.eventAdapter.cinematicFinished(cinematicId, skipped, initiatorPlayerNumber);
  }

  private createRuntimeFromGameState(): CampaignMissionRuntime {
    const context = this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.campaignContext;
    if (!context) throw new Error("CampaignMissionDirector requires campaignContext");
    const content = AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission(context.missionId);
    const restored = this.scene.baseGameData.gameInstance.gameState?.data.campaignMission;
    return new CampaignMissionRuntime(context.campaignId, content, restored, {
      actionAdapter: this.worldAdapter,
      conditionAdapter: this.worldAdapter,
      encounterAdapter: this.worldAdapter,
      progressionSnapshot: context.progressionSnapshot,
      participantProgressionSnapshots: context.participantProgressionSnapshots,
      difficulty: context.difficulty ?? "normal",
      playerCount: Math.max(
        1,
        this.scene.players.filter(
          (player) => player.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.Human
        ).length
      ),
      dialogue: AOTA_CAMPAIGN_CONTENT_REGISTRY.getDialogue(context.missionId)
    });
  }

  private publish(effects: readonly CampaignMissionRuntimeEffect[]): void {
    this.syncGameState();
    this.syncControlPerspective();
    this.objectiveProjection.rebuild(this.runtime.snapshot());
    this.cinematicPresentation.syncState(this.runtime.snapshot());
    this.objectiveProjection.presentEffects(effects);
    while (this.pendingCheckpointSaves.length > 0) {
      const checkpointId = this.pendingCheckpointSaves.shift();
      if (checkpointId) {
        this.scene.communicator.allScenes.emit({ name: "save-game", data: { kind: "autosave", checkpointId } });
      }
    }
    if (effects.length > 0) this.effects$.next(effects);
    const state = this.runtime.state;
    if (state.status === "failed") {
      getSceneService(this.scene, SimulationTickService)?.pauseTick(SimulationPauseReason.CampaignRuntimeFailure);
      console.error("[CampaignMissionDirector] Mission runtime failed.", state.integrity.diagnostic);
      return;
    }
    const outcome = this.runtime.claimOutcome();
    if (outcome) {
      this.syncGameState();
      this.outcomeHandler.resolveCampaignMissionOutcome(outcome);
    }
  }

  private syncGameState(): void {
    const gameState = this.scene.baseGameData.gameInstance.gameState;
    if (!gameState) throw new Error("CampaignMissionDirector requires game state");
    gameState.data.campaignMission = this.runtime.snapshot();
  }

  private syncControlPerspective(): void {
    const playerNumber = this.runtime.state.activeControlPlayerNumber;
    if (playerNumber === undefined || playerNumber === this.activeControlPlayerNumber) return;
    this.activeControlPlayerNumber = playerNumber;
    this.scene.communicator.allScenes.emit({ name: "selection.deselect" });
  }

  private onSnapshotApplied(event: ReconnectSnapshotAppliedSceneEvent): void {
    this.worldAdapter.resetOwnedResourcesForRestore();
    this.runtime = this.createRuntimeFromGameState();
    this.worldAdapter.restoreParticipantTeams(this.runtime.state.participantTeams);
    this.worldAdapter.activateRestoredResources();
    const tick = event.tick ?? getSceneService(this.scene, SimulationTickService)?.currentTick ?? 0;
    const result = this.started && !this.runtime.state.initialized ? this.runtime.start(tick) : { effects: [] };
    this.publish(result.effects);
    this.cinematicPresentation.restoreRuntimePresentation(this.runtime.snapshot());
  }

  private destroy(): void {
    this.tickSubscription?.unsubscribe();
    this.runtime.cancel("scene-shutdown");
    this.eventAdapter.destroy();
    this.worldAdapter.destroy();
    this.presentationSubscription.unsubscribe();
    this.objectiveNarrationSubscription.unsubscribe();
    this.objectiveProjection.destroy();
    this.cinematicPresentation.destroy();
    this.scene.events.off(ProbableWaffleSceneEventName.ReconnectSnapshotApplied, this.onSnapshotApplied, this);
    this.effects$.complete();
    this.events$.complete();
  }

  private dialoguePresented(lineId: string, ownerToken: string): void {
    if (this.isReplay() || this.runtime.state.dialoguePresentations[ownerToken]) return;
    this.eventAdapter.dialoguePresented(lineId, ownerToken);
  }

  private cinematicCue(cinematicId: string, cueIndex: number): void {
    if (this.isReplay()) return;
    this.eventAdapter.cinematicCue(cinematicId, cueIndex);
  }

  private isReplay(): boolean {
    return this.scene.baseGameData.gameInstance.gameInstanceMetadata.isReplay();
  }

  private executeDeveloperCommand(command: CampaignDeveloperCommand): CampaignDeveloperCommandResult {
    const references = getSceneService(this.scene, IndexedScenarioReferenceRegistry);
    if (command.kind === "focus-actor") {
      const position = references?.debugFocus(command.actorId);
      if (!position) return { accepted: false, invalidatedRewards: false, reason: "Actor is not resolved" };
      this.scene.cameras.main.centerOn(position.x, position.y - position.z);
      return { accepted: true, invalidatedRewards: false };
    }
    if (command.kind === "highlight-region") {
      const accepted = references?.debugHighlight(asCampaignContentId<"scenario-region">(command.regionId)) ?? false;
      return accepted
        ? { accepted: true, invalidatedRewards: false }
        : { accepted: false, invalidatedRewards: false, reason: "Region is not resolved" };
    }
    const result = this.runtime.executeDeveloperCommand(command);
    this.publish(result.effects);
    return this.runtime.state.status === "failed"
      ? { accepted: false, invalidatedRewards: true, reason: this.runtime.state.integrity.diagnostic?.message }
      : { accepted: true, invalidatedRewards: true };
  }

  private presentCheckpointResume(): void {
    const context = this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.campaignContext;
    const checkpointId = context?.restoredSaveContext?.checkpointId;
    if (!context || !checkpointId) return;
    const checkpoint = AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission(context.missionId).checkpoints.find(
      (candidate) => candidate.id === checkpointId
    );
    if (checkpoint?.resumePresentation?.textId) {
      this.worldAdapter.requestObjectiveNarration(checkpoint.resumePresentation.textId, `checkpoint-${checkpointId}`);
    }
    if (checkpoint?.resumePresentation?.cinematicId) {
      this.cinematicPresentation.handleRequest({
        kind: "cinematic",
        id: checkpoint.resumePresentation.cinematicId,
        ownerToken: `checkpoint-resume:${checkpointId}`
      });
    }
  }
}
