import { Subject, type Subscription } from "rxjs";
import {
  AOTA_CAMPAIGN_CONTENT_REGISTRY,
  CampaignMissionRuntime,
  type CampaignMissionRuntimeEffect
} from "@fuzzy-waddle/probable-waffle-campaign";
import type {
  CampaignMissionOutcome,
  CampaignMissionRuntimeEvent,
  CampaignMissionRuntimeState
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { getSceneService } from "../world/services/scene-component-helpers";
import { SimulationPauseReason, SimulationTickService } from "../world/services/simulation-tick.service";
import {
  ProbableWaffleSceneEventName,
  type ReconnectSnapshotAppliedSceneEvent
} from "../world/services/recovery/probable-waffle-scene-events";

export interface CampaignMissionOutcomeHandler {
  resolveCampaignMissionOutcome(outcome: Extract<CampaignMissionOutcome, "victory" | "defeat">): void;
}

/** Phaser integration boundary for the pure campaign mission runtime. */
export class CampaignMissionDirector {
  readonly effects$ = new Subject<readonly CampaignMissionRuntimeEffect[]>();
  private runtime: CampaignMissionRuntime;
  private tickSubscription?: Subscription;
  private started = false;

  static create(
    scene: ProbableWaffleScene,
    outcomeHandler: CampaignMissionOutcomeHandler
  ): CampaignMissionDirector | undefined {
    const context = scene.baseGameData.gameInstance.gameInstanceMetadata.data.campaignContext;
    if (!context) return undefined;
    const content = AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission(context.missionId);
    if (content.revision !== context.missionRevision) {
      throw new Error(
        `Campaign mission revision mismatch for ${context.missionId}: launch=${context.missionRevision} content=${content.revision}`
      );
    }
    return new CampaignMissionDirector(scene, outcomeHandler);
  }

  private constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly outcomeHandler: CampaignMissionOutcomeHandler
  ) {
    this.runtime = this.createRuntimeFromGameState();
    scene.events.on(ProbableWaffleSceneEventName.ReconnectSnapshotApplied, this.onSnapshotApplied, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /** Called after initial actors have been indexed so fresh phase entry can safely resolve actor references. */
  startAfterActorIndexing(): void {
    if (this.started) return;
    this.started = true;
    const tickService = getSceneService(this.scene, SimulationTickService);
    if (!tickService) throw new Error("CampaignMissionDirector requires SimulationTickService");
    if (this.runtime.state.initialized) {
      tickService.fastForwardTo(this.runtime.state.integrity.lastProcessedTick);
    }
    const initialResult = this.runtime.start(tickService.currentTick);
    this.publish(initialResult.effects);
    this.tickSubscription = tickService.tick$.subscribe((tick) => {
      const result = this.runtime.advanceTo(tick);
      this.publish(result.effects);
    });
  }

  queueEvent(event: Omit<CampaignMissionRuntimeEvent, "sequence"> & { readonly sequence?: number }): number {
    const sequence = this.runtime.enqueueEvent(event);
    this.syncGameState();
    return sequence;
  }

  snapshot(): CampaignMissionRuntimeState {
    return this.runtime.snapshot();
  }

  private createRuntimeFromGameState(): CampaignMissionRuntime {
    const context = this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.campaignContext;
    if (!context) throw new Error("CampaignMissionDirector requires campaignContext");
    const content = AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission(context.missionId);
    const restored = this.scene.baseGameData.gameInstance.gameState?.data.campaignMission;
    return new CampaignMissionRuntime(context.campaignId, content, restored);
  }

  private publish(effects: readonly CampaignMissionRuntimeEffect[]): void {
    this.syncGameState();
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

  private onSnapshotApplied(event: ReconnectSnapshotAppliedSceneEvent): void {
    this.runtime = this.createRuntimeFromGameState();
    const tick = event.tick ?? getSceneService(this.scene, SimulationTickService)?.currentTick ?? 0;
    const result = this.started && !this.runtime.state.initialized ? this.runtime.start(tick) : { effects: [] };
    this.publish(result.effects);
  }

  private destroy(): void {
    this.tickSubscription?.unsubscribe();
    this.scene.events.off(ProbableWaffleSceneEventName.ReconnectSnapshotApplied, this.onSnapshotApplied, this);
    this.effects$.complete();
  }
}
