// You can write more code here

/* START OF COMPILED CODE */

import ActorActions from "../../../prefabs/gui/buttons/ActorActions";
import ActorInfoContainer from "../../../prefabs/gui/labels/ActorInfoContainer";
import Minimap from "../../../prefabs/gui/Minimap";
import GameActions from "../../../prefabs/gui/buttons/GameActions";
import Resources from "../../../prefabs/gui/labels/Resources";
import AiControllerDebugPanel from "../../../prefabs/gui/debug/ai-controller/AiControllerDebugPanel";
import GameSpeedModifier from "../../../prefabs/gui/buttons/GameSpeedModifier";
import HudMessages from "../../../prefabs/gui/labels/HudMessages";
import GroupContainer from "../../../prefabs/gui/labels/GroupContainer";
import IdleWorkersButton from "../../../prefabs/gui/buttons/IdleWorkersButton";
import ChatButton from "../../../prefabs/gui/buttons/ChatButton";
import ChatNotification from "../../../prefabs/gui/labels/ChatNotification";
/* START-USER-IMPORTS */
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { HudGameState } from "../../../hud/hud-game-state";
import { HudElementVisibilityHandler } from "../../../hud/hud-element-visibility.handler";
import { CursorHandler } from "../../../player/human-controller/cursor.handler";
import { MultiSelectionHandler } from "../../../player/human-controller/multi-selection.handler";
import {
  type AllScenesEventData,
  ProbableWaffleGameInstanceType,
  ProbableWafflePlayerType
} from "@fuzzy-waddle/api-interfaces";
import { getGameObjectBounds } from "../../../data/game-object-helper";
import { filter, Subscription } from "rxjs";
import { environment } from "../../../../../../environments/environment";
import ConfirmationDialog from "../../../prefabs/gui/dialogs/ConfirmationDialog";
import SurrenderDialog from "../../../prefabs/gui/SurrenderDialog";
import { getPlayers } from "../../../data/scene-data";
import { ConnectionRecoveryService } from "../../services/recovery/connection-recovery.service";
import { getSceneService } from "../../services/scene-component-helpers";
import { SceneLightingService } from "../../services/lighting/scene-lighting.service";
import { NavigationDebugService } from "../../services/navigation-debug.service";
/* END-USER-IMPORTS */

export default class HudProbableWaffle extends ProbableWaffleScene {
  constructor() {
    super("HudProbableWaffle");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // actor_actions_container
    const actor_actions_container = new ActorActions(this, 1280, 720);
    this.add.existing(actor_actions_container);

    // actor_info_container
    const actor_info_container = new ActorInfoContainer(this, 1024, 720);
    this.add.existing(actor_info_container);
    actor_info_container.scaleX = 2.2;
    actor_info_container.scaleY = 2.2;

    // minimap_container
    const minimap_container = new Minimap(this, 0, 720);
    this.add.existing(minimap_container);

    // game_actions_container
    const game_actions_container = new GameActions(this, 1280, 2);
    this.add.existing(game_actions_container);

    // resources_container
    const resources_container = new Resources(this, 16, 17);
    this.add.existing(resources_container);

    // aiControllerDebugPanel
    const aiControllerDebugPanel = new AiControllerDebugPanel(this, 1276, 82);
    this.add.existing(aiControllerDebugPanel);

    // gameSpeedModifier
    const gameSpeedModifier = new GameSpeedModifier(this, 13, 486);
    this.add.existing(gameSpeedModifier);

    // hudMessages
    const hudMessages = new HudMessages(this, 6, 472);
    this.add.existing(hudMessages);
    hudMessages.setStyle({});

    // groupContainer
    const groupContainer = new GroupContainer(this, 552, 541);
    this.add.existing(groupContainer);

    // idleWorkersButton
    const idleWorkersButton = new IdleWorkersButton(this, 13, 520);
    this.add.existing(idleWorkersButton);

    // chatButton
    const chatButton = new ChatButton(this, 13, 560);
    this.add.existing(chatButton);

    // chatNotification
    const chatNotification = new ChatNotification(this, 13, 500);
    this.add.existing(chatNotification);

    // dayNightClockText
    const dayNightClockText = this.add.text(13, 692, "", {
      color: "#ffffffff",
      fontFamily: "disposabledroid",
      fontSize: "18px",
      resolution: 10,
      stroke: "#000000ff",
      strokeThickness: 3
    });
    dayNightClockText.setOrigin(0, 1);

    // lists
    const hudElements: Array<any> = [];

    this.actor_actions_container = actor_actions_container;
    this.actor_info_container = actor_info_container;
    this.minimap_container = minimap_container;
    this.game_actions_container = game_actions_container;
    this.resources_container = resources_container;
    this.aiControllerDebugPanel = aiControllerDebugPanel;
    this.gameSpeedModifier = gameSpeedModifier;
    this.hudMessages = hudMessages;
    this.groupContainer = groupContainer;
    this.idleWorkersButton = idleWorkersButton;
    this.chatButton = chatButton;
    this.chatNotification = chatNotification;
    this.dayNightClockText = dayNightClockText;
    this.hudElements = hudElements;

    this.events.emit("scene-awake");
  }

  public actor_actions_container!: ActorActions;
  private actor_info_container!: ActorInfoContainer;
  private minimap_container!: Minimap;
  private game_actions_container!: GameActions;
  private resources_container!: Resources;
  private aiControllerDebugPanel!: AiControllerDebugPanel;
  private gameSpeedModifier!: GameSpeedModifier;
  private hudMessages!: HudMessages;
  private groupContainer!: GroupContainer;
  private idleWorkersButton!: IdleWorkersButton;
  private chatButton!: ChatButton;
  private chatNotification!: ChatNotification;
  private dayNightClockText!: Phaser.GameObjects.Text;
  private hudElements!: Array<any>;

  /* START-USER-CODE */
  public confirmationDialog!: ConfirmationDialog;
  public surrenderDialog!: SurrenderDialog;
  private saveGameSubscription?: Subscription;
  private chatMessageSubscription?: Subscription;
  private readonly actorInfoSmallScreenBreakpoint = 1200;
  private readonly dayNightClockBottomMargin = 14;
  private readonly dayNightClockRefreshIntervalMs = 100;
  private cursorHandler?: CursorHandler;
  private connectionRecovery?: ConnectionRecoveryService;
  private dayNightClockAccumulatorMs = 0;
  private lastDayNightClockText = "";
  private navigationDebugButton?: Phaser.GameObjects.Container;
  private navigationDebugButtonText?: Phaser.GameObjects.Text;

  probableWaffleScene?: ProbableWaffleScene;
  override preload() {
    this.load.pack("asset-pack-gui", "assets/probable-waffle/asset-packers/asset-pack-probable-waffle-gui.json");
  }

  override create() {
    this.editorCreate();
    this.createNavigationDebugButton();

    this.confirmationDialog = new ConfirmationDialog(this, 640, 360);
    this.add.existing(this.confirmationDialog);

    this.surrenderDialog = new SurrenderDialog(this, 640, 360);
    this.add.existing(this.surrenderDialog);

    // resize the scene to match the screen size
    this.scale.on("resize", this.resize, this);
    this.resize({ height: this.scale.height, width: this.scale.width });

    new HudGameState(this, this.probableWaffleScene!);
    new HudElementVisibilityHandler(this, this.hudElements);
    this.cursorHandler = new CursorHandler(this);
    this.sceneGameData.components.push(new MultiSelectionHandler(this, this.probableWaffleScene!), this.cursorHandler);

    this.minimap_container.initializeWithParentScene(this.probableWaffleScene!, this);

    this.hudMessages.setup(this.probableWaffleScene!);

    this.idleWorkersButton.setup(this.probableWaffleScene!);

    // Initialize cursor handler with main scene for hover detection
    if (this.probableWaffleScene && this.cursorHandler) {
      this.cursorHandler.initializeWithMainScene(this.probableWaffleScene);
    }

    this.refreshDayNightClock(true);
  }

  initializeWithParentScene(probableWaffleScene: ProbableWaffleScene) {
    this.probableWaffleScene = probableWaffleScene;
    this.subscribeToSaveGameEvent();
    this.subscribeToChatMessageEvents();
    this.subscribeToSceneShutdown();

    this.connectionRecovery = new ConnectionRecoveryService();
    this.connectionRecovery.init(this, probableWaffleScene);

    // Initialize cursor handler with main scene if it was created before the parent scene was set
    if (this.cursorHandler) {
      this.cursorHandler.initializeWithMainScene(probableWaffleScene);
    }
  }

  private subscribeToSceneShutdown() {
    this.onShutdown.subscribe(() => {
      // Emit event to close chat modal when leaving the game
      this.communicator.allScenes.emit({
        name: "hud-scene-shutdown",
        data: undefined
      });
      this.connectionRecovery?.destroy();
    });
  }

  private resize(gameSize: { height: number; width: number }) {
    this.cameras.resize(gameSize.width, gameSize.height);
    this.updatePositionOfUiElements();
  }

  private updatePositionOfUiElements() {
    const sceneWidth = this.scale.width;

    // set resources top left
    this.resources_container.x = 10;
    this.resources_container.y = 10;
    this.resources_container.scale = 1;
    this.resources_container.setMobileLayout(sceneWidth <= this.actorInfoSmallScreenBreakpoint);

    // set game actions to top right
    this.game_actions_container.x = this.scale.width - 10;
    this.game_actions_container.y = 10;
    this.game_actions_container.scale = sceneWidth > this.actorInfoSmallScreenBreakpoint ? 2 : 1.5;

    // set minimap to bottom left
    this.minimap_container.x = 0;
    this.minimap_container.y = this.scale.height;
    // set width of minimap container to match the minimap
    this.minimap_container.scaleX = sceneWidth > this.minimap_container.minimapSmallScreenBreakpoint ? 1.026 : 0.55;
    this.minimap_container.scaleY = sceneWidth > this.minimap_container.minimapSmallScreenBreakpoint ? 0.953 : 0.55;
    this.minimap_container.visible = sceneWidth > this.minimap_container.minimapHideBreakpoint;
    const minimapBounds = getGameObjectBounds(this.minimap_container)!;
    const minimapHeight = minimapBounds.height;

    // set hudMessages above minimap on left side
    this.hudMessages.x = 10;
    this.hudMessages.y = this.scale.height - minimapHeight - 10;

    // set actor actions to bottom right
    this.actor_actions_container.x = this.scale.width;
    this.actor_actions_container.y = this.scale.height;
    this.actor_actions_container.scale = sceneWidth > this.actorInfoSmallScreenBreakpoint ? 1 : 0.7;

    // set actor info to bottom center (just left of actor actions)
    const actorActionsWidth = getGameObjectBounds(this.actor_actions_container)!.width;
    this.actor_info_container.x = this.scale.width - actorActionsWidth;
    this.actor_info_container.y = this.scale.height;
    // hide on small devices
    this.actor_info_container.visible = sceneWidth > this.actorInfoSmallScreenBreakpoint;

    // set groupContainer above actor_info_container on the left side and hide on small devices
    const actorInfoContainerBounds = getGameObjectBounds(this.actor_info_container)!;
    this.groupContainer.x = this.actor_info_container.x - actorInfoContainerBounds.width;
    this.groupContainer.y = this.actor_info_container.y - actorInfoContainerBounds.height;
    this.groupContainer.visible = sceneWidth > this.actorInfoSmallScreenBreakpoint;

    // set AI controller debug panel to top right below game actions
    const gameActionsHeight = getGameObjectBounds(this.game_actions_container)!.height;
    this.aiControllerDebugPanel.x = this.scale.width - 10;
    this.aiControllerDebugPanel.y = gameActionsHeight + 10;
    this.aiControllerDebugPanel.scale = sceneWidth > this.actorInfoSmallScreenBreakpoint ? 1 : 0.7;
    this.aiControllerDebugPanel.visible = !environment.production;

    if (this.navigationDebugButton) {
      this.navigationDebugButton.x = this.aiControllerDebugPanel.x - 238;
      this.navigationDebugButton.y = this.aiControllerDebugPanel.y + 15;
      this.navigationDebugButton.scale = this.aiControllerDebugPanel.scale;
      this.navigationDebugButton.visible = !environment.production;
    }

    // position game speed modifier above minimap on left side
    this.gameSpeedModifier.x = 10;
    this.gameSpeedModifier.y = this.scale.height - minimapHeight + 10;
    this.gameSpeedModifier.scale = sceneWidth > this.actorInfoSmallScreenBreakpoint ? 1 : 0.7;
    // hide if game mode is not single player
    this.gameSpeedModifier.visible =
      (this.gameType === ProbableWaffleGameInstanceType.InstantGame ||
        this.gameType === ProbableWaffleGameInstanceType.Replay ||
        this.gameType === ProbableWaffleGameInstanceType.Skirmish) &&
      sceneWidth > this.minimap_container.minimapHideBreakpoint;

    // position idle workers button below game speed modifier on left side
    this.idleWorkersButton.x = 10;
    this.idleWorkersButton.y = this.gameSpeedModifier.y + 40;
    // if game speed modifier is hidden, position idle workers button at same height as game speed modifier
    if (!this.gameSpeedModifier.visible) {
      this.idleWorkersButton.y = this.gameSpeedModifier.y;
    }
    this.idleWorkersButton.scale = sceneWidth > this.actorInfoSmallScreenBreakpoint ? 1 : 0.7;
    this.idleWorkersButton.visible = sceneWidth > this.minimap_container.minimapHideBreakpoint;

    // position chat button at the top on right side of minimap
    // hide for Skirmish mode (single-player) and small screens
    const nrOfRemainingHumanPlayers = getPlayers(this.probableWaffleScene!).filter(
      (p) =>
        p.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.Human &&
        !p.playerController.data.leftOrKilled
    ).length;

    const isChatVisible =
      (this.gameType === ProbableWaffleGameInstanceType.Matchmaking ||
        this.gameType === ProbableWaffleGameInstanceType.SelfHosted) &&
      nrOfRemainingHumanPlayers > 1 &&
      sceneWidth > this.minimap_container.minimapHideBreakpoint;
    this.chatButton.x = minimapBounds.right - 60;
    this.chatButton.y = this.scale.height - minimapHeight + 10;
    this.chatButton.scale = sceneWidth > this.actorInfoSmallScreenBreakpoint ? 1 : 0.7;
    this.chatButton.visible = isChatVisible;

    // position chat notification above chat button on left side
    this.chatNotification.x = 10;
    this.chatNotification.y = this.chatButton.y - 10;
    this.chatNotification.scale = sceneWidth > this.actorInfoSmallScreenBreakpoint ? 1 : 0.7;

    // Anchor the day/night clock to the bottom-left HUD column under the worker controls.
    this.dayNightClockText.x = 12;
    this.dayNightClockText.y = this.scale.height - this.dayNightClockBottomMargin;
    this.dayNightClockText.scale = sceneWidth > this.actorInfoSmallScreenBreakpoint ? 1 : 0.8;

    // position surrender dialog in center of screen
    this.surrenderDialog.x = this.scale.width / 2;
    this.surrenderDialog.y = this.scale.height / 2;

    // redraw minimap
    this.minimap_container.redrawMinimap();

    // position confirmation dialog in center of screen
    this.confirmationDialog.x = this.scale.width / 2;
    this.confirmationDialog.y = this.scale.height / 2;

    this.refreshDayNightClock(true);
  }

  private get gameType() {
    return this.probableWaffleScene?.baseGameData.gameInstance.gameInstanceMetadata.data.type;
  }

  private createNavigationDebugButton(): void {
    if (environment.production) return;

    const button = this.add.container(0, 0);
    button.setInteractive(new Phaser.Geom.Rectangle(-90, -13, 190, 26), Phaser.Geom.Rectangle.Contains);
    const bg = this.add.nineslice(0, 0, "gui", "cryos_mini_gui/buttons/button_small.png", 95, 20, 3, 3, 3, 3);
    bg.scaleX = 2.1;
    bg.scaleY = 1.55;
    const text = this.add.text(0, -1, "Show navigation debugging", {
      color: "#000000ff",
      fontFamily: "disposabledroid",
      fontSize: "20px",
      resolution: 10
    });
    text.setOrigin(0.5, 0.5);
    button.add([bg, text]);
    button.on("pointerup", () => this.toggleNavigationDebugging());
    this.navigationDebugButton = button;
    this.navigationDebugButtonText = text;
  }

  private toggleNavigationDebugging(): void {
    if (!this.probableWaffleScene) return;
    const debugService = getSceneService(this.probableWaffleScene, NavigationDebugService);
    if (!debugService) return;
    debugService.setEnabled(!debugService.isEnabled());
    if (this.navigationDebugButtonText) {
      this.navigationDebugButtonText.text = debugService.isEnabled()
        ? "Hide navigation debugging"
        : "Show navigation debugging";
    }
  }

  private subscribeToGameEvent(eventName: string, displayText: string) {
    if (!this.probableWaffleScene) return;

    return this.probableWaffleScene.communicator.allScenes
      .pipe(filter((value) => value.name === eventName))
      .subscribe(() => {
        // wait so saving is done
        setTimeout(() => {
          const text = this.add.text(this.scale.width / 2, this.scale.height / 2, displayText, {
            fontSize: "32px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 20, y: 10 }
          });
          text.setOrigin(0.5);
          // Intentional wall-clock timer for transient HUD toast cleanup.
          this.time.delayedCall(500, () => text.destroy());
        });
      });
  }

  private subscribeToSaveGameEvent() {
    this.saveGameSubscription = this.subscribeToGameEvent("save-game", "Game saved");
  }

  private subscribeToChatMessageEvents() {
    if (!this.probableWaffleScene) return;

    // Subscribe to chat message received events from Angular
    this.chatMessageSubscription = this.probableWaffleScene.communicator.allScenes
      .pipe(
        filter(
          (value): value is Extract<AllScenesEventData, { name: "chat-message-received" }> =>
            value.name === "chat-message-received"
        )
      )
      .subscribe((event) => {
        const { fullName, text } = event.data;
        this.chatNotification.showMessage(fullName, text);
        this.chatButton?.showUnreadBadge();
      });

    // show example chat message on startup in dev mode after 2 seconds
    // if (!environment.production) {
    //   // Intentional wall-clock timer: this sample notification is purely HUD debug behavior.
    //   this.time.delayedCall(2000, () => {
    //     this.chatNotification.showMessage("Test User", "Hello! This is an example chat message.");
    //     this.chatButton?.showUnreadBadge();
    //   });
    // }
  }

  override destroy() {
    this.saveGameSubscription?.unsubscribe();
    this.chatMessageSubscription?.unsubscribe();
    this.connectionRecovery?.destroy();
    super.destroy();
  }

  override update(_time: number, delta: number) {
    this.dayNightClockAccumulatorMs += delta;
    if (this.dayNightClockAccumulatorMs < this.dayNightClockRefreshIntervalMs) {
      return;
    }

    this.dayNightClockAccumulatorMs = 0;
    this.refreshDayNightClock();
  }

  /**
   * Pulls the current normalized day/night time from the world lighting service and mirrors it
   * into a lightweight HUD text label.
   */
  private refreshDayNightClock(force: boolean = false): void {
    const lightingService = this.probableWaffleScene
      ? getSceneService(this.probableWaffleScene, SceneLightingService)
      : undefined;
    const clockState = lightingService?.getDayNightClockState();
    const nextVisible = clockState?.enabled ?? false;
    const nextText = nextVisible ? clockState?.displayText ?? "" : "";

    this.dayNightClockText.visible = nextVisible;
    if (!nextVisible) {
      this.lastDayNightClockText = "";
      return;
    }

    if (!force && this.lastDayNightClockText === nextText) {
      return;
    }

    this.dayNightClockText.setText(nextText);
    this.lastDayNightClockText = nextText;
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
