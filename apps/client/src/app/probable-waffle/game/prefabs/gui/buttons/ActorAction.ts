// You can write more code here

/* START OF COMPILED CODE */

import OnPointerDownScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../../../../../shared/game/phaser/script-nodes/PushActionScript";
import OnPointerUpScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
import EmitEventActionScript from "../../../../../shared/game/phaser/script-nodes-basic/EmitEventActionScript";
/* START-USER-IMPORTS */
import ActorDefinitionTooltip, { type TooltipInfo } from "../labels/ActorDefinitionTooltip";
import HudProbableWaffle from "../../../world/scenes/hud-scenes/HudProbableWaffle";
import { getGameObjectBounds } from "../../../data/game-object-helper";
import { IconHelper } from "../labels/IconHelper";
/* END-USER-IMPORTS */

export default class ActorAction extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 21, y ?? 16);

    this.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );

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
    this.on(Phaser.Input.Events.POINTER_OVER, this.onPointerOver);
    this.on(Phaser.Input.Events.POINTER_OUT, this.onPointerOut);
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
  private tooltipInfo?: TooltipInfo;
  private action: (() => void) | undefined;
  private tooltipTimeoutId?: number;

  // Small shortcut label rendered on top of the button
  private shortcutText?: Phaser.GameObjects.Text;

  setup(setup: ActorActionSetup) {
    if (setup.icon) {
      this.setIcon(setup.icon.key, setup.icon.frame, setup.icon.origin);
    }
    this.setDisabled(setup.disabled ?? false);
    this.setVisible(setup.visible);
    this.tooltipInfo = setup.tooltipInfo;
    this.action = setup.action;
    this.setShortcutLabel(setup.shortcut);
  }

  private ensureShortcutText() {
    if (!this.shortcutText) {
      // Bottom-left corner
      const txt = this.scene.add.text(-16, 0, "", {
        fontSize: "12px",
        fontFamily: "disposabledroid",
        color: "#222222",
        resolution: 10
      });
      txt.setOrigin(0, 1);
      txt.setDepth(10);
      // subtle shadow for readability
      txt.setShadow(1, 1, "#ffffff", 0, true, true);
      this.add(txt);
      this.shortcutText = txt;
    }
  }

  private setShortcutLabel(shortcut?: string) {
    this.ensureShortcutText();
    if (!this.shortcutText) return;
    if (shortcut && shortcut.trim().length > 0) {
      this.shortcutText.setText(shortcut.toUpperCase());
      this.shortcutText.setVisible(true);
    } else {
      this.shortcutText.setVisible(false);
      this.shortcutText.setText("");
    }
    // reflect disabled state visually
    this.shortcutText.setAlpha(this.disabled ? 0.5 : 1);
  }

  private setIcon(key: string, frame: string, origin?: { x: number; y: number }) {
    const size = 24;
    IconHelper.setIcon(this.game_action_icon, key, frame, origin ?? { x: 0.5, y: 0.5 }, {
      maxWidth: size,
      maxHeight: size
    });
  }

  private setDisabled(disabled: boolean) {
    this.disabled = disabled;
    this.actor_action_click.setDisabled(disabled);
    this.recolorDisabled();
  }

  private recolorDisabled() {
    this.game_action_bg.setTint(this.disabled ? 0x666666 : 0xffffff);
    this.game_action_icon.setTint(this.disabled ? 0x666666 : 0xffffff);
    // adjust shortcut alpha too
    this.shortcutText?.setAlpha(this.disabled ? 0.5 : 1);
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
    this.tooltipTimeoutId = window.setTimeout(() => {
      if (!this.pointerIn) return;
      if (!this.tooltipInfo) return;
      if (this.disabled) return;

      const hudScene = this.scene as HudProbableWaffle;
      const bounds = getGameObjectBounds(hudScene.actor_actions_container);

      const x = bounds?.x ?? 0;
      const y = bounds?.y ?? 0;
      this.tooltip = new ActorDefinitionTooltip(this.scene, x, y);
      this.tooltip.setup(this.tooltipInfo);
      // set origin of tooltip to 1,1
      const boundsTooltip = getGameObjectBounds(this.tooltip);
      if (boundsTooltip) {
        this.tooltip.y -= boundsTooltip.height;
      }
      this.scene.add.existing(this.tooltip);
    }, 500);
  };

  private clearTooltipTimeout() {
    if (this.tooltipTimeoutId !== undefined) {
      clearTimeout(this.tooltipTimeoutId); // Clear the timeout
      this.tooltipTimeoutId = undefined;
    }
  }

  private destroyTooltip() {
    this.clearTooltipTimeout();
    this.tooltip?.destroy();
  }

  private onAction = () => {
    if (this.disabled) return;
    this.action?.();
  };

  private destroyCore = () => {
    this.off("actor-action", this.onAction);
    this.off(Phaser.Input.Events.POINTER_OVER, this.onPointerOver);
    this.off(Phaser.Input.Events.POINTER_OUT, this.onPointerOut);
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
  tooltipInfo?: TooltipInfo;
  // Optional shortcut label (e.g., "A", "M", "1")
  shortcut?: string;
};

// You can write more code here
