import Phaser from "phaser";
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { Subscription } from "rxjs";
import type {
  CampaignObjectiveProjection,
  CampaignObjectiveProjectionItem,
  CampaignQuestLogObjectiveEntry,
  CampaignQuestLogPresentationKey
} from "@fuzzy-waddle/probable-waffle-campaign";
import type { CampaignMissionRuntimeState } from "@fuzzy-waddle/probable-waffle-protocol";
import { environment } from "@fuzzy-waddle/environments/environment";
import type { CampaignMissionDirector } from "../../../campaign/campaign-mission-director";
import type { CampaignObjectiveNotification } from "../../../campaign/objectives/campaign-objective-projection-store";
import CampaignQuestLog from "./CampaignQuestLog";
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

    // encounterDiagnosticsText
    const encounterDiagnosticsText = scene.add.text(12, 0, "", {});
    encounterDiagnosticsText.setStyle({
      color: "#82d9ff",
      fontFamily: "monospace",
      fontSize: "12px",
      lineSpacing: 2,
      resolution: 4
    });
    encounterDiagnosticsText.setWordWrapWidth(316);
    this.add(encounterDiagnosticsText);

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
    const closeButton = scene.add.text(0, 222, "", {});
    closeButton.setOrigin(0.5, 0);
    closeButton.text = "[ Done ]";
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
    questBody.setWordWrapWidth(350);
    questPanel.add(questBody);

    this.trackerBackground = trackerBackground;
    this.trackerTitle = trackerTitle;
    this.logButton = logButton;
    this.trackerBody = trackerBody;
    this.encounterDiagnosticsText = encounterDiagnosticsText;
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
    this.questOverlay.on(Phaser.Input.Events.POINTER_UP, this.hideQuestLog, this);
    this.trackerBody.on(Phaser.Input.Events.POINTER_UP, this.focusFirstTrackedObjective, this);
    this.questBackground.setFillStyle(0x15110e, 0.99).setStrokeStyle(4, 0xb8923b, 1);
    this.questTitle.setStyle({ fontSize: "27px", stroke: "#060402", strokeThickness: 3 });
    this.closeButton.setStyle({ backgroundColor: "#2b170d", padding: { x: 46, y: 9 }, stroke: "#b8923b", strokeThickness: 2 });
    this.questDetailFrame = scene.add.rectangle(-5, 83, 680, 200, 0x080706, 0.92).setStrokeStyle(2, 0xb8923b, 1);
    this.questPanel.addAt(this.questDetailFrame, 2);
    this.questLog = new CampaignQuestLog(scene);
    scene.add.existing(this.questLog);
    this.questLog.setDepth(9001);
    scene.scale.on("resize", this.handleResize, this);
    scene.input.keyboard?.on("keydown-ESC", this.hideQuestLog, this);
    /* END-USER-CTR-CODE */
  }

  private trackerBackground: Phaser.GameObjects.Rectangle;
  private trackerTitle: Phaser.GameObjects.Text;
  private logButton: Phaser.GameObjects.Text;
  private trackerBody: Phaser.GameObjects.Text;
  private encounterDiagnosticsText: Phaser.GameObjects.Text;
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
  private selectedQuestKey?: CampaignQuestLogPresentationKey;
  private readonly questRows: Phaser.GameObjects.GameObject[] = [];
  private questDetailFrame: Phaser.GameObjects.Rectangle;
  private readonly questLog: CampaignQuestLog;

  setup(director: CampaignMissionDirector): void {
    this.director = director;
    this.setVisible(true);
    this.handleResize({ width: this.scene.scale.width, height: this.scene.scale.height });
    this.subscriptions.add(director.objectiveProjection.projection$.subscribe((projection) => this.render(projection)));
    this.subscriptions.add(director.effects$.subscribe(() => this.renderEncounterDiagnostics(director.snapshot())));
    this.renderEncounterDiagnostics(director.snapshot());
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
    this.updateTrackerHeight();
    this.renderQuestLog(projection);
    this.questLog.setProjection(projection);
  }

  private renderEncounterDiagnostics(state: CampaignMissionRuntimeState): void {
    const lines = formatCampaignEncounterDiagnostics(state);
    this.encounterDiagnosticsText
      .setText(lines)
      .setPosition(12, this.trackerBody.y + this.trackerBody.height + 8)
      .setVisible(!environment.production && lines.length > 0);
    this.updateTrackerHeight();
  }

  private updateTrackerHeight(): void {
    const diagnosticsHeight = this.encounterDiagnosticsText.visible ? this.encounterDiagnosticsText.height + 8 : 0;
    this.trackerBackground.height = Math.max(84, this.trackerBody.height + diagnosticsHeight + 58);
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
    if (this.questLog.visible) this.hideQuestLog();
    else {
      this.questLog.show();
      if (this.currentProjection) this.questLog.setProjection(this.currentProjection);
    }
  }

  private hideQuestLog(): void {
    this.questLog.hide();
  }

  /** Rebuilds local-only row objects; objective state remains owned by the projection store. */
  private renderQuestLog(projection: CampaignObjectiveProjection): void {
    const entries = projection.questLog.flatMap((section) => section.entries);
    this.selectedQuestKey = selectQuestLogEntry(entries, this.selectedQuestKey);
    for (const row of this.questRows) row.destroy();
    this.questRows.length = 0;
    const positions = { main: -335, optional: -5, guidance: -335 } as const;
    const labelY = { main: -205, optional: -205, guidance: -88 } as const;
    for (const section of projection.questLog) {
      const heading = this.scene.add.text(positions[section.id], labelY[section.id], section.heading, questHeadingStyle);
      this.questPanel.add(heading);
      this.questRows.push(heading);
      if (section.entries.length === 0) {
        const empty = this.scene.add.text(positions[section.id], labelY[section.id] + 34, "No quests", questEmptyStyle);
        this.questPanel.add(empty);
        this.questRows.push(empty);
      }
      section.entries.forEach((entry, index) => {
        const rowY = labelY[section.id] + 30 + index * 46;
        const rowBackground = this.scene.add
          .rectangle(positions[section.id] + 150, rowY + 17, 300, 38, entry.presentationKey === this.selectedQuestKey ? 0x5a2114 : 0x17120f, 0.98)
          .setStrokeStyle(2, entry.presentationKey === this.selectedQuestKey ? 0xf0c850 : 0x6d5426, 1);
        const iconFrame = this.scene.add
          .rectangle(positions[section.id] + 18, rowY + 17, 34, 34, 0x080706, 1)
          .setStrokeStyle(2, 0xb8923b, 1);
        const icon = this.scene.add.text(positions[section.id] + 18, rowY + 17, questGlyph(entry), questIconStyle).setOrigin(0.5);
        const row = this.scene.add.text(
          positions[section.id] + 42,
          rowY + 4,
          formatQuestRow(entry, entry.presentationKey === this.selectedQuestKey),
          questRowStyle
        );
        row.setWordWrapWidth(245);
        if (entry.type === "objective") {
          row.setInteractive({ useHandCursor: true });
          row.on(Phaser.Input.Events.POINTER_UP, () => {
            this.selectedQuestKey = entry.presentationKey;
            this.renderQuestLog(projection);
          });
        }
        this.questPanel.addAt(rowBackground, 3);
        this.questPanel.add(iconFrame);
        this.questPanel.add(icon);
        this.questPanel.add(row);
        this.questRows.push(rowBackground, iconFrame, icon, row);
      });
    }
    const selected = entries.find(
      (entry): entry is CampaignQuestLogObjectiveEntry => entry.type === "objective" && entry.presentationKey === this.selectedQuestKey
    );
    const detailTitle = this.scene.add.text(-335, -35, selected?.objective.title ?? "Quest details", questDetailTitleStyle);
    this.questPanel.add(detailTitle);
    this.questRows.push(detailTitle);
    this.questBody.setText(selected ? formatQuestDetail(selected.objective) : "Select a discovered quest to view its details.");
    this.questBody.setPosition(-335, 4);
    this.questBody.setWordWrapWidth(630);
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
    this.questLog.resize(gameSize.width, gameSize.height);
    this.notificationText.x = gameSize.width / 2 - this.x;
    this.notificationText.y = 8 - this.y;
    this.notificationText.setWordWrapWidth(Math.min(520, gameSize.width - 32));
    const scale = gameSize.width < 900 ? 0.78 : 1;
    this.trackerBackground.setScale(scale);
    this.trackerTitle.setScale(scale);
    this.logButton.setScale(scale);
    this.trackerBody.setScale(scale);
    this.encounterDiagnosticsText.setScale(scale);
  }

  override destroy(fromScene?: boolean): void {
    this.subscriptions.unsubscribe();
    this.notificationTimer?.destroy();
    this.scene.scale.off("resize", this.handleResize, this);
    this.logButton.off(Phaser.Input.Events.POINTER_UP, this.toggleQuestLog, this);
    this.closeButton.off(Phaser.Input.Events.POINTER_UP, this.hideQuestLog, this);
    this.questOverlay.off(Phaser.Input.Events.POINTER_UP, this.hideQuestLog, this);
    this.trackerBody.off(Phaser.Input.Events.POINTER_UP, this.focusFirstTrackedObjective, this);
    this.scene.input.keyboard?.off("keydown-ESC", this.hideQuestLog, this);
    this.questLog.destroy();
    for (const row of this.questRows) row.destroy();
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

const questHeadingStyle: Phaser.Types.GameObjects.Text.TextStyle = {
  color: "#f4cf52", fontFamily: "disposabledroid", fontSize: "22px", stroke: "#000000", strokeThickness: 2, resolution: 10
};
const questRowStyle: Phaser.Types.GameObjects.Text.TextStyle = {
  color: "#f2e5c8", fontFamily: "disposabledroid", fontSize: "15px", lineSpacing: 1, resolution: 10
};
const questEmptyStyle: Phaser.Types.GameObjects.Text.TextStyle = {
  color: "#9b8d7d", fontFamily: "disposabledroid", fontSize: "15px", resolution: 10
};
const questIconStyle: Phaser.Types.GameObjects.Text.TextStyle = {
  color: "#f4cf52", fontFamily: "disposabledroid", fontSize: "21px", stroke: "#000000", strokeThickness: 2, resolution: 10
};
const questDetailTitleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
  color: "#f4cf52", fontFamily: "disposabledroid", fontSize: "21px", stroke: "#000000", strokeThickness: 2, resolution: 10
};

function formatQuestRow(
  entry: CampaignObjectiveProjection["questLog"][number]["entries"][number],
  selected: boolean
): string {
  if (entry.type === "undiscovered") return entry.title;
  return `${selected ? "▶ " : ""}${entry.objective.title}\n${entry.objective.statusText}`;
}

function formatQuestDetail(objective: CampaignObjectiveProjectionItem): string[] {
  const lines = [objective.statusText, ""];
  if (objective.description) lines.push(objective.description, "");
  for (const item of objective.checklist) {
    lines.push(`${item.status === "completed" ? "✓" : "○"} ${item.text}${item.progressText ? ` (${item.progressText})` : ""}`);
    if (item.inputPrompt) lines.push(`  ${item.inputPrompt.text}`);
  }
  if (objective.focus) lines.push("", "Select the tracker to focus this objective.");
  return lines;
}

function questGlyph(entry: CampaignObjectiveProjection["questLog"][number]["entries"][number]): string {
  if (entry.type === "undiscovered") return "?";
  if (entry.objective.status === "completed") return "✓";
  if (entry.objective.status === "failed" || entry.objective.status === "impossible") return "✕";
  return entry.objective.kind === "optional" ? "◆" : "●";
}

/** Retains a valid local row selection, preferring active quests when the prior row disappears. */
export function selectQuestLogEntry(
  entries: readonly CampaignObjectiveProjection["questLog"][number]["entries"][number][],
  selected?: CampaignQuestLogPresentationKey
): CampaignQuestLogPresentationKey | undefined {
  const objectives = entries.filter((entry): entry is CampaignQuestLogObjectiveEntry => entry.type === "objective");
  if (selected && objectives.some((entry) => entry.presentationKey === selected)) return selected;
  return objectives.find((entry) => entry.objective.status === "active")?.presentationKey ?? objectives[0]?.presentationKey;
}

export function formatCampaignEncounterDiagnostics(state: CampaignMissionRuntimeState): string[] {
  const entries = Object.entries(state.encounters);
  if (entries.length === 0) return [];
  const lines = ["ENCOUNTERS"];
  for (const [id, encounter] of entries) {
    const timing = encounter.nextEligibleTick === undefined ? "" : ` next=${encounter.nextEligibleTick}`;
    const failure = encounter.failureReason ? ` failure=${encounter.failureReason}` : "";
    lines.push(
      `${id}: ${encounter.status} wave=${encounter.waveIndex} living=${encounter.livingSpawnedActorIds.length} cursor=${encounter.spawnCursor} blocked=${encounter.blockedAttempts}${timing}${failure}`
    );
  }
  return lines;
}

// You can write more code here
