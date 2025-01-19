// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import ActorInfoLabel from "./ActorInfoLabel";
/* START-USER-IMPORTS */
import HudProbableWaffle from "../../../scenes/HudProbableWaffle";
import { Subscription } from "rxjs";
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getSelectedActors, listenToSelectionEvents } from "../../../data/scene-data";
import { getActorComponent } from "../../../data/actor-component";
import { InfoComponent } from "../../../entity/actor/components/info-component";
/* END-USER-IMPORTS */

export default class ActorInfoContainer extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 214.40086535603183, y ?? 81.33939079440076);

    // actor_info_bg
    const actor_info_bg = scene.add.nineslice(
      -214.40086535603183,
      -81.33939079440076,
      "gui",
      "cryos_mini_gui/surfaces/surface_parchment.png",
      32,
      16,
      3,
      3,
      3,
      3
    );
    actor_info_bg.scaleX = 6.711135518221706;
    actor_info_bg.scaleY = 5.076854073573915;
    actor_info_bg.setOrigin(0, 0);
    this.add(actor_info_bg);

    // actorInfoLabel
    const actorInfoLabel = new ActorInfoLabel(scene, -196, -62);
    actorInfoLabel.scaleX = 0.5;
    actorInfoLabel.scaleY = 0.5;
    this.add(actorInfoLabel);
    actorInfoLabel.text_1.text = "test123";

    this.actorInfoLabel = actorInfoLabel;

    /* START-USER-CTR-CODE */
    this.mainSceneWithActors = (scene as HudProbableWaffle).parentScene!;
    this.subscribeToPlayerSelection();
    this.hideAllLabels();
    /* END-USER-CTR-CODE */
  }

  private actorInfoLabel: ActorInfoLabel;

  /* START-USER-CODE */

  private selectionChangedSubscription?: Subscription;
  private mainSceneWithActors: ProbableWaffleScene;
  private subscribeToPlayerSelection() {
    this.selectionChangedSubscription = listenToSelectionEvents(this.scene)?.subscribe(() => {
      const selectedActors = getSelectedActors(this.mainSceneWithActors);
      if (selectedActors.length === 0) {
        this.hideAllLabels();
        return;
      } else {
        const infoComponent = getActorComponent(selectedActors[0], InfoComponent);
        this.actorInfoLabel.text_1.text = infoComponent?.infoDefinition.name ?? "";
        this.actorInfoLabel.visible = true;
      }
    });
  }

  private hideAllLabels() {
    this.actorInfoLabel.visible = false;
  }

  destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.selectionChangedSubscription?.unsubscribe();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
