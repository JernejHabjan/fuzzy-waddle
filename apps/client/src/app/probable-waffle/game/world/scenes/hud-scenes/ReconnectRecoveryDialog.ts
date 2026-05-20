import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";

export default class ReconnectRecoveryDialog extends ProbableWaffleScene {
  private readonly smallScreenBreakpoint = 800;
  private dialogContainer!: Phaser.GameObjects.Container;
  private messageText!: Phaser.GameObjects.Text;
  private leaveMatchButtonBg!: Phaser.GameObjects.NineSlice;
  private leaveMatchButtonText!: Phaser.GameObjects.Text;
  private pendingMessage?: string;
  private pendingOnLeaveMatch?: () => void;

  constructor() {
    super("ReconnectRecoveryDialog");
  }

  override create() {
    const dialogContainer = this.add.container(0, 0);

    const dialogBg = this.add.nineslice(
      -150,
      -120,
      "gui",
      "cryos_mini_gui/surfaces/surface_dark.png",
      20,
      25,
      1,
      1,
      1,
      1
    );
    dialogBg.scaleX = 15;
    dialogBg.scaleY = 10;
    dialogBg.setOrigin(0, 0);
    dialogContainer.add(dialogBg);

    const titleText = this.add.text(0, -80, "Connection interrupted", {
      align: "center",
      color: "#ffcc66ff",
      fontFamily: "disposabledroid",
      fontSize: "24px",
      resolution: 10
    });
    titleText.setOrigin(0.5, 0.5);
    dialogContainer.add(titleText);

    this.messageText = this.add.text(0, -5, "", {
      align: "center",
      color: "#ffffffff",
      fontFamily: "disposabledroid",
      fontSize: "16px",
      resolution: 10,
      wordWrap: { width: 260 }
    });
    this.messageText.setOrigin(0.5, 0.5);
    dialogContainer.add(this.messageText);

    const hintText = this.add.text(0, 75, "The match resumes automatically when sync recovers.", {
      align: "center",
      color: "#bbbbbbff",
      fontFamily: "disposabledroid",
      fontSize: "14px",
      resolution: 10,
      wordWrap: { width: 260 }
    });
    hintText.setOrigin(0.5, 0.5);
    dialogContainer.add(hintText);

    const leaveMatchButtonBg = this.add.nineslice(
      0,
      120,
      "gui",
      "cryos_mini_gui/surfaces/surface_wood.png",
      180,
      34,
      4,
      4,
      4,
      4
    );
    leaveMatchButtonBg.setOrigin(0.5, 0.5);
    leaveMatchButtonBg.setInteractive({ useHandCursor: true });
    leaveMatchButtonBg.on("pointerdown", () => {
      this.pendingOnLeaveMatch?.();
    });
    dialogContainer.add(leaveMatchButtonBg);

    const leaveMatchButtonText = this.add.text(0, 120, "Leave match", {
      align: "center",
      color: "#ffffffff",
      fontFamily: "disposabledroid",
      fontSize: "16px",
      resolution: 10
    });
    leaveMatchButtonText.setOrigin(0.5, 0.5);
    dialogContainer.add(leaveMatchButtonText);

    this.dialogContainer = dialogContainer;
    this.leaveMatchButtonBg = leaveMatchButtonBg;
    this.leaveMatchButtonText = leaveMatchButtonText;

    this.scale.on("resize", this.resize, this);
    this.resize({ width: this.scale.width, height: this.scale.height });
    this.addBackgroundOverlay();
    if (this.pendingMessage !== undefined) {
      this.messageText.setText(this.pendingMessage);
    }
  }

  setup(message: string, onLeaveMatch: () => void): void {
    this.pendingMessage = message;
    this.pendingOnLeaveMatch = onLeaveMatch;
    if (!this.messageText) {
      return;
    }
    this.messageText.setText(message);
  }

  close(): void {
    this.scene.stop();
  }

  private resize(gameSize: { width: number; height: number }) {
    this.dialogContainer.setPosition(gameSize.width / 2, gameSize.height / 2);
    this.dialogContainer.scale = gameSize.width > this.smallScreenBreakpoint ? 1 : 0.8;
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

  override destroy() {
    this.leaveMatchButtonBg?.off("pointerdown");
    this.scale.off("resize", this.resize, this);
    super.destroy();
  }
}
