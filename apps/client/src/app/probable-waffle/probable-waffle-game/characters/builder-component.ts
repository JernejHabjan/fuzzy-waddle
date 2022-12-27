import { IComponent } from '../services/component.service';
import { Actor } from '../actor';

// when placing new building
export class BuilderComponent implements IComponent {
  // construction site the builder is currently working on
  assignedConstructionSite?: Actor;
  constructor(
    private readonly gameObject: Phaser.GameObjects.Sprite,
    // types of buildings the actor can produce
    private constructableBuildingClasses: typeof Actor[],
    // Whether the builder enters the construction site while working on it, or not.
    enterConstructionSite: boolean,
    // from how far builder builds construction site
    constructionSiteOffset: number
  ) {}

  init(): void {
    // pass
  }
}
