import { IComponent } from '../services/component.service';
import { Actor } from '../actor';
import { Barracks } from '../buildings/barracks';
import { Mine } from '../economy/mine';

export type ActorsAbleToBeBuilt = Barracks | Mine;
export type ActorsAbleToBeBuiltClass = typeof Barracks | typeof Mine;

export interface Builder {
  builderComponent: BuilderComponent;
}

// Allows the actor to construct buildings
export class BuilderComponent implements IComponent {
  // construction site the builder is currently working on
  assignedConstructionSite?: Actor;
  constructor(
    private readonly actor: Actor,
    // types of buildings the actor can produce
    private constructableBuildingClasses: ActorsAbleToBeBuiltClass[],
    // Whether the builder enters the construction site while working on it, or not.
    enterConstructionSite: boolean,
    // from how far builder builds construction site
    constructionSiteOffset: number
  ) {}

  init(): void {
    // pass
  }
}
