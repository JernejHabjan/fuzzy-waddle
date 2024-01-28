import { ProbableWaffleScene } from "../../../../core/probable-waffle.scene";
import { Subscription } from "rxjs";
import { getActorComponent } from "../../../../data/actor-component";
import { SelectableComponent } from "../../../../entity/actor/components/selectable-component";
import { getGameObjectBounds } from "../../../../data/game-object-helper";

export class GameObjectSelectionHandler {
  private sub!: Subscription;
  constructor(private readonly scene: ProbableWaffleScene) {
    this.bindSelectionInput();
    this.scene.onDestroy.subscribe(() => this.destroy());
  }

  private bindSelectionInput() {
    this.sub = this.scene.communicator.selection!.on.subscribe((selection) => {
      switch (selection.type) {
        case "deselect":
          console.log("deselect");
          this.getSelectableComponents().forEach((selectable) => selectable.setSelected(false));
          break;
        case "singleSelect":
          console.log("singleSelect", selection.data!.selected);
          // todo find actor by name? - then they need Name component as well
          break;
        case "terrainSelect":
          console.log("terrainSelect", selection.data!.terrainSelected);
          this.getSelectableComponents().forEach((selectable) => selectable.setSelected(false));
          break;
        case "multiSelect":
          const area = selection.data!.selectedArea!;
          console.log("multiSelect", area);
          this.getSelectableComponents().forEach((selectable) => selectable.setSelected(false));
          this.getSelectableComponentsUnderSelectedArea(area).forEach((actor) =>
            getActorComponent(actor, SelectableComponent)!.setSelected(true)
          );
          break;
        case "multiSelectPreview":
          // not logging as it's too many log events console.log("multiSelectPreview");
          break;
        default:
          throw new Error("unknown selection type");
      }
    });
  }

  private getSelectableComponents() {
    return this.getSelectableChildren().map((actor) => getActorComponent(actor, SelectableComponent)!);
  }

  private getSelectableChildren() {
    return this.scene.children.list.filter((actor) => !!getActorComponent(actor, SelectableComponent));
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
