/** Save-safe lifetime for a spell-created actor. */
export interface SummonExpiryData {
  readonly actorId: string;
  readonly effectId: string;
  readonly commandId: string;
  readonly dueTick: number;
}
