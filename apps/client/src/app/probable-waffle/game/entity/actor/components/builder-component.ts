import { ConstructionSiteComponent } from "../../building/construction/construction-site-component";
import { ContainerComponent } from "../../building/container-component";
import { Subject } from "rxjs";
import { PawnAiControllerComponentOld } from "../../../world/managers/controllers/pawn-ai-controller-component-old";
import { GameplayLibrary } from "../../../library/gameplay-library";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "./owner-component";
import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { ObjectNames } from "../../../data/object-names";
import GameObject = Phaser.GameObjects.GameObject;

export type BuilderDefinition = {
  // types of building the gameObject can produce
  constructableBuildings: ObjectNames[];
  // Whether the builder enters the building site while working on it, or not.
  enterConstructionSite: boolean;
  // from how far builder builds building site
  constructionSiteOffset: number;
};

// Allows the actor to construct building
export class BuilderComponent {
  // building site the builder is currently working on
  assignedConstructionSite?: GameObject;

  onConstructionSiteEntered: Subject<[GameObject, GameObject]> = new Subject<[GameObject, GameObject]>();
  onAssignedToConstructionSite: Subject<[GameObject, GameObject]> = new Subject<[GameObject, GameObject]>();
  onConstructionStarted: Subject<[GameObject, GameObject]> = new Subject<[GameObject, GameObject]>();
  onRemovedFromConstructionSite: Subject<[GameObject, GameObject]> = new Subject<[GameObject, GameObject]>();
  onConstructionSiteLeft: Subject<[GameObject, GameObject]> = new Subject<[GameObject, GameObject]>();

  constructor(
    private readonly gameObject: GameObject,
    private readonly builderComponentDefinition: BuilderDefinition
  ) {}

  get constructableBuildings(): ObjectNames[] {
    // NOTE, this can be later filtered, so we show only buildings that are available to the player
    return this.builderComponentDefinition.constructableBuildings;
  }

  getAssignedConstructionSite() {
    return this.assignedConstructionSite;
  }

  assignToConstructionSite(constructionSite: GameObject) {
    if (this.assignedConstructionSite === constructionSite) return;

    const constructionSiteComponent = getActorComponent(constructionSite, ConstructionSiteComponent);
    if (!constructionSiteComponent) return;

    if (!constructionSiteComponent.canAssignBuilder()) {
      // todo play sound and show notification on screen - same as "the production queue is full"
      return;
    }
    this.assignedConstructionSite = constructionSite;
    constructionSiteComponent.assignBuilder(this.gameObject);
    this.onAssignedToConstructionSite.next([this.gameObject, constructionSite]);

    if (this.builderComponentDefinition.enterConstructionSite) {
      const containerComponent = getActorComponent(constructionSite, ContainerComponent);
      if (containerComponent) {
        containerComponent.loadGameObject(this.gameObject);
        this.onConstructionSiteEntered.next([this.gameObject, constructionSite]);
      }
    }
  }

  beginConstruction(buildingClass: string, targetLocation: Vector3Simple): boolean {
    const pawnAiController = getActorComponent(this.gameObject, PawnAiControllerComponentOld);
    if (!pawnAiController) return false;
    // check requirements
    const missingRequirement = GameplayLibrary.getMissingRequirementsFor(this.gameObject, buildingClass);
    if (missingRequirement) {
      console.log("missing requirement", missingRequirement);
      // player is missing a required gameObject. stop

      pawnAiController.issueStopOrder();
      return false;
    }

    // move builder away to avoid collision
    // todo

    // spawn building
    const ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    const scene = this.gameObject.scene;
    // todo const building = gameMode.spawnGameObjectForPlayer(
    // todo   scene,
    // todo   buildingClass,
    // todo   targetLocation,
    // todo   ownerComponent.playerController
    // todo );
    const building = null;

    if (!building) {
      console.log("building could not be spawned");
      return false;
    }

    this.onConstructionStarted.next([this.gameObject, building]);

    // issue building order
    // pawnAiController.issueContinueConstructionOrder(building);
    return true;
  }

  leaveConstructionSite() {
    if (!this.assignedConstructionSite) return;

    const constructionSite = this.assignedConstructionSite;
    const constructionSiteComponent = getActorComponent(constructionSite, ConstructionSiteComponent);
    if (!constructionSiteComponent) return;

    // remove builder
    this.assignedConstructionSite = undefined;
    constructionSiteComponent.unAssignBuilder(this.gameObject);

    // notify listeners
    this.onRemovedFromConstructionSite.next([this.gameObject, constructionSite]);

    console.log("builder left building site");
    if (this.builderComponentDefinition.enterConstructionSite) {
      // leave building site
      const containerComponent = getActorComponent(constructionSite, ContainerComponent);
      if (containerComponent) {
        containerComponent.unloadGameObject(this.gameObject);
        this.onConstructionSiteLeft.next([this.gameObject, constructionSite]);
      }
    }
  }

  getConstructionRange(buildingType: string | undefined): number {
    // return collision radius of building
    // todo return URTSCollisionLibrary::GetCollisionSize(ConstructibleBuildingClasses[Index]) / 2;
    return 1; // todo
  }
}
