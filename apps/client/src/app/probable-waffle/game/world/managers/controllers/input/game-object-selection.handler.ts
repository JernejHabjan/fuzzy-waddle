import { ProbableWaffleScene } from "../../../../core/probable-waffle.scene";
import { Subscription } from "rxjs";
import { getActorComponent } from "../../../../data/actor-component";
import { SelectableComponent } from "../../../../entity/actor/components/selectable-component";
import { getGameObjectBounds } from "../../../../data/game-object-helper";
import { IdComponent } from "../../../../entity/actor/components/id-component";
import { getPlayerController } from "../../../../data/scene-data";
import { AttackComponent } from "../../../../entity/combat/components/attack-component";
import { ProductionCostComponent } from "../../../../entity/building/production/production-cost-component";
import { HealthComponent } from "../../../../entity/combat/components/health-component";
import GameObject = Phaser.GameObjects.GameObject;
import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getActorSystem } from "../../../../data/actor-system";
import { MovementSystem } from "../../../../entity/systems/movement.system";

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
          if (selection.data!.button === "left") {
            this.deselectActorsForPlayer();
          } else {
            this.issueMoveCommandToSelectedActors(selection.data!.terrainSelected!);
          }
          break;
        case "multiSelect":
          const area = selection.data!.selectedArea!;
          // console.log("multiSelect", area);
          const actorsUnderArea = this.getSelectableComponentsUnderSelectedArea(area);
          const actorsWithHighestPriority = this.getChildrenWithHighestPriority(actorsUnderArea);
          if (selection.data!.shiftKey) {
            actorsUnderArea.forEach((actor) => this.deselectActor(actor));
          } else if (selection.data!.ctrlKey) {
            actorsWithHighestPriority.forEach((actor) => this.selectActor(actor));
          } else {
            this.deselectActorsForPlayer();
            actorsWithHighestPriority.forEach((actor) => this.selectActor(actor));
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

  private getActorsByIds(ids: string[]): GameObject[] {
    const selectableChildren = this.getSelectableChildren();
    return ids
      .map((id) => selectableChildren.find((actor) => getActorComponent(actor, IdComponent)!.id === id))
      .filter((actor) => !!actor) as GameObject[];
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

    // Apply camera offset and scale // TODO SCALE NOT HANDLED CORRECTLY
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

  /**
   *  most important - those that have AttackComponent
   *  next - those that have ProductionCostComponent
   *  next - those that have health component
   *  others
   */
  private getChildrenWithHighestPriority(children: GameObject[]): GameObject[] {
    const grouped: { priority: number; actors: Phaser.GameObjects.GameObject[] }[] = [];

    children.forEach((actor) => {
      const attackComponent = getActorComponent(actor, AttackComponent);
      if (attackComponent) {
        grouped.push({ priority: 0, actors: [actor] });
      }

      const productionCostComponent = getActorComponent(actor, ProductionCostComponent);
      if (productionCostComponent) {
        grouped.push({ priority: 1, actors: [actor] });
      }

      const healthComponent = getActorComponent(actor, HealthComponent);
      if (healthComponent) {
        grouped.push({ priority: 2, actors: [actor] });
      }
      grouped.push({ priority: 3, actors: [actor] });
    });

    // return actors with the highest priority
    const highestPriority = Math.min(...grouped.map((group) => group.priority));
    return grouped
      .filter((group) => group.priority === highestPriority)
      .map((group) => group.actors)
      .flat();
  }

  private issueMoveCommandToSelectedActors(vec3: Vector3Simple) {
    console.log("issue move command to selected actors");
    const playerController = getPlayerController(this.scene);
    if (!playerController) return;
    // get actors that are selected
    const selectedActors = playerController.getSelection();
    if (selectedActors.length === 0) return;
    const selectedActorsGameObjects = this.getActorsByIds(selectedActors);
    const movableActors = selectedActorsGameObjects.filter((actor) => !!getActorSystem(actor, MovementSystem));
    movableActors.forEach((actor) => {
      // issue move command to each actor
      const movementSystem = getActorSystem(actor, MovementSystem)!;
      movementSystem.moveToLocation(vec3, {
        duration: 500
      });
    });
  }

  private destroy() {
    this.sub.unsubscribe();
  }
}
