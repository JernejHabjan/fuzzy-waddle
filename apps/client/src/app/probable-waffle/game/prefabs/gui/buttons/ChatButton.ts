// You can write more code here

/* START OF COMPILED CODE */

import OnPointerUpScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
import EmitEventActionScript from "../../../../../shared/game/phaser/script-nodes-basic/EmitEventActionScript";
import OnPointerDownScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../../../../../shared/game/phaser/script-nodes/PushActionScript";
/* START-USER-IMPORTS */
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
/* END-USER-IMPORTS */

export default class ChatButton extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    this.setInteractive(
      new Phaser.Geom.Rectangle(4, 2, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );

    // button_bg
    const button_bg = scene.add.nineslice(
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
    button_bg.scaleX = 2.0762647352357817;
    button_bg.scaleY = 1.5492262688240692;
    this.add(button_bg);

    // button_text
    const button_text = scene.add.text(21, 14, "", {});
    button_text.setOrigin(0.5, 0.5);
    button_text.text = "Chat";
    button_text.setStyle({ color: "#000000ff", fontFamily: "disposabledroid", fontSize: "16px", resolution: 10 });
    this.add(button_text);

    // unread_badge
    const unread_badge = scene.add.circle(38, 4, 6, 0xff0000);
    unread_badge.setStrokeStyle(1, 0xffffff);
    unread_badge.visible = false;
    this.add(unread_badge);

    // onPointerUpScript
    const onPointerUpScript = new OnPointerUpScript(this);

    // emitAction
    const emitAction = new EmitEventActionScript(onPointerUpScript);

    // onPointerDownScript
    const onPointerDownScript = new OnPointerDownScript(this);

    // action_click
    new PushActionScript(onPointerDownScript);

    // emitAction (prefab fields)
    emitAction.eventName = "action";

    this.unread_badge = unread_badge;

    /* START-USER-CTR-CODE */
    this.scene.events.on(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);

    this.on("action", () => {
      this.openChat();
    });
    /* END-USER-CTR-CODE */
  }

  private unread_badge: Phaser.GameObjects.Arc;

  /* START-USER-CODE */

  private openChat() {
    const probableWaffleScene = this.scene as ProbableWaffleScene;
    probableWaffleScene.communicator.utilityEvents.emit({ name: "chat" });
    this.hideUnreadBadge();
  }

  showUnreadBadge() {
    this.unread_badge.visible = true;
  }

  hideUnreadBadge() {
    this.unread_badge.visible = false;
  }

  override destroy() {
    super.destroy();
    this.removeAllListeners();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
