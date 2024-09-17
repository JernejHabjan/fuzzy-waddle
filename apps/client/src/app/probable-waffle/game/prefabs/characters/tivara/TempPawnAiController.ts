import Phaser from "phaser";
import { BehaviourTree } from "mistreevous";
import { RootNodeDefinition } from "mistreevous/dist/BehaviourTreeDefinition";
import { Agent } from "mistreevous/dist/Agent";

export class TempPawnAiController {
  private behaviourTree: BehaviourTree;

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
                            call: "isInRange" satisfies BehaviorTreeMethods
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
    // Implement logic to check if the enemy is visible
    return true; // Replace with actual logic
  }

  isInRange(): boolean {
    // Implement logic to check if the enemy is within attack range
    return true; // Replace with actual logic
  }

  canMoveToEnemy(): boolean {
    // Implement logic to check if the maceman can move to the enemy
    return true; // Replace with actual logic
  }

  moveToEnemy(): void {
    // Implement logic to move the maceman towards the enemy
    console.log("Moving to enemy");
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
