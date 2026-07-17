/* START OF COMPILED CODE */

import ButtonSmall from "./buttons/ButtonSmall";
/* START-USER-IMPORTS */
import { ProbableWafflePlayer } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class SurrenderDialog extends Phaser.GameObjects.Container {
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
      360,
      170,
      3,
      3,
      3,
      3
    );
    this.add(dialogBg);

    // titleText
    const titleText = scene.add.text(0, -34, "", {});
    titleText.setOrigin(0.5, 0.5);
    titleText.text = "Player wants to surrender";
    titleText.setStyle({
      color: "#000000ff",
      fontFamily: "disposabledroid",
      fontSize: "22px",
      align: "center",
      resolution: 10
    });
    titleText.setWordWrapWidth(320);
    this.add(titleText);

    // acceptButton
    const acceptButton = new ButtonSmall(scene, -70, 45);
    acceptButton.text = "Yes";
    acceptButton.w = 90;
    acceptButton.h = 30;
    acceptButton.fontSize = 20;
    this.add(acceptButton);

    // rejectButton
    const rejectButton = new ButtonSmall(scene, 70, 45);
    rejectButton.text = "No";
    rejectButton.w = 90;
    rejectButton.h = 30;
    rejectButton.fontSize = 20;
    this.add(rejectButton);

    this.overlay = overlay;
    this.dialogBg = dialogBg;
    this.titleText = titleText;
    this.acceptButton = acceptButton;
    this.rejectButton = rejectButton;

    this.visible = false;

    /* START-USER-CTR-CODE */
    this.scene.events.once(Phaser.Scenes.Events.CREATE, () => {
      this.postCreate();
    });
    /* END-USER-CTR-CODE */
  }

  private overlay!: Phaser.GameObjects.Rectangle;
  private dialogBg!: Phaser.GameObjects.NineSlice;
  private titleText!: Phaser.GameObjects.Text;
  private acceptButton!: ButtonSmall;
  private rejectButton!: ButtonSmall;

  /* START-USER-CODE */
  private surrenderingPlayer?: ProbableWafflePlayer;
  private onAcceptCallback?: (player: ProbableWafflePlayer) => void;
  private onRejectCallback?: (player: ProbableWafflePlayer) => void;

  private postCreate() {
    this.overlay.setInteractive();
    this.overlay.setOrigin(0, 0);
    this.acceptButton.image_1.setVisible(false);
    this.rejectButton.image_1.setVisible(false);
    this.acceptButton.clicked.subscribe(() => this.handleAcceptClick());
    this.rejectButton.clicked.subscribe(() => this.handleRejectClick());
    this.setDepth(10000);
    this.scene.scale.on("resize", this.handleResize, this);
    this.handleResize({ width: this.scene.scale.width, height: this.scene.scale.height });
  }

  private handleAcceptClick() {
    if (this.surrenderingPlayer && this.onAcceptCallback) {
      this.onAcceptCallback(this.surrenderingPlayer);
    }
    this.hide();
  }

  private handleRejectClick() {
    if (this.surrenderingPlayer && this.onRejectCallback) {
      this.onRejectCallback(this.surrenderingPlayer);
    }
    this.hide();
  }

  showSurrenderRequest(
    player: ProbableWafflePlayer,
    onAccept: (player: ProbableWafflePlayer) => void,
    onReject: (player: ProbableWafflePlayer) => void
  ) {
    this.surrenderingPlayer = player;
    this.onAcceptCallback = onAccept;
    this.onRejectCallback = onReject;

    const playerName = player.playerController.data.playerDefinition?.player.playerName || `Player ${player.playerNumber}`;
    this.titleText.setText(`${playerName} wants to surrender.\nDo you accept?`);

    this.visible = true;
  }

  hide() {
    this.visible = false;
    this.surrenderingPlayer = undefined;
    this.onAcceptCallback = undefined;
    this.onRejectCallback = undefined;
  }

  override destroy(fromScene?: boolean) {
    this.scene.scale.off("resize", this.handleResize, this);
    super.destroy(fromScene);
  }

  private handleResize(gameSize: { width: number; height: number }) {
    this.overlay.x = -this.x;
    this.overlay.y = -this.y;
    this.overlay.width = gameSize.width;
    this.overlay.height = gameSize.height;
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */
