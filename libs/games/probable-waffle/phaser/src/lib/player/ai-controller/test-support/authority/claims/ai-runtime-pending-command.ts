import type { AiIntent } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { GameCommandInput, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Confirmed bus admission awaiting all addressed actors' application; claims are diagnostic, never cash escrow. */
export interface AiRuntimePendingCommand {
  readonly commandId: string;
  readonly playerNumber: number;
  readonly intentId: string;
  readonly effectId: string;
  readonly commitmentKey: string;
  readonly authorityEpoch: number;
  readonly authoritySequence: number;
  readonly requestedTick: number;
  readonly proposedTick: number;
  readonly scheduledTick: number;
  readonly command: GameCommandInput;
  readonly claims: AiIntent["claims"];
  readonly resources: Readonly<Record<ResourceType, number>>;
  readonly unresolvedActorIds: readonly string[];
}
