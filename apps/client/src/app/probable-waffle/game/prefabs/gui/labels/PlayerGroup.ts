// You can write more code here

/* START OF COMPILED CODE */

import OnPointerDownScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../../../../../shared/game/phaser/script-nodes/PushActionScript";
import OnPointerUpScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
import EmitEventActionScript from "../../../../../shared/game/phaser/script-nodes-basic/EmitEventActionScript";
/* START-USER-IMPORTS */
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getSceneComponent } from "../../../world/components/scene-component-helpers";
import { SelectionGroupsComponent } from "../../../world/components/selection-groups.component";
import { getActorComponent } from "../../../data/actor-component";
import { InfoComponent } from "../../../entity/actor/components/info-component";
import { IconHelper } from "./IconHelper";
/* END-USER-IMPORTS */

export default class PlayerGroup extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    this.setInteractive(new Phaser.Geom.Rectangle(0, 0, 48, 32), Phaser.Geom.Rectangle.Contains);

    // bg
    const bg = scene.add.nineslice(0, 0, "gui", "cryos_mini_gui/surfaces/surface_dark.png", 48, 32, 4, 4, 4, 4);
    bg.setOrigin(0, 0);
    this.add(bg);

    // nr
    const nr = scene.add.text(9, 14, "", {});
    nr.setOrigin(0.5, 0.5);
    nr.text = "2";
    nr.setStyle({ fontFamily: "disposabledroid", fontSize: "22px", resolution: 10 });
    this.add(nr);

    // image
    const image = scene.add.image(31, 16, "factions", "character_icons/general/warrior.png");
    image.scaleX = 0.5;
    image.scaleY = 0.5;
    this.add(image);

    // onPointerDownScript
    const onPointerDownScript = new OnPointerDownScript(this);

    // actor_action_click
    new PushActionScript(onPointerDownScript);

    // onPointerUpScript_menu_9
    const onPointerUpScript_menu_9 = new OnPointerUpScript(this);

    // emitActorAction
    const emitActorAction = new EmitEventActionScript(onPointerUpScript_menu_9);

    // emitActorAction (prefab fields)
    emitActorAction.eventName = "actor-action";

    this.nr = nr;
    this.image = image;

    /* START-USER-CTR-CODE */
    this.on("actor-action", this.handleSelection, this);
    /* END-USER-CTR-CODE */
  }

  private nr: Phaser.GameObjects.Text;
  private image: Phaser.GameObjects.Image;

  /* START-USER-CODE */
  private probableWaffleScene?: ProbableWaffleScene;
  private key?: number;
  private underline?: Phaser.GameObjects.Graphics;
  init(probableWaffleScene: ProbableWaffleScene, key: number) {
    this.probableWaffleScene = probableWaffleScene;
    this.key = key;
    this.createUnderline();
  }

  private createUnderline() {
    if (!this.underline) {
      this.underline = this.scene.add.graphics();
      this.add(this.underline);
    }

    this.underline.clear();
    this.underline.lineStyle(2, 0xffffff); // White line with thickness 2
    this.underline.beginPath();
    this.underline.moveTo(0, 32); // Start at bottom-left
    this.underline.lineTo(48, 32); // Draw to bottom-right
    this.underline.closePath();
    this.underline.strokePath();

    this.underline.setVisible(false); // Initially hidden
  }
  private handleSelection() {
    if (!this.probableWaffleScene || !this.key) return;
    const selectionGroupsComponent = getSceneComponent(this.probableWaffleScene, SelectionGroupsComponent);
    if (!selectionGroupsComponent) return;
    selectionGroupsComponent.selectGroup(this.key);
  }

  select() {
    this.underline?.setVisible(true);
  }

  deselect() {
    this.underline?.setVisible(false);
  }

  setGroupActor(leadActor: Phaser.GameObjects.GameObject | null) {
    if (!leadActor) return;
    const actorInfo = getActorComponent(leadActor, InfoComponent);
    if (!actorInfo) return;
    const image = actorInfo.infoDefinition.smallImage;
    if (!image) return;
    IconHelper.setIcon(this.image, image.key, image.frame, image.origin, {
      maxHeight: 32,
      maxWidth: 32
    });
  }

  setCount(count: number) {
    this.nr.text = count.toString();
  }

  destroy(fromScene?: boolean) {
    this.off("actor-action", this.handleSelection, this);
    this.underline?.destroy();
    super.destroy(fromScene);
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
