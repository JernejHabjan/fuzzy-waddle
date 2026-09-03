import Phaser from "phaser";
import type {
  CampaignObjectiveProjection,
  CampaignObjectiveProjectionItem,
  CampaignQuestLogObjectiveEntry,
  CampaignQuestLogPresentationKey
} from "@fuzzy-waddle/probable-waffle-campaign";

/**
 * Local campaign journal surface. It intentionally owns only presentation selection and input capture; the
 * campaign projection remains the authority for objective content and progress.
 */
export default class CampaignQuestLog extends Phaser.GameObjects.Container {
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly dynamicObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly detail: Phaser.GameObjects.Text;
  private selectedKey?: CampaignQuestLogPresentationKey;

  constructor(scene: Phaser.Scene) {
    super(scene);
    this.setVisible(false);
    this.overlay = scene.add.rectangle(0, 0, 1280, 720, 0x000000, 0.62).setInteractive();
    const surface = scene.add.nineslice(-380, -280, "gui", "cryos_mini_gui/surfaces/surface_dark.png", 20, 25, 1, 1, 1, 1);
    surface.setOrigin(0, 0).setScale(38, 22.4);
    const title = scene.add.text(0, -253, "MISSION LOG", titleStyle).setOrigin(0.5, 0);
    const detailFrame = scene.add.nineslice(-342, -42, "gui", "cryos_mini_gui/surfaces/surface_dark.png", 20, 25, 1, 1, 1, 1);
    detailFrame.setOrigin(0, 0).setScale(34, 8.4);
    const doneBackground = scene.add.nineslice(-72, 218, "gui", "cryos_mini_gui/buttons/button_small.png", 40, 20, 3, 3, 3, 3);
    doneBackground.setScale(3.6, 1.7).setInteractive({ useHandCursor: true });
    const done = scene.add.text(0, 218, "Done", doneStyle).setOrigin(0.5);
    this.detail = scene.add.text(-322, 0, "Select a discovered quest to view its details.", detailStyle).setWordWrapWidth(620);
    this.add([this.overlay, surface, title, detailFrame, this.detail, doneBackground, done]);
    this.overlay.on(Phaser.Input.Events.POINTER_UP, this.hide, this);
    doneBackground.on(Phaser.Input.Events.POINTER_UP, this.hide, this);
    scene.input.keyboard?.on("keydown-ESC", this.hide, this);
  }

  setProjection(projection: CampaignObjectiveProjection): void {
    const entries = projection.questLog.flatMap((section) => section.entries);
    this.selectedKey = selectQuestLogEntry(entries, this.selectedKey);
    for (const object of this.dynamicObjects) object.destroy();
    this.dynamicObjects.length = 0;
    const x = { main: -335, optional: 0, guidance: -335 } as const;
    const y = { main: -205, optional: -205, guidance: -92 } as const;
    for (const section of projection.questLog) {
      const heading = this.addText(x[section.id], y[section.id], section.heading, headingStyle);
      if (section.entries.length === 0) this.addText(x[section.id], y[section.id] + 32, "No quests", emptyStyle);
      section.entries.forEach((entry, index) => {
        const rowY = y[section.id] + 30 + index * 44;
        const row = this.scene.add.nineslice(x[section.id], rowY, "gui", "cryos_mini_gui/buttons/button_small.png", 40, 20, 3, 3, 3, 3);
        row.setOrigin(0, 0).setScale(7.7, 1.65);
        const icon = this.addText(x[section.id] + 14, rowY + 10, questGlyph(entry), iconStyle).setOrigin(0.5);
        const text = this.addText(x[section.id] + 34, rowY + 4, formatRow(entry, entry.presentationKey === this.selectedKey), rowStyle).setWordWrapWidth(245);
        if (entry.type === "objective") {
          row.setInteractive({ useHandCursor: true }).on(Phaser.Input.Events.POINTER_UP, () => {
            this.selectedKey = entry.presentationKey;
            this.setProjection(projection);
          });
        }
        this.add(row);
        this.dynamicObjects.push(row);
      });
    }
    const selected = entries.find((entry): entry is CampaignQuestLogObjectiveEntry => entry.type === "objective" && entry.presentationKey === this.selectedKey);
    this.detail.setText(selected ? formatDetail(selected.objective) : "Select a discovered quest to view its details.");
  }

  show(): void { this.setVisible(true); }
  hide(): void { this.setVisible(false); }

  resize(width: number, height: number): void {
    this.setPosition(width / 2, height / 2);
    const scale = Math.max(0.55, Math.min(1, (width - 24) / 760, (height - 24) / 560));
    this.setScale(scale);
    this.overlay.setSize(width / scale, height / scale);
  }

  override destroy(fromScene?: boolean): void {
    this.scene.input.keyboard?.off("keydown-ESC", this.hide, this);
    this.overlay.off(Phaser.Input.Events.POINTER_UP, this.hide, this);
    super.destroy(fromScene);
  }

  private addText(x: number, y: number, text: string, style: Phaser.Types.GameObjects.Text.TextStyle): Phaser.GameObjects.Text {
    const object = this.scene.add.text(x, y, text, style);
    this.add(object);
    this.dynamicObjects.push(object);
    return object;
  }
}

const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = { color: "#f4cf52", fontFamily: "disposabledroid", fontSize: "28px", stroke: "#000000", strokeThickness: 3, resolution: 10 };
const headingStyle: Phaser.Types.GameObjects.Text.TextStyle = { color: "#f4cf52", fontFamily: "disposabledroid", fontSize: "22px", stroke: "#000000", strokeThickness: 2, resolution: 10 };
const rowStyle: Phaser.Types.GameObjects.Text.TextStyle = { color: "#f2e5c8", fontFamily: "disposabledroid", fontSize: "15px", resolution: 10 };
const iconStyle: Phaser.Types.GameObjects.Text.TextStyle = { color: "#f4cf52", fontFamily: "disposabledroid", fontSize: "18px", stroke: "#000000", strokeThickness: 2, resolution: 10 };
const emptyStyle: Phaser.Types.GameObjects.Text.TextStyle = { color: "#9b8d7d", fontFamily: "disposabledroid", fontSize: "15px", resolution: 10 };
const detailStyle: Phaser.Types.GameObjects.Text.TextStyle = { color: "#f2e5c8", fontFamily: "disposabledroid", fontSize: "17px", lineSpacing: 3, resolution: 10 };
const doneStyle: Phaser.Types.GameObjects.Text.TextStyle = { color: "#000000", fontFamily: "disposabledroid", fontSize: "20px", stroke: "#ffffff", strokeThickness: 1, resolution: 10 };

function formatRow(entry: CampaignObjectiveProjection["questLog"][number]["entries"][number], selected: boolean): string {
  if (entry.type === "undiscovered") return entry.title;
  return `${selected ? "▶ " : ""}${entry.objective.title}\n${entry.objective.statusText}`;
}
function formatDetail(objective: CampaignObjectiveProjectionItem): string[] {
  const lines = [objective.title, objective.statusText, ""];
  if (objective.description) lines.push(objective.description, "");
  for (const item of objective.checklist) lines.push(`${item.status === "completed" ? "✓" : "○"} ${item.text}${item.progressText ? ` (${item.progressText})` : ""}`);
  return lines;
}
function questGlyph(entry: CampaignObjectiveProjection["questLog"][number]["entries"][number]): string {
  if (entry.type === "undiscovered") return "?";
  if (entry.objective.status === "completed") return "✓";
  if (entry.objective.status === "failed" || entry.objective.status === "impossible") return "✕";
  return entry.objective.kind === "optional" ? "◆" : "●";
}
export function selectQuestLogEntry(entries: readonly CampaignObjectiveProjection["questLog"][number]["entries"][number][], selected?: CampaignQuestLogPresentationKey): CampaignQuestLogPresentationKey | undefined {
  const objectives = entries.filter((entry): entry is CampaignQuestLogObjectiveEntry => entry.type === "objective");
  if (selected && objectives.some((entry) => entry.presentationKey === selected)) return selected;
  return objectives.find((entry) => entry.objective.status === "active")?.presentationKey ?? objectives[0]?.presentationKey;
}
