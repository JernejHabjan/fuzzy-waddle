import { ProbableWaffleScene } from "../../../../core/probable-waffle.scene";
import { filter, Subscription } from "rxjs";
import { getActorComponent } from "../../../../data/actor-component";
import { SelectableComponent } from "../../../../entity/actor/components/selectable-component";
import { getGameObjectBounds } from "../../../../data/game-object-helper";
import { IdComponent } from "../../../../entity/actor/components/id-component";
import {
  emitEventIssueActorCommandToSelectedActors,
  emitEventIssueMoveCommandToSelectedActors,
  emitEventSelection,
  getPlayer
} from "../../../../data/scene-data";
import { AttackComponent } from "../../../../entity/combat/components/attack-component";
import { ProductionCostComponent } from "../../../../entity/building/production/production-cost-component";
import { HealthComponent } from "../../../../entity/combat/components/health-component";
import { ProbableWaffleSelectionData } from "@fuzzy-waddle/api-interfaces";
import { getActorSystem } from "../../../../data/actor-system";
import { MovementSystem } from "../../../../entity/systems/movement.system";
import GameObject = Phaser.GameObjects.GameObject;

export class GameObjectSelectionHandler {
  private readonly debug = false;
  private sub!: Subscription;
  constructor(private readonly scene: ProbableWaffleScene) {
    this.bindSelectionInput();
    this.scene.onShutdown.subscribe(() => this.destroy());
  }

  /**
   * shift + click removes from selection
   * ctrl + click adds to selection
   */
  private bindSelectionInput() {
    this.sub = this.scene.communicator
      .allScenes!.pipe(filter((selection) => selection.name.startsWith("selection.")))
      .subscribe((selection) => {
        const data = selection.data as ProbableWaffleSelectionData;
        switch (selection.name) {
          case "selection.deselect":
            if (this.debug) console.log("deselect");
            emitEventSelection(this.scene, "selection.cleared");
            break;
          case "selection.singleSelect":
            if (this.debug) console.log("singleSelect", data.objectIds);
            const isShiftDown = data.shiftKey;
            const isCtrlDown = data.ctrlKey;
            const isLeftClick = data.button === "left";

            if (isLeftClick) {
              if (isShiftDown) {
                if (this.debug) console.log("removeFromSelection", data.objectIds);
                emitEventSelection(this.scene, "selection.removed", data.objectIds!);
              } else if (isCtrlDown) {
                if (this.debug) console.log("additionalSelect", data.objectIds);
                emitEventSelection(this.scene, "selection.added", data.objectIds!);
              } else {
                emitEventSelection(this.scene, "selection.set", data.objectIds!);
              }
            } else {
              emitEventIssueActorCommandToSelectedActors(this.scene, data.objectIds!);
            }

            break;
          case "selection.terrainSelect":
            if (this.debug) console.log("terrainSelect", data.terrainSelectedTileVec3, data.terrainSelectedWorldVec3);
            if (data.button === "left") {
              emitEventSelection(this.scene, "selection.cleared");
            } else {
              emitEventIssueMoveCommandToSelectedActors(
                this.scene,
                data.terrainSelectedTileVec3!,
                data.terrainSelectedWorldVec3!
              );
            }
            break;
          case "selection.multiSelect":
            const area = data.selectedArea!;
            // console.log("multiSelect", area);
            const actorsUnderArea = this.getSelectableComponentsUnderSelectedArea(area);
            const actorsWithHighestPriority = this.getChildrenWithHighestPriority(actorsUnderArea);
            const actorsWithHighestPriorityIds = actorsWithHighestPriority.map(
              (actor) => getActorComponent(actor, IdComponent)!.id
            );
            if (data.shiftKey) {
              emitEventSelection(this.scene, "selection.removed", actorsWithHighestPriorityIds);
            } else if (data.ctrlKey) {
              emitEventSelection(this.scene, "selection.added", actorsWithHighestPriorityIds);
            } else {
              emitEventSelection(this.scene, "selection.set", actorsWithHighestPriorityIds);
            }
            break;
          case "selection.multiSelectPreview":
            // not logging as it's too many log events console.log("multiSelectPreview");
            break;
        }
      });
  }

  private getActorsByIds(ids: string[]): GameObject[] {
    const selectableChildren = this.getSelectableChildren();
    return ids
      .map((id) => selectableChildren.find((actor) => getActorComponent(actor, IdComponent)!.id === id))
      .filter((actor) => !!actor) as GameObject[];
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

    const worldXyStart = this.scene.cameras.main.getWorldPoint(selectedArea.x, selectedArea.y);
    const worldXyEnd = this.scene.cameras.main.getWorldPoint(
      selectedArea.x + selectedArea.width,
      selectedArea.y + selectedArea.height
    );
    const selectedAreaBounds = new Phaser.Geom.Rectangle(
      worldXyStart.x,
      worldXyStart.y,
      worldXyEnd.x - worldXyStart.x,
      worldXyEnd.y - worldXyStart.y
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

  private getSelectedMovableActors() {
    const player = getPlayer(this.scene);
    if (!player) return [];
    // get actors that are selected
    const selectedActors = player.getSelection();
    if (selectedActors.length === 0) return [];
    const selectedActorsGameObjects = this.getActorsByIds(selectedActors);
    // noinspection UnnecessaryLocalVariableJS
    const movableActors = selectedActorsGameObjects.filter((actor) => !!getActorSystem(actor, MovementSystem));
    return movableActors;
  }

  private destroy() {
    this.sub.unsubscribe();
  }
}
