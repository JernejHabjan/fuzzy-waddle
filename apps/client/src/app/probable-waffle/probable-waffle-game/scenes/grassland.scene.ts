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
import { PlacedGameObject, StaticObjectHelper } from '../placable-objects/static-object';
import { DynamicObjectHelper } from '../placable-objects/dynamic-object';
import { MapNavHelper } from '../map/map-nav-helper';
import { MinimapTextureHelper } from '../minimap/minimap-texture.helper';

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
  private selected: PlacedGameObject[] = [];
  private atlasToBePlaced: AtlasEmitValue | null = null;
  private warningText: Phaser.GameObjects.Text | null = null;
  private mapPropertiesHelper!: MapPropertiesHelper;
  private mapHelper!: MapHelper;
  private layerLines!: LayerLines;
  private playerNumber = 1; // todo
  private mapNavHelper!: MapNavHelper;

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
  }

  create() {
    // navigable map
    this.mapHelper = new MapHelper();
    this.tilemapHelper = new TilemapHelper(this.mapHelper, this);
    this.mapPropertiesHelper = new MapPropertiesHelper(this.mapHelper, this.textures);
    this.manualTilesHelper = new ManualTilesHelper(this.mapHelper, this, this.tilemapHelper);
    this.staticObjectHelper = new StaticObjectHelper(this.mapHelper, this);

    this.dynamicObjectHelper = new DynamicObjectHelper(this.mapHelper, this);
    this.layerLines = new LayerLines(this);
    this.pathfinder = new Pathfinder(this);

    this.bindSceneCommunicator();

    // init map
    this.tilemapHelper.createTilemap();
    this.mapPropertiesHelper.mapLayerTilesetsToAtlasesAndExtractProperties();
    this.manualTilesHelper.createEmptyManualLayers();
    this.staticObjectHelper.createStaticObjectLayer();
    this.dynamicObjectHelper.createDynamicObjectLayer();

    // placing objects on map

    this.placeAdditionalItemsOnManualLayers();
    this.placeStaticObjectsOnMap();
    this.placeDynamicObjectsOnMap();

    // input handling
    this.scaleHandler = new ScaleHandler(this.cameras, this.scale);
    this.inputHandler = new InputHandler(this.input, this.cameras.main);
    this.cursorHandler = new CursorHandler(this.input);
    this.tilemapInputHandler = new TilemapInputHandler(this.mapHelper.tilemapLayer);
    this.manualTileInputHandler = new ManualTileInputHandler(this, this.mapHelper.manualLayers);
    this.mapNavHelper = new MapNavHelper(this.mapHelper, this.tilemapInputHandler, this.manualTileInputHandler);
    this.navInputHandler = new NavInputHandler(this, this.pathfinder, this.mapNavHelper);
    this.multiSelectionHandler = new MultiSelectionHandler(this, this.input, this.cameras.main);
    this.minimapTextureHelper = new MinimapTextureHelper(this);

    this.subscribeToSelectionEvents();
    this.subscribeToInputEvents();
    this.destroyListener();

    // this.minimapTextureHelper.createMinimapCamera(this.cameras); // todo temp
    // this.minimapTextureHelper.createRenderTexture(); // todo temp
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
            this.navInputHandler.startNav(navigableTile, this.selected);
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

  private getObjectsUnderSelectionRectangle(rect: Phaser.Geom.Rectangle): PlacedGameObject[] {
    return this.mapHelper.dynamicObjects.filter((o) => {
      const bounds = o.spriteInstance.getBounds();
      return this.multiSelectionHandler.overlapsBounds(rect, bounds);
    });
  }

  private subscribeToSelectionEvents() {
    // todo move this
    this.selectionPreviewSub = this.multiSelectionHandler.onPreview.subscribe((rect) => {
      const selected = this.getObjectsUnderSelectionRectangle(rect);
      // tint all selected with blue

      this.mapHelper.dynamicObjects.forEach((o) => {
        o.spriteInstance.clearTint();
      });
      selected.forEach((s) => {
        s.spriteInstance.setTint(0x0000ff);
      });
    });
    // todo move this
    this.selectionEventSub = this.multiSelectionHandler.onSelect.subscribe((rect) => {
      this.selected = this.getObjectsUnderSelectionRectangle(rect);
      // tint all selected with red
      this.mapHelper.dynamicObjects.forEach((o) => {
        o.spriteInstance.clearTint();
      });
      this.selected.forEach((s) => {
        s.spriteInstance.setTint(0xff0000);
      });

      // extract sprite frame name
      const gameObjectSelection: GameObjectSelection[] = this.selected.map((s) => {
        return {
          name: s.placeableObjectProperties.placeableAtlasProperties.frame
        };
      });
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

    this.dynamicObjectHelper.placeObjectsOnMap([
      {
        tilePlacementData,
        placeableObjectProperties: {
          placeableAtlasProperties: {
            texture: atlasToBePlaced.tilesetName + MapDefinitions.atlasSuffix,
            frame: atlasToBePlaced.atlasFrame.filename
          }
        },
        belongsToPlayer: {
          playerNumber: this.playerNumber
        }
      }
    ]);
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

  private placeStaticObjectsOnMap(): void {
    this.staticObjectHelper.placeObjectsOnMap([
      {
        tilePlacementData: { tileXY: { x: 5, y: 4 }, z: 1 },
        placeableObjectProperties: {
          placeableAtlasProperties: {
            texture: 'house1',
            frame: 'house1_1'
          }
        },
        belongsToPlayer: {
          playerNumber: this.playerNumber
        }
      }
    ]);
  }

  private placeDynamicObjectsOnMap() {
    this.dynamicObjectHelper.placeObjectsOnMap([
      {
        tilePlacementData: { tileXY: { x: 1, y: 1 }, z: 0 },
        placeableObjectProperties: {
          placeableAtlasProperties: {
            texture: MapDefinitions.atlasCharacters + MapDefinitions.atlasSuffix,
            frame: 'warrior1'
          }
        },
        belongsToPlayer: {
          playerNumber: this.playerNumber
        }
      }
    ]);
  }
}
