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
import { type PlayerNumber, ProbableWafflePlayerType } from "@fuzzy-waddle/api-interfaces";
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
  private playerButtons: Map<number, Phaser.GameObjects.Container> = new Map();
  private playerButtonsContainer!: Phaser.GameObjects.Container;
  private categoryBackButton?: Phaser.GameObjects.Container;
  private playerBackButton?: Phaser.GameObjects.Container;
  private backButton?: Phaser.GameObjects.Container;
  private selectedCategory: string | null = null;
  private selectedPlayerNumber: PlayerNumber | null = null;

  private init() {
    this.button.on("action", this.toggleLabels, this);
    this.aiControllerDebugLabel.destroy();

    this.labelsContainer = this.scene.add.container(0, 50);
    this.labelsContainer.setVisible(false);
    this.add(this.labelsContainer);

    this.categoryButtonsContainer = this.scene.add.container(0, 50);
    this.categoryButtonsContainer.setVisible(false);
    this.add(this.categoryButtonsContainer);

    this.playerButtonsContainer = this.scene.add.container(0, 50);
    this.playerButtonsContainer.setVisible(false);
    this.add(this.playerButtonsContainer);
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

    this.categoryButtonsContainer.setVisible(false);
    this.labelsContainer.setVisible(false);
    this.playerButtonsContainer.setVisible(this.enabled);

    if (this.enabled) {
      this.selectedCategory = null;
      this.selectedPlayerNumber = null;
      this.showPlayerSelection();
    } else {
      this.hideAllSelections();
    }
  }

  private showPlayerSelection() {
    this.playerButtonsContainer.removeAll(true);
    this.playerButtons.clear();
    this.categoryButtonsContainer.setVisible(false);
    this.labelsContainer.setVisible(false);
    this.playerButtonsContainer.setVisible(true);

    const aiPlayers = getPlayers(this.mainScene).filter(
      (p) => p.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.AI
    );

    let currentY = 0;
    aiPlayers.forEach((player) => {
      const button = this.createPlayerButton(`AI Player ${player.playerNumber}`, player.playerNumber!, 0, currentY);
      const buttonWidth = button.getBounds().width;
      button.x = -(buttonWidth / 2 + buttonWidth / 4);

      this.playerButtonsContainer.add(button);
      this.playerButtons.set(player.playerNumber!, button);
      currentY += 35;
    });
  }

  private createPlayerButton(
    label: string,
    playerNumber: PlayerNumber,
    x: number,
    y: number
  ): Phaser.GameObjects.Container {
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
      this.selectPlayer(playerNumber);
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

  private createPlayerBackButton(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    container.setInteractive(new Phaser.Geom.Rectangle(-32, -13, 150, 25), Phaser.Geom.Rectangle.Contains);

    const bg = this.scene.add.nineslice(40, 0, "gui", "cryos_mini_gui/buttons/button_small.png", 90, 20, 3, 3, 3, 3);
    bg.scaleX = 1.6;
    bg.scaleY = 1.3;
    container.add(bg);

    const text = this.scene.add.text(40, -1, "← Players", {
      color: "#000000ff",
      fontFamily: "disposabledroid",
      fontSize: "18px",
      resolution: 10
    });
    text.setOrigin(0.5, 0.5);
    container.add(text);

    container.on("pointerdown", () => {
      this.deselectPlayer();
    });

    const buttonWidth = container.getBounds().width;
    container.x = -(buttonWidth / 2 + buttonWidth / 4);

    return container;
  }

  private selectPlayer(playerNumber: PlayerNumber) {
    this.selectedPlayerNumber = playerNumber;
    this.selectedCategory = null;
    this.showCategorySelection();
  }

  private showCategorySelection() {
    this.categoryButtonsContainer.removeAll(true);
    this.categoryButtons.clear();
    this.playerButtonsContainer.setVisible(false);
    this.labelsContainer.setVisible(false);
    this.categoryButtonsContainer.setVisible(true);

    const categories = [
      { id: "strategy", label: "Strategy & Combat" },
      { id: "resources", label: "Resources & Economy" },
      { id: "production", label: "Production & Tech" },
      { id: "logistics", label: "Logistics & Workers" },
      { id: "intel", label: "Enemy Intel & Scouting" },
      { id: "thresholds", label: "Adaptive Thresholds" }
    ];

    let currentY = 40;
    categories.forEach((category) => {
      const button = this.createCategoryButton(category.label, category.id, 0, currentY);
      const buttonWidth = button.getBounds().width;
      button.x = -(buttonWidth / 2 + buttonWidth / 4);

      this.categoryButtonsContainer.add(button);
      this.categoryButtons.set(category.id, button);
      currentY += 35;
    });

    if (this.playerBackButton) this.playerBackButton.destroy();
    this.playerBackButton = this.createPlayerBackButton(0, 0);
    this.categoryButtonsContainer.add(this.playerBackButton);
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

  private selectCategory(categoryId: string) {
    if (this.selectedPlayerNumber == null) {
      this.showPlayerSelection();
      return;
    }
    this.selectedCategory = categoryId;
    this.categoryButtonsContainer.setVisible(false);
    this.labelsContainer.setVisible(true);

    this.labels.forEach((label) => label.destroy());
    this.labels = [];
    this.labelsContainer.removeAll(true);

    if (this.backButton) {
      this.backButton.destroy();
    }
    this.backButton = this.createBackButton(0, 0);
    this.labelsContainer.add(this.backButton);

    const aiControllerDebugLabel = new AiControllerDebugLabel(this.scene, 0, 40);
    aiControllerDebugLabel.setPlayer(this.selectedPlayerNumber, categoryId);
    this.labelsContainer.add(aiControllerDebugLabel);
    this.labels.push(aiControllerDebugLabel);
  }

  private deselectCategory() {
    this.selectedCategory = null;
    this.labelsContainer.setVisible(false);
    if (this.backButton) {
      this.backButton.destroy();
      this.backButton = undefined;
    }
    this.labels.forEach((label) => label.destroy());
    this.labels = [];
    this.labelsContainer.removeAll(true);
    this.categoryButtonsContainer.setVisible(true);
  }

  private deselectPlayer() {
    this.selectedPlayerNumber = null;
    this.selectedCategory = null;
    if (this.playerBackButton) {
      this.playerBackButton.destroy();
      this.playerBackButton = undefined;
    }
    this.categoryButtonsContainer.setVisible(false);
    this.labelsContainer.setVisible(false);
    this.showPlayerSelection();
  }

  private hideAllSelections() {
    this.categoryButtonsContainer.removeAll(true);
    this.categoryButtons.clear();
    this.playerButtonsContainer.removeAll(true);
    this.playerButtons.clear();
    if (this.backButton) {
      this.backButton.destroy();
      this.backButton = undefined;
    }
    if (this.playerBackButton) {
      this.playerBackButton.destroy();
      this.playerBackButton = undefined;
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
    if (this.playerButtonsContainer) this.playerButtonsContainer.destroy();
    if (this.backButton) this.backButton.destroy();
    if (this.playerBackButton) this.playerBackButton.destroy();
    this.categoryButtons.clear();
    this.playerButtons.clear();
    super.destroy();
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
