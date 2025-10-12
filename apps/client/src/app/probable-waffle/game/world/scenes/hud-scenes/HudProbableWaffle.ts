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
/* START-USER-IMPORTS */
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { HudGameState } from "../../../hud/hud-game-state";
import { HudElementVisibilityHandler } from "../../../hud/hud-element-visibility.handler";
import { CursorHandler } from "../../../player/human-controller/cursor.handler";
import { MultiSelectionHandler } from "../../../player/human-controller/multi-selection.handler";
import { ProbableWaffleGameInstanceType } from "@fuzzy-waddle/api-interfaces";
import { getGameObjectBounds } from "../../../data/game-object-helper";
import { filter, Subscription } from "rxjs";
import { environment } from "../../../../../../environments/environment";
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
  private hudElements!: Array<any>;

  /* START-USER-CODE */
  private saveGameSubscription?: Subscription;
  private readonly actorInfoSmallScreenBreakpoint = 1200;

  probableWaffleScene?: ProbableWaffleScene;
  override preload() {
    this.load.pack("asset-pack-gui", "assets/probable-waffle/asset-packers/asset-pack-probable-waffle-gui.json");
  }

  override create() {
    this.editorCreate();

    // resize the scene to match the screen size
    this.scale.on("resize", this.resize, this);
    this.resize({ height: this.scale.height, width: this.scale.width });

    new HudGameState(this, this.probableWaffleScene!);
    new HudElementVisibilityHandler(this, this.hudElements);
    this.sceneGameData.components.push(
      new MultiSelectionHandler(this, this.probableWaffleScene!),
      new CursorHandler(this)
    );

    this.minimap_container.initializeWithParentScene(this.probableWaffleScene!, this);

    this.hudMessages.setup(this.probableWaffleScene!);
  }

  initializeWithParentScene(probableWaffleScene: ProbableWaffleScene) {
    this.probableWaffleScene = probableWaffleScene;
    this.subscribeToSaveGameEvent();
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
    this.resources_container.scale = sceneWidth > this.actorInfoSmallScreenBreakpoint ? 1 : 0.9;

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
    const minimapHeight = getGameObjectBounds(this.minimap_container)!.height;

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
    this.actor_info_container.scale = sceneWidth > this.actorInfoSmallScreenBreakpoint ? 2.2 : 1.5;
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

    // redraw minimap
    this.minimap_container.redrawMinimap();
  }

  private get gameType() {
    return this.probableWaffleScene?.baseGameData.gameInstance.gameInstanceMetadata.data.type;
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
          this.time.delayedCall(500, () => text.destroy());
        });
      });
  }

  private subscribeToSaveGameEvent() {
    this.saveGameSubscription = this.subscribeToGameEvent("save-game", "Game saved");
  }

  override destroy() {
    this.saveGameSubscription?.unsubscribe();
    super.destroy();
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
