import type { GatherData } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/resource/gather-data";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Fresh native gathering profiles per component; source definitions can override the return policy. */
export function createDefaultGatherData(): GatherData[] {
  return [
    {
      capacity: 3,
      cooldown: 1000,
      range: 1,
      resourceType: ResourceType.Wood,
      amountPerGathering: 1,
      needsReturnToDrain: true
    },
    {
      capacity: 3,
      cooldown: 1000,
      range: 1,
      resourceType: ResourceType.Stone,
      amountPerGathering: 1,
      needsReturnToDrain: true
    },
    {
      capacity: 3,
      cooldown: 1000,
      range: 1,
      resourceType: ResourceType.Minerals,
      amountPerGathering: 1,
      needsReturnToDrain: true
    },
    {
      capacity: 10,
      cooldown: 1000,
      range: 1,
      resourceType: ResourceType.Food,
      amountPerGathering: 5,
      needsReturnToDrain: false
    }
  ];
}
