// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class ReconnectRecoveryDialog extends Phaser.Scene {

  constructor() {
    super("ReconnectRecoveryDialog");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {

    // dialog_container
    const dialog_container = this.add.container(0, 0);

    // dialog_bg
    const dialog_bg = this.add.nineslice(-150, -120, "gui", "cryos_mini_gui/surfaces/surface_dark.png", 20, 25, 1, 1, 1, 1);
    dialog_bg.scaleX = 15;
    dialog_bg.scaleY = 10;
    dialog_bg.setOrigin(0, 0);
    dialog_container.add(dialog_bg);

    // title_text
    const title_text = this.add.text(0, -80, "", {});
    title_text.setOrigin(0.5, 0.5);
    title_text.text = "Connection interrupted";
    title_text.setStyle({ "align": "center", "color": "#ffcc66ff", "fontFamily": "disposabledroid", "fontSize": "24px", "resolution": 10 });
    dialog_container.add(title_text);

    // message_text
    const message_text = this.add.text(0, -19, "", {});
    message_text.setOrigin(0.5, 0.5);
    message_text.setStyle({ "align": "center", "color": "#ffffffff", "fontFamily": "disposabledroid", "resolution": 10 });
    message_text.setWordWrapWidth(260);
    dialog_container.add(message_text);

    // hint_text
    const hint_text = this.add.text(0, 50, "", {});
    hint_text.setOrigin(0.5, 0.5);
    hint_text.text = "The match resumes automatically when sync recovers.";
    hint_text.setStyle({ "align": "center", "color": "#bbbbbbff", "fontFamily": "disposabledroid", "fontSize": "14px", "resolution": 10 });
    hint_text.setWordWrapWidth(260);
    dialog_container.add(hint_text);

    // leave_match_button_bg
    const leave_match_button_bg = this.add.nineslice(0, 92, "gui", "cryos_mini_gui/buttons/button_small.png", 180, 34, 4, 4, 4, 4);
    dialog_container.add(leave_match_button_bg);

    // leave_match_button_text
    const leave_match_button_text = this.add.text(0, 91, "", {});
    leave_match_button_text.setOrigin(0.5, 0.5);
    leave_match_button_text.text = "Leave match";
    leave_match_button_text.setStyle({ "align": "center", "color": "#000000ff", "fontFamily": "disposabledroid", "resolution": 10 });
    dialog_container.add(leave_match_button_text);

    this.message_text = message_text;
    this.leave_match_button_bg = leave_match_button_bg;
    this.leave_match_button_text = leave_match_button_text;
    this.dialog_container = dialog_container;

    this.events.emit("scene-awake");
  }

  private message_text!: Phaser.GameObjects.Text;
  private leave_match_button_bg!: Phaser.GameObjects.NineSlice;
  private leave_match_button_text!: Phaser.GameObjects.Text;
  private dialog_container!: Phaser.GameObjects.Container;

  /* START-USER-CODE */
  private readonly smallScreenBreakpoint = 800;
  private pendingMessage?: string;
  private pendingOnLeaveMatch?: () => void;
  // Write your code here

  create() {
    this.editorCreate();

    this.scale.on("resize", this.resize, this);
    this.resize({ width: this.scale.width, height: this.scale.height });
    this.addBackgroundOverlay();
    if (this.pendingMessage !== undefined) {
      this.message_text.setText(this.pendingMessage);
    }

    this.leave_match_button_bg.setInteractive({ useHandCursor: true });
    this.leave_match_button_bg.on("pointerdown", () => {
      this.pendingOnLeaveMatch?.();
    });
    this.scene.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  setup(message: string, onLeaveMatch: () => void): void {
    this.pendingMessage = message;
    this.pendingOnLeaveMatch = onLeaveMatch;
    if (!this.message_text) {
      return;
    }
    this.message_text.setText(message);
  }

  close(): void {
    this.scene.stop();
  }

  private resize(gameSize: { width: number; height: number }) {
    this.dialog_container.setPosition(gameSize.width / 2, gameSize.height / 2);
    this.dialog_container.scale = gameSize.width > this.smallScreenBreakpoint ? 1 : 0.8;
  }

  private addBackgroundOverlay() {
    const bgOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.65);
    bgOverlay.setOrigin(0, 0);
    bgOverlay.setDepth(-1);
    bgOverlay.setInteractive();
    bgOverlay.on(
      "pointerdown",
      (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
      }
    );
  }

  destroy() {
    this.leave_match_button_bg?.off("pointerdown");
    this.scale.off("resize", this.resize, this);
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
