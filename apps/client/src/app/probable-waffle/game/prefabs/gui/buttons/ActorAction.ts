// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import OnPointerDownScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../../../../../shared/game/phaser/script-nodes/PushActionScript";
import OnPointerUpScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
import EmitEventActionScript from "../../../../../shared/game/phaser/script-nodes-basic/EmitEventActionScript";
/* START-USER-IMPORTS */
import { InfoDefinition } from "../../../entity/actor/components/info-component";
import ActorDefinitionTooltip from "../labels/ActorDefinitionTooltip";
/* END-USER-IMPORTS */

export default class ActorAction extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 41, y ?? 31);

    this.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    this.scaleX = 2;
    this.scaleY = 2;

    // game_action_bg
    const game_action_bg = scene.add.nineslice(
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
    game_action_bg.scaleX = 2.0762647352357817;
    game_action_bg.scaleY = 1.5492262688240692;
    this.add(game_action_bg);

    // game_action_icon
    const game_action_icon = scene.add.image(0, 0, "factions", "character_icons/general/warrior.png");
    game_action_icon.scaleX = 0.31509307156922584;
    game_action_icon.scaleY = 0.31509307156922584;
    game_action_icon.setOrigin(0.5, 0.7);
    this.add(game_action_icon);

    // onPointerDownScript
    const onPointerDownScript = new OnPointerDownScript(this);

    // actor_action_click
    const actor_action_click = new PushActionScript(onPointerDownScript);

    // onPointerUpScript_menu_9
    const onPointerUpScript_menu_9 = new OnPointerUpScript(this);

    // emitActorAction
    const emitActorAction = new EmitEventActionScript(onPointerUpScript_menu_9);

    // emitActorAction (prefab fields)
    emitActorAction.eventName = "actor-action";

    this.game_action_bg = game_action_bg;
    this.game_action_icon = game_action_icon;
    this.actor_action_click = actor_action_click;

    /* START-USER-CTR-CODE */
    this.once(Phaser.Input.Events.DESTROY, this.destroyCore);
    this.on("pointerover", this.onPointerOver);
    this.on("pointerout", this.onPointerOut);
    this.on("actor-action", this.onAction);
    /* END-USER-CTR-CODE */
  }

  private game_action_bg: Phaser.GameObjects.NineSlice;
  private game_action_icon: Phaser.GameObjects.Image;
  private actor_action_click: PushActionScript;

  /* START-USER-CODE */
  private disabled: boolean = false;
  private pointerIn: boolean = false;
  private tooltip?: ActorDefinitionTooltip;
  private tooltipInfo?: InfoDefinition;
  setup(setup: ActorActionSetup) {
    if (setup.icon) {
      this.setIcon(setup.icon.key, setup.icon.frame, setup.icon.origin);
    }
    this.setDisabled(setup.disabled ?? false);
    this.setVisible(setup.visible);
    this.tooltipInfo = setup.tooltipInfo;
  }

  private setIcon(key: string, frame: string, origin?: { x: number; y: number }) {
    this.game_action_icon.setTexture(key, frame);
    if (origin) {
      this.game_action_icon.setOrigin(origin.x, origin.y);
    }
  }

  private setDisabled(disabled: boolean) {
    this.disabled = disabled;
    this.actor_action_click.setDisabled(disabled);
    this.recolorDisabled();
  }

  private recolorDisabled() {
    this.game_action_bg.setTint(this.disabled ? 0x666666 : 0xffffff);
    this.game_action_icon.setTint(this.disabled ? 0x666666 : 0xffffff);
  }

  private onPointerOver = () => {
    this.pointerIn = true;
    this.setupTooltip();
  };

  private onPointerOut = () => {
    this.pointerIn = false;
    this.destroyTooltip();
  };

  private setupTooltip = () => {
    // display tooltip after 500ms
    setTimeout(() => {
      if (!this.pointerIn) return;
      if (!this.tooltipInfo) return;
      if (this.disabled) return;

      const x = this.scene.scale.width - 500; // todo not correct
      const y = this.scene.scale.height - 500; // todo not correct
      this.tooltip = new ActorDefinitionTooltip(this.scene, x, y);
      this.scene.add.existing(this.tooltip);
    }, 500);
  };

  private destroyTooltip() {
    this.tooltip?.destroy();
  }

  private onAction = () => {
    if (this.disabled) return;
    console.log("Actor action");
  };

  private destroyCore = () => {
    this.off("actor-action", this.onAction);
    this.off("pointerover", this.onPointerOver);
    this.off("pointerout", this.onPointerOut);
    this.destroyTooltip();
  };

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

export type ActorActionSetup = {
  icon?: {
    key: string;
    frame: string;
    origin?: {
      x: number;
      y: number;
    };
  };
  disabled?: boolean;
  visible: boolean;
  action?: () => void;
  tooltipInfo?: InfoDefinition;
};

// You can write more code here
