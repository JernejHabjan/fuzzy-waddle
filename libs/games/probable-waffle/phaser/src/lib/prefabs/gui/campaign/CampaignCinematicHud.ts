import Phaser from "phaser";
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { Subscription } from "rxjs";
import { searchCampaignDialogueLog } from "@fuzzy-waddle/probable-waffle-campaign";
import type { CampaignMissionDirector } from "../../../campaign/campaign-mission-director";
import type { CampaignCinematicViewState } from "../../../campaign/presentation/campaign-cinematic-presentation.service";
import type HudProbableWaffle from "../../../world/scenes/hud-scenes/HudProbableWaffle";
/* END-USER-IMPORTS */

export default class CampaignCinematicHud extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    // topBar
    const topBar = scene.add.rectangle(0, 0, 1280, 86, 0x000000);
    topBar.setOrigin(0, 0);
    topBar.isFilled = true;
    this.add(topBar);

    // bottomBar
    const bottomBar = scene.add.rectangle(0, 720, 1280, 132, 0x000000);
    bottomBar.setOrigin(0, 1);
    bottomBar.isFilled = true;
    this.add(bottomBar);

    // titleText
    const titleText = scene.add.text(640, 30, "", {});
    titleText.setOrigin(0.5, 0.5);
    titleText.setStyle({
      color: "#f1d6a4",
      fontFamily: "disposabledroid",
      fontSize: "34px",
      stroke: "#000000",
      strokeThickness: 3,
      resolution: 10
    });
    this.add(titleText);

    // subtitleBackground
    const subtitleBackground = scene.add.rectangle(640, 612, 900, 112, 0x18130f, 0.96);
    subtitleBackground.isFilled = true;
    subtitleBackground.setStrokeStyle(2, 0xc89b53, 1);
    this.add(subtitleBackground);

    // portraitFrame
    const portraitFrame = scene.add.rectangle(242, 612, 86, 86, 0x31261c);
    portraitFrame.isFilled = true;
    portraitFrame.setStrokeStyle(2, 0xc89b53, 1);
    this.add(portraitFrame);

    // portraitFallbackText
    const portraitFallbackText = scene.add.text(242, 612, "", {});
    portraitFallbackText.setOrigin(0.5, 0.5);
    portraitFallbackText.setStyle({
      color: "#f1d6a4",
      fontFamily: "disposabledroid",
      fontSize: "20px",
      align: "center",
      resolution: 10
    });
    portraitFallbackText.setWordWrapWidth(76);
    this.add(portraitFallbackText);

    // speakerText
    const speakerText = scene.add.text(304, 570, "", {});
    speakerText.setStyle({ color: "#e6c27a", fontFamily: "disposabledroid", fontSize: "22px", resolution: 10 });
    this.add(speakerText);

    // subtitleText
    const subtitleText = scene.add.text(304, 598, "", {});
    subtitleText.setStyle({
      color: "#ffffff",
      fontFamily: "disposabledroid",
      fontSize: "22px",
      lineSpacing: 3,
      resolution: 10
    });
    subtitleText.setWordWrapWidth(720);
    this.add(subtitleText);

    // continueText
    const continueText = scene.add.text(1028, 652, "", {});
    continueText.setOrigin(1, 0);
    continueText.text = "Click or press Space";
    continueText.setStyle({ color: "#e6c27a", fontFamily: "disposabledroid", fontSize: "16px", resolution: 10 });
    this.add(continueText);

    // skipRingBackground
    const skipRingBackground = scene.add.ellipse(1208, 648, 48, 48);
    skipRingBackground.setStrokeStyle(4, 0x6c5b43);
    this.add(skipRingBackground);

    // skipText
    const skipText = scene.add.text(1208, 648, "", {});
    skipText.setOrigin(0.5, 0.5);
    skipText.text = "ESC";
    skipText.setStyle({
      color: "#ffffff",
      fontFamily: "disposabledroid",
      fontSize: "14px",
      align: "center",
      resolution: 10
    });
    this.add(skipText);

    // logButton
    const logButton = scene.add.text(18, 18, "", {});
    logButton.text = "[ Dialogue log ]";
    logButton.setStyle({ color: "#e6c27a", fontFamily: "disposabledroid", fontSize: "18px", resolution: 10 });
    this.add(logButton);

    // logPanel
    const logPanel = scene.add.container(640, 360);
    logPanel.visible = false;
    this.add(logPanel);

    // logOverlay
    const logOverlay = scene.add.rectangle(0, 0, 1280, 720, 0x000000, 0.72);
    logOverlay.isFilled = true;
    logPanel.add(logOverlay);

    // logBackground
    const logBackground = scene.add.rectangle(0, 0, 820, 560, 0x241c15, 0.98);
    logBackground.isFilled = true;
    logBackground.setStrokeStyle(3, 0xc89b53, 1);
    logPanel.add(logBackground);

    // logTitle
    const logTitle = scene.add.text(-380, -252, "", {});
    logTitle.text = "Dialogue log";
    logTitle.setStyle({ color: "#f1d6a4", fontFamily: "disposabledroid", fontSize: "30px", resolution: 10 });
    logPanel.add(logTitle);

    // searchText
    const searchText = scene.add.text(-380, -210, "", {});
    searchText.text = "Search:";
    searchText.setStyle({ color: "#e6c27a", fontFamily: "disposabledroid", fontSize: "18px", resolution: 10 });
    logPanel.add(searchText);

    // logBody
    const logBody = scene.add.text(-380, -172, "", {});
    logBody.setStyle({
      color: "#ffffff",
      fontFamily: "disposabledroid",
      fontSize: "18px",
      lineSpacing: 3,
      resolution: 10
    });
    logBody.setWordWrapWidth(760);
    logPanel.add(logBody);

    // closeLogButton
    const closeLogButton = scene.add.text(380, -246, "", {});
    closeLogButton.setOrigin(1, 0);
    closeLogButton.text = "[ Close ]";
    closeLogButton.setStyle({
      color: "#e6c27a",
      fontFamily: "disposabledroid",
      fontSize: "18px",
      resolution: 10
    });
    logPanel.add(closeLogButton);

    this.topBar = topBar;
    this.bottomBar = bottomBar;
    this.titleText = titleText;
    this.subtitleBackground = subtitleBackground;
    this.portraitFrame = portraitFrame;
    this.portraitFallbackText = portraitFallbackText;
    this.speakerText = speakerText;
    this.subtitleText = subtitleText;
    this.continueText = continueText;
    this.skipRingBackground = skipRingBackground;
    this.skipText = skipText;
    this.logButton = logButton;
    this.logPanel = logPanel;
    this.logOverlay = logOverlay;
    this.logBackground = logBackground;
    this.logTitle = logTitle;
    this.searchText = searchText;
    this.logBody = logBody;
    this.closeLogButton = closeLogButton;

    /* START-USER-CTR-CODE */
    this.setDepth(10000);
    this.setVisible(false);
    this.progressGraphics = scene.add.graphics();
    this.add(this.progressGraphics);
    this.subtitleBackground.setInteractive({ useHandCursor: true });
    this.skipText.setInteractive({ useHandCursor: true });
    this.logButton.setInteractive({ useHandCursor: true });
    this.closeLogButton.setInteractive({ useHandCursor: true });
    this.logOverlay.setInteractive();
    this.subtitleBackground.on(Phaser.Input.Events.POINTER_UP, this.acknowledgeDialogue, this);
    this.skipText.on(Phaser.Input.Events.POINTER_DOWN, this.startSkip, this);
    this.skipText.on(Phaser.Input.Events.POINTER_UP, this.stopSkip, this);
    this.skipText.on(Phaser.Input.Events.POINTER_OUT, this.stopSkip, this);
    this.logButton.on(Phaser.Input.Events.POINTER_UP, this.toggleLog, this);
    this.closeLogButton.on(Phaser.Input.Events.POINTER_UP, this.hideLog, this);
    scene.input.keyboard?.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.handleKeyDown, this);
    scene.input.keyboard?.on(Phaser.Input.Keyboard.Events.ANY_KEY_UP, this.handleKeyUp, this);
    scene.scale.on("resize", this.handleResize, this);
    /* END-USER-CTR-CODE */
  }

  private topBar: Phaser.GameObjects.Rectangle;
  private bottomBar: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private subtitleBackground: Phaser.GameObjects.Rectangle;
  private portraitFrame: Phaser.GameObjects.Rectangle;
  private portraitFallbackText: Phaser.GameObjects.Text;
  private speakerText: Phaser.GameObjects.Text;
  private subtitleText: Phaser.GameObjects.Text;
  private continueText: Phaser.GameObjects.Text;
  private skipRingBackground: Phaser.GameObjects.Ellipse;
  private skipText: Phaser.GameObjects.Text;
  private logButton: Phaser.GameObjects.Text;
  private logPanel: Phaser.GameObjects.Container;
  private logOverlay: Phaser.GameObjects.Rectangle;
  private logBackground: Phaser.GameObjects.Rectangle;
  private logTitle: Phaser.GameObjects.Text;
  private searchText: Phaser.GameObjects.Text;
  private logBody: Phaser.GameObjects.Text;
  private closeLogButton: Phaser.GameObjects.Text;

  /* START-USER-CODE */
  private readonly subscriptions = new Subscription();
  private progressGraphics: Phaser.GameObjects.Graphics;
  private portraitSprite?: Phaser.GameObjects.Sprite;
  private director?: CampaignMissionDirector;
  private currentView?: CampaignCinematicViewState;
  private searchQuery = "";

  setup(director: CampaignMissionDirector): void {
    this.director = director;
    this.setVisible(true);
    this.handleResize({ width: this.scene.scale.width, height: this.scene.scale.height });
    this.subscriptions.add(director.cinematicPresentation.view$.subscribe((view) => this.render(view)));
  }

  private render(view: CampaignCinematicViewState): void {
    this.currentView = view;
    this.topBar.setVisible(view.active && view.letterbox);
    this.bottomBar.setVisible(view.active && view.letterbox);
    this.titleText.setText(view.title ?? "").setVisible(view.active && !!view.title);
    const subtitleVisible = !!view.subtitle;
    this.subtitleBackground.setVisible(subtitleVisible);
    this.portraitFrame.setVisible(subtitleVisible);
    this.portraitFallbackText
      .setText(view.subtitle?.portraitFallback ?? "")
      .setVisible(subtitleVisible && !view.subtitle?.portrait);
    this.speakerText.setText(view.subtitle?.speakerName ?? "").setVisible(subtitleVisible);
    this.subtitleText.setText(view.subtitle?.text ?? "").setVisible(subtitleVisible);
    this.continueText.setVisible(subtitleVisible && view.canAcknowledge);
    this.renderPortrait(view);
    this.skipRingBackground.setVisible(view.active);
    this.skipText.setText(view.skipMode === "tap" ? "ESC\nSkip" : "ESC").setVisible(view.active);
    this.drawSkipProgress(view.active ? view.skipProgress : 0);
    this.logButton.setVisible(view.dialogueLog.length > 0 && !view.uiSuppressed);
    this.renderLog();
    (this.scene as HudProbableWaffle).setCampaignUiSuppressed(view.uiSuppressed);
  }

  private renderPortrait(view: CampaignCinematicViewState): void {
    const portrait = view.subtitle?.portrait;
    if (!portrait || !this.scene.textures.exists(portrait.textureKey)) {
      this.portraitSprite?.setVisible(false);
      return;
    }
    this.portraitSprite ??= this.scene.add.sprite(242, 612, portrait.textureKey);
    if (!this.list.includes(this.portraitSprite)) this.add(this.portraitSprite);
    this.portraitSprite.setTexture(portrait.textureKey, portrait.frame).setDisplaySize(80, 80).setVisible(true);
    if (portrait.speakingAnimationKey && this.scene.anims.exists(portrait.speakingAnimationKey)) {
      this.portraitSprite.play(portrait.speakingAnimationKey);
    }
  }

  private drawSkipProgress(progress: number): void {
    this.progressGraphics.clear();
    if (progress <= 0) return;
    this.progressGraphics.lineStyle(5, 0xf1d6a4, 1);
    this.progressGraphics.beginPath();
    this.progressGraphics.arc(1208, 648, 29, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    this.progressGraphics.strokePath();
  }

  private acknowledgeDialogue(): void {
    this.director?.cinematicPresentation.acknowledgeDialogue();
  }

  private startSkip(pointer?: Phaser.Input.Pointer): void {
    pointer?.event.stopPropagation();
    this.director?.cinematicPresentation.requestSkip(true);
  }

  private stopSkip(pointer?: Phaser.Input.Pointer): void {
    pointer?.event.stopPropagation();
    this.director?.cinematicPresentation.requestSkip(false);
  }

  private toggleLog(): void {
    this.logPanel.setVisible(!this.logPanel.visible);
    this.renderLog();
  }

  private hideLog(): void {
    this.logPanel.setVisible(false);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.logPanel.visible && event.key === "Backspace") {
      this.searchQuery = this.searchQuery.slice(0, -1);
      this.renderLog();
      event.preventDefault();
      return;
    }
    if (this.logPanel.visible && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.searchQuery = `${this.searchQuery}${event.key}`.slice(0, 48);
      this.renderLog();
      return;
    }
    if (event.key === "Escape" && this.currentView?.active) {
      this.director?.cinematicPresentation.requestSkip(true);
      event.stopPropagation();
      return;
    }
    if ((event.key === " " || event.key === "Enter") && this.currentView?.subtitle) {
      this.acknowledgeDialogue();
      event.stopPropagation();
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    this.director?.cinematicPresentation.requestSkip(false);
    if (this.currentView?.active) event.stopPropagation();
  }

  private renderLog(): void {
    const entries = searchCampaignDialogueLog(this.currentView?.dialogueLog ?? [], this.searchQuery).slice(-14);
    this.searchText.setText(`Search: ${this.searchQuery || "type to filter"}`);
    this.logBody.setText(entries.flatMap((entry) => [`${entry.speakerName}:`, `  ${entry.text}`, ""]));
  }

  private handleResize(gameSize: { width: number; height: number }): void {
    const scale = Math.max(0.5, Math.min(gameSize.width / 1280, gameSize.height / 720));
    this.setScale(scale);
    this.x = (gameSize.width - 1280 * scale) / 2;
    this.y = (gameSize.height - 720 * scale) / 2;
  }

  override destroy(fromScene?: boolean): void {
    this.subscriptions.unsubscribe();
    (this.scene as HudProbableWaffle).setCampaignUiSuppressed(false);
    this.scene.input.keyboard?.off(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.handleKeyDown, this);
    this.scene.input.keyboard?.off(Phaser.Input.Keyboard.Events.ANY_KEY_UP, this.handleKeyUp, this);
    this.scene.scale.off("resize", this.handleResize, this);
    this.subtitleBackground.off(Phaser.Input.Events.POINTER_UP, this.acknowledgeDialogue, this);
    this.skipText.off(Phaser.Input.Events.POINTER_DOWN, this.startSkip, this);
    this.skipText.off(Phaser.Input.Events.POINTER_UP, this.stopSkip, this);
    this.skipText.off(Phaser.Input.Events.POINTER_OUT, this.stopSkip, this);
    this.logButton.off(Phaser.Input.Events.POINTER_UP, this.toggleLog, this);
    this.closeLogButton.off(Phaser.Input.Events.POINTER_UP, this.hideLog, this);
    super.destroy(fromScene);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
