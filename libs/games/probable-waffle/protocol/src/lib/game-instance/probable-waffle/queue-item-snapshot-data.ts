import type { ActorId, PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { GameCommandExecution } from "./game-command";
import type { ObjectNames } from "./object-names";
import type { ResearchType } from "./research-type";
import type { ResourceType } from "../../probable-waffle/resource-type-definition";

/** A paid queue handle, including its original price and command lineage; durations are simulation milliseconds. */
export type QueueItemSnapshotData = {
  totalTime: number;
  remainingTime: number;
  commandContext?: { execution: GameCommandExecution; playerNumber: PlayerNumber; actorIds: readonly ActorId[] };
} & (
  | {
      type: "Production";
      productionData: {
        actorName: ObjectNames;
        costData: {
          /** Existing payment wire values: 0 = immediate, 1 = over time. */
          costType: 0 | 1;
          productionTime: number;
          resources: Partial<Record<ResourceType, number>>;
          refundFactor: number;
        };
      };
    }
  | {
      type: "Research";
      researchData: ResearchType;
      researchCost?: { resources: Partial<Record<ResourceType, number>>; refundFactor: number };
    }
);
