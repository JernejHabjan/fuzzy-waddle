import { PlayerPawnAiControllerMdsl } from "./player-pawn-ai-controller.mdsl";
import { BehaviourTree, type BehaviourTreeOptions } from "mistreevous";
import Phaser from "phaser";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { PlayerPawnAiControllerAgent } from "./player-pawn-ai-controller.agent";
import { NodeDebugger } from "./node-debugger";
import { OrderType } from "../../ai/order-type";
import { environment } from "../../../../../environments/environment";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { DebuggingService } from "../../world/services/DebuggingService";
import { Subscription } from "rxjs";
import { type BackboardComponentData } from "@fuzzy-waddle/api-interfaces";
import type { PawnAiDefinition } from "./pawn-ai-definition";
import { AiType } from "./ai-type";
import { getActorComponent } from "../../data/actor-component";
import { isGameObjectActiveInActiveScene } from "../../data/game-object-helper";
import { SimulationTickService } from "../../world/services/simulation-tick.service";

export class PawnAiController {
  readonly blackboard: PawnAiBlackboard = new PawnAiBlackboard();
  private readonly agent: PlayerPawnAiControllerAgent;
  private readonly behaviourTree: BehaviourTree;
  private elapsedTime: number = 0;
  private nodeDebugger?: NodeDebugger;
  private aiDebuggingSubscription?: Subscription;
  private tickSubscription?: Subscription;
  private defaultStepInterval: number = 100;
  private static readonly AI_ENABLED = true;

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
          (this.agent as PlayerPawnAiControllerAgent).Stop("Character AI Cancellation");
          this.behaviourTree.reset();
        };
        break;
      default:
        this.agent = new PlayerPawnAiControllerAgent(this.gameObject, this.blackboard);
        this.behaviourTree = new BehaviourTree(PlayerPawnAiControllerMdsl, this.agent, options);
        this.blackboard.cancellationHandler = () => {
          (this.agent as PlayerPawnAiControllerAgent).Stop("Default AI Cancellation");
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

    const simulationTickService = getSceneService(this.gameObject.scene, SimulationTickService);
    if (simulationTickService) {
      this.tickSubscription = simulationTickService.tick$.subscribe(() => {
        this.updateOnSimulationTick();
      });
    } else {
      // Fallback for environments without SimulationTickService (e.g. isolated tests).
      // Runtime multiplayer must use simulation ticks for deterministic AI cadence.
      gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.updateFrameNonDeterministicFallback, this);
    }
    gameObject.once(HealthComponent.KilledEvent, this.onShutdown, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.onShutdown, this);
  }

  private updateFrameNonDeterministicFallback(_: number, delta: number) {
    if (!PawnAiController.AI_ENABLED) return;
    if (!isGameObjectActiveInActiveScene(this.gameObject)) return;
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (healthComponent && healthComponent.killed) return;
    this.elapsedTime += delta * this.gameObject.scene.time.timeScale;
    const stepInterval = this.pawnAiDefinition.stepInterval ?? this.defaultStepInterval;
    if (this.elapsedTime >= stepInterval) {
      this.stepBehaviourTree();
    }
  }

  private updateOnSimulationTick() {
    if (!PawnAiController.AI_ENABLED) return;
    if (!isGameObjectActiveInActiveScene(this.gameObject)) return;
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (healthComponent && healthComponent.killed) return;
    this.elapsedTime += SimulationTickService.TICK_INTERVAL_MS;
    const stepInterval = this.pawnAiDefinition.stepInterval ?? this.defaultStepInterval;
    if (this.elapsedTime >= stepInterval) {
      this.stepBehaviourTree();
    }
  }

  private stepBehaviourTree() {
    try {
      this.behaviourTree.step();
    } catch (e) {
      console.log(e, "Error stepping behaviour tree");
    }
    this.elapsedTime = 0;
    this.updateDebuggerText();
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
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.updateFrameNonDeterministicFallback, this);
    this.tickSubscription?.unsubscribe();
    this.aiDebuggingSubscription?.unsubscribe();
  }
}
