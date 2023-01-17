import { IComponent } from '../../core/component.service';
import { Actor } from '../actor/actor';
import { Minerals } from '../assets/resources/minerals';
import { Vector2Simple } from '../../library/math/intersection';

export type CanPlaceOnClasses = typeof Minerals;
export interface PlaceRestricted {
  placementRestrictionComponent: PlacementRestrictionComponent;
}

// makes sure that the actor can only be placed on a certain class (on minerals)
export class PlacementRestrictionComponent implements IComponent {
  constructor(private readonly actor: Actor, private readonly canPlaceOnClasses: CanPlaceOnClasses[]) {}

  init(): void {
    // todo
  }

  /**
   * Checks if we can place actor on tileXY
   */
  canPlace(tileXY:Vector2Simple): boolean {
    // todo
    return false;
  }
}
