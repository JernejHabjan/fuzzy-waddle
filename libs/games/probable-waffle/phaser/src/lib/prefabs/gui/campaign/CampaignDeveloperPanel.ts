import { Subscription } from "rxjs";
import type { CampaignDeveloperCommand, CampaignDeveloperCommandResult } from "@fuzzy-waddle/probable-waffle-campaign";
import type { CampaignMissionDirector } from "../../../campaign/campaign-mission-director";

/** Development-only scene-backed inspection surface; F9 toggles it without changing run integrity. */
export default class CampaignDeveloperPanel extends Phaser.GameObjects.Container {
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly body: Phaser.GameObjects.Text;
  private readonly subscriptions = new Subscription();
  private director?: CampaignMissionDirector;
  private toggleKey?: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    super(scene, 12, 72);
    this.setDepth(19_000).setVisible(false);
    this.background = scene.add.rectangle(0, 0, 560, 620, 0x090d12, 0.94).setOrigin(0);
    this.background.setStrokeStyle(2, 0x6bb7ff, 1);
    const title = scene.add.text(12, 10, "Campaign diagnostics · F9", {
      color: "#82d9ff",
      fontFamily: "monospace",
      fontSize: "16px"
    });
    this.body = scene.add.text(12, 40, "", {
      color: "#ffffff",
      fontFamily: "monospace",
      fontSize: "12px",
      lineSpacing: 2,
      wordWrap: { width: 536 }
    });
    this.add([this.background, title, this.body]);
  }

  setup(director: CampaignMissionDirector): void {
    this.director = director;
    this.render();
    this.subscriptions.add(director.effects$.subscribe(() => this.render()));
    this.toggleKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F9);
    this.toggleKey?.on(Phaser.Input.Keyboard.Events.DOWN, this.toggle, this);
  }

  execute(command: CampaignDeveloperCommand): CampaignDeveloperCommandResult {
    if (!this.director) return { accepted: false, invalidatedRewards: false, reason: "Campaign is not initialized" };
    const result = this.director.diagnostics.execute(command);
    this.render();
    return result;
  }

  private readonly toggle = (): void => {
    this.setVisible(!this.visible);
    if (this.visible) this.render();
  };

  private render(): void {
    const director = this.director;
    if (!director) return;
    const snapshot = director.diagnostics.snapshot();
    const graph = snapshot.phases.graph.edges
      .filter((edge) => edge.candidate)
      .map((edge) => `${edge.from} -> ${edge.to}`);
    const objectives = Object.entries(snapshot.objectives).map(([id, objective]) => `${id}=${objective.status}`);
    const encounters = Object.entries(snapshot.encounters).map(
      ([id, encounter]) => `${id}=${encounter.status}/wave-${encounter.waveIndex}`
    );
    const environment = director.diagnosticEnvironment();
    this.body.setText([
      `FLOW ${snapshot.missionId}@${snapshot.missionRevision} ${snapshot.status}`,
      `active: ${snapshot.phases.active.join(", ") || "none"}`,
      `candidates: ${graph.join(", ") || "none"}`,
      "",
      `OBJECTIVES ${objectives.join(" · ") || "none"}`,
      `FACTS ${JSON.stringify(snapshot.facts)}`,
      `COUNTERS ${JSON.stringify(snapshot.counters)}`,
      `TIMERS ${JSON.stringify(snapshot.timers)}`,
      "",
      `ENCOUNTERS ${encounters.join(" · ") || "none"}`,
      `WORLD ${snapshot.world.participants.map((participant) => `${participant.slotId}:${participant.controller}`).join(" · ")}`,
      `REFERENCES ${environment.references.length} resolved`,
      `PRESENTATION cinematic=${snapshot.presentation.activeCinematicId ?? "none"}`,
      `PAUSES ${environment.pauseReasons.join(",") || "none"}`,
      `SAVE checkpoint=${snapshot.saveRecovery.lastCheckpointId ?? "none"} pending=${snapshot.saveRecovery.pendingCheckpointIds.join(",") || "none"}`,
      `SAVE ELIGIBILITY ${environment.saveEligibility.eligible ? "eligible" : environment.saveEligibility.reason}`,
      `INTEGRITY ${snapshot.rewards.eligible ? "eligible" : snapshot.rewards.invalidationReasons.join(",")}`,
      `DIAGNOSTIC ${snapshot.diagnostic?.message ?? "none"}`,
      "",
      "TRACE",
      ...director.diagnostics.trace().slice(-12).map((entry) => `${entry.tick} ${entry.kind} ${entry.sourceId}`)
    ]);
    this.background.height = Math.max(220, this.body.height + 56);
  }

  override destroy(fromScene?: boolean): void {
    this.subscriptions.unsubscribe();
    this.toggleKey?.off(Phaser.Input.Keyboard.Events.DOWN, this.toggle, this);
    super.destroy(fromScene);
  }
}
