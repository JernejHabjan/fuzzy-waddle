import Phaser from "phaser";
import {
  type ConstructionSiteComponentData,
  ConstructionStateEnum
} from "@fuzzy-waddle/probable-waffle-protocol";
import { HealthComponent } from "../combat/components/health-component";
import { getActorComponent } from "../../../data/actor-component";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { onObjectReady } from "../../../data/game-object-helper";
import { getResearchedLevelForActor } from "../../../data/actor-level-utils";
import { BehaviorSubject, Subject, type Subscription } from "rxjs";
import { upgradeFromConstructingToFullActorData } from "../../../data/actor-data";
import { ConstructionProgressUiComponent } from "./construction-progress-ui-component";
import { BuilderComponent } from "./builder-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { ConstructionPresentation } from "./construction-presentation";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";
import type { ConstructionSiteDefinition } from
  "@fuzzy-waddle/probable-waffle-gameplay/entity/components/construction/construction-site-definition";
import type { ProductionCostDefinition } from
  "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/production-cost-definition";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { ProbableWaffleSceneEventName } from "../../../world/services/recovery/probable-waffle-scene-events";
import { buildsWithoutAssignedWorkers, constructionVitalityIncrement } from "./construction-progress";
import { startConstructionPayment, refundConstructionPayment } from "./construction-payment";
import { observeConstructionLifecycle } from "./observe-construction-authority";
import { fenceSceneResourceHistory } from "../../../data/scene-resource-observation";

export { buildsWithoutAssignedWorkers, constructionVitalityIncrement } from "./construction-progress";

export class ConstructionSiteComponent {
  public progressPercentage = 0;
  public constructionProgressPercentageChanged: BehaviorSubject<number> = new BehaviorSubject<number>(
    this.progressPercentage
  );
  private remainingConstructionTime = 0;
  private state: ConstructionStateEnum = ConstructionStateEnum.NotStarted;
  public constructionStateChanged: Subject<ConstructionStateEnum> = new Subject<ConstructionStateEnum>();
  private assignedBuilders: Phaser.GameObjects.GameObject[] = [];
  private assignedRepairers: Phaser.GameObjects.GameObject[] = [];
  constructionProgressUiComponent: ConstructionProgressUiComponent;
  private readonly presentation: ConstructionPresentation;
  private healthComponent?: HealthComponent;
  private simulationTickSub?: Subscription;
  private playingBuildSound: boolean = false;
  private pendingAssignedBuilderIds?: string[];
  private pendingAssignedRepairerIds?: string[];
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly constructionSiteDefinition: ConstructionSiteDefinition
  ) {
    this.constructionProgressUiComponent = new ConstructionProgressUiComponent(this.gameObject);
    this.presentation = new ConstructionPresentation(this.gameObject,
      () => this.playingBuildSound, (playing) => { this.playingBuildSound = playing; });
    onObjectReady(gameObject, this.init, this);
    this.simulationTickSub = getSceneService(gameObject.scene, SimulationTickService)?.tick$.subscribe(() =>
      this.update()
    );
    gameObject.on(Phaser.GameObjects.Events.DESTROY, this.onDestroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.onDestroy, this);
  }

  private init() {
    if (this.state === ConstructionStateEnum.NotStarted) {
      this.setInitialHealth();
    }
    if (this.state === ConstructionStateEnum.Finished) {
      this.progressPercentage = 100;
      this.constructionProgressPercentageChanged.next(this.progressPercentage);
    }
    this.presentation.init();
    this.healthComponent = getActorComponent(this.gameObject, HealthComponent);
  }

  private get productionDefinition(): ProductionCostDefinition | null {
    const definition = getPwActorDefinition(this.gameObject.name, getResearchedLevelForActor(this.gameObject));
    return definition?.components?.productionCost ?? null;
  }

  update(): void {
    this.tryResolveAssignedActorReferences();

    const deltaWithTimeScale = SimulationTickService.TICK_INTERVAL_MS;

    if (this.state == ConstructionStateEnum.Finished) {
      this.tryRepair(deltaWithTimeScale);
      return;
    }

    this.tryBuild(deltaWithTimeScale);
  }

  /**
   * Attempts construction only after ownership, resource, placement, and assigned-worker invariants have been checked.
   * It performs the state transition and associated cleanup as one operation so partially built actors cannot leak into normal production flow.
   */
  private tryBuild(deltaWithTimeScale: number) {
    if (this.state === ConstructionStateEnum.NotStarted && this.constructionSiteDefinition.startImmediately) {
      this.startConstruction();
      this.setInitialHealth();
    }

    if (this.state === ConstructionStateEnum.NotStarted && this.getAssignedBuilderCountForProgress() > 0) {
      this.startConstruction();
    }

    if (this.state !== ConstructionStateEnum.Constructing) return;

    if (this.healthComponent?.killed) return;

    const speedBoost = 1.0;
    // Fixes build-progress drift during partial restore by using pending assignment counts until references resolve.
    const constructionProgress =
      deltaWithTimeScale * this.constructionSiteDefinition.progressMadeAutomatically * speedBoost +
      deltaWithTimeScale *
        this.constructionSiteDefinition.progressMadePerBuilder *
        this.getAssignedBuilderCountForProgress() *
        speedBoost;

    const productionDefinition = this.productionDefinition;
    if (!productionDefinition) throw new Error("Production definition not found");

    // Work and silent vitality writes invalidate earlier readiness even for zero or capped progress.
    fenceSceneResourceHistory(this.gameObject.scene, "resource_actor_construction_change");
    this.remainingConstructionTime -= constructionProgress;
    const healthComponent = this.healthComponent;
    if (healthComponent) {
      const maxHealth = healthComponent.healthDefinition.maxHealth;
      const initialHealth = maxHealth * this.constructionSiteDefinition.initialHealthPercentage;
      const totalHealthToGain = maxHealth - initialHealth;

      // Calculate health increment based on total health to gain
      const healthIncrement = constructionVitalityIncrement(
        totalHealthToGain,
        productionDefinition.productionTime,
        constructionProgress
      );
      healthComponent.healthComponentData.health += healthIncrement;
      healthComponent.healthComponentData.health = Math.min(healthComponent.healthComponentData.health, maxHealth);

      // Handle armor similarly
      const maxArmour = healthComponent.healthDefinition.maxArmour;
      if (maxArmour) {
        const initialArmour = maxArmour * this.constructionSiteDefinition.initialHealthPercentage;
        const totalArmourToGain = maxArmour - initialArmour;
        const armourIncrement = constructionVitalityIncrement(
          totalArmourToGain,
          productionDefinition.productionTime,
          constructionProgress
        );
        healthComponent.healthComponentData.armour += armourIncrement;
        healthComponent.healthComponentData.armour = Math.min(healthComponent.healthComponentData.armour, maxArmour);
      }
    }

    this.presentation.playBuildSound();

    // Check if finished.
    if (this.remainingConstructionTime <= 0) {
      this.finishConstruction();
    }

    this.progressPercentage = this.getProgressFraction() * 100;
    this.constructionProgressPercentageChanged.next(this.progressPercentage);
  }

  startConstruction() {
    if (this.state !== ConstructionStateEnum.NotStarted) {
      throw new Error("ConstructionSiteComponent can only be started once");
    }
    const productionDefinition = this.productionDefinition;
    if (!productionDefinition) throw new Error("Production definition not found");
    startConstructionPayment(this.gameObject, productionDefinition, this.state, this.remainingConstructionTime);

    // Payment callbacks retain pre-start state; only a returned payment reaches this boundary.
    fenceSceneResourceHistory(this.gameObject.scene, "resource_actor_construction_change");
    // start building
    this.remainingConstructionTime = productionDefinition.productionTime;
    this.state = ConstructionStateEnum.Constructing;
    observeConstructionLifecycle(this.gameObject, this.state, this.remainingConstructionTime, "started");
    this.constructionStateChanged.next(this.state);
  }

  private setInitialHealth() {
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (healthComponent) {
      fenceSceneResourceHistory(this.gameObject.scene, "resource_actor_health_change");
      healthComponent.healthComponentData.health = Math.floor(
        healthComponent.healthDefinition.maxHealth * this.constructionSiteDefinition.initialHealthPercentage
      );
      if (healthComponent.healthDefinition.maxArmour) {
        healthComponent.healthComponentData.armour = Math.floor(
          healthComponent.healthDefinition.maxArmour * this.constructionSiteDefinition.initialHealthPercentage
        );
      }
    }
  }

  cancelConstruction() {
    if (this.isFinished) return;

    const productionDefinition = this.productionDefinition;
    if (!productionDefinition) throw new Error("Production definition not found");

    refundConstructionPayment(this.gameObject, productionDefinition, this.constructionSiteDefinition.refundFactor,
      () => this.getProgressFraction(), this.state, this.remainingConstructionTime);

    // stop action on builders
    this.assignedBuilders.forEach((builder) => {
      const payerPawnAiController = getActorComponent(builder, PawnAiController);
      payerPawnAiController?.blackboard.resetCurrentOrder();
    });
  }

  get isFinished() {
    return this.state === ConstructionStateEnum.Finished;
  }

  /** Automatic sites such as Fields must not be destroyed when no builder can be assigned. */
  get buildsWithoutAssignedWorkers() {
    return buildsWithoutAssignedWorkers(this.constructionSiteDefinition);
  }

  canAssignBuilder() {
    return (
      this.assignedBuilders.length < this.constructionSiteDefinition.maxAssignedBuilders &&
      !this.isFinished &&
      (this.healthComponent === undefined || !this.healthComponent.killed)
    );
  }

  assignBuilder(gameObject: Phaser.GameObjects.GameObject) {
    this.assignedBuilders.push(gameObject);
  }

  unAssignBuilder(gameObject: Phaser.GameObjects.GameObject) {
    const index = this.assignedBuilders.indexOf(gameObject);
    if (index >= 0) {
      this.assignedBuilders.splice(index, 1);
    }
  }

  canAssignRepairer() {
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (!healthComponent) return false;
    return (
      this.assignedRepairers.length < this.constructionSiteDefinition.maxAssignedRepairers &&
      healthComponent.healthComponentData.health < healthComponent.healthDefinition.maxHealth
    );
  }
  assignRepairer(gameObject: Phaser.GameObjects.GameObject) {
    this.assignedRepairers.push(gameObject);
  }
  unAssignRepairer(gameObject: Phaser.GameObjects.GameObject) {
    const index = this.assignedRepairers.indexOf(gameObject);
    if (index >= 0) {
      this.assignedRepairers.splice(index, 1);
    }
  }

  private tryRepair(deltaWithTimeScale: number) {
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (!healthComponent) return;

    if (this.getAssignedRepairerCountForProgress() === 0) return;
    if (healthComponent.healthComponentData.health >= healthComponent.healthDefinition.maxHealth) return;

    // Fixes repair-rate drift from transiently missing repairer references during restore.
    const repairAmount =
      deltaWithTimeScale * this.constructionSiteDefinition.repairFactor * this.getAssignedRepairerCountForProgress();
    fenceSceneResourceHistory(this.gameObject.scene, "resource_actor_health_change");
    healthComponent.healthComponentData.health += repairAmount;
    healthComponent.healthComponentData.health = Math.min(
      healthComponent.healthComponentData.health,
      healthComponent.healthDefinition.maxHealth
    );

    this.presentation.playBuildSound();

    if (healthComponent.healthComponentData.health >= healthComponent.healthDefinition.maxHealth) {
      this.assignedRepairers.forEach((repairer) => {
        const builderComponent = getActorComponent(repairer, BuilderComponent);
        if (builderComponent) {
          builderComponent.leaveRepairSite();
        }
      });
    }
  }

  private finishConstruction() {
    fenceSceneResourceHistory(this.gameObject.scene, "resource_actor_construction_change");
    this.state = ConstructionStateEnum.Finished;
    observeConstructionLifecycle(this.gameObject, this.state, this.remainingConstructionTime, "finished");
    this.constructionStateChanged.next(this.state);

    this.presentation.playCompletionSound();

    if (this.constructionSiteDefinition.consumesBuilders) {
      this.assignedBuilders.forEach((builder) => {
        builder.destroy();
      });
    }

    upgradeFromConstructingToFullActorData(this.gameObject);
    this.gameObject.scene.events.emit(ProbableWaffleSceneEventName.ScoreBuildingConstructed, this.gameObject);
  }

  completeConstruction(): void {
    if (!this.isFinished) this.finishConstruction();
  }

  private getProgressFraction() {
    const productionDefinition = this.productionDefinition;
    if (!productionDefinition) throw new Error("Production definition not found");
    const val = 1 - this.remainingConstructionTime / productionDefinition.productionTime;
    return Math.min(1, Math.max(0, val)); // clamp between 0 and 1
  }

  getData(): ConstructionSiteComponentData {
    return {
      state: this.state,
      remainingConstructionTime: this.remainingConstructionTime,
      progressPercentage: this.progressPercentage,
      assignedBuilders: this.assignedBuilders.map((builder) => getActorComponent(builder, IdComponent)!.id),
      assignedRepairers: this.assignedRepairers.map((repairer) => getActorComponent(repairer, IdComponent)!.id),
      playingBuildSound: this.playingBuildSound
    } satisfies ConstructionSiteComponentData;
  }

  setData(data: Partial<ConstructionSiteComponentData>) {
    // Even matching restores resolve references and emit native callbacks; they cannot reopen prior history.
    fenceSceneResourceHistory(this.gameObject.scene, "resource_actor_construction_change");
    if (data.state !== undefined) this.state = data.state;
    if (data.remainingConstructionTime !== undefined) this.remainingConstructionTime = data.remainingConstructionTime;
    if (data.progressPercentage !== undefined) this.progressPercentage = data.progressPercentage;
    if (data.playingBuildSound !== undefined) this.playingBuildSound = data.playingBuildSound;
    // assigned builders and repairers are set after all objects are loaded.
    this.pendingAssignedBuilderIds = data.assignedBuilders ? [...data.assignedBuilders] : undefined;
    this.pendingAssignedRepairerIds = data.assignedRepairers ? [...data.assignedRepairers] : undefined;
    this.tryResolveAssignedActorReferences();

    observeConstructionLifecycle(this.gameObject, this.state, this.remainingConstructionTime, "restored");
    this.constructionProgressPercentageChanged.next(this.progressPercentage);
    this.constructionStateChanged.next(this.state);
  }

  private onDestroy() {
    observeConstructionLifecycle(this.gameObject, this.state, this.remainingConstructionTime, "teardown");
    this.cancelConstruction();
    this.simulationTickSub?.unsubscribe();
  }

  private tryResolveAssignedActorReferences(): void {
    const actorIndex = getSceneService(this.gameObject.scene, ActorIndexSystem);
    if (!actorIndex) {
      return;
    }

    if (this.pendingAssignedBuilderIds) {
      const resolvedBuilders = this.pendingAssignedBuilderIds
        .map((id) => actorIndex.getActorById(id))
        .filter((obj): obj is Phaser.GameObjects.GameObject => obj !== null);
      if (resolvedBuilders.length === this.pendingAssignedBuilderIds.length) {
        // Fixes partial assignment state by applying builder references only after complete resolution.
        this.assignedBuilders = resolvedBuilders;
        this.pendingAssignedBuilderIds = undefined;
      }
    }

    if (this.pendingAssignedRepairerIds) {
      const resolvedRepairers = this.pendingAssignedRepairerIds
        .map((id) => actorIndex.getActorById(id))
        .filter((obj): obj is Phaser.GameObjects.GameObject => obj !== null);
      if (resolvedRepairers.length === this.pendingAssignedRepairerIds.length) {
        // Fixes partial assignment state by applying repairer references only after complete resolution.
        this.assignedRepairers = resolvedRepairers;
        this.pendingAssignedRepairerIds = undefined;
      }
    }
  }

  private getAssignedBuilderCountForProgress(): number {
    if (this.pendingAssignedBuilderIds) {
      return this.pendingAssignedBuilderIds.length;
    }
    return this.assignedBuilders.length;
  }

  private getAssignedRepairerCountForProgress(): number {
    if (this.pendingAssignedRepairerIds) {
      return this.pendingAssignedRepairerIds.length;
    }
    return this.assignedRepairers.length;
  }
}
