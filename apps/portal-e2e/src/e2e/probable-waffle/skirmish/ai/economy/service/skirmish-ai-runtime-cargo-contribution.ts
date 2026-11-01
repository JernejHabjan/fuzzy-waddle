import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { RuntimeServiceAttempt } from "./skirmish-ai-runtime-service-attempt";

/** One actual native cargo addition owned by an earlier gathering attempt; no purchase/current-order attribution. */
export interface RuntimeCargoContribution {
  readonly additionSequence: number;
  readonly resourceType: ResourceType;
  readonly amount: number;
  readonly gathering: RuntimeServiceAttempt;
}
