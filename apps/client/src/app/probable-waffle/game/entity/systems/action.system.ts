import { onObjectReady } from "../../data/game-object-helper";
import { Subscription } from "rxjs";
import { getCommunicator, getCurrentPlayerNumber } from "../../data/scene-data";
import { SelectableComponent } from "../actor/components/selectable-component";
import { getActorComponent } from "../../data/actor-component";
import { HealthComponent } from "../combat/components/health-component";
import { PawnAiController } from "../../world/managers/controllers/player-pawn-ai-controller/pawn-ai-controller";
import { IdComponent } from "../actor/components/id-component";
import { AttackComponent } from "../combat/components/attack-component";
import { OrderData } from "../character/ai/OrderData";
import { OrderType } from "../character/ai/order-type";
import { GathererComponent } from "../actor/components/gatherer-component";
import { ResourceDrainComponent } from "../economy/resource/resource-drain-component";
import { OwnerComponent } from "../actor/components/owner-component";
import { ConstructionSiteComponent } from "../building/construction/construction-site-component";
import { BuilderComponent } from "../actor/components/builder-component";
import { ActorTranslateComponent } from "../actor/components/actor-translate-component";
import { HealingComponent } from "../combat/components/healing-component";
import { ContainerComponent } from "../building/container-component";
import { ResourceSourceComponent } from "../economy/resource/resource-source-component";
import { environment } from "../../../../../environments/environment";
import { getSceneService } from "../../scenes/components/scene-component-helpers";
import { DebuggingService } from "../../scenes/services/DebuggingService";
import { ContainableComponent } from "../actor/components/containable-component";
import { AudioActorComponent } from "../actor/components/audio-actor-component";
import { WalkableComponent } from "../actor/components/walkable-component";
import { FlightComponent } from "../actor/components/flight-component";

export class ActionSystem {
  private playerChangedSubscription?: Subscription;
  private aiDebuggingSubscription?: Subscription;
  private displayDebugInfo: boolean = false;
  private audioActorComponent?: AudioActorComponent;
  private shiftKey: Phaser.Input.Keyboard.Key | undefined;

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    this.listenToActorActionEvents();
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
    this.subscribeToShiftKey();
  }
  private subscribeToShiftKey() {
    this.shiftKey = this.gameObject.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
  }
  private listenToActorActionEvents() {
    this.playerChangedSubscription = getCommunicator(this.gameObject.scene)
      .playerChanged?.onWithFilter((p) => p.property === "command.issued.actor") // todo it's actually blackboard that should replicate
      .subscribe((payload) => {
        const canIssueCommand = this.canIssueCommand();
        if (!canIssueCommand) return;

        const isSelected = getActorComponent(this.gameObject, SelectableComponent)?.getSelected();
        if (!isSelected) return;
        const payerPawnAiController = getActorComponent(this.gameObject, PawnAiController);
        if (!payerPawnAiController) return;

        const objectIds = payload.data.data!["objectIds"] as string[];
        const clickedGameObjects = this.gameObject.scene.children.list.filter((go) =>
          objectIds.includes(getActorComponent(go, IdComponent)?.id ?? "")
        );

        if (clickedGameObjects.length === 0) return;
        const clickedGameObject = clickedGameObjects[0];
        const action = this.findAction(clickedGameObject);
        if (!action) return;

        if (this.displayDebugInfo && !environment.production) console.log("ActionSystem: action", action);
        if (this.shiftKey?.isDown) {
          payerPawnAiController.blackboard.addOrder(action);
        } else {
          payerPawnAiController.blackboard.overrideOrderQueueAndActiveOrder(action);
        }
        this.playOrderSound(action);
      });
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

        const targetIsWalkable = getActorComponent(targetGameObject, WalkableComponent);
        const selfHasFlying = getActorComponent(this.gameObject, FlightComponent);
        if (targetIsWalkable && !selfHasFlying) {
          // target is walkable and self is not flying
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
            // self is containable

            console.warn("todo - this is not yet supported in player-pawn-ai-controller"); // todo
            return new OrderData(OrderType.EnterContainer, { targetGameObject });
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

  private canIssueCommand() {
    const currentPlayerNr = getCurrentPlayerNumber(this.gameObject.scene);
    const actorPlayerNr = getActorComponent(this.gameObject, OwnerComponent)?.getOwner();
    return actorPlayerNr === currentPlayerNr;
  }

  private playOrderSound(action: OrderData) {
    if (!this.audioActorComponent) return;
    this.audioActorComponent.playOrderSound(action);
  }

  private destroy() {
    this.playerChangedSubscription?.unsubscribe();
    this.aiDebuggingSubscription?.unsubscribe();
    this.shiftKey?.destroy();
  }
}
