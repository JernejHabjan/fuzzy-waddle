import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { RuntimeServiceAttemptV1 } from "./skirmish-ai-runtime-service-attempt";

/** One actual native cargo addition owned by an earlier gathering attempt; no purchase/current-order attribution. */
export interface RuntimeCargoContributionV1 {
  readonly additionSequence: number;
  readonly resourceType: ResourceType;
  readonly amount: number;
  readonly gathering: RuntimeServiceAttemptV1;
}
