import { State } from "mistreevous";
import type {
  IPlayerPawnControllerAgent,
  PlayerPawnCooldownType,
  PlayerPawnRangeType
} from "./player-pawn-ai-controller.agent.interface";
import { getActorComponent } from "../../data/actor-component";
import { VisionComponent } from "../../entity/components/vision-component";
import { DistanceHelper } from "../../library/distance-helper";
import { AttackComponent } from "../../entity/components/combat/components/attack-component";
import { getActorSystem } from "../../data/actor-system";
import { getRandomTileInNavigableRadius, MovementSystem } from "../../entity/systems/movement.system";
import { OrderLabelToTypeMap, OrderType } from "../../ai/order-type";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { GathererComponent } from "../../entity/components/resource/gatherer-component";
import { ResourceSourceComponent } from "../../entity/components/resource/resource-source-component";
import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { SpellTargetType } from "@fuzzy-waddle/api-interfaces";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { ContainableComponent } from "../../entity/components/building/containable-component";
import { ContainerComponent } from "../../entity/components/building/container-component";
import { ResourceDrainComponent } from "../../entity/components/resource/resource-drain-component";
import { BuilderComponent } from "../../entity/components/construction/builder-component";
import { OrderData } from "../../ai/OrderData";
import { HealingComponent } from "../../entity/components/combat/components/healing-component";
import { ConstructionSiteComponent } from "../../entity/components/construction/construction-site-component";
import { AnimationActorComponent } from "../../entity/components/animation/animation-actor-component";
import type { PathMoveConfig } from "../../entity/systems/path-move-config";
import { StatusEffectComponent } from "../../entity/components/status-effect/status-effect-component";
import { SpellComponent } from "../../entity/components/combat/components/spell-component";
import { SpellCastingSystem } from "../../entity/systems/spell-casting.system";
import { spellDefinitions } from "../../entity/components/combat/spell-definitions";
import { RepresentableComponent } from "../../entity/components/representable-component";
import { TendableComponent } from "../../entity/components/tendable/tendable-component";
import { isCropResourceSource } from "../../entity/components/tendable/growth-stage.interface";
import { AnimationType } from "../../entity/components/animation/animation-type";
import { getGameObjectTileInRadius } from "../../data/game-object-helper";
import { NavigationService } from "../../world/services/navigation.service";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { isWaterUnit } from "../../data/game-object-helper";
import { SimulationTickService } from "../../world/services/simulation-tick.service";
import { getSimulationNow } from "../../world/services/simulation-time";
import { IdComponent } from "../../entity/components/id-component";

export class PlayerPawnAiControllerAgent implements IPlayerPawnControllerAgent {
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly blackboard: PawnAiBlackboard
  ) {}

  [propertyName: string]: unknown;

  OrderExistsInQueue() {
    return this.blackboard.anyOrderInQueue();
  }

  AssignNextOrderFromQueue() {
    const playerOrder = this.blackboard.peekNextPlayerOrder();
    if (!playerOrder) return State.FAILED;
    this.blackboard.setCurrentOrder(playerOrder);
    // Cancel any pending boarding request when starting a non-boarding order
    if (playerOrder.orderType !== OrderType.EnterContainer) {
      getActorComponent(this.gameObject, ContainableComponent)?.cancelAnyPendingBoardingRequest();
    }
    return State.SUCCEEDED;
  }

  PlayerOrderIs(orderType: string) {
    const currentOrder = this.blackboard.getCurrentOrder();
    return currentOrder?.orderType === OrderLabelToTypeMap[orderType];
  }

  HasAttackComponent() {
    // noinspection UnnecessaryLocalVariableJS
    const hasComponent = !!getActorComponent(this.gameObject, AttackComponent);
    return hasComponent;
  }

  TargetIsAlive() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return false;
    const healthComponent = getActorComponent(target, HealthComponent);
    if (!healthComponent) return false;
    return healthComponent.alive;
  }

  SelfIsAlive() {
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (!healthComponent) return true; // if no health component, assume alive
    return healthComponent.alive;
  }

  /**
   * Checks if the actor is currently stunned or frozen
   * Stunned actors cannot move, attack, or cast spells
   */
  IsStunned() {
    const statusEffectComponent = getActorComponent(this.gameObject, StatusEffectComponent);
    if (!statusEffectComponent) return false;
    return statusEffectComponent.isStunned();
  }

  /**
   * Checks if the actor is currently slowed
   * Slowed actors can still act but move slower
   */
  IsSlowed() {
    const statusEffectComponent = getActorComponent(this.gameObject, StatusEffectComponent);
    if (!statusEffectComponent) return false;
    return statusEffectComponent.isSlowed();
  }

  async InRange(type: PlayerPawnRangeType): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) {
      // console.log("[Build] InRange: No current order");
      return State.FAILED;
    }
    const targetGameObject = currentOrder.data.targetGameObject;
    const targetLocation = currentOrder.data.targetTileLocation;
    const range = this.getRangeToTarget(type);
    if (range === undefined) {
      // console.log("[Build] InRange: Range undefined for type", type);
      return State.FAILED;
    }
    if (targetGameObject) {
      const movementSystem = getActorSystem(this.gameObject, MovementSystem);
      let distance: null | number;
      if (movementSystem) {
        const nrTiles = await movementSystem.getPathToClosestNavigableTileBetweenGameObjectsInRadius(
          targetGameObject,
          range
        );
        if (nrTiles === null) {
          // Target is unreachable - this is handled by the behavior tree
          // console.log("[Build] InRange: Target unreachable (no path), type=", type);
          return State.FAILED;
        }
        distance = nrTiles.length;
      } else {
        distance = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, targetGameObject);
      }
      if (distance === null) {
        // console.log("[Build] InRange: Distance is null");
        return State.FAILED;
      }
      // noinspection UnnecessaryLocalVariableJS
      const result = distance <= range ? State.SUCCEEDED : State.FAILED;
      // console.log(
      //   "[Build] InRange: type=",
      //   type,
      //   "distance=",
      //   distance,
      //   "range=",
      //   range,
      //   "result=",
      //   result === State.SUCCEEDED ? "SUCCEEDED" : "FAILED"
      // );

      return result;
    } else if (targetLocation) {
      const movementSystem = getActorSystem(this.gameObject, MovementSystem);
      if (!movementSystem) return State.FAILED;
      const distance = DistanceHelper.getTileDistanceBetweenGameObjectAndTile(this.gameObject, targetLocation);
      if (distance === null) return State.FAILED;
      return distance <= range ? State.SUCCEEDED : State.FAILED;
    } else {
      return State.FAILED;
    }
  }

  private getRangeToTarget(type: PlayerPawnRangeType): number | undefined {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return undefined;

    const targetGameObject = currentOrder.data.targetGameObject;
    const targetLocation = currentOrder.data.targetTileLocation;
    if (targetGameObject) {
      switch (type) {
        case "move":
          return 0;
        case "attack":
          return getActorComponent(this.gameObject, AttackComponent)?.getAttackRange(targetGameObject);
        case "gather":
          return getActorComponent(this.gameObject, GathererComponent)?.getGatherRange(targetGameObject);
        case "dropOff":
          return getActorComponent(targetGameObject, ResourceDrainComponent)?.getDropOffRange();
        case "construct":
          return getActorComponent(this.gameObject, BuilderComponent)?.getConstructionRange();
        case "heal":
          return getActorComponent(this.gameObject, HealingComponent)?.getHealRange();
        case "repair":
          return getActorComponent(this.gameObject, BuilderComponent)?.getRepairRange();
        default:
          throw new Error("Invalid range type");
      }
    } else if (targetLocation) {
      // range to location is always 0
      return 0;
    }
    return undefined;
  }

  async MoveToTarget(type: PlayerPawnRangeType): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) {
      // console.log("[Build] MoveToTarget: No current order");
      return State.FAILED;
    }
    const target = currentOrder.data.targetGameObject;
    if (!target) {
      // console.log("[Build] MoveToTarget: No target");
      return State.FAILED;
    }
    const range = this.getRangeToTarget(type);
    if (range === undefined) {
      // console.log("[Build] MoveToTarget: Range undefined");
      return State.FAILED;
    }
    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) {
      // console.log("[Build] MoveToTarget: No movement system");
      return State.FAILED;
    }
    try {
      const canMoveToTarget = await this.CanMoveToTarget(range);
      if (!canMoveToTarget) {
        // console.log("[Build] MoveToTarget: Cannot move to target (unreachable), type=", type);
        return State.FAILED;
      }
      // console.log("[Build] MoveToTarget: Moving to target, type=", type);
      const success = await movementSystem.moveToActorByAdjustingPathDynamically(target, {
        radiusTilesAroundDestination: range,
        onUpdateThrottled: () => {
          // if the target is not alive, stop moving
          const healthComponent = getActorComponent(target, HealthComponent);
          if (healthComponent && healthComponent.killed) {
            this.Stop("MoveToTarget");
          }
        }
      } satisfies Partial<PathMoveConfig>);
      // console.log("[Build] MoveToTarget: Movement result=", success ? "SUCCESS" : "FAILED");
      return success ? State.SUCCEEDED : State.FAILED;
    } catch (e) {
      console.error("[Build] MoveToTarget: Error", e);
      return State.FAILED;
    }
  }

  async MoveToTargetOrLocation(type: PlayerPawnRangeType): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    const location = currentOrder.data.targetTileLocation;
    if (target) {
      return await this.MoveToTarget(type);
    } else if (location) {
      return await this.MoveToLocation();
    } else {
      return Promise.resolve(State.FAILED);
    }
  }

  async MoveToLocation() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const location = currentOrder.data.targetTileLocation;
    if (!location) return State.FAILED;
    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return State.FAILED;
    try {
      // Attack-move support: while moving to location during an Attack order (without a target yet),
      // acquire the first visible enemy and cancel movement so the tree can proceed to attack.
      const isAttackMove = currentOrder.orderType === OrderType.Attack && !currentOrder.data.targetGameObject;
      let success: boolean;
      if (isAttackMove) {
        success = await movementSystem.moveToLocationByFollowingStaticPath(location, {
          onUpdateThrottled: () => {
            const enemy = this.getClosestAttackableVisibleEnemy();
            if (enemy) {
              currentOrder.data.targetGameObject = enemy;
              movementSystem.cancelMovement();
            }
          }
        } satisfies Partial<PathMoveConfig>);
      } else {
        success = await movementSystem.moveToLocationByFollowingStaticPath(location);
      }
      return success ? State.SUCCEEDED : State.FAILED;
    } catch (e) {
      // console.error("Error in MoveToLocation", e);
      this.Stop("MoveToLocation");
      return State.FAILED;
    }
  }

  Stop = (fromNode: string) => {
    // console.log(`Stop called from: ${fromNode}`);

    const currentOrder = this.blackboard.getCurrentOrder();
    if (currentOrder) {
      if (currentOrder.orderType !== OrderType.EnterContainer) {
        // Exit any container the actor is in for non-boarding orders
        const containableComponent = getActorComponent(this.gameObject, ContainableComponent);
        if (containableComponent) {
          containableComponent.leaveContainer();
        }
        // Also cancel any pending boarding request registered while walking to shore
        getActorComponent(this.gameObject, ContainableComponent)?.cancelAnyPendingBoardingRequest();
      } else if (fromNode !== "EnterContainer:MovedToShore") {
        // EnterContainer order cancelled before the unit reached shore — cancel boarding request
        const target = currentOrder.data.targetGameObject;
        if (target) {
          getActorComponent(target, ContainerComponent)?.cancelBoardingRequest(this.gameObject);
        }
      }
      // Unassign from any farm being tended
      const tendableTarget = currentOrder.data.targetGameObject;
      if (tendableTarget) {
        getActorComponent(tendableTarget, TendableComponent)?.unassignTender(this.gameObject);
      }

      switch (currentOrder.orderType) {
        case OrderType.Move:
          // movement cancelled below
          break;
        case OrderType.Build:
          const builderComponent = getActorComponent(this.gameObject, BuilderComponent);
          if (builderComponent) {
            builderComponent.leaveConstructionSite();
          }
          break;
        case OrderType.Repair:
          const builderComponent2 = getActorComponent(this.gameObject, BuilderComponent);
          if (builderComponent2) {
            builderComponent2.leaveRepairSite();
          }
          break;
      }

      // cancel any ongoing attack (e.g., active projectile flight)
      const attackComponent = getActorComponent(this.gameObject, AttackComponent);
      if (attackComponent) {
        attackComponent.cancelCurrentAttack();
      }

      this.blackboard.resetCurrentOrder(false);
      const animationActorComponent = getActorComponent(this.gameObject, AnimationActorComponent);
      if (animationActorComponent) {
        const healthComponent = getActorComponent(this.gameObject, HealthComponent);
        if (!healthComponent || healthComponent.alive) animationActorComponent.playOrderAnimation(OrderType.Stop);
      }
      const movementSystem = getActorSystem(this.gameObject, MovementSystem);
      movementSystem?.cancelMovement();
    }

    this.blackboard.popCurrentOrderFromQueue();
    return State.SUCCEEDED;
  };

  // ─── Farm Tending ───────────────────────────────────────────────────────────

  TargetHasTendableComponent(): boolean {
    const target = this.blackboard.getCurrentOrder()?.data.targetGameObject;
    if (!target) return false;
    return !!getActorComponent(target, TendableComponent);
  }

  GrowthReady(): boolean {
    const target = this.blackboard.getCurrentOrder()?.data.targetGameObject;
    if (!target) return false;
    return getActorComponent(target, TendableComponent)?.isReadyForHarvest() ?? false;
  }

  GrowthPercentBelow(threshold: number): boolean {
    const target = this.blackboard.getCurrentOrder()?.data.targetGameObject;
    if (!target) return false;
    const tendable = getActorComponent(target, TendableComponent);
    if (!tendable) return false;
    return tendable.growthPercent < threshold;
  }

  AssignSelfAsTender(): State {
    const target = this.blackboard.getCurrentOrder()?.data.targetGameObject;
    if (!target) return State.FAILED;
    const tendable = getActorComponent(target, TendableComponent);
    if (!tendable) return State.FAILED;
    if (tendable.isTenderAssigned(this.gameObject)) return State.SUCCEEDED;
    if (!tendable.canAssignTender()) return State.FAILED;
    tendable.assignTender(this.gameObject);
    return State.SUCCEEDED;
  }

  UnassignSelfAsTender(): State {
    const target = this.blackboard.getCurrentOrder()?.data.targetGameObject;
    if (target) {
      getActorComponent(target, TendableComponent)?.unassignTender(this.gameObject);
    }
    return State.SUCCEEDED;
  }

  async MoveToRandomSpotOnTarget(): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;
    // Use the worker's MovementSystem — the field has none
    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return State.FAILED;
    try {
      // Use spatial (non-pathfinding) tile lookup — field's own tile may be blocked by its collider
      const randomTile = getGameObjectTileInRadius(target, 2);
      if (!randomTile) return State.FAILED;
      const success = await movementSystem.moveToLocationByFollowingStaticPath({
        x: randomTile.x,
        y: randomTile.y,
        z: 0
      });
      return success ? State.SUCCEEDED : State.FAILED;
    } catch {
      return State.FAILED;
    }
  }

  PlaySeedingAnimation(): State {
    getActorComponent(this.gameObject, AnimationActorComponent)?.playCustomAnimation(AnimationType.Thrust);
    return State.SUCCEEDED;
  }

  PlayTendingAnimation(): State {
    const target = this.blackboard.getCurrentOrder()?.data.targetGameObject;
    const anim = isCropResourceSource(target)
      ? (target.getActiveCropTendAnimation() ?? AnimationType.Dig)
      : AnimationType.Dig;
    getActorComponent(this.gameObject, AnimationActorComponent)?.playCustomAnimation(anim);
    return State.SUCCEEDED;
  }

  /**
   * After finishing construction of a tendable building (e.g. a Field), immediately
   * issue a Gather order on it so the builder begins tending/harvesting without
   * needing a manual command.  Always returns SUCCEEDED so the build sequence continues.
   */
  AutoAssignTendOrderIfTendable(): State {
    const currentOrder = this.blackboard.getCurrentOrder();
    const target = currentOrder?.data.targetGameObject;
    if (!target) return State.SUCCEEDED;
    if (!getActorComponent(target, TendableComponent)) return State.SUCCEEDED;
    this.blackboard.addOrder(new OrderData(OrderType.Gather, { targetGameObject: target }));
    return State.SUCCEEDED;
  }

  // ────────────────────────────────────────────────────────────────────────────

  Attack() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    if (!this.SelfIsAlive()) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;
    const targetHealth = getActorComponent(target, HealthComponent);
    if (targetHealth && !targetHealth.alive) return State.FAILED;
    const attackComponent = getActorComponent(this.gameObject, AttackComponent);
    if (!attackComponent) return State.FAILED;
    if (!attackComponent.getAttack(target)) return State.FAILED;
    if (attackComponent.remainingCooldown > 0) return State.FAILED;
    attackComponent.useAttack(target);
    return State.SUCCEEDED;
  }

  AnyEnemyVisible() {
    const visionComponent = getActorComponent(this.gameObject, VisionComponent);
    if (!visionComponent) return false;
    return visionComponent.getVisibleEnemies().length > 0;
  }

  AnyAttackableEnemyVisible() {
    return !!this.getClosestAttackableVisibleEnemy();
  }

  // Assign closest visible enemy to the CURRENT order (used for attack-move).
  AssignAttackableEnemyToCurrentOrder(): State {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const enemy = this.getClosestAttackableVisibleEnemy();
    if (!enemy) return State.FAILED;
    currentOrder.data.targetGameObject = enemy;
    return State.SUCCEEDED;
  }

  CanAttackCurrentTarget() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return false;
    return this.canAttackTarget(target);
  }

  private async CanMoveToTarget(range: number): Promise<boolean> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return Promise.resolve(false);
    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return Promise.resolve(false);
    // noinspection UnnecessaryLocalVariableJS
    return await movementSystem.canMoveTo(target, range);
  }

  async AcquireNewResourceSource() {
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return State.FAILED;
    let resourceSource = await gathererComponent.getPreferredResourceSource();
    const currentResources = resourceSource?.active
      ? getActorComponent(resourceSource, ResourceSourceComponent)?.getCurrentResources()
      : 0;
    if (!currentResources || currentResources <= 0) {
      resourceSource = await gathererComponent.getNewResourceSource();
    }
    if (!resourceSource) return State.FAILED;
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    currentOrder.data.targetGameObject = resourceSource;
    return State.SUCCEEDED;
  }

  async AcquireNewResourceDrain(): Promise<State> {
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return State.FAILED;
    const resourceDrain = await gathererComponent.getPreferredResourceDrain();
    if (!resourceDrain) return State.FAILED;
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    currentOrder.data.targetGameObject = resourceDrain;
    return State.SUCCEEDED;
  }

  async GatherResource(): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    if (!this.SelfIsAlive()) return State.FAILED;
    const inRange = await this.InRange("gather");
    if (inRange !== State.SUCCEEDED) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;
    const targetHealth = getActorComponent(target, HealthComponent);
    if (targetHealth && !targetHealth.alive) return State.FAILED;
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return State.FAILED;
    if (gathererComponent.remainingCooldown > 0) return State.FAILED;
    if (gathererComponent.isCapacityFull()) return State.FAILED;
    const resourceSourceComponent = getActorComponent(target, ResourceSourceComponent);
    if (!resourceSourceComponent || resourceSourceComponent.getCurrentResources() <= 0) return State.FAILED;
    const successfullyStarted = gathererComponent.startGatheringResources(target);
    if (!successfullyStarted) return State.FAILED;
    await gathererComponent.gatherResources(target);
    return State.SUCCEEDED;
  }

  async DropOffResources() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    if (!this.SelfIsAlive()) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return State.FAILED;
    await gathererComponent.returnResources(target);
    return State.SUCCEEDED;
  }

  ContinueGathering() {
    this.AcquireNewResourceSource();
    return State.SUCCEEDED;
  }

  /**
   * Command the agent to leave a construction site or container
   */
  LeaveConstructionSiteOrCurrentContainer() {
    const containableComponent = getActorComponent(this.gameObject, ContainableComponent);
    if (!containableComponent) return State.SUCCEEDED;
    containableComponent.leaveContainer();
    return State.SUCCEEDED;
  }

  async AssignNextBuildOrder(): Promise<State> {
    const builderComponent = getActorComponent(this.gameObject, BuilderComponent);
    if (!builderComponent) {
      // console.log("[Build] AssignNextBuildOrder: No builder component");
      return State.FAILED;
    }
    const range = builderComponent.getConstructionSeekRange();
    const target = await builderComponent.getClosestConstructionSite(range);
    if (!target) {
      // console.log("[Build] AssignNextBuildOrder: No reachable construction site found");
      return State.FAILED;
    }
    // console.log("[Build] AssignNextBuildOrder: Found target", target);
    this.blackboard.addOrder(new OrderData(OrderType.Build, { targetGameObject: target }));

    return State.SUCCEEDED;
  }

  ConstructBuilding() {
    const builderComponent = getActorComponent(this.gameObject, BuilderComponent);
    if (!builderComponent) {
      // console.log("[Build] ConstructBuilding: No builder component");
      return State.FAILED;
    }
    if (!this.SelfIsAlive()) {
      // console.log("[Build] ConstructBuilding: Self not alive");
      return State.FAILED;
    }
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) {
      // console.log("[Build] ConstructBuilding: No current order");
      return State.FAILED;
    }
    const target = currentOrder.data.targetGameObject;
    if (!target) {
      // console.log("[Build] ConstructBuilding: No target");
      return State.FAILED;
    }
    // Check if in range before trying to construct
    const constructionSiteComponent = getActorComponent(target, ConstructionSiteComponent);
    if (!constructionSiteComponent) {
      // console.log("[Build] ConstructBuilding: No construction site component");
      return State.FAILED;
    }
    if (!constructionSiteComponent.canAssignBuilder()) {
      // console.log("[Build] ConstructBuilding: Cannot assign builder");
      return State.FAILED;
    }
    if (builderComponent.remainingCooldown > 0) {
      // console.log("[Build] ConstructBuilding: Cooldown not ready");
      return State.FAILED;
    }
    // console.log("[Build] ConstructBuilding: Assigning to construction site", target);
    builderComponent.assignToConstructionSite(target);
    return State.SUCCEEDED;
  }

  CanAssignBuilder(): boolean {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) {
      // console.log("[Build] CanAssignBuilder: No current order");
      return false;
    }
    const target = currentOrder.data.targetGameObject;
    if (!target) {
      // console.log("[Build] CanAssignBuilder: No target");
      return false;
    }
    const constructionSiteComponent = getActorComponent(target, ConstructionSiteComponent);
    if (!constructionSiteComponent) {
      // console.log("[Build] CanAssignBuilder: No construction site component on target");
      return false;
    }
    // noinspection UnnecessaryLocalVariableJS
    const canAssign = constructionSiteComponent.canAssignBuilder();
    // console.log("[Build] CanAssignBuilder:", canAssign);
    return canAssign;
  }

  HasBuilderComponent(): boolean {
    return !!getActorComponent(this.gameObject, BuilderComponent);
  }

  Attacked() {
    const attackedCooldown = 1000; // milliseconds
    const attackedCooldownTicks = Math.ceil(attackedCooldown / SimulationTickService.TICK_INTERVAL_MS);
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (!healthComponent) return false;

    const latestDamage = healthComponent.latestDamage;
    if (!latestDamage) return false;

    const simulationTickService = getSceneService(this.gameObject.scene, SimulationTickService);
    if (simulationTickService && latestDamage.simulationTick !== undefined) {
      const ticksSinceDamage = simulationTickService.currentTick - latestDamage.simulationTick;
      return ticksSinceDamage < attackedCooldownTicks;
    }

    // Use scene time for proper timeScale support
    const currentSceneTime = getSimulationNow(this.gameObject.scene);
    const damageSceneTime = latestDamage.sceneTime;
    const sceneTimeSinceDamage = currentSceneTime - damageSceneTime;

    // noinspection UnnecessaryLocalVariableJS
    const attacked = sceneTimeSinceDamage < attackedCooldown;
    return attacked;
  }

  Heal(): State {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    if (!this.SelfIsAlive()) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;
    const targetHealth = getActorComponent(target, HealthComponent);
    if (!targetHealth || !targetHealth.alive) return State.FAILED;
    if (targetHealth.healthIsFull) return State.FAILED;
    const healingComponent = getActorComponent(this.gameObject, HealingComponent);
    if (!healingComponent) return State.FAILED;
    if (healingComponent.remainingCooldown > 0) return State.FAILED;
    healingComponent.heal(target);
    return State.SUCCEEDED;
  }

  CanHeal(): boolean {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return false;
    const healthComponent = getActorComponent(target, HealthComponent);
    if (!healthComponent) return false;
    return !healthComponent.healthIsFull;
  }
  HasHealerComponent(): boolean {
    return !!getActorComponent(this.gameObject, HealingComponent);
  }

  AssignEnemy(source: string): State {
    switch (source) {
      case "vision":
        const visibleEnemy = this.getClosestAttackableVisibleEnemy();
        if (!visibleEnemy) return State.FAILED;
        this.blackboard.addOrder(new OrderData(OrderType.Attack, { targetGameObject: visibleEnemy }));
        return State.SUCCEEDED;
      case "retaliation": // todo
        const healthComponent = getActorComponent(this.gameObject, HealthComponent);
        if (!healthComponent) return State.FAILED;
        const latestDamage = healthComponent.latestDamage;
        if (!latestDamage) return State.FAILED;
        const attacker = latestDamage.damageInitiator;
        if (!attacker) return State.FAILED;
        if (!this.canAttackTarget(attacker)) return State.FAILED;
        this.blackboard.addOrder(new OrderData(OrderType.Attack, { targetGameObject: attacker }));
        return State.SUCCEEDED;
      default:
        console.error("Invalid source for AssignEnemy.");
        return State.FAILED;
    }
  }

  /**
   * Command the agent to move randomly within the specified range
   */
  async AssignMoveRandomlyInRange(range: number) {
    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return State.FAILED;
    let randomTile: Vector2Simple | null = null;
    try {
      randomTile = await getRandomTileInNavigableRadius(this.gameObject, range);
      if (!randomTile) return State.FAILED;
    } catch (e) {
      return State.FAILED;
    }
    const targetLocation = { x: randomTile.x, y: randomTile.y, z: 0 } satisfies Vector3Simple;
    this.blackboard.addOrder(new OrderData(OrderType.Move, { targetTileLocation: targetLocation }));
    return State.SUCCEEDED;
  }

  /**
   * Check if the cooldown period has passed for an action like resource gathering or attack
   */
  CooldownReady(type: PlayerPawnCooldownType) {
    switch (type) {
      case "attack":
        const attackComponent = getActorComponent(this.gameObject, AttackComponent);
        if (!attackComponent) return false;
        return attackComponent.remainingCooldown <= 0;
      case "gather":
        const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
        if (!gathererComponent) return false;
        return gathererComponent.remainingCooldown <= 0;
      case "construct":
        const builderComponent1 = getActorComponent(this.gameObject, BuilderComponent);
        if (!builderComponent1) return false;
        return builderComponent1.remainingCooldown <= 0;
      case "heal":
        const healingComponent = getActorComponent(this.gameObject, HealingComponent);
        if (!healingComponent) return false;
        return healingComponent.remainingCooldown <= 0;
      case "repair":
        const builderComponent2 = getActorComponent(this.gameObject, BuilderComponent);
        if (!builderComponent2) return false;
        return builderComponent2.remainingCooldown <= 0;
      default:
        throw new Error("Invalid cooldown type");
    }
  }

  TargetExists() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    return !!currentOrder.data.targetGameObject;
  }

  TargetOrLocationExists() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    return !!currentOrder.data.targetGameObject || !!currentOrder.data.targetTileLocation;
  }

  /**
   * Check if the target still has resources to gather
   */
  TargetHasResources() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return false;
    const resourceSourceComponent = getActorComponent(target, ResourceSourceComponent);
    if (!resourceSourceComponent) return false;
    return resourceSourceComponent.getCurrentResources() > 0;
  }

  AnyHighValueResourceVisible() {
    const visionComponent = getActorComponent(this.gameObject, VisionComponent);
    if (!visionComponent) return false;
    return visionComponent.getVisibleHighValueResources() !== null;
  }

  GatherHighValueResource() {
    // Command the agent to gather from a high-value resource
    console.log("Gathering high-value resource.");
    return State.SUCCEEDED;
  }

  NoEnemiesVisible() {
    // Check if there are no enemies visible to the agent
    return false;
  }

  private getClosestAttackableVisibleEnemy(): Phaser.GameObjects.GameObject | null {
    const visionComponent = getActorComponent(this.gameObject, VisionComponent);
    if (!visionComponent) return null;

    const attackableEnemies = visionComponent.getVisibleEnemies().filter((enemy) => this.canAttackTarget(enemy));
    if (attackableEnemies.length === 0) return null;

    // Deterministic target ordering: closest first, then stable actor identity.
    attackableEnemies.sort((a, b) => {
      const distanceA = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, a);
      const distanceB = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, b);
      if (distanceA === null && distanceB === null) {
        return this.compareEnemyTieBreaker(a, b);
      }
      if (distanceA === null) {
        return 1;
      }
      if (distanceB === null) {
        return -1;
      }
      if (distanceA !== distanceB) {
        return distanceA - distanceB;
      }
      return this.compareEnemyTieBreaker(a, b);
    });

    return attackableEnemies[0]!;
  }

  private compareEnemyTieBreaker(a: Phaser.GameObjects.GameObject, b: Phaser.GameObjects.GameObject): number {
    const aId = getActorComponent(a, IdComponent)?.id;
    const bId = getActorComponent(b, IdComponent)?.id;
    if (aId && bId && aId !== bId) {
      return aId.localeCompare(bId);
    }
    // Fallback key keeps ordering stable even when one side is missing an id.
    const aStable = `${a.name}:${aId ?? ""}`;
    const bStable = `${b.name}:${bId ?? ""}`;
    return aStable.localeCompare(bStable);
  }

  private canAttackTarget(target: Phaser.GameObjects.GameObject): boolean {
    const attackComponent = getActorComponent(this.gameObject, AttackComponent);
    if (!attackComponent) return false;
    return !!attackComponent.getAttack(target);
  }

  HasHarvestComponent() {
    // noinspection UnnecessaryLocalVariableJS
    const hasComponent = !!getActorComponent(this.gameObject, GathererComponent);
    return hasComponent;
  }

  GatherCapacityFull(): boolean {
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return false;
    return gathererComponent.isCapacityFull();
  }

  async AssignDropOffResourcesOrder(): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;

    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return State.FAILED;

    const preferredResourceDrain = await gathererComponent.getPreferredResourceDrain();
    if (!preferredResourceDrain) return State.FAILED;

    currentOrder.orderType = OrderType.ReturnResources;
    currentOrder.data.targetGameObject = preferredResourceDrain;
    return State.SUCCEEDED;
  }

  async AssignGatherResourcesOrder(): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;

    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return State.FAILED;

    const preferredResourceSource = await gathererComponent.getPreferredResourceSource();
    if (!preferredResourceSource) return State.FAILED;

    currentOrder.orderType = OrderType.Gather;
    currentOrder.data.targetGameObject = preferredResourceSource;
    return State.SUCCEEDED;
  }

  ConstructionSiteFinished(): boolean {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return false;
    const constructionSiteComponent = getActorComponent(target, ConstructionSiteComponent);
    if (!constructionSiteComponent) return false;
    return constructionSiteComponent.isFinished;
  }
  TargetHealthFull(): boolean {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return false;
    const healthComponent = getActorComponent(target, HealthComponent);
    if (!healthComponent) return false;
    return healthComponent.healthIsFull;
  }
  RepairBuilding(): State {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    if (!this.SelfIsAlive()) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;
    const targetHealth = getActorComponent(target, HealthComponent);
    if (targetHealth && !targetHealth.alive) return State.FAILED;
    const builderComponent = getActorComponent(this.gameObject, BuilderComponent);
    if (!builderComponent) return State.FAILED;
    const constructionSiteComponent = getActorComponent(target, ConstructionSiteComponent);
    if (!constructionSiteComponent) return State.FAILED;
    if (!constructionSiteComponent.canAssignRepairer()) return State.FAILED;
    if (builderComponent.remainingCooldown > 0) return State.FAILED;
    builderComponent.assignToRepairSite(target);
    return State.SUCCEEDED;
  }
  CanAssignRepairer(): boolean {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return false;
    const constructionSiteComponent = getActorComponent(target, ConstructionSiteComponent);
    if (!constructionSiteComponent) return false;
    return constructionSiteComponent.canAssignRepairer();
  }

  Succeed() {
    return State.SUCCEEDED;
  }

  Fail() {
    return State.FAILED;
  }

  Log(message: string): State {
    console.log(message);
    return State.SUCCEEDED;
  }

  // ========== Container Boarding AI ==========

  HasContainableComponent(): boolean {
    return !!getActorComponent(this.gameObject, ContainableComponent);
  }

  /** True if self is a water-terrain unit (e.g. a transport boat). */
  IsWaterUnit(): boolean {
    return isWaterUnit(this.gameObject);
  }

  /** True if the current order's target container is a water-terrain unit (e.g. a transport boat). */
  IsWaterContainerTarget(): boolean {
    const target = this.blackboard.getCurrentOrder()?.data.targetGameObject;
    return !!target && isWaterUnit(target);
  }

  IsAlreadyInContainer(): boolean {
    return getActorComponent(this.gameObject, ContainableComponent)?.isContained() ?? false;
  }

  /** True if self is adjacent to the target container and the container still has capacity. */
  CanBoardContainerNow(): boolean {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return false;

    const containerComp = getActorComponent(target, ContainerComponent);
    if (!containerComp || !containerComp.canLoadGameObject(this.gameObject)) return false;

    // Unit must be within boarding range (adjacent tile) of the container
    const dist = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, target);
    return dist !== null && dist <= 1;
  }

  /** Load self into the target container and cancel any pending boarding request. */
  BoardContainer(): State {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;

    const containerComp = getActorComponent(target, ContainerComponent);
    if (!containerComp) return State.FAILED;
    if (!containerComp.canLoadGameObject(this.gameObject)) return State.FAILED;

    containerComp.cancelBoardingRequest(this.gameObject);
    containerComp.loadGameObject(this.gameObject);
    getActorComponent(this.gameObject, ContainableComponent)?.setContainer(target);
    return State.SUCCEEDED;
  }

  /**
   * Try to walk directly adjacent to the container using land pathfinding.
   * Succeeds when the unit is (or gets) within boarding range of the ship.
   * Fast-fails for water containers (boats in deep water) so the MDSL selector
   * falls through immediately to MoveToNearestShoreForContainer.
   */
  async MoveAdjacentToContainer(): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;

    // Water units cannot be reached via land pathfinding — skip the walk attempt
    if (isWaterUnit(target)) return State.FAILED;

    // Already adjacent — skip movement entirely
    if (this.CanBoardContainerNow()) return State.SUCCEEDED;

    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return State.FAILED;

    try {
      const success = await movementSystem.moveToActorByAdjustingPathDynamically(target, {
        radiusTilesAroundDestination: 1
      } satisfies Partial<PathMoveConfig>);
      // Movement may return false when path is empty (unit already at destination tile).
      // Accept that case too if we're now within boarding range.
      return success || this.CanBoardContainerNow() ? State.SUCCEEDED : State.FAILED;
    } catch {
      return State.FAILED;
    }
  }

  /**
   * Fallback for when the container is not directly reachable (deep water).
   * Finds the meeting point (water-side shore tile + adjacent land tile), registers the boarding
   * request immediately so the boat starts heading to shore in parallel, then walks to the land tile.
   * Cancels the request if movement fails.
   */
  async MoveToNearestShoreForContainer(): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;

    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return State.FAILED;

    const navService = getSceneService(this.gameObject.scene, NavigationService);
    if (!navService) return State.FAILED;

    // Find the nearest shore tile (water-side) from the ship's current position
    const shipTile = navService.getCenterTileCoordUnderObject(target);
    if (!shipTile) return State.FAILED;

    const shoreTile = navService.findNearestShoreTile(shipTile);
    if (!shoreTile) return State.FAILED;

    // Shore tile is a water tile — the ground unit must walk to the adjacent land tile instead
    const groundMeetingPoint = navService.findGroundTileAdjacentToShoreTile(shoreTile);
    if (!groundMeetingPoint) return State.FAILED;

    const containerComp = getActorComponent(target, ContainerComponent);
    const containableComp = getActorComponent(this.gameObject, ContainableComponent);

    // Register boarding intent NOW so the boat starts navigating to shore in parallel
    // while this unit is still walking to the meeting point.
    // Pass the water-side shore tile so boat and unit converge on the same spot.
    if (containerComp) {
      containerComp.registerBoardingRequest(this.gameObject, shoreTile);
      if (containableComp) containableComp.pendingContainerBoardingRequest = target;
    }

    const shoreLocation: Vector3Simple = { x: groundMeetingPoint.x, y: groundMeetingPoint.y, z: 0 };
    const success = await movementSystem.moveToLocationByFollowingStaticPath(shoreLocation);

    if (!success && containerComp) {
      // Clean up if we couldn't reach the shore
      containerComp.cancelBoardingRequest(this.gameObject);
      if (containableComp) containableComp.pendingContainerBoardingRequest = null;
    }

    return success ? State.SUCCEEDED : State.FAILED;
  }

  HasContainerComponent(): boolean {
    return !!getActorComponent(this.gameObject, ContainerComponent);
  }

  HasPendingBoarders(): boolean {
    return getActorComponent(this.gameObject, ContainerComponent)?.hasPendingBoarders() ?? false;
  }

  /**
   * Navigate the container actor to the shore tile where the first pending boarder is waiting.
   * Uses the pre-agreed shore tile stored on the boarding request when available, so the boat
   * converges on the exact same tile the boarder already walked to.
   * Falls back to finding the nearest shore to the boarder's current position otherwise.
   */
  async MoveToShoreForBoarding(): Promise<State> {
    const containerComp = getActorComponent(this.gameObject, ContainerComponent);
    if (!containerComp) return State.FAILED;
    const boarders = containerComp.getPendingBoarders();
    if (boarders.length === 0) return State.FAILED;

    const navService = getSceneService(this.gameObject.scene, NavigationService);
    if (!navService) return State.FAILED;
    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return State.FAILED;

    const firstBoarder = boarders[0]!;
    // Prefer the shore tile the boarder pre-negotiated when it registered
    let shoreTile = containerComp.getTargetShoreForBoarder(firstBoarder);
    if (!shoreTile) {
      const boarderTile = navService.getCenterTileCoordUnderObject(firstBoarder);
      if (!boarderTile) return State.FAILED;
      shoreTile = navService.findNearestShoreTile(boarderTile) ?? undefined;
    }
    if (!shoreTile) return State.FAILED;

    const shoreLocation: Vector3Simple = { x: shoreTile.x, y: shoreTile.y, z: 0 };
    const success = await movementSystem.moveToLocationByFollowingStaticPath(shoreLocation);
    return success ? State.SUCCEEDED : State.FAILED;
  }

  /**
   * When self (container actor) is on a shore tile, load all pending boarders that are
   * adjacent (within boarding range) of the container.
   */
  LoadPendingBoarders(): State {
    const containerComp = getActorComponent(this.gameObject, ContainerComponent);
    if (!containerComp) return State.FAILED;

    const navService = getSceneService(this.gameObject.scene, NavigationService);
    if (!navService) return State.FAILED;

    const selfTile = navService.getCenterTileCoordUnderObject(this.gameObject);
    if (!selfTile || !navService.isShoreTile(selfTile)) return State.FAILED;

    const boarders = containerComp.getPendingBoarders();
    let loaded = 0;
    for (const boarder of boarders) {
      if (!containerComp.canLoadGameObject(boarder)) continue;
      // Boarder must be within boarding range of the container (adjacent tile)
      const dist = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, boarder);
      if (dist === null || dist > 2) continue;
      containerComp.cancelBoardingRequest(boarder);
      containerComp.loadGameObject(boarder);
      getActorComponent(boarder, ContainableComponent)?.setContainer(this.gameObject);
      loaded++;
    }

    return loaded > 0 ? State.SUCCEEDED : State.FAILED;
  }

  // ========== Spell Casting AI ==========

  HasSpellComponent(): boolean {
    return !!getActorComponent(this.gameObject, SpellComponent);
  }

  HasAutocastSpellReady(): boolean {
    const spellComponent = getActorComponent(this.gameObject, SpellComponent);
    if (!spellComponent) return false;

    const spellCastingSystem = getActorSystem(this.gameObject, SpellCastingSystem);
    if (!spellCastingSystem) return false;

    for (const spellType of spellComponent.availableSpells) {
      if (!spellComponent.isAutocastEnabled(spellType)) continue;
      if (!spellComponent.isSpellResearched(spellType)) continue;
      if (!spellComponent.canCastSpell(spellType)) continue;

      // Check if we have a valid target for this spell
      const spellData = spellDefinitions[spellType];
      if (!spellData) continue;

      if (this.hasValidAutocastTarget(spellData.targetType)) {
        return true;
      }
    }

    return false;
  }

  private hasValidAutocastTarget(targetType: SpellTargetType): boolean {
    const visionComponent = getActorComponent(this.gameObject, VisionComponent);
    if (!visionComponent) return false;

    switch (targetType) {
      case SpellTargetType.Ground:
      case SpellTargetType.EnemyUnit:
        // For offensive spells, need visible enemy
        return visionComponent.getVisibleEnemies().length > 0;
      case SpellTargetType.FriendlyUnit:
      case SpellTargetType.Self:
        // For healing spells, need visible damaged friendly
        const visibleFriendlies = visionComponent.getVisibleFriendlies();
        return visibleFriendlies.some((friendly) => {
          const healthComponent = getActorComponent(friendly, HealthComponent);
          return healthComponent && !healthComponent.healthIsFull && healthComponent.alive;
        });
      default:
        return false;
    }
  }

  CastAutocastSpell(): State {
    const spellComponent = getActorComponent(this.gameObject, SpellComponent);
    if (!spellComponent) return State.FAILED;

    const spellCastingSystem = getActorSystem(this.gameObject, SpellCastingSystem);
    if (!spellCastingSystem) return State.FAILED;

    const visionComponent = getActorComponent(this.gameObject, VisionComponent);
    if (!visionComponent) return State.FAILED;

    for (const spellType of spellComponent.availableSpells) {
      if (!spellComponent.isAutocastEnabled(spellType)) continue;
      if (!spellComponent.isSpellResearched(spellType)) continue;
      if (!spellComponent.canCastSpell(spellType)) continue;

      const spellData = spellDefinitions[spellType];
      if (!spellData) continue;

      // Find target position based on spell target type
      let targetPosition: Vector3Simple | null = null;

      switch (spellData.targetType) {
        case SpellTargetType.EnemyUnit:
        case SpellTargetType.Ground:
          // For offensive spells, target closest enemy position
          const enemy = visionComponent.getClosestVisibleEnemy();
          if (enemy) {
            const representableComponentEnemy = getActorComponent(enemy, RepresentableComponent);
            if (enemy && representableComponentEnemy) {
              targetPosition = representableComponentEnemy.logicalWorldTransform;
            }
          }
          break;
        case SpellTargetType.FriendlyUnit:
          // Find damaged friendly
          const friendlies = visionComponent.getVisibleFriendlies();
          for (const friendly of friendlies) {
            const healthComponent = getActorComponent(friendly, HealthComponent);
            const representableComponentFriendly = getActorComponent(friendly, RepresentableComponent);
            if (
              healthComponent &&
              !healthComponent.healthIsFull &&
              healthComponent.alive &&
              representableComponentFriendly
            ) {
              targetPosition = representableComponentFriendly.logicalWorldTransform;
              break;
            }
          }
          break;
        case SpellTargetType.Self:
          const representableComponentSelf = getActorComponent(this.gameObject, RepresentableComponent);
          if (representableComponentSelf) {
            targetPosition = representableComponentSelf.logicalWorldTransform;
          }
          break;
      }

      if (!targetPosition) continue;

      // Cast the spell
      const success = spellCastingSystem.castSpell(spellType, targetPosition);
      if (success) {
        return State.SUCCEEDED;
      }
    }

    return State.FAILED;
  }
}
