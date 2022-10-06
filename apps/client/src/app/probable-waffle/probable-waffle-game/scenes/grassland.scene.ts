import * as Phaser from 'phaser';
import { Scenes } from './scenes';
import { SceneCommunicatorService } from '../event-emitters/scene-communicator.service';
import { CreateSceneFromObjectConfig } from '../interfaces/scene-config.interface';
import { InputHandler } from '../input/input.handler';
import { ScaleHandler } from '../scale/scale.handler';
import { MapSizeInfo } from '../const/map-size.info';
import { CursorHandler } from '../input/cursor.handler';
import { TilemapInputHandler } from '../input/tilemap/tilemap-input.handler';
import { MultiSelectionHandler } from '../input/multi-selection.handler';
import { Subscription } from 'rxjs';
import { TilemapHelper } from '../tilemap/tilemap.helper';
import { Pathfinder } from '../navigation/pathfinder';
import { OtherInputHandler } from '../input/other-input.handler';
import { ManualTileInputHandler } from '../input/manual-tiles/manual-tile-input.handler';
import { ManualTile, ManualTilesHelper } from '../manual-tiles/manual-tiles.helper';

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
  private tileToBeReplaced: number | null = null; // todo should be moved

  constructor() {
    super({ key: Scenes.GrasslandScene });
  }

  preload() {
    this.load.atlas(
      'atlas',
      'assets/probable-waffle/atlas/megaset-0.png',
      'assets/probable-waffle/atlas/megaset-0.json'
    );

    this.load.image('tiles', 'assets/probable-waffle/atlas/iso-64x64-outside.png');
    this.load.image('tiles2', 'assets/probable-waffle/atlas/iso-64x64-building.png');
    this.load.tilemapTiledJSON('map', 'assets/probable-waffle/tilemaps/start-small.json');

    this.load.atlas(
      'iso-64x64-building-atlas',
      'assets/probable-waffle/atlas/iso-64x64-building.png',
      'assets/probable-waffle/atlas/iso-64x64-building.json'
    );

    // big map
    // this.load.tilemapTiledJSON('map', 'https://labs.phaser.io/assets/tilemaps/iso/isorpg.json');
  }

  init() {
    this.tilemapHelper = new TilemapHelper(this);
    this.manualTilesHelper = new ManualTilesHelper(this);
    this.pathfinder = new Pathfinder(this);
  }

  create() {
    this.bindSceneCommunicator();

    const { tilemapLayer, mapSizeInfo } = this.createMap();
    const manualLayers = this.createAdditionalLayers(mapSizeInfo);
    this.createSprites(tilemapLayer, mapSizeInfo);

    this.scaleHandler = new ScaleHandler(this.cameras, this.scale, mapSizeInfo);
    this.inputHandler = new InputHandler(this.input, this.cameras.main);
    this.otherInputHandler = new OtherInputHandler(this.input);
    this.otherInputHandler.bindOtherPossiblyUsefulInputHandlers();
    this.cursorHandler = new CursorHandler(this.input);
    this.tilemapInputHandler = new TilemapInputHandler(this.input, tilemapLayer, mapSizeInfo);
    this.manualTileInputHandler = new ManualTileInputHandler(this.input, tilemapLayer, manualLayers, mapSizeInfo);
    this.subscribeToTileMapSelectEvents(tilemapLayer);
    this.multiSelectionHandler = new MultiSelectionHandler(this, this.input, this.cameras.main);
    this.subscribeToSelectionEvents();
    this.destroyListener();
  }

  private createMap(): {
    tilemapLayer: Phaser.Tilemaps.TilemapLayer;
    mapSizeInfo: MapSizeInfo;
  } {
    const map = this.add.tilemap('map');

    const tileset1 = map.addTilesetImage('iso-64x64-outside', 'tiles') as Phaser.Tilemaps.Tileset;
    const tileset2 = map.addTilesetImage('iso-64x64-building', 'tiles2') as Phaser.Tilemaps.Tileset;

    const tileMapLayer = map.createLayer('Tile Layer 1', [tileset1, tileset2]) as Phaser.Tilemaps.TilemapLayer;
    return {
      tilemapLayer: tileMapLayer,
      mapSizeInfo: new MapSizeInfo(map.width, map.height, map.tileWidth, map.tileHeight)
    };
  }

  private createAdditionalLayers(mapSizeInfo: MapSizeInfo): ManualTile[][] {
    const layer0 = this.manualTilesHelper.createLayer(
      mapSizeInfo,
      [
        { texture: 'iso-64x64-building-atlas', frame: 'iso-64x64-building-0.png', x: 5, y: 4 },
        { texture: 'iso-64x64-building-atlas', frame: 'iso-64x64-building-0.png', x: 6, y: 4 },
        { texture: 'iso-64x64-building-atlas', frame: 'iso-64x64-building-55.png', x: 7, y: 4 }
      ],
      0
    );
    const layer1 = this.manualTilesHelper.createLayer(
      mapSizeInfo,
      [{ texture: 'iso-64x64-building-atlas', frame: 'iso-64x64-building-0.png', x: 5, y: 4 }],
      1
    );
    return [layer0, layer1];
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
      const selected = this.getObjectsUnderSelectionRectangle(rect);
      // tint all selected with red
      selected.forEach((s) => {
        s.setTint(0xff0000);
      });
    });
  }

  private subscribeToTileMapSelectEvents(tilemapLayer: Phaser.Tilemaps.TilemapLayer) {
    this.tileSelectedSub = this.tilemapInputHandler.onTileSelected.subscribe((tile) => {
      // replace tile
      this.tileReplacement(tilemapLayer, tile);
    });

    this.manualTileSelectedSub = this.manualTileInputHandler.onTileSelected.subscribe((tile) => {
      console.log('manual tile selected', tile.x, tile.y, tile.z);
      tile.gameObjectImage.tint = 0xff0000;
    });
  }

  private tileReplacement(tilemapLayer: Phaser.Tilemaps.TilemapLayer, tile: Phaser.Tilemaps.Tile) {
    if (this.tileToBeReplaced !== null) {
      const tilesToReplace = SceneCommunicatorService.tileEmitterNrSubject.getValue();
      // get neighbors of tile
      const from = Math.floor(tilesToReplace / 2);
      const neighbors = tilemapLayer.getTilesWithin(tile.x - from, tile.y - from, tilesToReplace, tilesToReplace);
      neighbors.forEach((t) => {
        tilemapLayer.replaceByIndex(t.index, this.tileToBeReplaced as number, t.x, t.y, 1, 1);
      });
    }
  }

  private bindSceneCommunicator() {
    SceneCommunicatorService.subscriptions.push(
      SceneCommunicatorService.testEmitterSubject.subscribe((nr) => {
        console.log('event received', nr);
        // this.logo.setVelocity(100 * nr, 200 * nr);
      }),
      SceneCommunicatorService.tileEmitterSubject.subscribe((tileNr) => {
        this.tileToBeReplaced = tileNr;
      })
    );
  }

  private createSprites(tilemapLayer: Phaser.Tilemaps.TilemapLayer, mapSizeInfo: MapSizeInfo) {
    const ball1XY = { x: 0, y: 0 };
    const ballSprite = this.tilemapHelper.placeSpriteOnTilemapTile(
      tilemapLayer.getTileAt(ball1XY.x, ball1XY.y),
      mapSizeInfo
    );
    this.objects.push(ballSprite);

    // removing navigation for now
    // this.pathfinder.find(ball1XY, { x: 4, y: 0 }, tilemapLayer, mapSizeInfo);
  }
}
