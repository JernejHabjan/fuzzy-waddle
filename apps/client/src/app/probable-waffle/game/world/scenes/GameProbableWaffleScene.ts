import { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { ScaleHandler } from "../../player/human-controller/scale.handler";
import { CameraMovementHandler } from "../../player/human-controller/cameraMovementHandler";
import { LightsHandler } from "./effects/lights.handler";
import { DepthHelper } from "../services/depth.helper";
import { AnimatedTilemap } from "../tilemap/animated-tiles/animated-tile.helper";
import { SingleSelectionHandler } from "../../player/human-controller/single-selection.handler";
import HudProbableWaffle from "./hud-scenes/HudProbableWaffle";
import { GameObjectSelectionHandler } from "../../player/human-controller/game-object-selection.handler";
import { SceneGameState } from "../state/scene-game-state";
import { GameSettings } from "../../core/gameSettings";
import { SaveGame } from "../../data/save-game";
import { SceneActorCreator } from "../services/scene-actor-creator";
import { NavigationService } from "../services/navigation.service";
import { AudioService } from "../services/audio.service";
import { RandomService } from "../services/random.service";
import { TilemapComponent } from "../tilemap/tilemap.component";
import { RestartGame } from "../../data/restart-game";
import { AiPlayerHandler } from "../../player/ai-controller/ai-player-handler";
import { BuildingCursor } from "../../player/human-controller/building-cursor";
import { DebuggingService } from "../services/DebuggingService";
import { CrossSceneCommunicationService } from "../services/CrossSceneCommunicationService";
import { FogOfWarComponent } from "../tilemap/fog-of-war.component";
import { SelectionGroupsComponent } from "../../player/human-controller/selection-groups.component";
import { GameModeConditionChecker } from "../state/GameModeConditionChecker";
import { ScoreTracker } from "../state/ScoreTracker";
import { getSceneExternalComponent, getSceneService } from "../services/scene-component-helpers";
import { ActorIdSeeder } from "../services/actor-id-seeder.service";
import { AchievementService } from "../../../services/achievement/achievement.service";
import { AchievementType } from "../../../services/achievement/achievement-type";
import { environment } from "../../../../../environments/environment";
import { GameObjectActionAssigner } from "../../prefabs/gui/game-object-action-assigner";
import { PlayerActionsHandler } from "../../player/human-controller/player-actions-handler";
import { ActorIndexSystem } from "../services/ActorIndexSystem";
import { TechTreeService } from "../../data/tech-tree/tech-tree.service";
import { SelectionTabHandler } from "../../player/human-controller/selection-tab-handler";
import { LockedCursorHandler } from "../../player/human-controller/locked-cursor.handler";
import { ActorDebugDamageSystem } from "../services/actor-debug-damage-system";
import { SpellCursor } from "../../player/human-controller/spell-cursor";
import { AoeZoneManager } from "../../entity/systems/aoe-zone-manager";
import { CommandBusService } from "../services/command-bus.service";
import { SimulationTickService } from "../services/simulation-tick.service";
import { StateHashService } from "../services/state-hash.service";
import { SnapshotService } from "../services/snapshot.service";
import { ReconnectService } from "../services/reconnect.service";
import { ReplayPlaybackService } from "../services/replay-playback.service";
import { ReplayRecorderService } from "../services/replay-recorder.service";
import { HostMigrationService } from "../services/host-migration.service";
import { PauseSyncService } from "../services/pause-sync.service";

export default class GameProbableWaffleScene extends ProbableWaffleScene {
  tilemap!: Phaser.Tilemaps.Tilemap;

  override init() {
    super.init();
  }

  override create() {
    const hud = this.scene.get<HudProbableWaffle>("HudProbableWaffle") as HudProbableWaffle;
    hud.scene.start();
    hud.initializeWithParentScene(this);

    new SceneGameState(this);
    new ScaleHandler(this, this.tilemap, { margins: { left: 150, bottom: 100 }, maxLayers: 8 });
    new LightsHandler(this, { enableLights: false });
    new DepthHelper(this);
    new AnimatedTilemap(this, this.tilemap, this.tilemap.tilesets);
    new GameObjectSelectionHandler(this);
    new GameObjectActionAssigner(this);
    new SaveGame(this);
    new RestartGame(this, hud);
    new GameModeConditionChecker(this);
    this.sceneGameData.systems.push(new ScoreTracker(this)); // Track player scores for score screen
    const creator = new SceneActorCreator(this);
    const actorIndex = new ActorIndexSystem(this);
    const snapshotService = new SnapshotService();

    this.sceneGameData.components.push(
      this.getCameraMovementHandler(),
      new SingleSelectionHandler(this, hud, this.tilemap),
      new TilemapComponent(this.tilemap),
      new BuildingCursor(this),
      new SelectionGroupsComponent(this),
      new SelectionTabHandler(this)
    );
    this.sceneGameData.services.push(
      this.getRandomService(),
      // CommandBusService and SimulationTickService must be registered first so they're available during initInitialActors()
      new CommandBusService(),
      new SimulationTickService(this),
      new NavigationService(this, this.tilemap),
      new AudioService(this),
      new PlayerActionsHandler(this, hud),
      creator,
      new DebuggingService(),
      new CrossSceneCommunicationService(),
      actorIndex,
      new TechTreeService(),
      new SpellCursor(this),
      new AoeZoneManager(this),
      new PauseSyncService(this),
      snapshotService
    );
    new ActorDebugDamageSystem(this);
    if (!this.baseGameData.gameInstance.gameInstanceMetadata.isReplay()) {
      this.sceneGameData.systems.push(new AiPlayerHandler(this));
    }
    if (!this.isSpectator) {
      this.sceneGameData.components.push(new FogOfWarComponent(this, this.tilemap));
    }

    creator.initInitialActors();
    // Populate the index after initial actors are in place
    actorIndex.scanExistingActors();
    // ActorIdSeeder must run after actors are in place. On non-host it subscribes
    // to the host's seed broadcast and patches actor ids to stay in sync.
    new ActorIdSeeder(this);

    // Wire SimulationTickService into CommandBusService now that both are registered
    const commandBus = getSceneService(this, CommandBusService);
    const simTick = getSceneService(this, SimulationTickService);
    if (commandBus && simTick) {
      commandBus.tickService = simTick;
      // Activate the multiplayer relay path when a socket is present
      const communicator = this.baseGameData.communicator;
      if (communicator.gameCommandChanged) {
        commandBus.initMultiplayer(this);
      }
    }

    // Desync detection: hash state every 60 ticks and compare with peers (MP only).
    new StateHashService().init(this);
    // Snapshot service: host keeps a rolling snapshot for reconnect / late spectator catch-up.
    snapshotService.init(this);
    // Reconnect service: non-host clients request a snapshot when they rejoin after a drop.
    new ReconnectService().init(this);
    new HostMigrationService().init(this);
    new ReplayRecorderService().init(this);
    new ReplayPlaybackService().init(this);

    super.create();

    this.scene.scene.data.set("justCreated", true);
    setTimeout(() => {
      this.scene.scene.data.remove("justCreated");
    });
    this.sceneGameData.initializers.sceneInitialized.next(true);

    if (!environment.production) {
      const achievementService = getSceneExternalComponent(this.scene.scene, AchievementService);
      achievementService?.unlockAchievement(AchievementType.FIRST_VICTORY); // just for test
    }
  }

  private getCameraMovementHandler(): CameraMovementHandler {
    const gameSettings = GameSettings.loadFromLocalStorage();
    return new CameraMovementHandler(this, {
      cameraEdgeMovementSpeed: 30,
      cameraKeyboardMovementSpeed: 2,
      enabledMouseCornerMovement: gameSettings.enabledMouseCornerMovement
    });
  }

  /**
   * Initialize RandomService with seed from game config for deterministic randomness
   */
  private getRandomService(): RandomService {
    const seed = this.sys.game.config.seed?.[0];
    if (!seed) throw new Error("Game seed is not defined");
    return new RandomService(seed);
  }

  private cleanup() {
    this.sceneGameData.components = [];
    this.sceneGameData.services = [];
    this.sceneGameData.systems = [];
    this.sceneGameData.initializers.sceneInitialized.next(false);
    LockedCursorHandler.releasePointerLock(this.input);
  }

  protected override shutDown() {
    super.shutDown();
    this.cleanup();
  }

  override destroy() {
    super.destroy();
    this.cleanup();
  }
}
