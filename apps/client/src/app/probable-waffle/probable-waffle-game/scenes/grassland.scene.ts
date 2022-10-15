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
import { MapDefinitions, MapSizeInfo } from '../const/map-size.info';
import { CursorHandler } from '../input/cursor.handler';
import { TilemapInputHandler, TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import { MultiSelectionHandler } from '../input/multi-selection.handler';
import { Subscription } from 'rxjs';
import { TilemapHelper } from '../tilemap/tilemap.helper';
import { Pathfinder } from '../navigation/pathfinder';
import { OtherInputHandler } from '../input/other-input.handler';
import { ManualTileInputHandler, PossibleClickCoords } from '../input/manual-tiles/manual-tile-input.handler';
import {
  ManualTile,
  ManualTileLayer,
  ManualTilesHelper,
  TilePlacementWorldWithProperties
} from '../manual-tiles/manual-tiles.helper';
import { TileIndexProperties, TilePossibleProperties } from '../types/tile-types';
import { Vector2Simple } from '../math/intersection';

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
  private pathfinder!: Pathfinder;
  private otherInputHandler!: OtherInputHandler;

  // todo move this somewhere else
  // used for selection
  private objects: Phaser.GameObjects.Sprite[] = [];
  private selectionPreviewSub!: Subscription;
  private selectionEventSub!: Subscription;
  private tileSelectedSub!: Subscription;
  private manualTileSelectedSub!: Subscription;
  private onEditorTileSelectedSub!: Subscription;
  private tileToBeReplaced: number | null = null; // todo should be moved
  private currentLayerLinesGroup: Phaser.GameObjects.Group | null = null;
  private editorLayerNr = SceneCommunicatorService.DEFAULT_LAYER;
  private manualLayers!: ManualTileLayer[];
  private selected: Phaser.GameObjects.Sprite[] = [];
  // now we can access atlas frames by tileset.firstgid + tile.index
  private mappedTilesetsToAtlasesWithProperties!: TilemapToAtlasMap[];
  private atlasToBePlaced: AtlasEmitValue | null = null;
  private warningText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: Scenes.GrasslandScene });
  }

  preload() {
    this.load.atlas(
      MapDefinitions.atlasMegaset + MapDefinitions.atlasSuffix,
      `assets/probable-waffle/atlas/${MapDefinitions.atlasMegaset}.png`,
      `assets/probable-waffle/atlas/${MapDefinitions.atlasMegaset}.json`
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

    this.load.tilemapTiledJSON('map', MapDefinitions.mapJson);
  }

  init() {
    this.tilemapHelper = new TilemapHelper(this);
    this.manualTilesHelper = new ManualTilesHelper(this);
    this.pathfinder = new Pathfinder(this);
  }

  create() {
    this.bindSceneCommunicator();

    const tilemapLayer = this.createMap();
    this.mappedTilesetsToAtlasesWithProperties = this.mapTilesetsToAtlasesAndExtractProperties(tilemapLayer.tileset);
    this.manualLayers = this.createEmptyLayers();
    this.placeAdditionalItemsOnManualLayers(this.manualLayers);
    this.createSprites();

    this.scaleHandler = new ScaleHandler(this.cameras, this.scale);
    this.inputHandler = new InputHandler(this.input, this.cameras.main);
    const navigationGrid = tilemapLayer.layer.data.map((row: Phaser.Tilemaps.Tile[]) => row.map((tile) => tile.index));
    this.otherInputHandler = new OtherInputHandler(this, this.input, this.pathfinder, navigationGrid);
    this.cursorHandler = new CursorHandler(this.input);
    this.tilemapInputHandler = new TilemapInputHandler(this.input, tilemapLayer);
    this.manualTileInputHandler = new ManualTileInputHandler(this, this.input, this.manualLayers);
    this.subscribeToTileMapSelectEvents(tilemapLayer);
    this.multiSelectionHandler = new MultiSelectionHandler(this, this.input, this.cameras.main);
    this.subscribeToSelectionEvents();
    this.subscribeToInputEvents(tilemapLayer);
    this.destroyListener();
  }

  private createMap(): Phaser.Tilemaps.TilemapLayer {
    const map = this.add.tilemap('map');

    const tileSetImages: Phaser.Tilemaps.Tileset[] = [];
    map.tilesets.forEach((tileSet) => {
      tileSetImages.push(map.addTilesetImage(tileSet.name, tileSet.name) as Phaser.Tilemaps.Tileset);
    });

    // const tilemapLayer = map.createBlankLayer('layer 2', tileSetImages, 0, 0, 100, 100) as Phaser.Tilemaps.TilemapLayer;
    const tilemapLayer = map.createLayer(map.layers[0].name, tileSetImages) as Phaser.Tilemaps.TilemapLayer;
    MapSizeInfo.info = new MapSizeInfo(
      tilemapLayer.width / map.tileWidth,
      tilemapLayer.height / map.tileHeight,
      map.tileWidth,
      map.tileHeight
    );
    return tilemapLayer;
  }

  private subscribeToInputEvents(tilemapLayer: Phaser.Tilemaps.TilemapLayer) {
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
          console.log('deselecting because of pointer velocity');
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
          if (this.warningText) {
            this.warningText.destroy(true);
          }
          this.warningText = this.add.text(-100, 0, 'Note that nav z index checks only last node now', {
            fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif'
          });

          this.deselectPlacementInEditor();

          const navigableTile = this.getNavigableTile(worldXY);
          if (navigableTile) {
            this.otherInputHandler.startNav(navigableTile, this.selected);
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

            if (this.tileShouldBePlacedOnTilemap(this.tileToBeReplaced, this.editorLayerNr)) {
              const tileOnTilemap = this.tilemapInputHandler.getTileFromTilemapOnWorldXY(worldXY);
              const newTileLayerProperties = {
                tileIndex: this.tileToBeReplaced
              } as TileIndexProperties;
              if (tileOnTilemap) {
                this.replaceTileOnTilemap(tilemapLayer, tileOnTilemap.tileWorldData, newTileLayerProperties);
              }
            } else {
              const possibleCoordsFound = this.manualTileInputHandler.searchPossibleTileCoordinates(worldXY);
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

  private getNavigableTile(worldXY: Vector2Simple): TilePlacementWorldWithProperties | null {
    const existingManualTileSelected = this.manualTileInputHandler.getManualTileOnWorldXY(worldXY);
    if (existingManualTileSelected) {
      return {
        tileWorldData: existingManualTileSelected.tileWorldData,
        tileLayerProperties: existingManualTileSelected.tileLayerProperties
      };
    }
    const tileOnTilemap = this.tilemapInputHandler.getTileFromTilemapOnWorldXY(worldXY);
    return tileOnTilemap;
  }

  private tileShouldBePlacedOnTilemap(tileToBeReplaced: number | null, layer: number): boolean {
    if (!tileToBeReplaced) return false;
    if (layer !== 0) return false;

    const atlasMap = this.mappedTilesetsToAtlasesWithProperties[tileToBeReplaced];
    if (!atlasMap.tileProperties) return false;
    const tileProperties = atlasMap.tileProperties as TilePossibleProperties;
    return tileProperties.stepHeight === 0;
  }

  private mapTilesetsToAtlasesAndExtractProperties(tilesets: Phaser.Tilemaps.Tileset[]): TilemapToAtlasMap[] {
    const tilesetAtlasNameMapper: TilemapToAtlasMap[] = [];
    tilesets.forEach((tileset) => {
      let i = tilesetAtlasNameMapper.length;
      for (i; i < tileset.firstgid; i++) {
        tilesetAtlasNameMapper.push({ imageName: null, atlasName: null, imageSuffix: null, tileProperties: null });
      }
      const atlasTexture = this.textures.get(tileset.name + MapDefinitions.atlasSuffix);

      const frames = atlasTexture.getFrameNames();
      // push to array
      frames.forEach((frameName, i) => {
        // split frameName by "." and get 2 variables
        const [imageName, imageSuffix] = frameName.split('.');
        const tileProperties = (tileset.tileProperties as TilePossibleProperties[])[i];
        tilesetAtlasNameMapper.push({ imageName, imageSuffix, atlasName: tileset.name, tileProperties });
      });
    });

    return tilesetAtlasNameMapper;
  }

  private createEmptyLayers(): ManualTileLayer[] {
    const layers: ManualTileLayer[] = [];
    for (let i = 0; i <= MapDefinitions.nrLayers; i++) {
      layers.push({
        z: i,
        tiles: []
      });
    }
    return layers;
  }

  private placeAdditionalItemsOnManualLayers(layers: ManualTileLayer[]): void {
    const buildingCubeIndex = 137;
    const buildingStairsSouthWestIndex = 191;
    const buildingStairsSouthEastIndex = 192;
    this.manualTilesHelper.placeTilesOnLayer(layers, this.mappedTilesetsToAtlasesWithProperties, [
      { tilePlacementData: { tileXY: { x: 5, y: 4 }, z: 0 }, tileIndexProperties: { tileIndex: buildingCubeIndex } },
      { tilePlacementData: { tileXY: { x: 6, y: 4 }, z: 0 }, tileIndexProperties: { tileIndex: buildingCubeIndex } },
      {
        tilePlacementData: { tileXY: { x: 7, y: 4 }, z: 0 },
        tileIndexProperties: { tileIndex: buildingStairsSouthEastIndex }
      },
      {
        tilePlacementData: { tileXY: { x: 8, y: 8 }, z: 0 },
        tileIndexProperties: { tileIndex: buildingStairsSouthWestIndex }
      },

      // layer 1
      { tilePlacementData: { tileXY: { x: 5, y: 4 }, z: 1 }, tileIndexProperties: { tileIndex: buildingCubeIndex } },
      {
        tilePlacementData: { tileXY: { x: 6, y: 4 }, z: 1 },
        tileIndexProperties: { tileIndex: buildingStairsSouthEastIndex }
      }
    ]);
  }

  /**
   * called by editor. Ensures to destroy tiles before creating new one
   */
  private replaceTilesOnLayer(
    manualTilesLayer: ManualTile[],
    tilePlacementData: TilePlacementData,
    tileIndexProperties: TileIndexProperties
  ) {
    const existingTileOnLayer = manualTilesLayer.find(
      (tile) =>
        tile.tileWorldData.tileXY.x === tilePlacementData.tileXY.x &&
        tile.tileWorldData.tileXY.y === tilePlacementData.tileXY.y &&
        tile.tileWorldData.z === tilePlacementData.z
    );
    if (existingTileOnLayer) {
      manualTilesLayer.splice(manualTilesLayer.indexOf(existingTileOnLayer), 1);
      existingTileOnLayer.gameObjectImage.destroy(true);
    }

    this.manualTilesHelper.placeTileOnLayer(
      this.manualLayers,
      this.mappedTilesetsToAtlasesWithProperties,
      tilePlacementData,
      tileIndexProperties
    );
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
      this.otherInputHandler.destroy();
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

  private getObjectsUnderSelectionRectangle(rect: Phaser.Geom.Rectangle): Phaser.GameObjects.Sprite[] {
    return this.objects.filter((s: Phaser.GameObjects.Sprite) => {
      const bounds = s.getBounds();
      return this.multiSelectionHandler.overlapsBounds(rect, bounds);
    });
  }

  private subscribeToSelectionEvents() {
    // todo move this
    this.selectionPreviewSub = this.multiSelectionHandler.onPreview.subscribe((rect) => {
      const selected = this.getObjectsUnderSelectionRectangle(rect);
      // tint all selected with blue
      selected.forEach((s) => {
        s.setTint(0x0000ff);
      });
    });
    // todo move this
    this.selectionEventSub = this.multiSelectionHandler.onSelect.subscribe((rect) => {
      this.selected = this.getObjectsUnderSelectionRectangle(rect);
      // tint all selected with red
      this.selected.forEach((s) => {
        s.setTint(0xff0000);
      });

      // extract sprite frame name
      const gameObjectSelection: GameObjectSelection[] = this.selected.map((s) => {
        return {
          name: s.frame.name
        };
      });
      SceneCommunicatorService.selectionChangedSubject.next(gameObjectSelection); // todo
    });
  }

  private subscribeToTileMapSelectEvents(tilemapLayer: Phaser.Tilemaps.TilemapLayer) {
    // this.tileSelectedSub = this.tilemapInputHandler.onTileSelected.subscribe((tileSelectedData) => {
    //   // replace tile
    //   this.tileReplacement(tilemapLayer, tileSelectedData);
    // });
  }

  private replaceTileOnTilemap(
    tilemapLayer: Phaser.Tilemaps.TilemapLayer,
    tilePlacementData: TilePlacementData,
    tileIndexProperties: TileIndexProperties
  ) {
    this.tileReplacement(tilemapLayer, tilePlacementData, tileIndexProperties);
  }

  private selectedTileFromManualTileLayer(tile: ManualTile) {
    tile.gameObjectImage.tint = 0xff0000;
  }

  /**
   * used when placing new tile / placing new atlas
   */
  private possibleCoordSelected(possibleCoords: PossibleClickCoords[], layer: number) {
    const maxLayerZ = this.manualLayers[this.manualLayers.length - 1].z;

    if (!(layer !== null && layer >= 0 && layer <= maxLayerZ)) {
      return;
    }

    const correctLayer = possibleCoords.find((c) => c.z === layer);
    if (!correctLayer) {
      return;
    }
    const tiles = (this.manualLayers.find((l) => l.z === layer) as ManualTileLayer).tiles;

    if (this.tileToBeReplaced !== null) {
      this.replaceTilesOnLayer(
        tiles,
        {
          tileXY: correctLayer.tileXY,
          z: this.editorLayerNr
        },
        {
          tileIndex: this.tileToBeReplaced
        }
      );
    }

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

    const ballSprite = this.tilemapHelper.placeSpriteOnTileXY(
      tilePlacementData.tileXY,
      atlasToBePlaced.tilesetName + MapDefinitions.atlasSuffix,
      atlasToBePlaced.atlasFrame.filename,
      tilePlacementData.z
    );
    this.objects.push(ballSprite);
  }

  private get nrTilesToReplace(): number {
    return SceneCommunicatorService.tileEmitterNrSubject.getValue();
  }

  private tileReplacement(
    tilemapLayer: Phaser.Tilemaps.TilemapLayer,
    tilePlacementData: TilePlacementData,
    tileIndexProperties: TileIndexProperties
  ) {
    // if (this.tileToBeReplaced !== null) {
    const tilesToReplace = this.nrTilesToReplace;
    // get neighbors of tile
    const from = Math.floor(tilesToReplace / 2);
    const neighbors = tilemapLayer.getTilesWithin(
      tilePlacementData.tileXY.x - from,
      tilePlacementData.tileXY.y - from,
      tilesToReplace,
      tilesToReplace
    );
    neighbors.forEach((t) => {
      tilemapLayer.replaceByIndex(t.index, tileIndexProperties.tileIndex, t.x, t.y, 1, 1);
    });
    console.log('tilemap tile replaced');
    // }
  }

  private bindSceneCommunicator() {
    SceneCommunicatorService.addSubscription(
      SceneCommunicatorService.tileEmitterSubject.subscribe((tileNr) => {
        this.tileToBeReplaced = tileNr;
        this.atlasToBePlaced = null; // stop placing atlas
        this.selected = [];
        this.drawLayerLines();
      }),
      SceneCommunicatorService.layerEmitterSubject.subscribe((layerNr) => {
        this.editorLayerNr = layerNr;
        this.drawLayerLines();
      }),
      SceneCommunicatorService.atlasEmitterSubject.subscribe((atlas) => {
        this.atlasToBePlaced = atlas;
        this.tileToBeReplaced = null; // stop placing tile
        this.selected = [];
        this.drawLayerLines();
      })
    );
  }

  private drawLayerLines() {
    if (this.currentLayerLinesGroup !== null) {
      // remove all lines from group
      this.currentLayerLinesGroup.clear(true, true);
      this.currentLayerLinesGroup.destroy();
      this.currentLayerLinesGroup = null;
    }
    if (this.tileToBeReplaced !== null || this.atlasToBePlaced !== null) {
      this.currentLayerLinesGroup = this.manualTilesHelper.drawLayerLines(this.editorLayerNr);
    }
  }

  private createSprites() {
    const ballSprite = this.tilemapHelper.placeSpriteOnTileXY(
      { x: 1, y: 1 },
      MapDefinitions.atlasMegaset + MapDefinitions.atlasSuffix,
      'blue_ball',
      0
    );
    this.objects.push(ballSprite);

    // removing navigation for now
    // this.pathfinder.find(ball1XY, { x: 4, y: 0 }, tilemapLayer, mapSizeInfo);
  }
}
