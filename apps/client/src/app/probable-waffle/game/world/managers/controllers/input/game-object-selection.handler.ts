import { ProbableWaffleScene } from "../../../../core/probable-waffle.scene";
import { filter, Subscription } from "rxjs";
import { getActorComponent } from "../../../../data/actor-component";
import { getGameObjectBounds } from "../../../../data/game-object-helper";
import { IdComponent } from "../../../../entity/actor/components/id-component";
import {
  emitEventIssueActorCommandToSelectedActors,
  emitEventIssueMoveCommandToSelectedActors,
  emitEventSelection,
  getCurrentPlayerNumber,
  getPlayer,
  getSelectableSceneChildren
} from "../../../../data/scene-data";
import { AttackComponent } from "../../../../entity/combat/components/attack-component";
import { ProductionCostComponent } from "../../../../entity/building/production/production-cost-component";
import { HealthComponent } from "../../../../entity/combat/components/health-component";
import {
  ObjectNames,
  ProbableWaffleDoubleSelectionData,
  ProbableWaffleSelectionData
} from "@fuzzy-waddle/api-interfaces";
import { getActorSystem } from "../../../../data/actor-system";
import { MovementSystem } from "../../../../entity/systems/movement.system";
import { AudioActorComponent, SoundType } from "../../../../entity/actor/components/audio-actor-component";
import { OwnerComponent } from "../../../../entity/actor/components/owner-component";
import GameObject = Phaser.GameObjects.GameObject;
import { pwActorDefinitions } from "../../../../data/actor-definitions";

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
        const data = selection.data as ProbableWaffleSelectionData | undefined;
        const isShiftDown = data?.shiftKey;
        const isCtrlDown = data?.ctrlKey;
        const isLeftClick = data?.button === "left";
        const isRightClick = data?.button === "right";
        switch (selection.name) {
          case "selection.deselect":
            if (this.debug) console.log("deselect");
            emitEventSelection(this.scene, "selection.cleared");
            break;
          case "selection.singleSelect":
            const objectIds = data?.objectIds;
            if (this.debug) console.log("singleSelect", objectIds);
            if (isLeftClick) {
              if (isShiftDown) {
                if (this.debug) console.log("removeFromSelection", objectIds);
                emitEventSelection(this.scene, "selection.removed", objectIds!);
              } else if (isCtrlDown) {
                if (this.debug) console.log("additionalSelect", objectIds);
                emitEventSelection(this.scene, "selection.added", objectIds!);
              } else {
                emitEventSelection(this.scene, "selection.set", objectIds!);
                this.playAudio(objectIds!);
              }
            } else if (isRightClick) {
              emitEventIssueActorCommandToSelectedActors(this.scene, objectIds!);
            }

            break;
          case "selection.doubleSelect":
            const doubleSelectData = selection.data as ProbableWaffleDoubleSelectionData;
            const objectId = doubleSelectData.objectId;
            if (this.debug) console.log("doubleSelect", objectId);
            const actors = this.getSameTypeActorsInViewportById(objectId);
            const actorIds = actors.map((actor) => getActorComponent(actor, IdComponent)!.id);
            emitEventSelection(this.scene, "selection.set", actorIds);
            this.playAudio(actorIds);
            break;
          case "selection.terrainSelect":
            if (this.debug) console.log("terrainSelect", data!.terrainSelectedTileVec3, data!.terrainSelectedWorldVec3);
            if (isLeftClick) {
              emitEventSelection(this.scene, "selection.cleared");
            } else if (isRightClick) {
              const selectedActorObjectIds = this.getSelectedMovableActors().map(
                (actor) => getActorComponent(actor, IdComponent)!.id
              );
              emitEventIssueMoveCommandToSelectedActors(
                this.scene,
                data.terrainSelectedTileVec3!,
                data.terrainSelectedWorldVec3!,
                selectedActorObjectIds
              );
            }
            break;
          case "selection.multiSelect":
            const area = data!.selectedArea!;
            // console.log("multiSelect", area);
            const actorsUnderArea = this.getSelectableComponentsUnderSelectedArea(area);
            const actorsWithHighestPriority = this.getChildrenWithHighestPriority(actorsUnderArea);
            const actorsWithHighestPriorityIds = actorsWithHighestPriority.map(
              (actor) => getActorComponent(actor, IdComponent)!.id
            );
            if (isShiftDown) {
              emitEventSelection(this.scene, "selection.removed", actorsWithHighestPriorityIds);
            } else if (isCtrlDown) {
              emitEventSelection(this.scene, "selection.added", actorsWithHighestPriorityIds);
            } else {
              emitEventSelection(this.scene, "selection.set", actorsWithHighestPriorityIds);
              this.playAudio(actorsWithHighestPriorityIds);
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
    return getSelectableSceneChildren(this.scene);
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

  private playAudio(actorIds: string[]) {
    if (!actorIds.length) return;
    const firstActorId = actorIds[0];
    const firstActor = this.getActorsByIds([firstActorId])[0];
    if (!firstActor) return;
    const audioActorComponent = getActorComponent(firstActor, AudioActorComponent);
    if (!audioActorComponent) return;
    const selectionIsForCurrentPlayer = this.selectionIsForCurrentPlayer(firstActor);
    if (!selectionIsForCurrentPlayer) return;
    const healthComponent = getActorComponent(firstActor, HealthComponent);
    if (healthComponent && healthComponent.killed) return;
    audioActorComponent.playCustomSound(SoundType.Select);
  }

  private selectionIsForCurrentPlayer(actor: GameObject) {
    const currentPlayerNr = getCurrentPlayerNumber(actor.scene);
    const actorPlayerNr = getActorComponent(actor, OwnerComponent)?.getOwner();
    return actorPlayerNr === currentPlayerNr;
  }

  /**
   * Gets game objects in current users viewport by the same actor name.
   * Used when double-clicking on an actor to select same actors on screen by type
   */
  private getSameTypeActorsInViewportById(objectId: string): GameObject[] {
    const selectableChildren = this.getSelectableChildren();

    // Find the original actor to get its type/name
    const originalActor = selectableChildren.find((actor) => getActorComponent(actor, IdComponent)!.id === objectId);

    if (!originalActor) return [];

    // Get the actor's name as the type identifier
    let actorType = originalActor.name;
    const parentType = this.getParentType(actorType as ObjectNames);
    if (parentType) actorType = parentType;

    // Get current viewport bounds in world coordinates
    const camera = this.scene.cameras.main;
    const worldView = camera.worldView;

    // Filter actors by same type and within viewport
    return selectableChildren.filter((actor) => {
      let thisActorType = actor.name;
      const thisParentType = this.getParentType(thisActorType as ObjectNames);
      if (thisParentType) thisActorType = thisParentType;

      if (thisParentType !== actorType) return false;

      // Check if actor is within viewport
      const bounds = getGameObjectBounds(actor);
      if (!bounds) return false;

      const actorBounds = new Phaser.Geom.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
      return Phaser.Geom.Rectangle.Overlaps(worldView, actorBounds);
    });
  }

  /**
   * Find parent type - for example TivaraWorkerFemale has parent type TivaraWorker
   */
  private getParentType(actorName: ObjectNames): ObjectNames | undefined {
    for (const key in pwActorDefinitions) {
      const actorDefinition = pwActorDefinitions[key as ObjectNames];
      if (actorDefinition.meta?.randomOfType?.includes(actorName as ObjectNames)) {
        return key as ObjectNames;
      }
    }
    return undefined;
  }
}
