import type { GameCommandSource } from "./game-command-source";
/**
 * Versioned idempotency and authority metadata carried by the command stream.
 * Legacy version-1 archives omit this field and are upgraded deterministically by
 * the playback/application boundary before they can affect the world.
 */
export interface GameCommandExecution {
  readonly schemaVersion: 1;
  readonly commandId: string;
  readonly commitmentKey: string;
  readonly source: GameCommandSource;
  readonly authorityEpoch: number;
  readonly sequence: number;
  readonly intentId?: string;
  readonly effectId?: string;
}
