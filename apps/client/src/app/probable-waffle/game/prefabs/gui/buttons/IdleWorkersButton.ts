// You can write more code here

/* START OF COMPILED CODE */

import OnPointerUpScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
import EmitEventActionScript from "../../../../../shared/game/phaser/script-nodes-basic/EmitEventActionScript";
import OnPointerDownScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../../../../../shared/game/phaser/script-nodes/PushActionScript";
/* START-USER-IMPORTS */
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import HudProbableWaffle from "../../../world/scenes/hud-scenes/HudProbableWaffle";
import { getActorComponent } from "../../../data/actor-component";
import { GathererComponent } from "../../../entity/components/resource/gatherer-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";
import { getCurrentPlayerNumber } from "../../../data/scene-data";
import { IdComponent } from "../../../entity/components/id-component";
import { emitEventSelection } from "../../../data/scene-data";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
/* END-USER-IMPORTS */

export default class IdleWorkersButton extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    // button_container
    const button_container = scene.add.container(20, 15);
    button_container.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    this.add(button_container);

    // button_bg
    const button_bg = scene.add.nineslice(
      0,
      0,
      "gui",
      "cryos_mini_gui/buttons/button_small.png",
      20,
      20,
      3,
      3,
      3,
      3
    );
    button_bg.scaleX = 2.0762647352357817;
    button_bg.scaleY = 1.5492262688240692;
    button_container.add(button_bg);

    // button_text
    const button_text = scene.add.text(0, -1, "", {});
    button_text.setOrigin(0.5, 0.5);
    button_text.text = "0";
    button_text.setStyle({ color: "#000000ff", fontFamily: "disposabledroid", fontSize: "22px", resolution: 10 });
    button_container.add(button_text);

    // onPointerUpScript
    const onPointerUpScript = new OnPointerUpScript(button_container);

    // emitAction
    const emitAction = new EmitEventActionScript(onPointerUpScript);

    // onPointerDownScript
    const onPointerDownScript = new OnPointerDownScript(button_container);

    // action_click
    new PushActionScript(onPointerDownScript);

    // emitAction (prefab fields)
    emitAction.eventName = "action";

    this.button_container = button_container;
    this.button_bg = button_bg;
    this.button_text = button_text;

    /* START-USER-CTR-CODE */
    this.scene.events.on(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.init();
    /* END-USER-CTR-CODE */
  }

  private button_container: Phaser.GameObjects.Container;
  private button_bg: Phaser.GameObjects.NineSlice;
  private button_text: Phaser.GameObjects.Text;

  /* START-USER-CODE */
  private mainSceneWithActors?: ProbableWaffleScene;
  private updateInterval?: Phaser.Time.TimerEvent;

  private init() {
    this.mainSceneWithActors = (this.scene as HudProbableWaffle).probableWaffleScene!;
    
    // Listen for click events
    this.button_container.on("action", () => {
      this.selectFirstIdleWorker();
    });

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
    
    this.button_text.setText(count.toString());
    
    // Enable/disable button based on count
    if (count > 0) {
      this.button_container.setAlpha(1);
      this.button_container.setInteractive();
    } else {
      this.button_container.setAlpha(0.5);
      this.button_container.removeInteractive();
    }
  }

  private selectFirstIdleWorker() {
    if (!this.mainSceneWithActors) return;

    const idleWorkers = this.getIdleWorkers();
    if (idleWorkers.length === 0) return;

    // Select the first idle worker
    const firstWorker = idleWorkers[0];
    const idComponent = getActorComponent(firstWorker, IdComponent);
    if (!idComponent || !idComponent.id) return;

    emitEventSelection(this.mainSceneWithActors, "selection.set", [idComponent.id]);
  }

  override destroy() {
    super.destroy();
    this.button_container.removeAllListeners();
    if (this.updateInterval) {
      this.updateInterval.destroy();
    }
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
