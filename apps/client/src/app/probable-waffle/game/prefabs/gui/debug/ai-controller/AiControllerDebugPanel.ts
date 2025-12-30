// You can write more code here

/* START OF COMPILED CODE */

import OnPointerDownScript from "../../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../../../../../../shared/game/phaser/script-nodes/PushActionScript";
import OnPointerUpScript from "../../../../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
import EmitEventActionScript from "../../../../../../shared/game/phaser/script-nodes-basic/EmitEventActionScript";
import AiControllerDebugLabel from "./AiControllerDebugLabel";
/* START-USER-IMPORTS */
import { getPlayers } from "../../../../data/scene-data";
import HudProbableWaffle from "../../../../world/scenes/hud-scenes/HudProbableWaffle";
import { ProbableWafflePlayerType } from "@fuzzy-waddle/api-interfaces";
import { getSceneService } from "../../../../world/services/scene-component-helpers";
import { DebuggingService } from "../../../../world/services/DebuggingService";
/* END-USER-IMPORTS */

export default class AiControllerDebugPanel extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 200.21157284311968, y ?? 0);

    // button
    const button = scene.add.container(-150.21157898014727, 15);
    button.setInteractive(
      new Phaser.Geom.Rectangle(-32, -13, 182.0350429198294, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    this.add(button);

    // game_action_bg
    const game_action_bg = scene.add.nineslice(
      60,
      0,
      "gui",
      "cryos_mini_gui/buttons/button_small.png",
      90,
      20,
      3,
      3,
      3,
      3
    );
    game_action_bg.scaleX = 2.0762647352357817;
    game_action_bg.scaleY = 1.5492262688240692;
    button.add(game_action_bg);

    // buttonText
    const buttonText = scene.add.text(69.74578515529078, -1, "", {});
    buttonText.setOrigin(0.5472303972883584, 0.5);
    buttonText.text = "Show AI debugging";
    buttonText.setStyle({ color: "#000000ff", fontFamily: "disposabledroid", fontSize: "22px", resolution: 10 });
    button.add(buttonText);

    // onPointerDownScript
    const onPointerDownScript = new OnPointerDownScript(button);

    // actor_action_click
    new PushActionScript(onPointerDownScript);

    // onPointerUpScript_menu_9
    const onPointerUpScript_menu_9 = new OnPointerUpScript(button);

    // emitActorAction
    const emitActorAction = new EmitEventActionScript(onPointerUpScript_menu_9);

    // aiControllerDebugLabel
    const aiControllerDebugLabel = new AiControllerDebugLabel(scene, 0, 32);
    this.add(aiControllerDebugLabel);

    // emitActorAction (prefab fields)
    emitActorAction.eventName = "action";

    this.buttonText = buttonText;
    this.button = button;
    this.aiControllerDebugLabel = aiControllerDebugLabel;

    /* START-USER-CTR-CODE */
    this.init();
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate, this); // periodic telemetry refresh
    /* END-USER-CTR-CODE */
  }

  private buttonText: Phaser.GameObjects.Text;
  private button: Phaser.GameObjects.Container;
  private aiControllerDebugLabel: AiControllerDebugLabel;

  /* START-USER-CODE */
  private enabled = false;
  private labels: AiControllerDebugLabel[] = [];
  private labelsContainer!: Phaser.GameObjects.Container;
  private categoryButtons: Map<string, Phaser.GameObjects.Container> = new Map();
  private categoryButtonsContainer!: Phaser.GameObjects.Container;
  private backButton?: Phaser.GameObjects.Container;
  private selectedCategory: string | null = null;

  private init() {
    this.button.on("action", this.toggleLabels, this);
    this.aiControllerDebugLabel.destroy();

    this.labelsContainer = this.scene.add.container(0, 50);
    this.labelsContainer.setVisible(false);
    this.add(this.labelsContainer);

    this.categoryButtonsContainer = this.scene.add.container(0, 50);
    this.categoryButtonsContainer.setVisible(false);
    this.add(this.categoryButtonsContainer);
  }

  private onUpdate() {
    if (!this.enabled) return;
    const now = performance.now();
    this.labels.forEach((lbl) => lbl.refreshTelemetry(now));
  }

  private toggleLabels() {
    this.enabled = !this.enabled;
    this.buttonText.text = this.enabled ? "Hide AI debugging" : "Show AI debugging";
    const aiDebuggingService = getSceneService(this.mainScene, DebuggingService);
    if (aiDebuggingService) {
      aiDebuggingService.debug = this.enabled;
      aiDebuggingService.debugChanged.next(this.enabled);
    }

    this.categoryButtonsContainer.setVisible(this.enabled);
    this.labelsContainer.setVisible(false);

    if (this.enabled) {
      this.selectedCategory = null;
      this.showCategorySelection();
    } else {
      this.hideCategorySelection();
      this.labels.forEach((label) => label.destroy());
      this.labels = [];
      this.labelsContainer.removeAll(true);
    }
  }

  private showCategorySelection() {
    this.categoryButtonsContainer.removeAll(true);
    this.categoryButtons.clear();

    const categories = [
      { id: "strategy", label: "Strategy & Combat" },
      { id: "resources", label: "Resources & Economy" },
      { id: "production", label: "Production & Tech" },
      { id: "logistics", label: "Logistics & Workers" },
      { id: "intel", label: "Enemy Intel & Scouting" },
      { id: "thresholds", label: "Adaptive Thresholds" }
    ];

    let currentY = 0;
    categories.forEach((category) => {
      const button = this.createCategoryButton(category.label, category.id, 0, currentY);
      const buttonWidth = button.getBounds().width;
      button.x = -(buttonWidth / 2 + buttonWidth / 4);

      this.categoryButtonsContainer.add(button);
      this.categoryButtons.set(category.id, button);
      currentY += 35;
    });
  }

  private createCategoryButton(label: string, categoryId: string, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    container.setInteractive(new Phaser.Geom.Rectangle(-32, -13, 220, 25), Phaser.Geom.Rectangle.Contains);

    const bg = this.scene.add.nineslice(60, 0, "gui", "cryos_mini_gui/buttons/button_small.png", 110, 20, 3, 3, 3, 3);
    bg.scaleX = 2;
    bg.scaleY = 1.3;
    container.add(bg);

    const text = this.scene.add.text(70, -1, label, {
      color: "#000000ff",
      fontFamily: "disposabledroid",
      fontSize: "18px",
      resolution: 10
    });
    text.setOrigin(0.5, 0.5);
    container.add(text);

    container.on("pointerdown", () => {
      this.selectCategory(categoryId);
    });

    return container;
  }

  private createBackButton(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    container.setInteractive(new Phaser.Geom.Rectangle(-32, -13, 120, 25), Phaser.Geom.Rectangle.Contains);

    const bg = this.scene.add.nineslice(40, 0, "gui", "cryos_mini_gui/buttons/button_small.png", 70, 20, 3, 3, 3, 3);
    bg.scaleX = 1.5;
    bg.scaleY = 1.3;
    container.add(bg);

    const text = this.scene.add.text(40, -1, "← Back", {
      color: "#000000ff",
      fontFamily: "disposabledroid",
      fontSize: "18px",
      resolution: 10
    });
    text.setOrigin(0.5, 0.5);
    container.add(text);

    container.on("pointerdown", () => {
      this.deselectCategory();
    });

    const buttonWidth = container.getBounds().width;
    container.x = -(buttonWidth / 2 + buttonWidth / 4 + 10);

    return container;
  }

  private selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;
    this.categoryButtonsContainer.setVisible(false);
    this.labelsContainer.setVisible(true);

    // Clear previous labels
    this.labels.forEach((label) => label.destroy());
    this.labels = [];
    this.labelsContainer.removeAll(true);

    // Add back button
    if (this.backButton) {
      this.backButton.destroy();
    }
    this.backButton = this.createBackButton(0, 0);
    this.labelsContainer.add(this.backButton);

    // Create labels for each AI player
    const aiPlayers = getPlayers(this.mainScene).filter(
      (p) => p.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.AI
    );

    let currentY = 40;
    aiPlayers.forEach((player) => {
      const aiControllerDebugLabel = new AiControllerDebugLabel(this.scene, 0, currentY);
      aiControllerDebugLabel.setPlayer(player.playerNumber!, categoryId);
      this.labelsContainer.add(aiControllerDebugLabel);
      currentY += 400; // Increased spacing for more detailed info
      this.labels.push(aiControllerDebugLabel);
    });
  }

  private deselectCategory() {
    this.selectedCategory = null;
    this.categoryButtonsContainer.setVisible(true);
    this.labelsContainer.setVisible(false);

    if (this.backButton) {
      this.backButton.destroy();
      this.backButton = undefined;
    }

    this.labels.forEach((label) => label.destroy());
    this.labels = [];
    this.labelsContainer.removeAll(true);
  }

  private hideCategorySelection() {
    this.categoryButtonsContainer.removeAll(true);
    this.categoryButtons.clear();
    if (this.backButton) {
      this.backButton.destroy();
      this.backButton = undefined;
    }
  }

  get mainScene() {
    return (this.scene as HudProbableWaffle).probableWaffleScene!;
  }

  override destroy() {
    this.button.off("action", this.toggleLabels, this);
    this.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);
    this.labels.forEach((label) => label.destroy());
    if (this.labelsContainer) this.labelsContainer.destroy();
    if (this.categoryButtonsContainer) this.categoryButtonsContainer.destroy();
    if (this.backButton) this.backButton.destroy();
    this.categoryButtons.clear();
    super.destroy();
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
