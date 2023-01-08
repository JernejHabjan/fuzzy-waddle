import * as Phaser from 'phaser';
import { Scenes } from './scenes';
import {
  AtlasEmitValue,
  GameObjectSelection,
  SceneCommunicatorService
} from '../event-emitters/scene-communicator.service';
import { CreateSceneFromObjectConfig } from '../interfaces/scene-config.interface';
import { InputHandler } from '../input/input.handler';
import { ScaleHandler } from '../scale/scale.handler';
import { MapDefinitions, TileDefinitions } from '../const/map-size.info';
import { CursorHandler } from '../input/cursor.handler';
import { TilemapInputHandler, TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import { MultiSelectionHandler } from '../input/multi-selection.handler';
import { Subscription } from 'rxjs';
import { TilemapHelper } from '../tilemap/tilemap.helper';
import { Pathfinder } from '../navigation/pathfinder';
import { NavInputHandler } from '../input/nav-input.handler';
import { ManualTileInputHandler, PossibleClickCoords } from '../input/manual-tiles/manual-tile-input.handler';
import { ManualTile, ManualTilesHelper } from '../manual-tiles/manual-tiles.helper';
import { TileIndexProperties, TilePossibleProperties } from '../types/tile-types';
import { Vector2Simple } from '../math/intersection';
import { MapPropertiesHelper } from '../map/map-properties-helper';
import { MapHelper } from '../map/map-helper';
import { LayerLines } from '../map/layer-lines';
import { StaticObjectHelper } from '../placable-objects/static-object';
import { DynamicObjectHelper } from '../placable-objects/dynamic-object';
import { MapNavHelper } from '../map/map-nav-helper';
import { MinimapTextureHelper } from '../minimap/minimap-texture.helper';
import { Warrior, WarriorDefinition } from '../characters/warrior';
import { GameObjectsHelper } from '../map/game-objects-helper';
import { LpcAnimationHelper } from '../animation/lpc-animation-helper';
import { Actor } from '../actor';
import { RepresentableActor } from '../characters/representable-actor';
import { hasSpriteRepresentationComponent } from '../characters/sprite-representable-component';
import { PlayerController } from '../controllers/player-controller';
import { Barracks } from '../buildings/barracks';
import { PlayerResourcesComponent } from '../controllers/player-resources-component';
import { Resources, ResourceType } from '../buildings/resource-type';
import { TownHall } from '../buildings/town-hall';
import { Minerals } from '../economy/minerals';
import { Worker } from '../characters/worker';

export interface TilemapToAtlasMap {
  imageSuffix: string | null;
  imageName: string | null;
  atlasName: string | null;
  tileProperties: TilePossibleProperties | null;
}

export default class GrasslandScene extends Phaser.Scene implements CreateSceneFromObjectConfig {
  private inputHandler!: InputHandler;
  private scaleHandler!: ScaleHandler;
  private cursorHandler!: CursorHandler;
  private tilemapInputHandler!: TilemapInputHandler;
  private manualTileInputHandler!: ManualTileInputHandler;
  private multiSelectionHandler!: MultiSelectionHandler;
  private tilemapHelper!: TilemapHelper;
  private manualTilesHelper!: ManualTilesHelper;
  private staticObjectHelper!: StaticObjectHelper;
  private dynamicObjectHelper!: DynamicObjectHelper;
  private pathfinder!: Pathfinder;
  private navInputHandler!: NavInputHandler;
  private minimapTextureHelper!: MinimapTextureHelper;

  // todo move this somewhere else
  // used for selection
  private selectionPreviewSub!: Subscription;
  private selectionEventSub!: Subscription;
  private tileSelectedSub!: Subscription;
  private manualTileSelectedSub!: Subscription;
  private onEditorTileSelectedSub!: Subscription;
  private tileToBeReplaced: number | null = null; // todo should be moved
  private editorLayerNr = SceneCommunicatorService.DEFAULT_LAYER;
  private selected: Actor[] = [];
  private atlasToBePlaced: AtlasEmitValue | null = null;
  private warningText: Phaser.GameObjects.Text | null = null;
  private mapPropertiesHelper!: MapPropertiesHelper;
  private mapHelper!: MapHelper;
  private gameObjectsHelper!: GameObjectsHelper;
  private layerLines!: LayerLines;
  private playerNumber = 1; // todo
  private mapNavHelper!: MapNavHelper;
  private warriorGroup: RepresentableActor[] = [];
  private updateLoopActors: Actor[] = []; // todo to separate update loop then
  private animHelper!: LpcAnimationHelper;
  private playerController!: PlayerController; // todo temp

  constructor() {
    super({ key: Scenes.GrasslandScene });
  }

  init(data: unknown) {
    // todo?
  }

  preload() {
    this.load.atlas(
      MapDefinitions.atlasBuildings + MapDefinitions.atlasSuffix,
      `assets/probable-waffle/atlas/${MapDefinitions.atlasBuildings}.png`,
      `assets/probable-waffle/atlas/${MapDefinitions.atlasBuildings}.json`
    );
    this.load.atlas(
      MapDefinitions.atlasCharacters + MapDefinitions.atlasSuffix,
      `assets/probable-waffle/atlas/${MapDefinitions.atlasCharacters}.png`,
      `assets/probable-waffle/atlas/${MapDefinitions.atlasCharacters}.json`
    );

    MapDefinitions.mapAtlases.forEach((atlas) => {
      // used by this.scene.add.image(...
      this.load.atlas(
        `${atlas}${MapDefinitions.atlasSuffix}`,
        `assets/probable-waffle/atlas/${atlas}.png`,
        `assets/probable-waffle/atlas/${atlas}.json`
      );
      // used by addTilesetImage
      this.load.image(atlas, `assets/probable-waffle/atlas/${atlas}.png`);
    });

    this.load.tilemapTiledJSON(MapDefinitions.tilemapMapName, MapDefinitions.tilemapMapJson);

    this.load.spritesheet(
      WarriorDefinition.textureMapDefinition.textureName,
      'assets/probable-waffle/spritesheets/' + WarriorDefinition.textureMapDefinition.spriteSheet.name + '.png',
      WarriorDefinition.textureMapDefinition.spriteSheet.frameConfig
    );

    this.load.audio(
      WarriorDefinition.soundDefinition.move as string,
      'assets/probable-waffle/sfx/character/move/footstep.mp3'
    );

    this.load.audio(
      WarriorDefinition.soundDefinition.death as string,
      'assets/probable-waffle/sfx/character/death/death1.mp3'
    );
  }

  create() {
    this.animHelper = new LpcAnimationHelper(this.anims);
    this.animHelper.createAnimationsForLPCSpriteSheet(WarriorDefinition.textureMapDefinition.spriteSheet.name);
    // iterate over WarriorSoundEnum and load all sounds
    Object.values(WarriorDefinition.soundDefinition).forEach((sound) => {
      this.sound.add(sound);
    });

    // navigable map
    this.mapHelper = new MapHelper();
    this.gameObjectsHelper = new GameObjectsHelper();
    this.tilemapHelper = new TilemapHelper(this.mapHelper, this);
    this.mapPropertiesHelper = new MapPropertiesHelper(this.mapHelper, this.textures);
    this.manualTilesHelper = new ManualTilesHelper(this.mapHelper, this, this.tilemapHelper);
    this.staticObjectHelper = new StaticObjectHelper(this.gameObjectsHelper, this);
    this.dynamicObjectHelper = new DynamicObjectHelper(this.gameObjectsHelper, this);
    this.layerLines = new LayerLines(this);
    this.pathfinder = new Pathfinder(this);

    this.bindSceneCommunicator();

    // init map
    this.tilemapHelper.createTilemap();
    this.mapPropertiesHelper.mapLayerTilesetsToAtlasesAndExtractProperties();
    this.manualTilesHelper.createEmptyManualLayers();
    this.staticObjectHelper.createStaticObjectLayer();
    this.dynamicObjectHelper.createDynamicObjectLayer();

    // input handling
    this.scaleHandler = new ScaleHandler(this.cameras, this.scale);
    this.inputHandler = new InputHandler(this.input, this.cameras.main);
    this.cursorHandler = new CursorHandler(this.input);
    this.tilemapInputHandler = new TilemapInputHandler(this.mapHelper.tilemapLayer);
    this.manualTileInputHandler = new ManualTileInputHandler(this, this.mapHelper.manualLayers);
    this.mapNavHelper = new MapNavHelper(
      this.mapHelper,
      this.gameObjectsHelper,
      this.tilemapInputHandler,
      this.manualTileInputHandler
    );
    this.navInputHandler = new NavInputHandler(this, this.pathfinder, this.mapNavHelper);
    this.multiSelectionHandler = new MultiSelectionHandler(this, this.input, this.cameras.main);
    this.minimapTextureHelper = new MinimapTextureHelper(this);

    this.subscribeToSelectionEvents();
    this.subscribeToInputEvents();
    this.destroyListener();

    // this.minimapTextureHelper.createMinimapCamera(this.cameras); // todo temp
    // this.minimapTextureHelper.createRenderTexture(); // todo temp

    // placing objects on map
    this.placeAdditionalItemsOnManualLayers();
    this.placeRawSpriteStaticObjectsOnMap();
    this.placeRawSpriteDynamicObjectsOnMap();
  }

  private subscribeToInputEvents() {
    this.input.on(
      Phaser.Input.Events.POINTER_MOVE,
      (
        pointer: Phaser.Input.Pointer,
        gameObjectsUnderCursor: Phaser.GameObjects.GameObject[],
        event: TouchEvent | MouseEvent
      ) => {
        /**
         * pointer velocity threshold, which is used to determine if the pointer is moving or not
         */
        const allowedPointerVelocity = 100;
        if (
          pointer.leftButtonDown() &&
          (Math.abs(pointer.velocity.x) > allowedPointerVelocity ||
            Math.abs(pointer.velocity.y) > allowedPointerVelocity)
        ) {
          // console.log('deselecting because of pointer velocity');
          this.deselectPlacementInEditor();
        }
      }
    );

    this.input.on(
      Phaser.Input.Events.POINTER_UP,
      (
        pointer: Phaser.Input.Pointer,
        gameObjectsUnderCursor: Phaser.GameObjects.GameObject[],
        event: TouchEvent | MouseEvent
      ) => {
        const worldXY: Vector2Simple = { x: pointer.worldX, y: pointer.worldY };
        if (pointer.rightButtonReleased()) {
          // if (this.warningText) {
          //   this.warningText.destroy(true);
          // }
          // this.warningText = this.add.text(-100, 0, 'Note that nav z index checks only last node now', {
          //   fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif'
          // });

          this.deselectPlacementInEditor();

          const navigableTile = this.mapNavHelper.getNavigableTile(worldXY);
          if (navigableTile) {
            const selectedMovable = this.selected.filter(
              (obj) => obj instanceof RepresentableActor
            ) as RepresentableActor[];
            this.navInputHandler.startNav(navigableTile, selectedMovable);
          }
        } else {
          if (gameObjectsUnderCursor.length) {
            for (const gameObject of gameObjectsUnderCursor) {
              if (gameObject instanceof Phaser.GameObjects.Sprite || gameObject instanceof Phaser.GameObjects.Image) {
                gameObject.setTint(0xff0000);
              }
            }
          } else {
            // deselect all sprites
            // todo this.selected.forEach((sprite) => sprite.clearTint());

            // todo reduce all these tile input handlers

            const tileOnTilemap = this.tilemapInputHandler.getTileFromTilemapOnWorldXY(worldXY);
            const removingTile = this.tileToBeReplaced === TileDefinitions.tileRemoveIndex;
            const removingExistingTile = !!tileOnTilemap && removingTile;
            if (
              (removingExistingTile && this.editorLayerNr === 0) ||
              (!removingTile &&
                this.tilemapHelper.tileShouldBePlacedOnTilemap(this.tileToBeReplaced, this.editorLayerNr))
            ) {
              const newTileLayerProperties = {
                tileIndex: this.tileToBeReplaced
              } as TileIndexProperties;
              if (tileOnTilemap) {
                this.tilemapHelper.replaceTileOnTilemap(tileOnTilemap.tileWorldData, newTileLayerProperties);
              }
            } else {
              const possibleCoordsFound =
                this.manualTileInputHandler.searchPossibleTileCoordinatesOnManualLayers(worldXY);
              this.possibleCoordSelected(possibleCoordsFound, this.editorLayerNr);
              if (possibleCoordsFound.length) {
                const existingTileSelected = this.manualTileInputHandler.getManualTileOnWorldXY(worldXY);
                if (existingTileSelected) {
                  this.selectedTileFromManualTileLayer(existingTileSelected);
                } else {
                  // console.log('no action');
                }
              }
            }
          }
        }
      }
    );
  }

  private deselectPlacementInEditor() {
    // deselect in editor
    if (this.atlasToBePlaced) {
      SceneCommunicatorService.atlasEmitterSubject.next(null);
    }
    // deselect in editor
    if (this.tileToBeReplaced) {
      SceneCommunicatorService.tileEmitterSubject.next(null);
    }
  }

  private placeAdditionalItemsOnManualLayers(): void {
    const buildingCubeIndex = 137;
    const buildingStairsSouthWestIndex = 191;
    const buildingStairsSouthEastIndex = 192;
    const waterIndex = 63;
    this.manualTilesHelper.placeTilesOnLayer(this.mapHelper.mappedTilesetsToAtlasesWithProperties, [
      { tilePlacementData: { tileXY: { x: 3, y: 7 }, z: 0 }, tileIndexProperties: { tileIndex: buildingCubeIndex } },
      { tilePlacementData: { tileXY: { x: 5, y: 4 }, z: 0 }, tileIndexProperties: { tileIndex: buildingCubeIndex } },
      { tilePlacementData: { tileXY: { x: 6, y: 4 }, z: 0 }, tileIndexProperties: { tileIndex: buildingCubeIndex } },
      {
        tilePlacementData: { tileXY: { x: 7, y: 4 }, z: 0 },
        tileIndexProperties: { tileIndex: buildingStairsSouthEastIndex }
      },
      {
        tilePlacementData: { tileXY: { x: 2, y: 4 }, z: 0 },
        tileIndexProperties: { tileIndex: buildingStairsSouthWestIndex }
      },
      { tilePlacementData: { tileXY: { x: 0, y: 2 }, z: 0 }, tileIndexProperties: { tileIndex: waterIndex } },

      // layer 1
      { tilePlacementData: { tileXY: { x: 5, y: 4 }, z: 1 }, tileIndexProperties: { tileIndex: buildingCubeIndex } },
      {
        tilePlacementData: { tileXY: { x: 6, y: 4 }, z: 1 },
        tileIndexProperties: { tileIndex: buildingStairsSouthEastIndex }
      }
    ]);
  }

  override update(time: number, delta: number) {
    super.update(time, delta);
    this.inputHandler.update(time, delta);
    this.warriorGroup.forEach((child) => {
      child.update(time, delta);
      return true;
    });
    this.updateLoopActors.forEach((actor) => actor.update(time, delta));
  }

  private destroyListener() {
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE);
      this.input.off(Phaser.Input.Events.GAMEOBJECT_DOWN);
      this.input.off(Phaser.Input.Events.POINTER_UP);
      this.input.off(Phaser.Input.Events.POINTER_DOWN);
      this.input.off(Phaser.Input.Events.GAME_OUT);
      this.input.off(Phaser.Input.Events.POINTER_WHEEL);
      // todo these components should handle their own destroy on shutdown
      this.inputHandler.destroy();
      this.navInputHandler.destroy();
      this.scaleHandler.destroy();
      this.cursorHandler.destroy();
      this.tilemapInputHandler.destroy();
      this.manualTileInputHandler.destroy();
      this.multiSelectionHandler.destroy();
      this.selectionPreviewSub.unsubscribe();
      this.selectionEventSub.unsubscribe();
      this.tileSelectedSub.unsubscribe();
      this.manualTileSelectedSub.unsubscribe();
      this.onEditorTileSelectedSub.unsubscribe();
    });
  }

  private getObjectsUnderSelectionRectangle(rect: Phaser.Geom.Rectangle): RepresentableActor[] {
    // return this.gameObjectsHelper.dynamicObjects.filter((o) => {
    //   const bounds = o.spriteInstance.getBounds();
    //   return this.multiSelectionHandler.overlapsBounds(rect, bounds);
    // });
    const children = this.warriorGroup;
    return children.filter((o) => {
      const bounds = o.spriteRepresentationComponent.sprite.getBounds();
      return this.multiSelectionHandler.overlapsBounds(rect, bounds);
    });
  }

  private subscribeToSelectionEvents() {
    // todo move this
    this.selectionPreviewSub = this.multiSelectionHandler.onPreview.subscribe((rect) => {
      const selected = this.getObjectsUnderSelectionRectangle(rect);
      // tint all selected with blue

      this.gameObjectsHelper.dynamicObjects.forEach((o) => {
        o.spriteInstance.clearTint();
      });
      selected.forEach((s) => {
        s.spriteRepresentationComponent.sprite.setTint(0x0000ff);
      });
    });
    // todo move this
    this.selectionEventSub = this.multiSelectionHandler.onSelect.subscribe((rect) => {
      this.selected = this.getObjectsUnderSelectionRectangle(rect);
      // tint all selected with red
      this.gameObjectsHelper.dynamicObjects.forEach((o) => {
        o.spriteInstance.clearTint();
      });
      this.selected.forEach((s) => {
        if (hasSpriteRepresentationComponent(s)) {
          s.spriteRepresentationComponent.sprite.setTint(0xff0000);
        }
      });

      // extract sprite frame name
      const gameObjectSelection: GameObjectSelection[] = this.selected.map((s) => ({
        name: s.name
      }));
      SceneCommunicatorService.selectionChangedSubject.next(gameObjectSelection); // todo
    });
  }

  private selectedTileFromManualTileLayer(tile: ManualTile) {
    tile.gameObjectImage.tint = 0xff0000;
  }

  /**
   * used when placing new tile / placing new atlas
   */
  private possibleCoordSelected(possibleCoords: PossibleClickCoords[], layer: number) {
    const maxLayerZ = MapDefinitions.nrLayers;

    if (!(layer !== null && layer >= 0 && layer <= maxLayerZ)) {
      return;
    }

    const correctLayer = possibleCoords.find((c) => c.z === layer);
    if (!correctLayer) {
      return;
    }

    this.manualTilesHelper.tryPlaceTileOnLayer(correctLayer, this.tileToBeReplaced, layer);

    if (this.atlasToBePlaced) {
      // todo
      this.placeAtlasOnCoords(this.atlasToBePlaced, {
        tileXY: correctLayer.tileXY,
        z: layer
      });
    }
  }

  private placeAtlasOnCoords(atlasToBePlaced: AtlasEmitValue | null, tilePlacementData: TilePlacementData): void {
    if (atlasToBePlaced === null) return;

    if (atlasToBePlaced.atlasFrame.filename === WarriorDefinition.textureMapDefinition.textureName + '.png') {
      this.placeWarrior(tilePlacementData);
    } else {
      this.dynamicObjectHelper.placeRawSpriteObjectsOnMap([
        {
          tilePlacementData,
          placeableObjectProperties: {
            placeableAtlasProperties: {
              texture: atlasToBePlaced.tilesetName + MapDefinitions.atlasSuffix,
              frame: atlasToBePlaced.atlasFrame.filename
            }
          }
        }
      ]);
    }
  }

  private bindSceneCommunicator() {
    SceneCommunicatorService.addSubscription(
      SceneCommunicatorService.tileEmitterSubject.subscribe((tileNr) => {
        this.tileToBeReplaced = tileNr;
        this.atlasToBePlaced = null; // stop placing atlas
        this.selected = [];
        this.conditionallyDrawLayerLines();
      }),
      SceneCommunicatorService.layerEmitterSubject.subscribe((layerNr) => {
        this.editorLayerNr = layerNr;
        this.conditionallyDrawLayerLines();
      }),
      SceneCommunicatorService.atlasEmitterSubject.subscribe((atlas) => {
        this.atlasToBePlaced = atlas;
        this.tileToBeReplaced = null; // stop placing tile
        this.selected = [];
        this.conditionallyDrawLayerLines();
      })
    );
  }

  private conditionallyDrawLayerLines() {
    if (this.tileToBeReplaced === null && this.atlasToBePlaced === null) return;
    this.layerLines.drawLayerLines(this.editorLayerNr);
  }

  private placeRawSpriteStaticObjectsOnMap(): void {
    this.staticObjectHelper.placeRawSpriteObjectsOnMap([
      // {
      //   tilePlacementData: { tileXY: { x: 5, y: 4 }, z: 1 },
      //   placeableObjectProperties: {
      //     placeableAtlasProperties: {
      //       texture: 'house1',
      //       frame: 'house1_1'
      //     }
      //   }
      // }
    ]);
  }

  private placeRawSpriteDynamicObjectsOnMap() {
    this.dynamicObjectHelper.placeRawSpriteObjectsOnMap([
      // {
      //   tilePlacementData: { tileXY: { x: 1, y: 1 }, z: 0 },
      //   placeableObjectProperties: {
      //     placeableAtlasProperties: {
      //       texture: MapDefinitions.atlasCharacters + MapDefinitions.atlasSuffix,
      //       frame: Warrior.textureName
      //     }
      //   }
      // }
    ]);
    this.playerController = new PlayerController(); // todo temp
    this.playerController.components.findComponent(PlayerResourcesComponent).addResources(
      new Map<ResourceType, number>([
        [Resources.ambrosia, 5000],
        [Resources.stone, 5000],
        [Resources.wood, 5000],
        [Resources.minerals, 5000]
      ])
    );
    this.updateLoopActors.push(this.playerController);
    const warrior = this.placeWarrior({ tileXY: { x: 1, y: 1 }, z: 0 });
    const worker = this.placeWorker({ tileXY: { x: 2, y: 2 }, z: 0 });
    const barracks = this.placeBarracks({ tileXY: { x: 1, y: 2 }, z: 0 });
    const townHall = this.placeTownHall({ tileXY: { x: 1, y: 4 }, z: 0 });
    const minerals = this.placeMinerals({ tileXY: { x: 1, y: 6 }, z: 0 });

    setTimeout(() => {
      // test for periodically take damage
      // window.setInterval(() => {
      //   warrior.healthComponent.takeDamage(10, DamageTypes.DamageTypeNormal);
      // }, 300);

      minerals.resourceSourceComponent.extractResources(worker, 10); // todo where to get this value from
      townHall.resourceDrainComponent.returnResources(
        worker,
        worker.gathererComponent.carriedResourceType as ResourceType,
        worker.gathererComponent.carriedResourceAmount
      );

      // worker.builderComponent.beginConstruction(Barracks, { tileXY: { x: 1, y: 3 }, z: 0 }); // todo not working yet because gameMode doesn't have scene defined yet! - for spawnActorForPlayer
    }, 100);
  }

  private placeWarrior(tilePlacementData: TilePlacementData) {
    const warrior = new Warrior(this, tilePlacementData, this.playerController);
    warrior.init(); // todo should be called by registration engine - pass "world" to creation of warrior and there we can access world.registrationEngine.registerWarrior(warrior) // todo it also registers on "update" hook
    this.warriorGroup.push(warrior);
    return warrior;
  }

  private placeWorker(tilePlacementData: TilePlacementData) {
    const worker = new Worker(this, tilePlacementData, this.playerController);
    worker.init(); // todo should be called by registration engine -
    this.warriorGroup.push(worker);
    return worker;
  }

  private placeBarracks(tilePlacementData: TilePlacementData) {
    const barracks = new Barracks(this, tilePlacementData, this.playerController);
    barracks.init(); // todo should be called by registration engine
    this.warriorGroup.push(barracks); // todo
    return barracks;
  }

  private placeTownHall(tilePlacementData: TilePlacementData) {
    const townHall = new TownHall(this, tilePlacementData, this.playerController);
    townHall.init(); // todo should be called by registration engine
    this.warriorGroup.push(townHall); // todo
    return townHall;
  }

  private placeMinerals(tilePlacementData: TilePlacementData) {
    const minerals = new Minerals(this, tilePlacementData);
    minerals.init(); // todo should be called by registration engine
    this.warriorGroup.push(minerals); // todo
    return minerals;
  }
}
