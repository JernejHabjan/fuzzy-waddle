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
import { NavigationService } from "../../world/services/navigation.service";
import { getSceneService } from "../../world/services/scene-component-helpers";

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
        const nrTiles = await movementSystem.getPathToClosestWalkableTileBetweenGameObjectsInRadius(
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
      // exit container
      const containableComponent = getActorComponent(this.gameObject, ContainableComponent);
      if (containableComponent) {
        containableComponent.leaveContainer();
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
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (!healthComponent) return false;

    const latestDamage = healthComponent.latestDamage;
    if (!latestDamage) return false;

    // Use scene time for proper timeScale support
    const scene = this.gameObject.scene;
    const currentSceneTime = scene.time.now;
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

    attackableEnemies.sort((a, b) => {
      const distanceA = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, a);
      const distanceB = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, b);
      if (distanceA === null || distanceB === null) return 0;
      return distanceA - distanceB;
    });

    return attackableEnemies[0]!;
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

  IsAlreadyInContainer(): boolean {
    return getActorComponent(this.gameObject, ContainableComponent)?.isContained() ?? false;
  }

  /** True if self and target container are both on shore and container still has capacity. */
  CanBoardContainerNow(): boolean {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return false;

    const containerComp = getActorComponent(target, ContainerComponent);
    if (!containerComp || !containerComp.canLoadGameObject(this.gameObject)) return false;

    const navService = getSceneService(this.gameObject.scene, NavigationService);
    if (!navService) return false;

    const selfTile = navService.getCenterTileCoordUnderObject(this.gameObject);
    const targetTile = navService.getCenterTileCoordUnderObject(target);
    if (!selfTile || !targetTile) return false;

    return navService.isShoreTile(selfTile) && navService.isShoreTile(targetTile);
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
   * If the target container can be reached on foot, move next to it.
   * If it is in water (unreachable), find the nearest shore tile near the container,
   * move there, and register a boarding request so the container actor picks us up.
   */
  async MoveToContainerOrShore(): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;

    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return State.FAILED;

    // First, try moving directly to the container (it may be on shore already)
    const reachable = await movementSystem.canMoveTo(target, 1);
    if (reachable) {
      const success = await movementSystem.moveToActorByAdjustingPathDynamically(target, {
        radiusTilesAroundDestination: 1
      } satisfies Partial<PathMoveConfig>);
      return success ? State.SUCCEEDED : State.FAILED;
    }

    // Container is in water — find the nearest shore tile to the container
    const navService = getSceneService(this.gameObject.scene, NavigationService);
    if (!navService) return State.FAILED;

    const containerTile = navService.getCenterTileCoordUnderObject(target);
    if (!containerTile) return State.FAILED;

    const shoreTile = navService.findNearestShoreTile(containerTile);
    if (!shoreTile) return State.FAILED;

    // Move self to that shore tile
    const shoreLocation: Vector3Simple = { x: shoreTile.x, y: shoreTile.y, z: 0 };
    const success = await movementSystem.moveToLocationByFollowingStaticPath(shoreLocation);

    if (success) {
      // Register boarding intent so the container actor will come pick us up
      const containerComp = getActorComponent(target, ContainerComponent);
      containerComp?.registerBoardingRequest(this.gameObject);
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
   * Navigate the container actor to the nearest shore tile adjacent to the first pending boarder.
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

    const boarderTile = navService.getCenterTileCoordUnderObject(boarders[0]!);
    if (!boarderTile) return State.FAILED;

    const shoreTile = navService.findNearestShoreTile(boarderTile);
    if (!shoreTile) return State.FAILED;

    const shoreLocation: Vector3Simple = { x: shoreTile.x, y: shoreTile.y, z: 0 };
    const success = await movementSystem.moveToLocationByFollowingStaticPath(shoreLocation);
    return success ? State.SUCCEEDED : State.FAILED;
  }

  /**
   * When self (container actor) is on a shore tile, load all pending boarders that are also on shore.
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
      const boarderTile = navService.getCenterTileCoordUnderObject(boarder);
      if (!boarderTile || !navService.isShoreTile(boarderTile)) continue;
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
