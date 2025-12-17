// You can write more code here

/* START OF COMPILED CODE */

import OnPointerUpScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
import EmitEventActionScript from "../../../../../shared/game/phaser/script-nodes-basic/EmitEventActionScript";
import OnPointerDownScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../../../../../shared/game/phaser/script-nodes/PushActionScript";
/* START-USER-IMPORTS */
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { GathererComponent } from "../../../entity/components/resource/gatherer-component";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";
import { emitEventSelection, getCurrentPlayerNumber } from "../../../data/scene-data";
import { IdComponent } from "../../../entity/components/id-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
/* END-USER-IMPORTS */

export default class IdleWorkersButton extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    this.setInteractive(
      new Phaser.Geom.Rectangle(4, 2, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );

    // game_action_bg
    const game_action_bg = scene.add.nineslice(
      21,
      15,
      "gui",
      "cryos_mini_gui/buttons/button_small.png",
      20,
      20,
      3,
      3,
      3,
      3
    );
    game_action_bg.scaleX = 2.0762647352357817;
    game_action_bg.scaleY = 1.5492262688240692;
    this.add(game_action_bg);

    // button_text
    const button_text = scene.add.text(21, 14, "", {});
    button_text.setOrigin(0.5, 0.5);
    button_text.text = "1";
    button_text.setStyle({ color: "#000000ff", fontFamily: "disposabledroid", fontSize: "22px", resolution: 10 });
    this.add(button_text);

    // button_text_1
    const button_text_1 = scene.add.text(30, 2, "", {});
    button_text_1.setOrigin(0.5, 0.5);
    button_text_1.text = "z";
    button_text_1.setStyle({
      color: "#000000ff",
      fontFamily: "disposabledroid",
      fontSize: "18px",
      stroke: "#ffffffff",
      "shadow.offsetX": 1,
      "shadow.offsetY": 1,
      "shadow.color": "#000000ff",
      resolution: 10
    });
    this.add(button_text_1);

    // button_text_2
    const button_text_2 = scene.add.text(37, -2, "", {});
    button_text_2.setOrigin(0.5, 0.5);
    button_text_2.text = "z";
    button_text_2.setStyle({
      color: "#000000ff",
      fontFamily: "disposabledroid",
      stroke: "#ffffffff",
      "shadow.offsetX": 1,
      "shadow.offsetY": 1,
      "shadow.color": "#000000ff",
      resolution: 10
    });
    this.add(button_text_2);

    // onPointerUpScript_menu_9
    const onPointerUpScript_menu_9 = new OnPointerUpScript(this);

    // emitActorAction
    const emitActorAction = new EmitEventActionScript(onPointerUpScript_menu_9);

    // onPointerDownScript
    const onPointerDownScript = new OnPointerDownScript(this);

    // action_click
    new PushActionScript(onPointerDownScript);

    // button_text_3
    const button_text_3 = scene.add.text(44, -5, "", {});
    button_text_3.setOrigin(0.5, 0.5);
    button_text_3.text = "z";
    button_text_3.setStyle({
      color: "#000000ff",
      fontFamily: "disposabledroid",
      fontSize: "14px",
      stroke: "#ffffffff",
      "shadow.offsetX": 1,
      "shadow.offsetY": 1,
      "shadow.color": "#000000ff",
      resolution: 10
    });
    this.add(button_text_3);

    // emitActorAction (prefab fields)
    emitActorAction.eventName = "action";

    this.button_text = button_text;

    /* START-USER-CTR-CODE */
    this.scene.events.on(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);

    this.on("action", () => {
      if (this.currentIdleWorkerCount === 0) {
        return;
      }
      this.selectFirstIdleWorker();
    });
    /* END-USER-CTR-CODE */
  }

  private button_text: Phaser.GameObjects.Text;

  /* START-USER-CODE */
  private mainSceneWithActors?: ProbableWaffleScene;
  private updateInterval?: Phaser.Time.TimerEvent;
  private currentIdleWorkerCount: number = 0;

  setup(probableWaffleScene: ProbableWaffleScene) {
    this.mainSceneWithActors = probableWaffleScene;

    // Update the button count periodically
    this.updateInterval = this.scene.time.addEvent({
      delay: 500, // Update every 500ms
      callback: this.updateIdleWorkerCount,
      callbackScope: this,
      loop: true
    });

    // Initial update
    this.updateIdleWorkerCount();
  }

  private getIdleWorkers(): Phaser.GameObjects.GameObject[] {
    if (!this.mainSceneWithActors) return [];

    const currentPlayerNumber = getCurrentPlayerNumber(this.mainSceneWithActors);
    if (currentPlayerNumber === undefined) return [];

    const actorIndexSystem = getSceneService(this.mainSceneWithActors, ActorIndexSystem);
    if (!actorIndexSystem) return [];

    // Get all actors owned by current player
    const ownedActors = actorIndexSystem.getOwnedActors(currentPlayerNumber);

    // Filter for workers with GathererComponent that are idle
    const idleWorkers = ownedActors.filter((actor) => {
      // Must have GathererComponent
      const gathererComponent = getActorComponent(actor, GathererComponent);
      if (!gathererComponent) return false;

      // Must have PawnAiController
      const aiController = getActorComponent(actor, PawnAiController);
      if (!aiController) return false;

      // Check if idle - no current order
      const currentOrder = aiController.blackboard.getCurrentOrder();
      return !currentOrder;
    });

    return idleWorkers;
  }

  private updateIdleWorkerCount() {
    const idleWorkers = this.getIdleWorkers();
    const count = idleWorkers.length;
    if (count === this.currentIdleWorkerCount) {
      return; // No change
    }
    this.currentIdleWorkerCount = count;

    this.button_text.setText(count.toString());

    // Enable/disable button based on count
    if (count > 0) {
      this.setAlpha(1);
    } else {
      this.setAlpha(0.5);
    }
  }

  private selectFirstIdleWorker() {
    if (!this.mainSceneWithActors) return;

    const idleWorkers = this.getIdleWorkers();
    if (idleWorkers.length === 0) return;

    // Select the first idle worker
    const firstWorker = idleWorkers[0]!;
    const idComponent = getActorComponent(firstWorker, IdComponent);
    if (!idComponent || !idComponent.id) return;

    emitEventSelection(this.mainSceneWithActors, "selection.set", [idComponent.id]);
  }

  override destroy() {
    super.destroy();
    this.removeAllListeners();
    if (this.updateInterval) {
      this.updateInterval.destroy();
    }
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
