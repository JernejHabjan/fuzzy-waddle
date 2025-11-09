// You can write more code here

/* START OF COMPILED CODE */

import ButtonSmall from "../buttons/ButtonSmall";
/* START-USER-IMPORTS */
import { EventEmitter } from "@angular/core";
/* END-USER-IMPORTS */

export default class ConfirmationDialog extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 640, y ?? 360);

    // background overlay (semi-transparent)
    const overlay = scene.add.rectangle(0, 0, 1280, 720, 0x000000, 0.7);
    overlay.setOrigin(0.5, 0.5);
    this.add(overlay);

    // dialog background
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
    dialogBg.setOrigin(0.5, 0.5);
    this.add(dialogBg);

    // dialog border
    const dialogBorder = scene.add.nineslice(
      0,
      0,
      "gui",
      "cryos_mini_gui/borders/border_wood.png",
      300,
      150,
      4,
      4,
      4,
      4
    );
    dialogBorder.setOrigin(0.5, 0.5);
    this.add(dialogBorder);

    // message text
    const messageText = scene.add.text(0, -30, "", {
      fontFamily: "disposabledroid",
      fontSize: "18px",
      color: "#000000",
      align: "center",
      wordWrap: { width: 260 }
    });
    messageText.setOrigin(0.5, 0.5);
    this.add(messageText);

    // yes button
    const yesButton = new ButtonSmall(scene, -60, 40);
    yesButton.text = "Yes";
    yesButton.w = 80;
    yesButton.h = 30;
    yesButton.fontSize = 16;
    this.add(yesButton);

    // no button
    const noButton = new ButtonSmall(scene, 60, 40);
    noButton.text = "No";
    noButton.w = 80;
    noButton.h = 30;
    noButton.fontSize = 16;
    this.add(noButton);

    this.overlay = overlay;
    this.dialogBg = dialogBg;
    this.dialogBorder = dialogBorder;
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
  private dialogBorder: Phaser.GameObjects.NineSlice;
  private messageText: Phaser.GameObjects.Text;
  private yesButton: ButtonSmall;
  private noButton: ButtonSmall;

  /* START-USER-CODE */
  scene: Phaser.Scene;
  confirmed = new EventEmitter<boolean>();

  postCreate() {
    // Make overlay interactive to prevent clicks behind the dialog
    this.overlay.setInteractive();

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

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
