import Phaser from "phaser";
import { BehaviourTree } from "mistreevous";
import { RootNodeDefinition } from "mistreevous/dist/BehaviourTreeDefinition";
import { Agent } from "mistreevous/dist/Agent";
import { getActorComponent } from "../../../data/actor-component";
import { VisionComponent } from "../../../entity/actor/components/vision-component";
import { PawnAiBlackboard } from "../../../entity/character/ai/pawn-ai-blackboard";
import { AttackComponent } from "../../../entity/combat/components/attack-component";
import { GameplayLibrary } from "../../../library/gameplay-library";
import { getActorSystem } from "../../../data/actor-system";
import { MovementSystem } from "../../../entity/systems/movement.system";
import { OrderType } from "../../../entity/character/ai/order-type";

export class TempPawnAiController {
  private behaviourTree: BehaviourTree;

  private blackboard: PawnAiBlackboard = new PawnAiBlackboard();

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    this.behaviourTree = this.createBehaviourTree();
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.onDestroy, this);
  }

  createBehaviourTree() {
    const definition: RootNodeDefinition = {
      type: "root",
      child: {
        type: "sequence",
        children: [
          {
            type: "selector",
            children: [
              {
                type: "sequence",
                children: [
                  {
                    type: "condition",
                    call: "isEnemyVisible" satisfies BehaviorTreeMethods
                  },
                  {
                    type: "selector",
                    // if in range, attack
                    // if not in range, move to enemy
                    children: [
                      {
                        type: "sequence",
                        children: [
                          {
                            type: "condition",
                            call: "isInRange" satisfies BehaviorTreeMethods,
                            args: [getActorComponent(this.gameObject, AttackComponent)?.getMaximumRange()]
                          },
                          {
                            type: "action",
                            call: "attackEnemy" satisfies BehaviorTreeMethods
                          }
                        ]
                      },
                      {
                        type: "sequence",
                        children: [
                          {
                            type: "condition",
                            call: "canMoveToEnemy" satisfies BehaviorTreeMethods
                          },
                          {
                            type: "action",
                            call: "moveToEnemy" satisfies BehaviorTreeMethods
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                type: "action",
                call: "walkRandomly" satisfies BehaviorTreeMethods
              }
            ]
          }
        ]
      }
    };
    return new BehaviourTree(definition, this as any as Agent);
  }

  // Define action methods
  isEnemyVisible(): boolean {
    const target = this.blackboard.targetGameObject;
    if (!target) return false;
    const visionComponent = getActorComponent(this.gameObject, VisionComponent);
    if (!visionComponent) return false;
    return visionComponent.isActorVisible(target) ?? false;
  }

  isInRange(range?: number): boolean {
    if (!range) return false;
    const target = this.blackboard.targetGameObject;
    if (!target) return false;
    const distance = GameplayLibrary.getDistanceBetweenActors(this.gameObject, target);
    if (distance === null) return false;
    return distance <= range;
  }

  async canMoveToEnemy(): Promise<boolean> {
    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return Promise.resolve(false);
    // noinspection UnnecessaryLocalVariableJS
    const canMove = await movementSystem.canMoveTo(this.blackboard.targetGameObject);
    return canMove;
  }

  moveToEnemy(): void {
    this.blackboard.orderType = OrderType.Move;
  }

  attackEnemy(): void {
    // Implement logic to attack the enemy
    console.log("Attacking enemy");
  }

  walkRandomly(): void {
    // Implement logic to make the maceman walk randomly within a specified radius
    console.log("Walking randomly");
  }

  private update(time: number, dt: number) {
    this.behaviourTree.step();
  }

  private onDestroy() {
    this.gameObject.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }
}

type BehaviorTreeMethods = keyof TempPawnAiController;
