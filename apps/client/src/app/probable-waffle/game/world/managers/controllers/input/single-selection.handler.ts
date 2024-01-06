import { GameObjects, Input } from "phaser";
import { ProbableWaffleScene } from "../../../../core/probable-waffle.scene";

export class SingleSelectionHandler {
  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly tilemap: Phaser.Tilemaps.Tilemap
  ) {
    this.bindSceneInput();
  }

  private bindSceneInput() {
    this.scene.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      (pointer: Input.Pointer, gameObjectsUnderCursor: GameObjects.GameObject[]) => {
        // Check if an interactive object was clicked
        if (gameObjectsUnderCursor.length > 0) {
          // An interactive object was clicked
          const objects = gameObjectsUnderCursor.map((go) => go.name);
          console.log("clicked on interactive objects", gameObjectsUnderCursor.length, objects);
          // if we clicked on top of terrain object, then emit terrain selection
          const clickedOnTopOfTerrain = false; // TODO
          if (clickedOnTopOfTerrain) {
            this.sendTerrainSelection(0, 0, 0); // todo?
          } else {
            this.sendSelection(objects);
          }
        } else {
          // No interactive object was clicked, handle tilemap click

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
          console.log("clicked on tile", clickedTileXY.x, clickedTileXY.y);

          this.sendTerrainSelection(clickedTileXY.x, clickedTileXY.y, 0);
        }
      },
      this
    );
  }

  private sendSelection(selected: string[]) {
    this.scene.communicator.selection!.sendLocally({
      gameInstanceId: this.scene.gameInstanceId,
      emitterUserId: this.scene.userId,
      type: "singleSelect",
      data: {
        selected
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

  private sendTerrainSelection(x: number, y: number, z: number) {
    this.scene.communicator.selection!.sendLocally({
      gameInstanceId: this.scene.gameInstanceId,
      emitterUserId: this.scene.userId,
      type: "terrainSelect",
      data: {
        terrainSelected: {
          x,
          y,
          z
        }
      }
    });
  }
}
