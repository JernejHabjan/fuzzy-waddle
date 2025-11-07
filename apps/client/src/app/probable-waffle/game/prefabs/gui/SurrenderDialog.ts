/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ProbableWafflePlayer } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class SurrenderDialog extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    // Background panel
    const background = scene.add.rectangle(0, 0, 400, 150, 0x000000, 0.8);
    this.add(background);

    // Border
    const border = scene.add.rectangle(0, 0, 400, 150);
    border.setStrokeStyle(2, 0xffffff);
    this.add(border);

    // Title text
    const titleText = scene.add.text(0, -40, "", {
      fontFamily: "disposabledroid",
      fontSize: "24px",
      color: "#ffffff",
      align: "center",
      resolution: 10
    });
    titleText.setOrigin(0.5);
    this.add(titleText);

    // Accept button background
    const acceptButtonBg = scene.add.rectangle(-60, 20, 100, 40, 0x00ff00, 1);
    acceptButtonBg.setInteractive({ useHandCursor: true });
    this.add(acceptButtonBg);

    // Accept button text
    const acceptButtonText = scene.add.text(-60, 20, "Yes", {
      fontFamily: "disposabledroid",
      fontSize: "20px",
      color: "#000000",
      resolution: 10
    });
    acceptButtonText.setOrigin(0.5);
    this.add(acceptButtonText);

    // Reject button background
    const rejectButtonBg = scene.add.rectangle(60, 20, 100, 40, 0xff0000, 1);
    rejectButtonBg.setInteractive({ useHandCursor: true });
    this.add(rejectButtonBg);

    // Reject button text
    const rejectButtonText = scene.add.text(60, 20, "No", {
      fontFamily: "disposabledroid",
      fontSize: "20px",
      color: "#ffffff",
      resolution: 10
    });
    rejectButtonText.setOrigin(0.5);
    this.add(rejectButtonText);

    this.titleText = titleText;
    this.acceptButtonBg = acceptButtonBg;
    this.rejectButtonBg = rejectButtonBg;

    this.visible = false;

    /* START-USER-CTR-CODE */
    // Set up button listeners once during construction
    this.acceptButtonBg.on("pointerdown", this.handleAcceptClick, this);
    this.rejectButtonBg.on("pointerdown", this.handleRejectClick, this);
    /* END-USER-CTR-CODE */
  }

  private titleText!: Phaser.GameObjects.Text;
  private acceptButtonBg!: Phaser.GameObjects.Rectangle;
  private rejectButtonBg!: Phaser.GameObjects.Rectangle;

  /* START-USER-CODE */
  private surrenderingPlayer?: ProbableWafflePlayer;
  private onAcceptCallback?: (player: ProbableWafflePlayer) => void;
  private onRejectCallback?: (player: ProbableWafflePlayer) => void;

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
    // Clean up event listeners
    this.acceptButtonBg.off("pointerdown", this.handleAcceptClick, this);
    this.rejectButtonBg.off("pointerdown", this.handleRejectClick, this);
    super.destroy(fromScene);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */
