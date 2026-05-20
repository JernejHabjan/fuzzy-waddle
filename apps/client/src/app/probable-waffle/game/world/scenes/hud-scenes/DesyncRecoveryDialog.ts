// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import OnPointerUpScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
import EmitEventActionScript from "../../../../../shared/game/phaser/script-nodes-basic/EmitEventActionScript";
import OnPointerDownScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../../../../../shared/game/phaser/script-nodes/PushActionScript";
/* END-USER-IMPORTS */

export default class DesyncRecoveryDialog extends Phaser.Scene {
  constructor() {
    super("DesyncRecoveryDialog");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // dialog_container
    const dialog_container = this.add.container(0, 0);

    // dialog_bg
    const dialog_bg = this.add.nineslice(
      -150,
      -160,
      "gui",
      "cryos_mini_gui/surfaces/surface_dark.png",
      20,
      25,
      1,
      1,
      1,
      1
    );
    dialog_bg.scaleX = 15;
    dialog_bg.scaleY = 12.8;
    dialog_bg.setOrigin(0, 0);
    dialog_container.add(dialog_bg);

    // title_text
    const title_text = this.add.text(0, -120, "", {});
    title_text.setOrigin(0.5, 0.5);
    title_text.text = "Desync Detected";
    title_text.setStyle({
      align: "center",
      color: "#ff4444ff",
      fontFamily: "disposabledroid",
      fontSize: "24px",
      resolution: 10
    });
    dialog_container.add(title_text);

    // message_text
    const message_text = this.add.text(0, -40, "", {});
    message_text.setOrigin(0.5, 0.5);
    message_text.text = "Player ? is out of sync";
    message_text.setStyle({
      align: "center",
      color: "#ffffffff",
      fontFamily: "disposabledroid",
      maxLines: 3,
      resolution: 10
    });
    message_text.setWordWrapWidth(260);
    dialog_container.add(message_text);

    // wait_button
    const wait_button = this.add.container(-67, 80);
    wait_button.setInteractive(
      new Phaser.Geom.Rectangle(-42, -13, 85.7117848223629, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    wait_button.scaleX = 2;
    wait_button.scaleY = 2;
    dialog_container.add(wait_button);

    // wait_button_bg
    const wait_button_bg = this.add.nineslice(
      0,
      0,
      "gui",
      "cryos_mini_gui/buttons/button_small.png",
      40,
      20,
      3,
      3,
      3,
      3
    );
    wait_button_bg.scaleX = 1.5;
    wait_button_bg.scaleY = 1.5492262688240692;
    wait_button.add(wait_button_bg);

    // wait_text
    const wait_text = this.add.text(-1, 0, "", {});
    wait_text.setOrigin(0.5, 0.5);
    wait_text.text = "Wait";
    wait_text.setStyle({
      align: "center",
      color: "#000000ff",
      fontFamily: "disposabledroid",
      fontSize: "18px",
      resolution: 10
    });
    wait_button.add(wait_text);

    // onPointerUpScript_wait
    const onPointerUpScript_wait = new OnPointerUpScript(wait_button);

    // emitEventWait
    const emitEventWait = new EmitEventActionScript(onPointerUpScript_wait);

    // onPointerDownScript_wait
    const onPointerDownScript_wait = new OnPointerDownScript(wait_button);

    // wait_click
    new PushActionScript(onPointerDownScript_wait);

    // kick_button
    const kick_button = this.add.container(67, 80);
    kick_button.setInteractive(
      new Phaser.Geom.Rectangle(-42, -13, 85.7117848223629, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    kick_button.scaleX = 2;
    kick_button.scaleY = 2;
    dialog_container.add(kick_button);

    // kick_button_bg
    const kick_button_bg = this.add.nineslice(
      0,
      0,
      "gui",
      "cryos_mini_gui/buttons/button_small.png",
      40,
      20,
      3,
      3,
      3,
      3
    );
    kick_button_bg.scaleX = 1.5;
    kick_button_bg.scaleY = 1.5492262688240692;
    kick_button.add(kick_button_bg);

    // kick_text
    const kick_text = this.add.text(-1, 0, "", {});
    kick_text.setOrigin(0.5, 0.5);
    kick_text.text = "Kick";
    kick_text.setStyle({
      align: "center",
      color: "#cc0000ff",
      fontFamily: "disposabledroid",
      fontSize: "18px",
      resolution: 10
    });
    kick_button.add(kick_text);

    // onPointerUpScript_kick
    const onPointerUpScript_kick = new OnPointerUpScript(kick_button);

    // emitEventKick
    const emitEventKick = new EmitEventActionScript(onPointerUpScript_kick);

    // onPointerDownScript_kick
    const onPointerDownScript_kick = new OnPointerDownScript(kick_button);

    // kick_click
    new PushActionScript(onPointerDownScript_kick);

    // emitEventWait (prefab fields)
    emitEventWait.eventName = "desync-wait";

    // emitEventKick (prefab fields)
    emitEventKick.eventName = "desync-kick";

    this.dialog_container = dialog_container;
    this.title_text = title_text;
    this.message_text = message_text;
    this.wait_button = wait_button;
    this.kick_button = kick_button;
    this.dialog_container = dialog_container;

    this.events.emit("scene-awake");
  }

  private dialog_container!: Phaser.GameObjects.Container;
  private title_text!: Phaser.GameObjects.Text;
  private message_text!: Phaser.GameObjects.Text;
  private wait_button!: Phaser.GameObjects.Container;
  private kick_button!: Phaser.GameObjects.Container;

  /* START-USER-CODE */
  private readonly smallScreenBreakpoint = 800;
  private onWaitCallback?: () => void;
  private onKickCallback?: () => void;
  private pendingSetup?: {
    tick: number;
    playerNumber: number | undefined;
    reason?: string;
    onWait: () => void;
    onKick: () => void;
  };

  create() {
    this.editorCreate();

    this.scale.on("resize", this.resize, this);
    this.resize({ height: this.scale.height, width: this.scale.width });

    this.addBackgroundOverlay();
    this.handleWait();
    this.handleKick();
    if (this.pendingSetup) {
      this.applySetup(this.pendingSetup);
    }
  }

  /**
   * Called before scene.start() to configure the dialog content and callbacks.
   * The recovery service sets this up immediately after getting the dialog reference.
   */
  setup(opts: {
    tick: number;
    playerNumber: number | undefined;
    reason?: string;
    onWait: () => void;
    onKick: () => void;
  }): void {
    this.pendingSetup = opts;
    this.applySetup(opts);
  }

  private applySetup(opts: {
    tick: number;
    playerNumber: number | undefined;
    reason?: string;
    onWait: () => void;
    onKick: () => void;
  }): void {
    this.onWaitCallback = opts.onWait;
    this.onKickCallback = opts.onKick;
    if (!this.message_text) {
      return;
    }

    this.message_text.setText(
      `Player ${opts.playerNumber ?? "?"} is out of sync\nat tick ${opts.tick}${opts.reason ? `\n${opts.reason}` : ""}`
    );
  }

  private resize(gameSize: { width: number; height: number }) {
    this.dialog_container.setPosition(gameSize.width / 2, gameSize.height / 2);
    this.dialog_container.scale = gameSize.width > this.smallScreenBreakpoint ? 1 : 0.8;
  }

  private addBackgroundOverlay() {
    const bgOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.65);
    bgOverlay.setOrigin(0, 0);
    bgOverlay.setDepth(-1);
    // Intentionally non-interactive: player must explicitly choose Wait or Kick.
    bgOverlay.setInteractive();
    bgOverlay.on(
      "pointerdown",
      (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
      }
    );
  }

  private handleWait() {
    this.wait_button.once("desync-wait", () => {
      this.onWaitCallback?.();
      this.destroySelf();
    });
  }

  private handleKick() {
    this.kick_button.once("desync-kick", () => {
      this.onKickCallback?.();
      this.destroySelf();
    });
  }

  private destroySelf() {
    this.scene.stop();
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
