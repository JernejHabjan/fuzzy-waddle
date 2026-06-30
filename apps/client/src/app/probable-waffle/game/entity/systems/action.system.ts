import { isGameObjectActiveInActiveScene, onObjectReady } from "../../data/game-object-helper";
import { Subscription } from "rxjs";
import { getActorComponent } from "../../data/actor-component";
import { HealthComponent } from "../components/combat/components/health-component";
import { PawnAiController } from "../../prefabs/ai-agents/pawn-ai-controller";
import { IdComponent } from "../components/id-component";
import { AttackComponent } from "../components/combat/components/attack-component";
import { OrderData } from "../../ai/OrderData";
import { OrderType } from "../../ai/order-type";
import { GathererComponent } from "../components/resource/gatherer-component";
import { ResourceDrainComponent } from "../components/resource/resource-drain-component";
import { OwnerComponent } from "../components/owner-component";
import { ConstructionSiteComponent } from "../components/construction/construction-site-component";
import { BuilderComponent } from "../components/construction/builder-component";
import { ActorTranslateComponent } from "../components/movement/actor-translate-component";
import { HealingComponent } from "../components/combat/components/healing-component";
import { ContainerComponent } from "../components/building/container-component";
import { ResourceSourceComponent } from "../components/resource/resource-source-component";
import { environment } from "../../../../../environments/environment";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { DebuggingService } from "../../world/services/DebuggingService";
import { ContainableComponent } from "../components/building/containable-component";
import { AudioActorComponent } from "../components/actor-audio/audio-actor-component";
import { NavigableComponent } from "../components/movement/navigable-component";
import { FlyingComponent } from "../components/movement/flying-component";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import type { ActorActionCommand } from "../../data/commands/game-command";

export class ActionSystem {
  private commandBusSubscription?: Subscription;
  private aiDebuggingSubscription?: Subscription;
  private displayDebugInfo: boolean = false;
  private audioActorComponent?: AudioActorComponent;

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    this.listenToCommandBusEvents();
    onObjectReady(gameObject, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
  }

  private init() {
    if (!environment.production) {
      const aiDebuggingService = getSceneService(this.gameObject.scene, DebuggingService)!;
      this.aiDebuggingSubscription = aiDebuggingService.debugChanged.subscribe((debug) => {
        this.displayDebugInfo = debug;
      });
      this.audioActorComponent = getActorComponent(this.gameObject, AudioActorComponent);
    }
  }
  private listenToCommandBusEvents() {
    const commandBus = getSceneService(this.gameObject.scene, CommandBusService);
    if (!commandBus) {
      console.error("ActionSystem: CommandBusService not found — commands will not be received");
      return;
    }

    const myId = getActorComponent(this.gameObject, IdComponent)?.id;

    this.commandBusSubscription = commandBus.command$.subscribe((cmd) => {
      if (!isGameObjectActiveInActiveScene(this.gameObject)) return;

      // Resolve actor ID lazily in case it was not available at construction time
      const actorId = myId ?? getActorComponent(this.gameObject, IdComponent)?.id;
      if (!actorId) return;
      if (!cmd.actorIds.includes(actorId)) return;

      if (cmd.type === "ACTOR_ACTION") {
        this.handleActorActionCommand(cmd);
      } else if (cmd.type === "STOP") {
        this.handleStopCommand();
      }
    });
  }

  private handleActorActionCommand(cmd: ActorActionCommand) {
    let targetGameObject: Phaser.GameObjects.GameObject | undefined;

    if (cmd.targetObjectIds) {
      const clickedGameObjects = this.gameObject.scene.children.list.filter((go) =>
        cmd.targetObjectIds!.includes(getActorComponent(go, IdComponent)?.id ?? "")
      );
      if (clickedGameObjects.length > 0) {
        targetGameObject = clickedGameObjects[0];
      }
    }

    this.executeAction(cmd.orderType, targetGameObject, cmd.tileVec3, cmd.queue);
  }

  public executeAction(
    orderType?: OrderType,
    targetGameObject?: Phaser.GameObjects.GameObject,
    tileVec3?: ActorActionCommand["tileVec3"],
    queue: boolean = false
  ): boolean {
    const payerPawnAiController = getActorComponent(this.gameObject, PawnAiController);
    if (!payerPawnAiController) return false;

    let action: OrderData | null = null;

    if (orderType) {
      action = new OrderData(orderType, {
        targetGameObject,
        targetTileLocation: tileVec3
      });
    } else if (targetGameObject) {
      action = this.findAction(targetGameObject);
    } else if (tileVec3) {
      action = new OrderData(OrderType.Move, {
        targetTileLocation: tileVec3
      });
    }

    if (!action) return false;

    if (this.displayDebugInfo && !environment.production) {
      console.log("ActionSystem: action", action);
    }

    if (queue) {
      payerPawnAiController.blackboard.addOrder(action);
    } else {
      payerPawnAiController.blackboard.overrideOrderQueueAndActiveOrder(action);
    }
    this.playOrderSound(action);
    return true;
  }

  private handleStopCommand() {
    const payerPawnAiController = getActorComponent(this.gameObject, PawnAiController);
    payerPawnAiController?.blackboard.resetCurrentOrder();
  }

  private findAction(targetGameObject: Phaser.GameObjects.GameObject): OrderData | null {
    const targetOwnerComponent = getActorComponent(targetGameObject, OwnerComponent);
    if (targetOwnerComponent) {
      // player object

      const targetPlayerNumber = targetOwnerComponent.getOwner();
      const selfOwnerComponent = getActorComponent(this.gameObject, OwnerComponent);
      if (!selfOwnerComponent) throw new Error("OwnerComponent not found when trying to find action");
      const selfPlayerNumber = selfOwnerComponent.getOwner();
      if (selfPlayerNumber === targetPlayerNumber) {
        // ally

        const targetIsNavigable = getActorComponent(targetGameObject, NavigableComponent);
        const selfHasFlying = getActorComponent(this.gameObject, FlyingComponent);
        if (targetIsNavigable && !selfHasFlying) {
          // target is navigable and self is not flying
          return new OrderData(OrderType.Move, { targetGameObject });
        }

        const targetIsBuilding = getActorComponent(targetGameObject, ConstructionSiteComponent);
        if (targetIsBuilding) {
          // target is building

          if (!targetIsBuilding.isFinished) {
            // Building is not finished

            const selfBuilderComponent = getActorComponent(this.gameObject, BuilderComponent);
            if (selfBuilderComponent) {
              // self is builder

              return new OrderData(OrderType.Build, { targetGameObject });
            }
          } else {
            // building is finished

            const targetHealthComponent = getActorComponent(targetGameObject, HealthComponent);
            if (targetHealthComponent) {
              if (targetHealthComponent.isDamaged) {
                // building is damaged

                const selfBuilderComponent = getActorComponent(this.gameObject, BuilderComponent);
                if (selfBuilderComponent) {
                  return new OrderData(OrderType.Repair, { targetGameObject });
                }
              }
            }
          }
        } else {
          // target is not building

          const targetHealthComponent = getActorComponent(targetGameObject, HealthComponent);
          if (targetHealthComponent) {
            if (targetHealthComponent.isDamaged) {
              // target is damaged

              const selfBuilderComponent = getActorComponent(this.gameObject, HealingComponent);
              if (selfBuilderComponent) {
                return new OrderData(OrderType.Heal, { targetGameObject });
              }
            }
          }
        }

        const targetIsResourceDrain = getActorComponent(targetGameObject, ResourceDrainComponent);
        if (targetIsResourceDrain) {
          // target is resource drain

          const selfGathererComponent = getActorComponent(this.gameObject, GathererComponent);
          if (selfGathererComponent) {
            // self is gatherer

            return new OrderData(OrderType.ReturnResources, { targetGameObject });
          }
        }

        const targetIsContainer = getActorComponent(targetGameObject, ContainerComponent);
        if (targetIsContainer) {
          // target is container

          const selfContainableComponent = getActorComponent(this.gameObject, ContainableComponent);
          if (selfContainableComponent) {
            // self is containable — issue boarding order
            return new OrderData(OrderType.EnterContainer, { targetGameObject });
          }
        }

        // Player-owned resource sources (e.g. Field) — gatherer can harvest them
        const targetResourceSourceComponent = getActorComponent(targetGameObject, ResourceSourceComponent);
        if (targetResourceSourceComponent) {
          const selfGathererComponent = getActorComponent(this.gameObject, GathererComponent);
          if (selfGathererComponent) {
            return new OrderData(OrderType.Gather, { targetGameObject });
          }
        }
      } else {
        // enemy

        const selfAttackComponent = getActorComponent(this.gameObject, AttackComponent);
        if (selfAttackComponent) {
          // self is attacker

          return new OrderData(OrderType.Attack, { targetGameObject });
        }
      }
    } else {
      // non-player object like resources

      const targetResourceSource = getActorComponent(targetGameObject, ResourceSourceComponent);
      if (targetResourceSource) {
        // target is resource source

        const selfGathererComponent = getActorComponent(this.gameObject, GathererComponent);
        if (selfGathererComponent) {
          // self is gatherer

          return new OrderData(OrderType.Gather, { targetGameObject });
        }
      }
    }

    const selfHasMovementComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    if (selfHasMovementComponent) {
      // self can move

      return new OrderData(OrderType.Move, { targetGameObject });
    }

    return null;
  }

  private destroy() {
    this.commandBusSubscription?.unsubscribe();
    this.aiDebuggingSubscription?.unsubscribe();
  }

  private playOrderSound(action: OrderData) {
    if (!this.audioActorComponent) return;
    this.audioActorComponent.playOrderSound(action);
  }
}
