import { PlayerPawnAiControllerMdsl } from "./player-pawn-ai-controller.mdsl";
import { BehaviourTree, type BehaviourTreeOptions } from "mistreevous";
import Phaser from "phaser";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { PlayerPawnAiControllerAgent } from "./player-pawn-ai-controller.agent";
import { NodeDebugger } from "./node-debugger";
import { OrderType } from "../../../../ai/order-type";
import { environment } from "../../../../../../../environments/environment";
import { HealthComponent } from "../../../../entity/components/combat/components/health-component";
import { getSceneService } from "../../../components/scene-component-helpers";
import { DebuggingService } from "../../../services/DebuggingService";
import { Subscription } from "rxjs";
import { type BackboardComponentData } from "@fuzzy-waddle/api-interfaces";

export interface PawnAiDefinition {
  type: AiType;
  stepInterval?: number;
}

export class PawnAiController {
  readonly blackboard: PawnAiBlackboard = new PawnAiBlackboard(); // todo it's actually blackboard that should replicate
  private readonly agent: PlayerPawnAiControllerAgent;
  private readonly behaviourTree: BehaviourTree;
  private elapsedTime: number = 0;
  private nodeDebugger?: NodeDebugger;
  private aiDebuggingSubscription?: Subscription;
  private defaultStepInterval: number = 100;

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly pawnAiDefinition: PawnAiDefinition
  ) {
    const options = environment.production
      ? {}
      : ({
          //onNodeStateChange: (change: NodeStateChange) => console.log(change)
        } satisfies BehaviourTreeOptions);
    switch (pawnAiDefinition.type) {
      case AiType.Character:
        this.agent = new PlayerPawnAiControllerAgent(this.gameObject, this.blackboard);
        this.behaviourTree = new BehaviourTree(PlayerPawnAiControllerMdsl, this.agent, options);
        this.blackboard.cancellationHandler = () => {
          (this.agent as PlayerPawnAiControllerAgent).Stop();
          this.behaviourTree.reset();
        };
        break;
      default:
        this.agent = new PlayerPawnAiControllerAgent(this.gameObject, this.blackboard);
        this.behaviourTree = new BehaviourTree(PlayerPawnAiControllerMdsl, this.agent, options);
        this.blackboard.cancellationHandler = () => {
          (this.agent as PlayerPawnAiControllerAgent).Stop();
          this.behaviourTree.reset();
        };
        break;
    }

    if (!environment.production) {
      const aiDebuggingService = getSceneService(this.gameObject.scene, DebuggingService)!;
      this.aiDebuggingSubscription = aiDebuggingService.debugChanged.subscribe((debug) => {
        if (debug) {
          this.nodeDebugger = new NodeDebugger(this.gameObject);
        } else {
          this.nodeDebugger?.destroy();
          this.nodeDebugger = undefined;
        }
      });
    }

    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.once(HealthComponent.KilledEvent, this.onShutdown, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.onShutdown, this);
  }

  private update(_: number, dt: number) {
    this.elapsedTime += dt;
    if (this.elapsedTime >= (this.pawnAiDefinition.stepInterval ?? this.defaultStepInterval)) {
      try {
        this.behaviourTree.step();
      } catch (e) {
        console.log(e, "Error stepping behaviour tree");
      }
      this.elapsedTime = 0;
      this.updateDebuggerText();
    }
  }

  private updateDebuggerText() {
    if (!this.nodeDebugger) return;
    const playerOrderType = this.blackboard.getCurrentOrder()?.orderType;
    const playerOrderTypeName = playerOrderType !== undefined ? OrderType[playerOrderType] : null;
    const targetGameObject = this.blackboard.getCurrentOrder()?.data.targetGameObject;
    const targetGameObjectName = targetGameObject ? targetGameObject.name : null;
    const targetLocation = this.blackboard.getCurrentOrder()?.data?.targetTileLocation;
    const targetLocationXYZ = targetLocation ? `${targetLocation.x}, ${targetLocation.y}, ${targetLocation.z}` : null;

    let text = "";
    if (playerOrderTypeName) {
      text += `Player Order Type: ${playerOrderTypeName}\n`;
    }
    if (targetGameObjectName) {
      text += `Target Game Object: ${targetGameObjectName}\n`;
    }
    if (targetLocationXYZ) {
      text += `Target Location: ${targetLocationXYZ}\n`;
    }

    this.nodeDebugger.updateText(text);
  }

  public getData(): BackboardComponentData {
    return {
      blackboard: this.blackboard.getData()
    } satisfies BackboardComponentData;
  }

  public setData(data: Partial<BackboardComponentData>) {
    if (data.blackboard) {
      this.blackboard.setData(data.blackboard, this.gameObject.scene);
    }
  }

  private onShutdown() {
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.aiDebuggingSubscription?.unsubscribe();
  }
}

export enum AiType {
  Character = "Character"
}
