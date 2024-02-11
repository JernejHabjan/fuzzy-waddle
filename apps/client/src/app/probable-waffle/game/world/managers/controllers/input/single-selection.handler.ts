import { GameObjects, Input } from "phaser";
import { ProbableWaffleScene } from "../../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../../data/actor-component";
import { SelectableComponent } from "../../../../entity/actor/components/selectable-component";
import { IdComponent } from "../../../../entity/actor/components/id-component";
import { MULTI_SELECTING } from "./multi-selection.handler";

export class SingleSelectionHandler {
  private multiSelecting: boolean = false;
  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly hudScene: ProbableWaffleScene,
    private readonly tilemap: Phaser.Tilemaps.Tilemap
  ) {
    this.bindSceneInput();
    this.scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
    hudScene.events.on(MULTI_SELECTING, this.onMultiSelecting, this);
  }

  private onMultiSelecting(multiSelecting: boolean) {
    // timeout so this is executed after this pointer up event
    setTimeout(() => {
      this.multiSelecting = multiSelecting;
      console.log("multiSelecting", multiSelecting);
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

        // offset pointer by camera position
        const pointerX = pointer.x + this.scene.cameras.main.scrollX;
        const pointerY = pointer.y + this.scene.cameras.main.scrollY + this.tilemap.tileHeight;

        const clickedTileXY = new Phaser.Math.Vector2();
        Phaser.Tilemaps.Components.IsometricWorldToTileXY(
          pointerX,
          pointerY,
          true,
          clickedTileXY,
          this.scene.cameras.main,
          this.tilemap.layer
        );

        if (isLeftClick && gameObjectsUnderCursor.length > 0) {
          // An interactive object was clicked
          const objectIds = gameObjectsUnderCursor
            .filter((go) => !!getActorComponent(go, SelectableComponent) && !!getActorComponent(go, IdComponent))
            .map((go) => getActorComponent(go, IdComponent)!.id);
          console.log("clicked on interactive objects", gameObjectsUnderCursor.length, objectIds);
          // if we clicked on top of terrain object, then emit terrain selection
          const clickedOnTopOfTerrain = false; // TODO
          if (clickedOnTopOfTerrain) {
            this.sendTerrainSelection("left", 0, 0, 0, isShiftDown, isCtrlDown);
          } else {
            this.sendSelection("left", objectIds, isShiftDown, isCtrlDown);
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
            clickedTileXY.x,
            clickedTileXY.y,
            0,
            isShiftDown,
            isCtrlDown
          );
        }
      },
      this
    );
  }

  private sendSelection(
    button: "left" | "right",
    selected: string[],
    shiftKey: boolean = false,
    ctrlKey: boolean = false
  ) {
    this.scene.communicator.selection!.sendLocally({
      gameInstanceId: this.scene.gameInstanceId,
      emitterUserId: this.scene.userId,
      type: "singleSelect",
      data: {
        button,
        selected,
        shiftKey,
        ctrlKey
      }
    });
  }

  private sendDeselect() {
    this.scene.communicator.selection!.sendLocally({
      gameInstanceId: this.scene.gameInstanceId,
      emitterUserId: this.scene.userId,
      type: "deselect"
    });
  }

  private sendTerrainSelection(
    button: "left" | "right",
    x: number,
    y: number,
    z: number,
    shiftKey: boolean = false,
    ctrlKey: boolean = false
  ) {
    this.scene.communicator.selection!.sendLocally({
      gameInstanceId: this.scene.gameInstanceId,
      emitterUserId: this.scene.userId,
      type: "terrainSelect",
      data: {
        button,
        terrainSelected: {
          x,
          y,
          z
        },
        shiftKey,
        ctrlKey
      }
    });
  }

  private destroy() {
    this.scene.input.off(Phaser.Input.Events.POINTER_UP);
    this.hudScene.events.off(MULTI_SELECTING);
  }
}
