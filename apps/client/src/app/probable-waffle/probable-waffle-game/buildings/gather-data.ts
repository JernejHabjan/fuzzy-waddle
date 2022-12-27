import { ResourceType } from './resource-type';

export class GatherData {
  constructor(
    public resourceType: ResourceType,
    public amountPerGathering: number,
    capacity: number,
    cooldown: number,
    needsReturnToDrain: boolean,
    // range in which resources can be gathered
    range: number
  ) {}
}
