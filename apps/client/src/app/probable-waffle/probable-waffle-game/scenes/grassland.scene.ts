import * as Phaser from 'phaser';
import { Scenes } from './scenes';
import { SceneCommunicatorService } from '../event-emitters/scene-communicator.service';
import { CreateSceneFromObjectConfig } from '../interfaces/scene-config.interface';
import { InputHandler } from '../input/input.handler';
import { ScaleHandler } from '../scale/scale.handler';
import { MapDefinitions, MapSizeInfo } from '../const/map-size.info';
import { CursorHandler } from '../input/cursor.handler';
import { TilemapInputHandler, TileSelectedData } from '../input/tilemap/tilemap-input.handler';
import { MultiSelectionHandler } from '../input/multi-selection.handler';
import { Subscription } from 'rxjs';
import { TilemapHelper } from '../tilemap/tilemap.helper';
import { Pathfinder } from '../navigation/pathfinder';
import { OtherInputHandler } from '../input/other-input.handler';
import { ManualTileInputHandler } from '../input/manual-tiles/manual-tile-input.handler';
import { ManualTile, ManualTileLayer, ManualTilesHelper } from '../manual-tiles/manual-tiles.helper';
import { SlopeDirection, TileLayerConfig } from '../types/tile-types';

export interface TilemapToAtlasMap {
  imageSuffix: string | null;
  imageName: string | null;
  atlasName: string | null;
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
  private editorLayerNr = 0;
  private manualLayers!: ManualTileLayer[];
  private selected: Phaser.GameObjects.Sprite[] = [];
  // now we can access atlas frames by tileset.firstgid + tile.index
  private mappedTilesetsToAtlases!: TilemapToAtlasMap[];

  constructor() {
    super({ key: Scenes.GrasslandScene });
  }

  preload() {
    this.load.atlas(
      'atlas',
      'assets/probable-waffle/atlas/megaset-0.png',
      'assets/probable-waffle/atlas/megaset-0.json'
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
    this.mappedTilesetsToAtlases = this.mapTilesetsToAtlases(tilemapLayer.tileset);
    this.manualLayers = this.createEmptyLayers();
    this.placeAdditionalItemsOnManualLayers(this.manualLayers);
    this.createSprites();

    this.scaleHandler = new ScaleHandler(this.cameras, this.scale);
    this.inputHandler = new InputHandler(this.input, this.cameras.main);
    const navigationGrid = tilemapLayer.layer.data.map((row: Phaser.Tilemaps.Tile[]) => row.map((tile) => tile.index));
    this.otherInputHandler = new OtherInputHandler(this, this.input, this.pathfinder, navigationGrid);
    this.otherInputHandler.bindOtherPossiblyUsefulInputHandlers(this.selected);
    this.cursorHandler = new CursorHandler(this.input);
    this.tilemapInputHandler = new TilemapInputHandler(this.input, tilemapLayer);
    this.manualTileInputHandler = new ManualTileInputHandler(this, this.input, this.manualLayers);
    this.subscribeToTileMapSelectEvents(tilemapLayer);
    this.multiSelectionHandler = new MultiSelectionHandler(this, this.input, this.cameras.main);
    this.subscribeToSelectionEvents();
    this.destroyListener();
  }

  private createMap(): Phaser.Tilemaps.TilemapLayer {
    const map = this.add.tilemap('map');

    const tileSetImages: Phaser.Tilemaps.Tileset[] = [];
    map.tilesets.forEach((tileSet) => {
      tileSetImages.push(map.addTilesetImage(tileSet.name, tileSet.name) as Phaser.Tilemaps.Tileset);
    });

    // const tilemapLayer = map.createBlankLayer('layer 2', tileSets, 0, 0, 200, 200) as Phaser.Tilemaps.TilemapLayer;
    const tilemapLayer = map.createLayer(map.layers[0].name, tileSetImages) as Phaser.Tilemaps.TilemapLayer;
    MapSizeInfo.info = new MapSizeInfo(
      tilemapLayer.width / map.tileWidth,
      tilemapLayer.height / map.tileHeight,
      map.tileWidth,
      map.tileHeight
    );
    return tilemapLayer;
  }

  private mapTilesetsToAtlases(tilesets: Phaser.Tilemaps.Tileset[]): TilemapToAtlasMap[] {
    const tilesetAtlasNameMapper: TilemapToAtlasMap[] = [];
    tilesets.forEach((tileset) => {
      let i = tilesetAtlasNameMapper.length;
      for (i; i < tileset.firstgid; i++) {
        tilesetAtlasNameMapper.push({ imageName: null, atlasName: null, imageSuffix: null });
      }
      const atlasTexture = this.textures.get(tileset.name + MapDefinitions.atlasSuffix);

      const frames = atlasTexture.getFrameNames();
      // push to array
      frames.forEach((frameName) => {
        // split frameName by "." and get 2 variables
        const [imageName, imageSuffix] = frameName.split('.');
        tilesetAtlasNameMapper.push({ imageName, imageSuffix, atlasName: tileset.name });
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
    this.manualTilesHelper.addItemsToLayer(
      layers,
      this.mappedTilesetsToAtlases,
      [
        { tileIndex: buildingCubeIndex, x: 5, y: 4 },
        { tileIndex: buildingCubeIndex, x: 6, y: 4 },
        {
          tileIndex: buildingStairsSouthEastIndex,
          x: 7,
          y: 4,
          slopeDir: SlopeDirection.SouthEast
        },
        {
          tileIndex: buildingStairsSouthWestIndex,
          x: 8,
          y: 8,
          slopeDir: SlopeDirection.SouthWest
        }
      ],
      0
    );
    this.manualTilesHelper.addItemsToLayer(
      layers,
      this.mappedTilesetsToAtlases,
      [
        { tileIndex: buildingCubeIndex, x: 5, y: 4 },
        {
          tileIndex: buildingStairsSouthEastIndex,
          x: 6,
          y: 4,
          slopeDir: SlopeDirection.SouthEast
        }
      ],
      1
    );
  }

  /**
   * called by editor. Ensures to destroy tiles before creating new one
   */
  private replaceTilesOnLayer(manualTilesLayer: ManualTile[], layer: number, tileConfig: TileLayerConfig) {
    const tileCenter = TilemapHelper.getTileCenter(MapSizeInfo.info.tileWidthHalf, MapSizeInfo.info.tileWidthHalf, {
      offset: layer * MapSizeInfo.info.tileHeight
    });
    const existingTileOnLayer = manualTilesLayer.find(
      (tile) => tile.tileConfig.x === tileConfig.x && tile.tileConfig.y === tileConfig.y && tile.z === layer
    );
    if (existingTileOnLayer) {
      manualTilesLayer.splice(manualTilesLayer.indexOf(existingTileOnLayer), 1);
      existingTileOnLayer.gameObjectImage.destroy(true);
    }

    this.manualTilesHelper.placeTileOnLayer(
      manualTilesLayer,
      this.mappedTilesetsToAtlases,
      layer,
      tileConfig,
      tileCenter
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
      // clear selected array
      this.selected.splice(0, this.selected.length);
      this.selected.push(...this.getObjectsUnderSelectionRectangle(rect));
      // tint all selected with red
      this.selected.forEach((s) => {
        s.setTint(0xff0000);
      });
    });
  }

  private subscribeToTileMapSelectEvents(tilemapLayer: Phaser.Tilemaps.TilemapLayer) {
    this.tileSelectedSub = this.tilemapInputHandler.onTileSelected.subscribe((tileSelectedData) => {
      // replace tile
      this.tileReplacement(tilemapLayer, tileSelectedData);
    });

    this.manualTileSelectedSub = this.manualTileInputHandler.onTileSelected.subscribe((tile) => {
      // console.log('manual tile selected', tile.tileConfig.x, tile.tileConfig.y, tile.z);
      tile.gameObjectImage.tint = 0xff0000;
    });

    this.onEditorTileSelectedSub = this.manualTileInputHandler.onEditorTileSelected.subscribe((possibleCoords) => {
      const maxLayerZ = this.manualLayers[this.manualLayers.length - 1].z;
      if (
        this.tileToBeReplaced !== null &&
        this.editorLayerNr !== null &&
        this.editorLayerNr >= 0 &&
        this.editorLayerNr <= maxLayerZ
      ) {
        if (this.editorLayerNr === 0) {
          // todo for now not placing stuff on layer 0
          return;
        }

        const correctLayer = possibleCoords.find((c) => c.z === this.editorLayerNr);
        if (correctLayer) {
          const tiles = (this.manualLayers.find((l) => l.z === this.editorLayerNr) as ManualTileLayer).tiles;

          // offset by 2, so it's displayed correctly
          const offset = this.editorLayerNr * 2;
          // todo take this into account:
          // todo this.nrTilesToReplace
          this.replaceTilesOnLayer(tiles, this.editorLayerNr, {
            x: correctLayer.tileXY.x + offset,
            y: correctLayer.tileXY.y + offset,
            tileIndex: this.tileToBeReplaced
          });
        }
      }
    });
  }

  private get nrTilesToReplace(): number {
    return SceneCommunicatorService.tileEmitterNrSubject.getValue();
  }

  private tileReplacement(tilemapLayer: Phaser.Tilemaps.TilemapLayer, tileSelectedData: TileSelectedData) {
    if (this.tileToBeReplaced !== null) {
      const tilesToReplace = this.nrTilesToReplace;
      // get neighbors of tile
      const from = Math.floor(tilesToReplace / 2);
      const neighbors = tilemapLayer.getTilesWithin(
        tileSelectedData.tileXY.x - from,
        tileSelectedData.tileXY.y - from,
        tilesToReplace,
        tilesToReplace
      );
      neighbors.forEach((t) => {
        tilemapLayer.replaceByIndex(t.index, this.tileToBeReplaced as number, t.x, t.y, 1, 1);
      });
    }
  }

  private bindSceneCommunicator() {
    SceneCommunicatorService.subscriptions.push(
      SceneCommunicatorService.tileEmitterSubject.subscribe((tileNr) => {
        this.tileToBeReplaced = tileNr;
        this.drawLayerLines();
      }),
      SceneCommunicatorService.layerEmitterSubject.subscribe((layerNr) => {
        this.editorLayerNr = layerNr;
        this.drawLayerLines();
      })
    );
  }

  private drawLayerLines() {
    if (this.currentLayerLinesGroup !== null) {
      // remove all lines from group
      this.currentLayerLinesGroup.clear(true, true);
      this.currentLayerLinesGroup.destroy();
    }
    if (this.tileToBeReplaced !== null) {
      this.currentLayerLinesGroup = this.manualTilesHelper.drawLayerLines(this.editorLayerNr);
    }
  }

  private createSprites() {
    const ballSprite = this.tilemapHelper.placeSpriteOnTileXY({ x: 1, y: 1 });
    this.objects.push(ballSprite);

    // removing navigation for now
    // this.pathfinder.find(ball1XY, { x: 4, y: 0 }, tilemapLayer, mapSizeInfo);
  }
}
