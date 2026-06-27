// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class ChatNotification extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    // background
    const background = scene.add.nineslice(
      0,
      0,
      "gui",
      "cryos_mini_gui/surfaces/surface_dark.png",
      250,
      50,
      3,
      3,
      3,
      3
    );
    background.setOrigin(0, 1);
    background.setAlpha(0.9);
    this.add(background);

    // player_name
    const player_name = scene.add.text(8, -42, "", {});
    player_name.setOrigin(0, 0);
    player_name.text = "Player";
    player_name.setStyle({
      color: "#FFD700",
      fontFamily: "disposabledroid",
      fontSize: "14px",
      fontStyle: "bold",
      resolution: 10
    });
    player_name.setWordWrapWidth(234);
    this.add(player_name);

    // message_text
    const message_text = scene.add.text(8, -24, "", {});
    message_text.setOrigin(0, 0);
    message_text.text = "Message";
    message_text.setStyle({
      color: "#FFFFFF",
      fontFamily: "disposabledroid",
      fontSize: "14px",
      resolution: 10
    });
    message_text.setWordWrapWidth(234);
    this.add(message_text);

    this.background = background;
    this.player_name = player_name;
    this.message_text = message_text;

    /* START-USER-CTR-CODE */
    this.visible = false;
    this.scene.events.on(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    /* END-USER-CTR-CODE */
  }

  private background: Phaser.GameObjects.NineSlice;
  private player_name: Phaser.GameObjects.Text;
  private message_text: Phaser.GameObjects.Text;

  /* START-USER-CODE */
  private hideTimer?: Phaser.Time.TimerEvent;
  private readonly maxMessageLength = 80;

  showMessage(playerName: string, messageText: string) {
    // Truncate message if too long
    const truncatedMessage =
      messageText.length > this.maxMessageLength
        ? messageText.substring(0, this.maxMessageLength) + "..."
        : messageText;

    this.player_name.setText(playerName + ":");
    this.message_text.setText(truncatedMessage);

    // Adjust background height based on text
    const textHeight = this.message_text.height + this.player_name.height + 16;
    this.background.height = Math.max(50, textHeight);

    // Reposition text elements relative to background bottom
    this.player_name.y = -this.background.height + 8;
    this.message_text.y = this.player_name.y + this.player_name.height + 2;

    this.visible = true;

    // Clear previous timer if exists
    if (this.hideTimer) {
      this.hideTimer.destroy();
    }

    // Auto-hide after 5 seconds
    // Intentional wall-clock timer: chat bubble visibility is UI-only.
    this.hideTimer = this.scene.time.delayedCall(5000, () => {
      this.hide();
    });
  }

  hide() {
    this.visible = false;
    if (this.hideTimer) {
      this.hideTimer.destroy();
      this.hideTimer = undefined;
    }
  }

  override destroy() {
    if (this.hideTimer) {
      this.hideTimer.destroy();
    }
    super.destroy();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
