import { ProbableWaffleScene } from "../../../../core/probable-waffle.scene";
import { Subscription } from "rxjs";
import { getActorComponent } from "../../../../data/actor-component";
import { SelectableComponent } from "../../../../entity/actor/components/selectable-component";
import { getGameObjectBounds } from "../../../../data/game-object-helper";
import { IdComponent } from "../../../../entity/actor/components/id-component";
import { getPlayerController } from "../../../../data/scene-data";

export class GameObjectSelectionHandler {
  private sub!: Subscription;
  constructor(private readonly scene: ProbableWaffleScene) {
    this.bindSelectionInput();
    this.scene.onDestroy.subscribe(() => this.destroy());
  }

  /**
   * shift + click removes from selection
   * ctrl + click adds to selection
   */
  private bindSelectionInput() {
    this.sub = this.scene.communicator.selection!.on.subscribe((selection) => {
      switch (selection.type) {
        case "deselect":
          console.log("deselect");
          this.deselectActorsForPlayer();
          break;
        case "singleSelect":
          console.log("singleSelect", selection.data!.selected);
          const isShiftDown = selection.data!.shiftKey;
          const isCtrlDown = selection.data!.ctrlKey;

          if (isShiftDown) {
            console.log("removeFromSelection", selection.data!.selected);
            this.deselectActorsByIds(selection.data!.selected!);
          } else if (isCtrlDown) {
            console.log("additionalSelect", selection.data!.selected);
            this.selectActorsByIds(selection.data!.selected!);
          } else {
            this.deselectActorsForPlayer();
            this.selectActorsByIds(selection.data!.selected!);
          }
          break;
        case "terrainSelect":
          console.log("terrainSelect", selection.data!.terrainSelected);
          this.deselectActorsForPlayer();
          break;
        case "multiSelect":
          const area = selection.data!.selectedArea!;
          console.log("multiSelect", area);
          if (selection.data!.shiftKey) {
            this.getSelectableComponentsUnderSelectedArea(area).forEach((actor) => this.deselectActor(actor));
          } else if (selection.data!.ctrlKey) {
            this.getSelectableComponentsUnderSelectedArea(area).forEach((actor) => this.selectActor(actor));
          } else {
            this.deselectActorsForPlayer();
            this.getSelectableComponentsUnderSelectedArea(area).forEach((actor) => this.selectActor(actor));
          }
          break;
        case "multiSelectPreview":
          // not logging as it's too many log events console.log("multiSelectPreview");
          break;
        default:
          throw new Error("unknown selection type");
      }
    });
  }

  private getActorsByIds(ids: string[]) {
    const selectableChildren = this.getSelectableChildren();
    return ids.map((id) => selectableChildren.find((actor) => getActorComponent(actor, IdComponent)!.id === id));
  }

  private selectActorsByIds(ids: string[]) {
    this.getActorsByIds(ids).forEach((actor) => actor && this.selectActor(actor));
  }

  private deselectActorsByIds(ids: string[]) {
    this.getActorsByIds(ids).forEach(
      (actor) => actor && getActorComponent(actor, SelectableComponent)!.setSelected(false)
    );
  }

  selectActor(actor: Phaser.GameObjects.GameObject) {
    getActorComponent(actor, SelectableComponent)!.setSelected(true);
    const playerController = getPlayerController(this.scene);
    if (!playerController) return;
    playerController.setSelectedActor(getActorComponent(actor, IdComponent)!.id);
  }

  private deselectActor(actor: Phaser.GameObjects.GameObject) {
    getActorComponent(actor, SelectableComponent)!.setSelected(false);
    const playerController = getPlayerController(this.scene);
    if (!playerController) return;
    playerController.removeSelectedActor(getActorComponent(actor, IdComponent)!.id);
  }

  private deselectActorsForPlayer() {
    const playerController = getPlayerController(this.scene);
    if (!playerController) return;
    const selection: string[] = playerController.getSelection();
    const selectableChildren = this.getSelectableChildren();
    selection.forEach((id) => {
      const actor = selectableChildren.find((actor) => getActorComponent(actor, IdComponent)!.id === id);
      if (actor) getActorComponent(actor, SelectableComponent)!.setSelected(false);
    });
    playerController.clearSelection();
  }

  private getSelectableChildren() {
    return this.scene.children.list.filter(
      (actor) => !!getActorComponent(actor, SelectableComponent) && !!getActorComponent(actor, IdComponent)
    );
  }

  private getSelectableComponentsUnderSelectedArea(selectedArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) {
    const selectableChildren = this.getSelectableChildren();

    // Apply camera offset and scale
    const selectedAreaBounds = new Phaser.Geom.Rectangle(
      selectedArea.x * this.scene.cameras.main.zoom + this.scene.cameras.main.scrollX,
      selectedArea.y * this.scene.cameras.main.zoom + this.scene.cameras.main.scrollY,
      selectedArea.width * this.scene.cameras.main.zoom,
      selectedArea.height * this.scene.cameras.main.zoom
    );

    return selectableChildren.filter((selectableChild) => {
      const bounds = getGameObjectBounds(selectableChild);
      if (!bounds) return false;
      const actorBounds = new Phaser.Geom.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);

      // Calculate intersection rectangle
      const intersection = Phaser.Geom.Rectangle.Intersection(selectedAreaBounds, actorBounds);

      // Check if more than half of actor's width and height overlap the selectedArea
      const actorOverlapPercentageWidth = intersection.width / actorBounds.width;
      const actorOverlapPercentageHeight = intersection.height / actorBounds.height;

      const minOverlapPercentage = 0.2; // configurable overlap percentage - this is so we don't accidentally select actors that are only slightly overlapping the selection area

      return actorOverlapPercentageWidth > minOverlapPercentage && actorOverlapPercentageHeight > minOverlapPercentage;
    });
  }

  private destroy() {
    this.sub.unsubscribe();
  }
}
