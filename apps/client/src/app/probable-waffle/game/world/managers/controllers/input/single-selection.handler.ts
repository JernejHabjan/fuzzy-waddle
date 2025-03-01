import { GameObjects, Input } from "phaser";
import { ProbableWaffleScene } from "../../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../../data/actor-component";
import { IdComponent } from "../../../../entity/actor/components/id-component";
import { MULTI_SELECTING } from "./multi-selection.handler";
import { ProbableWaffleSelectionData, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getSelectableGameObject } from "../../../../data/game-object-helper";

export class SingleSelectionHandler {
  private readonly debug = false;
  private multiSelecting: boolean = false;
  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly hudScene: ProbableWaffleScene,
    private readonly tilemap: Phaser.Tilemaps.Tilemap
  ) {
    this.bindSceneInput();
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    hudScene.events.on(MULTI_SELECTING, this.onMultiSelecting, this);
  }

  private onMultiSelecting(multiSelecting: boolean) {
    // timeout so this is executed after this pointer up event
    setTimeout(() => {
      this.multiSelecting = multiSelecting;
      if (this.debug) {
        console.log("multiSelecting", multiSelecting);
      }
    });
  }

  private bindSceneInput() {
    this.scene.input.on(
      Phaser.Input.Events.POINTER_UP,
      (pointer: Input.Pointer, gameObjectsUnderCursor: GameObjects.GameObject[]) => {
        if (this.multiSelecting) return;
        // Check if an interactive object was clicked
        const isLeftClick = pointer.leftButtonReleased();
        const isShiftDown = pointer.event.shiftKey; // shift removes from selection
        const isCtrlDown = pointer.event.ctrlKey; // ctrl adds to selection

        // convert pointerXY to worldXY including camera zoom
        const worldPosition = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

        const clickedTileXY = new Phaser.Math.Vector2();
        Phaser.Tilemaps.Components.IsometricWorldToTileXY(
          worldPosition.x,
          worldPosition.y,
          false,
          clickedTileXY,
          this.scene.cameras.main,
          this.tilemap.layer
        );

        // for some reason we need to ceil the clicked tile
        clickedTileXY.x = Math.ceil(clickedTileXY.x);
        clickedTileXY.y = Math.ceil(clickedTileXY.y);

        const interactiveObjectIds = gameObjectsUnderCursor
          .map((go) => getSelectableGameObject(go))
          .filter((go) => !!go)
          .map((go) => getActorComponent(go, IdComponent)!.id);
        if (interactiveObjectIds.length > 0) {
          if (this.debug) {
            console.log("clicked on interactive objects", gameObjectsUnderCursor.length, interactiveObjectIds);
          }
          // if we clicked on top of terrain object, then emit terrain selection -- todo wall
          const clickedOnTopOfTerrain = false;
          if (clickedOnTopOfTerrain) {
            this.sendTerrainSelection(
              isLeftClick ? "left" : "right",
              {
                x: 0,
                y: 0,
                z: 0
              },
              {
                x: 0,
                y: 0,
                z: 0
              },
              isShiftDown,
              isCtrlDown
            );
          } else {
            this.sendSelection(isLeftClick ? "left" : "right", interactiveObjectIds, isShiftDown, isCtrlDown);
          }
        } else {
          // No interactive object was clicked, handle tilemap click
          const maxTileX = this.tilemap.width;
          const maxTileY = this.tilemap.height;
          const minTileX = 0;
          const minTileY = 0;
          if (
            clickedTileXY.x < minTileX ||
            clickedTileXY.x > maxTileX ||
            clickedTileXY.y < minTileY ||
            clickedTileXY.y > maxTileY
          ) {
            this.sendDeselect();
            return;
          }
          this.sendTerrainSelection(
            isLeftClick ? "left" : "right",
            { x: clickedTileXY.x, y: clickedTileXY.y, z: 0 },
            { x: worldPosition.x, y: worldPosition.y, z: 0 },
            isShiftDown,
            isCtrlDown
          );
        }
      },
      this
    );
  }

  public sendSelection(
    button: "left" | "right",
    objectIds: string[],
    shiftKey: boolean = false,
    ctrlKey: boolean = false
  ) {
    this.scene.communicator.allScenes!.emit({
      name: "selection.singleSelect",
      data: {
        button,
        objectIds,
        shiftKey,
        ctrlKey
      } satisfies ProbableWaffleSelectionData
    });
  }

  private sendDeselect() {
    this.scene.communicator.allScenes!.emit({
      name: "selection.deselect"
    });
  }

  private sendTerrainSelection(
    button: "left" | "right",
    terrainSelectedTileVec3: Vector3Simple,
    terrainSelectedWorldVec3: Vector3Simple,
    shiftKey: boolean = false,
    ctrlKey: boolean = false
  ) {
    this.scene.communicator.allScenes!.emit({
      name: "selection.terrainSelect",
      data: {
        button,
        terrainSelectedTileVec3,
        terrainSelectedWorldVec3,
        shiftKey,
        ctrlKey
      } satisfies ProbableWaffleSelectionData
    });
  }

  private destroy() {
    this.scene.input.off(Phaser.Input.Events.POINTER_UP);
    this.hudScene.events.off(MULTI_SELECTING);
  }
}
