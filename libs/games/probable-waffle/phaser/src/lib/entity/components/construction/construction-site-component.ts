import Phaser from "phaser";
import { type ConstructionSiteComponentData, ConstructionStateEnum } from "@fuzzy-waddle/probable-waffle-protocol";
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
// prettier-ignore
import type { ConstructionSiteDefinition } from
  "@fuzzy-waddle/probable-waffle-gameplay/entity/components/construction/construction-site-definition";
// prettier-ignore
import type { ProductionCostDefinition } from
  "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/production-cost-definition";
import { ConstructionWorkerMembership } from "./construction-worker-membership";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { ProbableWaffleSceneEventName } from "../../../world/services/recovery/probable-waffle-scene-events";
import { buildsWithoutAssignedWorkers, constructionVitalityIncrement } from "./construction-progress";
import { startConstructionPayment, refundConstructionPayment } from "./construction-payment";
import { observeConstructionLifecycle } from "./observe-construction-authority";
import { fenceSceneResourceHistory } from "../../../data/scene-resource-observation";

export { buildsWithoutAssignedWorkers, constructionVitalityIncrement } from "./construction-progress";

export class ConstructionSiteComponent {
  private readonly scene: Phaser.Scene;
  public progressPercentage = 0;
  public constructionProgressPercentageChanged: BehaviorSubject<number> = new BehaviorSubject<number>(
    this.progressPercentage
  );
  private remainingConstructionTime = 0;
  private state: ConstructionStateEnum = ConstructionStateEnum.NotStarted;
  public constructionStateChanged: Subject<ConstructionStateEnum> = new Subject<ConstructionStateEnum>();
  private readonly builders: ConstructionWorkerMembership;
  private readonly repairers: ConstructionWorkerMembership;
  constructionProgressUiComponent: ConstructionProgressUiComponent;
  private readonly presentation: ConstructionPresentation;
  private healthComponent?: HealthComponent;
  private simulationTickSub?: Subscription;
  private playingBuildSound = false;
  /** Killed and destroy callbacks can both address this component; refund and listener disposal happen once. */
  private teardownComplete = false;
  private sceneDisposed = false;
  /** Resource callbacks are synchronous and may attempt to start the same unpaid site again. */
  private paymentInProgress = false;
  /** Terminal settlement survives save/load; callbacks cannot refund the same site again. */
  private cancellationSettled = false;
  private cancellationPending = false;
  /** Blocks reentry while the pre-mutation resource fence still exposes unsettled saved state. */
  private cancellationInProgress = false;
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly constructionSiteDefinition: ConstructionSiteDefinition
  ) {
    this.scene = gameObject.scene;
    this.builders = new ConstructionWorkerMembership(gameObject.scene);
    this.repairers = new ConstructionWorkerMembership(gameObject.scene);
    this.constructionProgressUiComponent = new ConstructionProgressUiComponent(this.gameObject);
    this.presentation = new ConstructionPresentation(
      this.gameObject,
      () => this.playingBuildSound,
      (playing) => {
        this.playingBuildSound = playing;
      }
    );
    onObjectReady(gameObject, this.init, this);
    this.simulationTickSub = getSceneService(gameObject.scene, SimulationTickService)?.tick$.subscribe(() =>
      this.update()
    );
    gameObject.on(Phaser.GameObjects.Events.DESTROY, this.onDestroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.onDestroy, this);
    gameObject.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onSceneShutdown, this);
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
    if (this.cancellationSettled || this.teardownComplete || this.cancellationInProgress) return;
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
   * It performs the state transition and associated cleanup as one operation
   * so partially built actors cannot leak into normal production flow.
   */
  private tryBuild(deltaWithTimeScale: number) {
    if (this.state === ConstructionStateEnum.NotStarted && this.constructionSiteDefinition.startImmediately) {
      if (!this.startConstruction(true)) return;
      this.setInitialHealth();
    }

    if (this.state === ConstructionStateEnum.NotStarted && this.builders.actors.length > 0) {
      if (!this.startConstruction(true)) return;
    }

    if (this.state !== ConstructionStateEnum.Constructing) return;

    if (this.healthComponent?.killed) return;

    const speedBoost = 1.0;
    // Unresolved saved workers cannot perform construction until their live references resolve.
    const constructionProgress =
      deltaWithTimeScale * this.constructionSiteDefinition.progressMadeAutomatically * speedBoost +
      deltaWithTimeScale *
        this.constructionSiteDefinition.progressMadePerBuilder *
        this.builders.actors.length *
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

  /** Explicit starts retain denial errors; automatic retries wait without advancing work, health or construction state. */
  startConstruction(waitForFunds = false): boolean {
    if (this.paymentInProgress || this.teardownComplete || this.cancellationSettled || this.cancellationInProgress)
      return false;
    if (this.state !== ConstructionStateEnum.NotStarted) {
      throw new Error("ConstructionSiteComponent can only be started once");
    }
    const productionDefinition = this.productionDefinition;
    if (!productionDefinition) throw new Error("Production definition not found");
    this.paymentInProgress = true;
    try {
      if (
        startConstructionPayment(
          this.gameObject,
          productionDefinition,
          this.state,
          this.remainingConstructionTime,
          waitForFunds
        ) === false
      )
        return false;

      // Payment callbacks retain pre-start state; only a returned payment reaches this boundary.
      fenceSceneResourceHistory(this.gameObject.scene, "resource_actor_construction_change");
      // start building
      this.remainingConstructionTime = productionDefinition.productionTime;
      this.state = ConstructionStateEnum.Constructing;
      if (this.cancellationPending || this.teardownComplete) {
        this.paymentInProgress = false;
        this.cancelConstruction();
        return false;
      }
      observeConstructionLifecycle(this.gameObject, this.state, this.remainingConstructionTime, "started");
      this.constructionStateChanged.next(this.state);
      return true;
    } finally {
      this.paymentInProgress = false;
    }
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
    if (this.sceneDisposed || this.isFinished || this.cancellationSettled || this.cancellationInProgress) return;
    if (this.paymentInProgress) {
      this.cancellationPending = true;
      return;
    }
    this.cancellationInProgress = true;
    const builders = [...this.builders.actors];
    fenceSceneResourceHistory(this.gameObject.scene, "resource_actor_construction_change");
    this.cancellationSettled = true;
    let failure: unknown;
    let failed = false;
    try {
      // A rejected/unstarted placement has never paid; its assigned builders still need normal order cleanup.
      if (this.state !== ConstructionStateEnum.NotStarted) {
        const productionDefinition = this.productionDefinition;
        if (!productionDefinition) throw new Error("Production definition not found");
        refundConstructionPayment(
          this.gameObject,
          productionDefinition,
          this.constructionSiteDefinition.refundFactor,
          () => this.getProgressFraction(),
          this.state,
          this.remainingConstructionTime
        );
      }
    } catch (error) {
      failure = error;
      failed = true;
    }
    // Resets may remove membership synchronously. Every original builder still needs cleanup.
    for (const builder of builders) {
      try {
        const payerPawnAiController = getActorComponent(builder, PawnAiController);
        payerPawnAiController?.blackboard.resetCurrentOrder();
      } catch (error) {
        if (!failed) failure = error;
        failed = true;
      }
    }
    if (failed) throw failure;
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
      this.builders.actors.length < this.constructionSiteDefinition.maxAssignedBuilders &&
      !this.cancellationSettled &&
      !this.cancellationInProgress &&
      !this.teardownComplete &&
      !this.isFinished &&
      (this.healthComponent === undefined || !this.healthComponent.killed)
    );
  }

  assignBuilder(gameObject: Phaser.GameObjects.GameObject) {
    if (
      this.cancellationSettled ||
      this.teardownComplete ||
      this.cancellationInProgress ||
      this.builders.actors.includes(gameObject)
    )
      return;
    this.builders.add(gameObject);
  }

  unAssignBuilder(gameObject: Phaser.GameObjects.GameObject) {
    this.builders.remove(gameObject);
  }

  canAssignRepairer() {
    if (this.cancellationSettled || this.teardownComplete || this.cancellationInProgress) return false;
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (!healthComponent) return false;
    return (
      this.repairers.actors.length < this.constructionSiteDefinition.maxAssignedRepairers &&
      healthComponent.healthComponentData.health < healthComponent.healthDefinition.maxHealth
    );
  }
  assignRepairer(gameObject: Phaser.GameObjects.GameObject) {
    if (
      this.cancellationSettled ||
      this.teardownComplete ||
      this.cancellationInProgress ||
      this.repairers.actors.includes(gameObject)
    )
      return;
    this.repairers.add(gameObject);
  }
  unAssignRepairer(gameObject: Phaser.GameObjects.GameObject) {
    this.repairers.remove(gameObject);
  }

  private tryRepair(deltaWithTimeScale: number) {
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (!healthComponent) return;

    if (this.repairers.actors.length === 0) return;
    if (healthComponent.healthComponentData.health >= healthComponent.healthDefinition.maxHealth) return;

    // Fixes repair-rate drift from transiently missing repairer references during restore.
    const repairAmount =
      deltaWithTimeScale * this.constructionSiteDefinition.repairFactor * this.repairers.actors.length;
    fenceSceneResourceHistory(this.gameObject.scene, "resource_actor_health_change");
    healthComponent.healthComponentData.health += repairAmount;
    healthComponent.healthComponentData.health = Math.min(
      healthComponent.healthComponentData.health,
      healthComponent.healthDefinition.maxHealth
    );

    this.presentation.playBuildSound();

    if (healthComponent.healthComponentData.health >= healthComponent.healthDefinition.maxHealth) {
      [...this.repairers.actors].forEach((repairer) => {
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
      [...this.builders.actors].forEach((builder) => {
        builder.destroy();
      });
    }

    upgradeFromConstructingToFullActorData(this.gameObject);
    this.gameObject.scene.events.emit(ProbableWaffleSceneEventName.ScoreBuildingConstructed, this.gameObject);
  }

  completeConstruction(): void {
    if (!this.isFinished && !this.cancellationSettled && !this.teardownComplete && !this.cancellationInProgress)
      this.finishConstruction();
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
      assignedBuilders: this.builders.savedIds,
      assignedRepairers: this.repairers.savedIds,
      playingBuildSound: this.playingBuildSound,
      ...(this.cancellationSettled ? { cancellationSettled: true as const } : {})
    } satisfies ConstructionSiteComponentData;
  }

  setData(data: Partial<ConstructionSiteComponentData>) {
    if (this.teardownComplete) return;
    // Even matching restores resolve references and emit native callbacks; they cannot reopen prior history.
    fenceSceneResourceHistory(this.gameObject.scene, "resource_actor_construction_change");
    if (data.cancellationSettled) this.cancellationSettled = true;
    if (data.state !== undefined) this.state = data.state;
    if (data.remainingConstructionTime !== undefined) this.remainingConstructionTime = data.remainingConstructionTime;
    if (data.progressPercentage !== undefined) this.progressPercentage = data.progressPercentage;
    if (data.playingBuildSound !== undefined) this.playingBuildSound = data.playingBuildSound;
    // assigned builders and repairers are set after all objects are loaded.
    this.builders.restore(data.assignedBuilders);
    this.repairers.restore(data.assignedRepairers);
    this.tryResolveAssignedActorReferences();

    observeConstructionLifecycle(this.gameObject, this.state, this.remainingConstructionTime, "restored");
    this.constructionProgressPercentageChanged.next(this.progressPercentage);
    this.constructionStateChanged.next(this.state);
  }

  private onDestroy() {
    if (this.teardownComplete) return;
    this.teardownComplete = true;
    try {
      observeConstructionLifecycle(this.gameObject, this.state, this.remainingConstructionTime, "teardown");
      this.cancelConstruction();
    } finally {
      this.simulationTickSub?.unsubscribe();
      this.gameObject.off(Phaser.GameObjects.Events.DESTROY, this.onDestroy, this);
      this.gameObject.off(HealthComponent.KilledEvent, this.onDestroy, this);
      this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.onSceneShutdown, this);
    }
  }

  /** Scene disposal is not a paid cancellation. Actor teardown after shutdown must not mint refunds. */
  private onSceneShutdown(): void {
    this.sceneDisposed = true;
    this.teardownComplete = true;
    this.simulationTickSub?.unsubscribe();
    this.gameObject.off(Phaser.GameObjects.Events.DESTROY, this.onDestroy, this);
    this.gameObject.off(HealthComponent.KilledEvent, this.onDestroy, this);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.onSceneShutdown, this);
  }

  private tryResolveAssignedActorReferences(): void {
    this.builders.resolve();
    this.repairers.resolve();
  }
}
