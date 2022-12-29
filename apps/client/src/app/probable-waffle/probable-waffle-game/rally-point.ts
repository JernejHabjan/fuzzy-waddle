import { TilePlacementData } from './input/tilemap/tilemap-input.handler';
import { RepresentableActor } from './characters/representable-actor';

export class RallyPoint {
  constructor(
    // Location to send new actors to
    public tilePlacementData?: TilePlacementData,
    // Actor to send new actors to
    public actor?: RepresentableActor
  ) {}
}
