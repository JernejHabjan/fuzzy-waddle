import { IComponent } from '../services/component.service';
import { Actor } from '../actor';
import { Barracks } from '../buildings/barracks';
import { Mine } from '../economy/mine';
import { ConstructionSiteComponent } from '../buildings/construction-site-component';
import { ContainerComponent } from '../buildings/container-component';
import { Subject } from 'rxjs';
import { PawnAiControllerComponent } from '../controllers/pawn-ai-controller-component';
import { GameMode } from '../game-mode/game-mode';
import { GameModeSkirmish } from '../game-mode/game-mode-skirmish';
import { GameplayLibrary } from '../library/gameplay-library';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import { OwnerComponent } from './owner-component';

export type ActorAbleToBeBuilt = Barracks | Mine;
export type ActorAbleToBeBuiltClass = typeof Barracks | typeof Mine;

export interface Builder {
  builderComponent: BuilderComponent;
}

// Allows the actor to construct buildings
export class BuilderComponent implements IComponent {
  // construction site the builder is currently working on
  assignedConstructionSite?: Actor;

  onConstructionSiteEntered: Subject<[Actor, Actor]> = new Subject<[Actor, Actor]>();
  onAssignedToConstructionSite: Subject<[Actor, Actor]> = new Subject<[Actor, Actor]>();
  onConstructionStarted: Subject<[Actor, Actor]> = new Subject<[Actor, Actor]>();
  onRemovedFromConstructionSite: Subject<[Actor, Actor]> = new Subject<[Actor, Actor]>();
  onConstructionSiteLeft: Subject<[Actor, Actor]> = new Subject<[Actor, Actor]>();
  constructor(
    private readonly actor: Actor,
    // types of buildings the actor can produce
    private constructableBuildingClasses: ActorAbleToBeBuiltClass[],
    // Whether the builder enters the construction site while working on it, or not.
    private enterConstructionSite: boolean,
    // from how far builder builds construction site
    private constructionSiteOffset: number
  ) {
  }

  init(): void {
    // pass
  }

  getAssignedConstructionSite() {
    return this.assignedConstructionSite;
  }

  assignToConstructionSite(constructionSite: Actor) {
    if (this.assignedConstructionSite === constructionSite) {
      return;
    }
    const constructionSiteComponent = constructionSite.components.findComponentOrNull(ConstructionSiteComponent);
    if (!constructionSiteComponent) {
      return;
    }
    if (constructionSiteComponent.canAssignBuilder()) {
      this.assignedConstructionSite = constructionSite;
      constructionSiteComponent.assignBuilder(this.actor);
      this.onAssignedToConstructionSite.next([this.actor, constructionSite]);

      if (this.enterConstructionSite) {
        const containerComponent = constructionSite.components.findComponentOrNull(ContainerComponent);
        if (containerComponent) {
          containerComponent.loadActor(this.actor);
          this.onConstructionSiteEntered.next([this.actor, constructionSite]);
        }
      }
    }
  }

  beginConstruction(buildingClass: ActorAbleToBeBuiltClass, targetLocation: TilePlacementData): boolean {
    const gameMode: GameMode = new GameModeSkirmish(); // todo !!!!!!!!!!!!
    const pawnAiController = this.actor.components.findComponent(PawnAiControllerComponent);

    // check requirements
    const missingRequirement = GameplayLibrary.getMissingRequirementsFor(this.actor, buildingClass);
    if (missingRequirement) {
      console.log('missing requirement', missingRequirement);
      // player is missing a required actor. stop

      pawnAiController.issueStopOrder();
      return false;
    }

    // move builder away to avoid collision
    // todo

    // spawn building
    const ownerController = this.actor.components.findComponent(OwnerComponent);
    const building = gameMode.spawnActorForPlayer(buildingClass, ownerController.playerController, targetLocation);

    if (!building) {
      console.log('building could not be spawned');
      return false;
    }

    this.onConstructionStarted.next([this.actor, building]);

    // issue construction order
    pawnAiController.issueContinueConstructionOrder(building);
    return true;
  }

  leaveConstructionSite() {
    if(!this.assignedConstructionSite){
      return;
    }

    const constructionSite = this.assignedConstructionSite;
    const constructionSiteComponent = constructionSite.components.findComponentOrNull(ConstructionSiteComponent);
    if (!constructionSiteComponent) {
      return;
    }
    // remove builder
    this.assignedConstructionSite = undefined;
    constructionSiteComponent.unAssignBuilder(this.actor);

    // notify listeners
    this.onRemovedFromConstructionSite.next([this.actor, constructionSite]);

    console.log('builder left construction site');
    if(this.enterConstructionSite){

      // leave construction site
      const containerComponent = constructionSite.components.findComponentOrNull(ContainerComponent);
      if (containerComponent) {
        containerComponent.unloadActor(this.actor);
        this.onConstructionSiteLeft.next([this.actor, constructionSite]);
      }
    }
  }

  getConstructionRange(buildingType: ActorAbleToBeBuiltClass | undefined): number {
    // return collision radius of building
    // todo return URTSCollisionLibrary::GetCollisionSize(ConstructibleBuildingClasses[Index]) / 2;
    return 1; // todo
  }
}
