import { Barracks } from "../../assets/buildings/barracks";
import { Mine } from "../../assets/buildings/mine";
import { ConstructionSiteComponent } from "../../building/construction/construction-site-component";
import { ContainerComponent } from "../../building/container-component";
import { Subject } from "rxjs";
import { PawnAiControllerComponent } from "../../../world/managers/controllers/pawn-ai-controller-component";
import { GameMode } from "../../../world/managers/game-mode/game-mode";
import { GameModeSkirmish } from "../../../world/managers/game-mode/game-modes/game-mode-skirmish";
import { GameplayLibrary } from "../../../library/gameplay-library";
import { TilePlacementData } from "../../../world/managers/controllers/input/tilemap/tilemap-input.handler";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "./owner-component";
import GameObject = Phaser.GameObjects.GameObject;

export type ActorAbleToBeBuilt = Barracks | Mine;
export type ActorAbleToBeBuiltClass = typeof Barracks | typeof Mine;
export type BuilderComponentDefinition = {
  // types of building the gameObject can produce
  constructableBuildingClasses: string[];
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
    private readonly builderComponentDefinition: BuilderComponentDefinition
  ) {}

  getAssignedConstructionSite() {
    return this.assignedConstructionSite;
  }

  assignToConstructionSite(constructionSite: GameObject) {
    if (this.assignedConstructionSite === constructionSite) {
      return;
    }
    const constructionSiteComponent = getActorComponent(constructionSite, ConstructionSiteComponent);
    if (!constructionSiteComponent) {
      return;
    }
    if (constructionSiteComponent.canAssignBuilder()) {
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
  }

  beginConstruction(buildingClass: GameObjectAbleToBeBuiltClass, targetLocation: TilePlacementData): boolean {
    const gameMode: GameMode = new GameModeSkirmish(); // todo !!!!!!!!!!!!
    const pawnAiController = this.gameObject.components.findComponent(PawnAiControllerComponent);

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
    const building = gameMode.spawnGameObjectForPlayer(
      scene,
      buildingClass,
      targetLocation,
      ownerComponent.playerController
    );

    if (!building) {
      console.log("building could not be spawned");
      return false;
    }

    this.onConstructionStarted.next([this.gameObject, building]);

    // issue building order
    pawnAiController.issueContinueConstructionOrder(building);
    return true;
  }

  leaveConstructionSite() {
    if (!this.assignedConstructionSite) {
      return;
    }

    const constructionSite = this.assignedConstructionSite;
    const constructionSiteComponent = getActorComponent(constructionSite, ConstructionSiteComponent);
    if (!constructionSiteComponent) {
      return;
    }
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
