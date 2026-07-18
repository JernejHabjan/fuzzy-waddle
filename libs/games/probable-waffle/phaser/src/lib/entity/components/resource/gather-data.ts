import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

export class GatherData {
  constructor(
    public resourceType: ResourceType,
    public amountPerGathering: number,
    public capacity: number,
    public cooldown: number,
    public needsReturnToDrain: boolean,
    // range in which resources can be gathered
    public range: number
  ) {}
}
