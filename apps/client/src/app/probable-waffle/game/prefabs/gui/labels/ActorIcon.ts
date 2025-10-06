// You can write more code here

/* START OF COMPILED CODE */

import OnPointerDownScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../../../../../shared/game/phaser/script-nodes/PushActionScript";
import OnPointerUpScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
import EmitEventActionScript from "../../../../../shared/game/phaser/script-nodes-basic/EmitEventActionScript";
/* START-USER-IMPORTS */
import { IconHelper } from "./IconHelper";
import { Subject } from "rxjs";
/* END-USER-IMPORTS */

export default class ActorIcon extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    this.setInteractive(new Phaser.Geom.Rectangle(0, 0, 16, 16), Phaser.Geom.Rectangle.Contains);

    // bg
    const bg = scene.add.nineslice(0, 0, "gui", "cryos_mini_gui/surfaces/surface_dark.png", 16, 16, 2, 2, 2, 2);
    bg.setOrigin(0, 0);
    this.add(bg);

    // nr
    const nr = scene.add.text(8, 7, "", {});
    nr.setOrigin(0.5, 0.5);
    nr.text = "2";
    nr.setStyle({ fontFamily: "disposabledroid", fontSize: "18px", resolution: 10 });
    this.add(nr);

    // image
    const image = scene.add.image(8, 8, "factions", "character_icons/general/warrior.png");
    image.scaleX = 0.22;
    image.scaleY = 0.22;
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
    this.nr.visible = false;
    this.image.visible = false;
    this.on("actor-action", this.emitClick, this);
    this.ctrlKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);
    this.shiftKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    /* END-USER-CTR-CODE */
  }

  private nr: Phaser.GameObjects.Text;
  private image: Phaser.GameObjects.Image;

  /* START-USER-CODE */
  private definition?: ActorIconObjectDefinition;
  private readonly ctrlKey?: Phaser.Input.Keyboard.Key;
  private readonly shiftKey?: Phaser.Input.Keyboard.Key;

  private readonly clickSubject = new Subject<ActorIconClickAction>();

  setActorIcon(definition: ActorIconObjectDefinition, key: string, frame: string, origin: { x: number; y: number }) {
    this.nr.visible = false;
    this.image.visible = true;
    this.definition = definition;

    IconHelper.setIcon(this.image, key, frame, origin, { maxWidth: 16, maxHeight: 16 });
  }

  setNumber(number: number) {
    this.nr.text = number.toString();
    this.nr.visible = true;
    this.image.visible = false;
    this.definition = undefined;
  }

  private emitClick() {
    const isCtrlPressed = this.ctrlKey?.isDown ?? false;
    const isShiftPressed = this.shiftKey?.isDown ?? false;
    this.clickSubject.next({
      definition: {
        actorObjectId: this.definition?.actorObjectId,
        iconIndex: this.definition?.iconIndex
      },
      keys: { ctrl: isCtrlPressed, shift: isShiftPressed }
    });
  }

  get onClick() {
    return this.clickSubject.asObservable();
  }

  override destroy(fromScene?: boolean) {
    this.off("actor-action", this.emitClick, this);
    super.destroy(fromScene);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */
export type ActorIconClickAction = {
  definition: ActorIconObjectDefinition;
  keys: {
    ctrl: boolean;
    shift: boolean;
  };
};
export type ActorIconObjectDefinition = {
  actorObjectId?: string;
  iconIndex?: number;
};

// You can write more code here
