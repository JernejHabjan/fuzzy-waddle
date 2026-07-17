// You can write more code here

/* START OF COMPILED CODE */

import ButtonSmall from "../buttons/ButtonSmall";
/* START-USER-IMPORTS */
import { EventEmitter } from "@angular/core";
/* END-USER-IMPORTS */

export default class ConfirmationDialog extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 640, y ?? 360);

    // overlay
    const overlay = scene.add.rectangle(0, 0, 1280, 720, 0x000000, 0.7);
    this.add(overlay);

    // dialogBg
    const dialogBg = scene.add.nineslice(
      0,
      0,
      "gui",
      "cryos_mini_gui/surfaces/surface_parchment.png",
      300,
      150,
      3,
      3,
      3,
      3
    );
    this.add(dialogBg);

    // messageText
    const messageText = scene.add.text(0, -30, "", {});
    messageText.setOrigin(0.5, 0.5);
    messageText.text = "Message";
    messageText.setStyle({
      color: "#000000ff",
      fontFamily: "disposabledroid",
      fontSize: "18px",
      align: "center",
      resolution: 10
    });
    messageText.setWordWrapWidth(260);
    this.add(messageText);

    // yesButton
    const yesButton = new ButtonSmall(scene, -60, 40);
    yesButton.text = "Yes";
    yesButton.w = 80;
    yesButton.h = 30;
    yesButton.fontSize = 20;
    this.add(yesButton);

    // noButton
    const noButton = new ButtonSmall(scene, 60, 40);
    noButton.text = "No";
    noButton.w = 80;
    noButton.h = 30;
    noButton.fontSize = 20;
    this.add(noButton);

    this.overlay = overlay;
    this.dialogBg = dialogBg;
    this.messageText = messageText;
    this.yesButton = yesButton;
    this.noButton = noButton;

    /* START-USER-CTR-CODE */
    this.scene = scene;
    this.setVisible(false);
    scene.events.once(Phaser.Scenes.Events.CREATE, () => {
      this.postCreate();
    });
    /* END-USER-CTR-CODE */
  }

  private overlay: Phaser.GameObjects.Rectangle;
  private dialogBg: Phaser.GameObjects.NineSlice;
  private messageText: Phaser.GameObjects.Text;
  private yesButton: ButtonSmall;
  private noButton: ButtonSmall;

  /* START-USER-CODE */
  override scene: Phaser.Scene;
  confirmed = new EventEmitter<boolean>();

  postCreate() {
    // Make overlay interactive to prevent clicks behind the dialog
    this.overlay.setInteractive();
    this.overlay.setOrigin(0, 0);
    this.yesButton.image_1.setVisible(false);
    this.noButton.image_1.setVisible(false);
    this.handleResize({ width: this.scene.scale.width, height: this.scene.scale.height });

    // Setup button handlers
    this.yesButton.clicked.subscribe(() => {
      this.confirmed.emit(true);
      this.hide();
    });

    this.noButton.clicked.subscribe(() => {
      this.confirmed.emit(false);
      this.hide();
    });

    // Make the dialog always on top
    this.setDepth(10000);
    this.scene.scale.on("resize", this.handleResize, this);
  }

  show(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.messageText.text = message;
      this.setVisible(true);

      // Subscribe once to the confirmation event
      const subscription = this.confirmed.subscribe((result) => {
        subscription.unsubscribe();
        resolve(result);
      });
    });
  }

  hide() {
    this.setVisible(false);
  }

  private handleResize(gameSize: { width: number; height: number }) {
    this.overlay.x = -this.x;
    this.overlay.y = -this.y;
    this.overlay.width = gameSize.width;
    this.overlay.height = gameSize.height;
  }

  override destroy(fromScene?: boolean) {
    this.scene.scale.off("resize", this.handleResize, this);
    super.destroy(fromScene);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
