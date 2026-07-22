// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { Subscription } from "rxjs";
import type {
  CampaignObjectiveProjection,
  CampaignObjectiveProjectionItem
} from "@fuzzy-waddle/probable-waffle-campaign";
import type { CampaignMissionDirector } from "../../../campaign/campaign-mission-director";
import type { CampaignObjectiveNotification } from "../../../campaign/objectives/campaign-objective-projection-store";
/* END-USER-IMPORTS */

export default class CampaignObjectivesHud extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 920, y ?? 70);

    // trackerBackground
    const trackerBackground = scene.add.rectangle(0, 0, 340, 220, 0x18130f, 0.88);
    trackerBackground.setOrigin(0, 0);
    trackerBackground.isFilled = true;
    this.add(trackerBackground);

    // trackerTitle
    const trackerTitle = scene.add.text(12, 10, "", {});
    trackerTitle.text = "Objectives";
    trackerTitle.setStyle({
      color: "#f1d6a4",
      fontFamily: "disposabledroid",
      fontSize: "22px",
      stroke: "#000000",
      strokeThickness: 2,
      resolution: 10
    });
    this.add(trackerTitle);

    // logButton
    const logButton = scene.add.text(226, 13, "", {});
    logButton.text = "[ Mission log ]";
    logButton.setStyle({ color: "#e6c27a", fontFamily: "disposabledroid", fontSize: "16px", resolution: 10 });
    this.add(logButton);

    // trackerBody
    const trackerBody = scene.add.text(12, 44, "", {});
    trackerBody.setStyle({
      color: "#ffffff",
      fontFamily: "disposabledroid",
      fontSize: "17px",
      lineSpacing: 3,
      resolution: 10
    });
    trackerBody.setWordWrapWidth(316);
    this.add(trackerBody);

    // notificationText
    const notificationText = scene.add.text(0, 0, "", {});
    notificationText.setOrigin(0.5, 0);
    notificationText.setStyle({
      backgroundColor: "#18130fee",
      color: "#f6dfad",
      fontFamily: "disposabledroid",
      fontSize: "24px",
      padding: { x: 18, y: 10 },
      align: "center",
      stroke: "#000000",
      strokeThickness: 2,
      resolution: 10
    });
    notificationText.setWordWrapWidth(520);
    this.add(notificationText);

    // questPanel
    const questPanel = scene.add.container(0, 0);
    questPanel.visible = false;
    this.add(questPanel);

    // questOverlay
    const questOverlay = scene.add.rectangle(0, 0, 1280, 720, 0x000000, 0.72);
    questOverlay.isFilled = true;
    questPanel.add(questOverlay);

    // questBackground
    const questBackground = scene.add.rectangle(0, 0, 760, 560, 0x241c15, 0.98);
    questBackground.isFilled = true;
    questBackground.setStrokeStyle(3, 0xc89b53, 1);
    questPanel.add(questBackground);

    // questTitle
    const questTitle = scene.add.text(0, -252, "", {});
    questTitle.setOrigin(0.5, 0);
    questTitle.text = "Mission objectives";
    questTitle.setStyle({ color: "#f1d6a4", fontFamily: "disposabledroid", fontSize: "30px", resolution: 10 });
    questPanel.add(questTitle);

    // closeButton
    const closeButton = scene.add.text(315, -250, "", {});
    closeButton.setOrigin(0.5, 0);
    closeButton.text = "[ Close ]";
    closeButton.setStyle({ color: "#e6c27a", fontFamily: "disposabledroid", fontSize: "18px", resolution: 10 });
    questPanel.add(closeButton);

    // questBody
    const questBody = scene.add.text(-350, -210, "", {});
    questBody.setStyle({
      color: "#ffffff",
      fontFamily: "disposabledroid",
      fontSize: "18px",
      lineSpacing: 3,
      resolution: 10
    });
    questBody.setWordWrapWidth(700);
    questPanel.add(questBody);

    this.trackerBackground = trackerBackground;
    this.trackerTitle = trackerTitle;
    this.logButton = logButton;
    this.trackerBody = trackerBody;
    this.notificationText = notificationText;
    this.questPanel = questPanel;
    this.questOverlay = questOverlay;
    this.questBackground = questBackground;
    this.questTitle = questTitle;
    this.closeButton = closeButton;
    this.questBody = questBody;

    /* START-USER-CTR-CODE */
    this.setDepth(9000);
    this.setVisible(false);
    this.notificationText.setVisible(false);
    this.logButton.setInteractive({ useHandCursor: true });
    this.closeButton.setInteractive({ useHandCursor: true });
    this.questOverlay.setInteractive();
    this.trackerBody.setInteractive({ useHandCursor: true });
    this.logButton.on(Phaser.Input.Events.POINTER_UP, this.toggleQuestLog, this);
    this.closeButton.on(Phaser.Input.Events.POINTER_UP, this.hideQuestLog, this);
    this.trackerBody.on(Phaser.Input.Events.POINTER_UP, this.focusFirstTrackedObjective, this);
    scene.scale.on("resize", this.handleResize, this);
    /* END-USER-CTR-CODE */
  }

  private trackerBackground: Phaser.GameObjects.Rectangle;
  private trackerTitle: Phaser.GameObjects.Text;
  private logButton: Phaser.GameObjects.Text;
  private trackerBody: Phaser.GameObjects.Text;
  private notificationText: Phaser.GameObjects.Text;
  private questPanel: Phaser.GameObjects.Container;
  private questOverlay: Phaser.GameObjects.Rectangle;
  private questBackground: Phaser.GameObjects.Rectangle;
  private questTitle: Phaser.GameObjects.Text;
  private closeButton: Phaser.GameObjects.Text;
  private questBody: Phaser.GameObjects.Text;

  /* START-USER-CODE */
  private readonly subscriptions = new Subscription();
  private readonly pendingNotifications: CampaignObjectiveNotification[] = [];
  private notificationTimer?: Phaser.Time.TimerEvent;
  private director?: CampaignMissionDirector;
  private currentProjection?: CampaignObjectiveProjection;

  setup(director: CampaignMissionDirector): void {
    this.director = director;
    this.setVisible(true);
    this.handleResize({ width: this.scene.scale.width, height: this.scene.scale.height });
    this.subscriptions.add(director.objectiveProjection.projection$.subscribe((projection) => this.render(projection)));
    this.subscriptions.add(
      director.objectiveProjection.notifications$.subscribe((notification) => {
        this.pendingNotifications.push(notification);
        this.showNextNotification();
      })
    );
  }

  private render(projection: CampaignObjectiveProjection): void {
    this.currentProjection = projection;
    this.trackerBody.setText(projection.tracker.flatMap(formatTrackerObjective));
    this.trackerBackground.height = Math.max(84, this.trackerBody.height + 58);
    this.questBody.setText(formatQuestLog(projection));
  }

  private showNextNotification(): void {
    if (this.notificationTimer || this.pendingNotifications.length === 0) return;
    const notification = this.pendingNotifications.shift()!;
    this.notificationText.setText(notification.text).setVisible(true);
    // Intentional wall-clock timer: mission notification duration is presentation-only.
    this.notificationTimer = this.scene.time.delayedCall(3200, () => {
      this.notificationTimer = undefined;
      this.notificationText.setVisible(false);
      this.showNextNotification();
    });
  }

  private toggleQuestLog(): void {
    this.questPanel.setVisible(!this.questPanel.visible);
  }

  private hideQuestLog(): void {
    this.questPanel.setVisible(false);
  }

  private focusFirstTrackedObjective(): void {
    const objective = this.currentProjection?.tracker.find((candidate) => candidate.focus);
    if (objective) this.director?.focusObjective(objective.id);
  }

  private handleResize(gameSize: { width: number; height: number }): void {
    this.x = Math.max(8, gameSize.width - 356);
    this.y = 72;
    this.questPanel.x = gameSize.width / 2 - this.x;
    this.questPanel.y = gameSize.height / 2 - this.y;
    const questScale = Math.max(0.55, Math.min(1, (gameSize.width - 24) / 760, (gameSize.height - 24) / 560));
    this.questPanel.setScale(questScale);
    this.questOverlay.setSize(gameSize.width / questScale, gameSize.height / questScale);
    this.notificationText.x = gameSize.width / 2 - this.x;
    this.notificationText.y = 8 - this.y;
    this.notificationText.setWordWrapWidth(Math.min(520, gameSize.width - 32));
    const scale = gameSize.width < 900 ? 0.78 : 1;
    this.trackerBackground.setScale(scale);
    this.trackerTitle.setScale(scale);
    this.logButton.setScale(scale);
    this.trackerBody.setScale(scale);
  }

  override destroy(fromScene?: boolean): void {
    this.subscriptions.unsubscribe();
    this.notificationTimer?.destroy();
    this.scene.scale.off("resize", this.handleResize, this);
    this.logButton.off(Phaser.Input.Events.POINTER_UP, this.toggleQuestLog, this);
    this.closeButton.off(Phaser.Input.Events.POINTER_UP, this.hideQuestLog, this);
    this.trackerBody.off(Phaser.Input.Events.POINTER_UP, this.focusFirstTrackedObjective, this);
    super.destroy(fromScene);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

function formatTrackerObjective(objective: CampaignObjectiveProjectionItem): string[] {
  const lines = [`• ${objective.title} — ${objective.statusText}`];
  for (const item of objective.checklist) {
    lines.push(
      `  ${item.status === "completed" ? "✓" : "○"} ${item.text}${item.progressText ? ` (${item.progressText})` : ""}`
    );
    if (item.inputPrompt) lines.push(`    ${item.inputPrompt.text}`);
  }
  return lines;
}

function formatQuestLog(projection: CampaignObjectiveProjection): string[] {
  const lines: string[] = [];
  for (const [kind, objectives] of Object.entries(projection.questLog)) {
    if (objectives.length === 0) continue;
    lines.push(kind.toUpperCase());
    for (const objective of objectives) lines.push(...formatTrackerObjective(objective));
    lines.push("");
  }
  if (projection.history.length > 0) {
    lines.push("MISSION HISTORY");
    for (const entry of projection.history) lines.push(`• ${entry.text} — ${entry.state ?? entry.kind}`);
  }
  return lines;
}

// You can write more code here
