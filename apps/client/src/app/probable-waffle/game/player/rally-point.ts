import { TilePlacementData } from "../world/managers/controllers/input/tilemap/tilemap-input.handler";
import { RepresentableActor } from "../entity/actor/representable-actor";

export class RallyPoint {
  constructor(
    // Location to send new actors to
    public tilePlacementData?: TilePlacementData,
    // Actor to send new actors to
    public actor?: RepresentableActor
  ) {}
}
