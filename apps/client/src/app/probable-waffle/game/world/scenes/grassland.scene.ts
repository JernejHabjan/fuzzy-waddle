import { CreateSceneFromObjectConfig } from "../../../../shared/game/phaser/scene/scene-config.interface";
import { DEPRECATED_inputHandler } from "../managers/controllers/input/DEPRECATED_input.handler";
import { DEPRECATED_scaleHandler } from "../map/DEPRECATED_scale.handler";
import { MapDefinitions, TileDefinitions } from "../const/map-size.info_old";
import { CursorHandler } from "../managers/controllers/input/cursor.handler";
import {
  TilemapInputHandler,
  TilePlacementData_old
} from "../managers/controllers/input/tilemap/tilemap-input.handler";
import { DEPRECATED_multiSelectionHandler } from "../managers/controllers/input/DEPRECATED_multi-selection.handler";
import { Subscription } from "rxjs";
import { TilemapHelper_old } from "../map/tile/tilemapHelper_old";
import { Pathfinder_old } from "../map/pathfinder_old";
import { NavInputHandler_old } from "../managers/controllers/input/nav-input.handler_old";
import {
  ManualTileInputHandler_old,
  PossibleClickCoords
} from "../managers/controllers/input/manual-tiles/manual-tile-input.handler_old";
import { ManualTile, ManualTilesHelper } from "../map/tile/manual-tiles/manual-tiles.helper";
import { TileIndexProperties, TilePossibleProperties } from "../map/tile/types/tile-types";
import { MapPropertiesHelper } from "../map/tile/map-properties-helper";
import { MapHelper } from "../map/tile/map-helper";
import { StaticObjectHelper } from "../../entity/placable-objects/static-object";
import { DynamicObjectHelper_old } from "../../entity/placable-objects/dynamic-object";
import { MapNavHelper_old } from "../map/map-nav-helper_old";
import { MinimapTextureHelper } from "../map/minimap-texture.helper";
import { GameObjectsHelper } from "../map/game-objects-helper";
import { Actor } from "../../entity/actor/actor";
import { RepresentableActor_old } from "../../entity/actor/representable-actor_old";
import { SpriteRepresentationComponent } from "../../entity/actor/components/sprite-representable-component";
import { PlayerController_old } from "../managers/controllers/player-controller_old";
import { Barracks } from "../../entity/assets/buildings/barracks";
import { TownHall } from "../../entity/assets/buildings/town-hall";
import { GameObjects, Geom, Input, Scale, Scene } from "phaser";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";

export interface TilemapToAtlasMap {
  imageSuffix: string | null;
  imageName: string | null;
  atlasName: string | null;
  tileProperties: TilePossibleProperties | null;
}

export class GrasslandScene extends Scene implements CreateSceneFromObjectConfig {
  private inputHandler!: DEPRECATED_inputHandler;
  private scaleHandler!: DEPRECATED_scaleHandler;
  private cursorHandler!: CursorHandler;
  private tilemapInputHandler!: TilemapInputHandler;
  private manualTileInputHandler!: ManualTileInputHandler_old;
  private multiSelectionHandler!: DEPRECATED_multiSelectionHandler;
  private tilemapHelper!: TilemapHelper_old;
  private manualTilesHelper!: ManualTilesHelper;
  private staticObjectHelper!: StaticObjectHelper;
  private dynamicObjectHelper!: DynamicObjectHelper_old;
  private pathfinder!: Pathfinder_old;
  private navInputHandler!: NavInputHandler_old;
  private minimapTextureHelper!: MinimapTextureHelper;

  // todo move this somewhere else
  // used for selection
  private selectionPreviewSub!: Subscription;
  private selectionEventSub!: Subscription;
  private tileSelectedSub!: Subscription;
  private manualTileSelectedSub!: Subscription;
  private onEditorTileSelectedSub!: Subscription;
  private tileToBeReplaced: number | null = null; // todo should be moved
  private editorLayerNr = 1;
  private selected: Actor[] = [];
  private atlasToBePlaced: null = null;
  private warningText: GameObjects.Text | null = null;
  private mapPropertiesHelper!: MapPropertiesHelper;
  private mapHelper!: MapHelper;
  private gameObjectsHelper!: GameObjectsHelper;
  private playerNumber = 1; // todo
  private mapNavHelper!: MapNavHelper_old;
  private warriorGroup: RepresentableActor_old[] = [];
  private updateLoopActors: Actor[] = []; // todo to separate update loop then
  private playerController!: PlayerController_old; // todo temp

  constructor() {
    super({ key: "GrasslandScene" });
  }

  create() {
    // navigable map
    this.mapHelper = new MapHelper();
    this.gameObjectsHelper = new GameObjectsHelper();
    this.tilemapHelper = new TilemapHelper_old(this.mapHelper, this);
    this.mapPropertiesHelper = new MapPropertiesHelper(this.mapHelper, this.textures);
    this.manualTilesHelper = new ManualTilesHelper(this.mapHelper, this, this.tilemapHelper);
    this.staticObjectHelper = new StaticObjectHelper(this.gameObjectsHelper, this);
    this.dynamicObjectHelper = new DynamicObjectHelper_old(this.gameObjectsHelper, this);
    this.pathfinder = new Pathfinder_old(this);

    this.bindSceneCommunicator();

    // init map
    this.tilemapHelper.createTilemap();
    this.mapPropertiesHelper.mapLayerTilesetsToAtlasesAndExtractProperties();
    this.manualTilesHelper.createEmptyManualLayers();
    this.staticObjectHelper.createStaticObjectLayer();
    this.dynamicObjectHelper.createDynamicObjectLayer_old();

    // input handling
    this.scaleHandler = new DEPRECATED_scaleHandler(this.cameras, this.scale);
    this.inputHandler = new DEPRECATED_inputHandler(this.input, this.cameras.main);
    this.cursorHandler = new CursorHandler(this);
    this.tilemapInputHandler = new TilemapInputHandler(this.mapHelper.tilemapLayer);
    this.manualTileInputHandler = new ManualTileInputHandler_old(this, this.mapHelper.manualLayers);
    this.mapNavHelper = new MapNavHelper_old(
      this.mapHelper,
      this.gameObjectsHelper,
      this.tilemapInputHandler,
      this.manualTileInputHandler
    );
    this.navInputHandler = new NavInputHandler_old(this, this.pathfinder, this.mapNavHelper);
    this.multiSelectionHandler = new DEPRECATED_multiSelectionHandler(this, this.input, this.cameras.main);
    this.minimapTextureHelper = new MinimapTextureHelper(this);

    this.subscribeToSelectionEvents();
    this.subscribeToInputEvents();
    this.destroyListener();

    // this.minimapTextureHelper.createMinimapCamera(this.cameras); // todo temp
    // this.minimapTextureHelper.createRenderTexture(); // todo temp

    // placing objects on map
    this.placeActors();
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

  private subscribeToInputEvents() {
    this.input.on(
      Input.Events.POINTER_MOVE,
      (pointer: Input.Pointer, gameObjectsUnderCursor: GameObjects.GameObject[], event: TouchEvent | MouseEvent) => {
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
      Input.Events.POINTER_UP,
      (pointer: Input.Pointer, gameObjectsUnderCursor: GameObjects.GameObject[], event: TouchEvent | MouseEvent) => {
        const worldXY: Vector2Simple = { x: pointer.worldX, y: pointer.worldY };
        if (pointer.rightButtonReleased()) {
          // if (this.warningText) {
          //   this.warningText.destroy();
          // }
          // this.warningText = this.add.text(-100, 0, 'Note that nav z index checks only last node now', {
          //   fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif'
          // });

          this.deselectPlacementInEditor();

          const navigableTile = this.mapNavHelper.getNavigableTile(worldXY);
          if (navigableTile) {
            const selectedMovable = this.selected.filter(
              (obj) => obj instanceof RepresentableActor_old
            ) as RepresentableActor_old[];
            this.navInputHandler.startNav_old(navigableTile, selectedMovable);
          }
        } else {
          if (gameObjectsUnderCursor.length) {
            for (const gameObject of gameObjectsUnderCursor) {
              if (gameObject instanceof GameObjects.Sprite || gameObject instanceof GameObjects.Image) {
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
                tileIndex: this.tileToBeReplaced!
              } satisfies TileIndexProperties;
              if (tileOnTilemap) {
                this.tilemapHelper.replaceTileOnTilemap(tileOnTilemap.tileWorldData, newTileLayerProperties);
              }
            } else {
              const possibleCoordsFound =
                this.manualTileInputHandler.searchPossibleTileCoordinatesOnManualLayers_old(worldXY);
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
      // Deprecated_SceneCommunicatorService.atlasEmitterSubject.next(null);
    }
    // deselect in editor
    if (this.tileToBeReplaced) {
      // Deprecated_SceneCommunicatorService.tileEmitterSubject.next(null);
    }
  }

  private destroyListener() {
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Scale.Events.RESIZE);
      this.input.off(Input.Events.GAMEOBJECT_DOWN);
      this.input.off(Input.Events.POINTER_UP);
      this.input.off(Input.Events.POINTER_DOWN);
      this.input.off(Input.Events.GAME_OUT);
      this.input.off(Input.Events.POINTER_WHEEL);
      // todo these components should handle their own destroy on shutdown
      this.inputHandler.destroy();
      this.navInputHandler.destroy();
      this.scaleHandler.destroy();
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

  private getObjectsUnderSelectionRectangle(rect: Geom.Rectangle): RepresentableActor_old[] {
    // return this.gameObjectsHelper.dynamicObjects.filter((o) => {
    //   const bounds = o.spriteInstance.getBounds();
    //   return this.multiSelectionHandler.overlapsBounds(rect, bounds);
    // });
    const children = this.warriorGroup;
    return children.filter((o) => {
      const sprite = o.components.findComponent(SpriteRepresentationComponent).sprite;
      const bounds = sprite.getBounds();
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
        const sprite = s.components.findComponent(SpriteRepresentationComponent).sprite;
        sprite.setTint(0x0000ff);
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
        s.components.findComponentOrNull(SpriteRepresentationComponent)?.sprite.setTint(0xff0000);
      });

      // extract sprite frame name
      // const gameObjectSelection: GameObjectSelection[] = this.selected.map((s) => ({
      //   name: s.name
      // }));
      // Deprecated_SceneCommunicatorService.selectionChangedSubject.next(gameObjectSelection); // todo
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

  private placeAtlasOnCoords(atlasToBePlaced: any | null, tilePlacementData: TilePlacementData_old): void {
    if (atlasToBePlaced === null) return;

    this.dynamicObjectHelper.placeRawSpriteObjectsOnMap_old([
      {
        tilePlacementData,
        placeableObjectProperties: {
          placeableAtlasProperties: {
            texture: atlasToBePlaced.tilesetName,
            frame: atlasToBePlaced.atlasFrame.filename
          }
        }
      }
    ]);
  }

  private bindSceneCommunicator() {
    // Deprecated_SceneCommunicatorService.addSubscription(
    //   Deprecated_SceneCommunicatorService.tileEmitterSubject.subscribe((tileNr) => {
    //     this.tileToBeReplaced = tileNr;
    //     this.atlasToBePlaced = null; // stop placing atlas
    //     this.selected = [];
    //   }),
    //   Deprecated_SceneCommunicatorService.layerEmitterSubject.subscribe((layerNr) => {
    //     this.editorLayerNr = layerNr;
    //   }),
    //   Deprecated_SceneCommunicatorService.atlasEmitterSubject.subscribe((atlas) => {
    //     this.atlasToBePlaced = atlas;
    //     this.tileToBeReplaced = null; // stop placing tile
    //     this.selected = [];
    //   })
    // );
  }

  private placeActors() {
    // todo this.playerController = new PlayerController(); // todo temp
    // this.playerController.components.findComponent(PlayerResourcesComponent).addResources(
    //   new Map<ResourceTypeDefinition, number>([
    //     [Resources.ambrosia, 5000],
    //     [Resources.stone, 5000],
    //     [Resources.wood, 5000],
    //     [Resources.minerals, 5000]
    //   ])
    // );
    this.updateLoopActors.push(this.playerController);
    const barracks = this.placeBarracks({ tileXY: { x: 1, y: 2 }, z: 0 });
    const townHall = this.placeTownHall({ tileXY: { x: 1, y: 4 }, z: 0 });

    // test for periodically take damage
    // const warriorHealthComponent = warrior.components.findComponent(HealthComponent);
    window.setInterval(() => {
      // disabled for now
      const takeDamage = false;
      if (takeDamage) {
        // warriorHealthComponent.takeDamage(10, DamageTypes.DamageTypeNormal);
      }
    }, 300);

    // todo not working yet because gameMode doesn't have scene defined yet! - for spawnActorForPlayer
    // (builderComponent as any).beginConstruction(Barracks, { tileXY: { x: 1, y: 3 }, z: 0 });
  }

  private placeBarracks(tilePlacementData: TilePlacementData_old) {
    const barracks = new Barracks(this, tilePlacementData);
    barracks.registerGameObject(); // todo should be called by registration engine
    barracks.possess(this.playerController);
    this.warriorGroup.push(barracks); // todo
    return barracks;
  }

  private placeTownHall(tilePlacementData: TilePlacementData_old) {
    const townHall = new TownHall(this, tilePlacementData);
    townHall.registerGameObject(); // todo should be called by registration engine
    townHall.possess(this.playerController);
    this.warriorGroup.push(townHall); // todo
    return townHall;
  }
}
