import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { GameCommandAuthorityState } from "@fuzzy-waddle/probable-waffle-protocol";

/** Pending side effects belong to a player; commitment keys are opaque within that player's namespace. */
export class CommandCommitmentRegistry {
  private readonly players = new Map<PlayerNumber, Map<string, string>>();

  get(playerNumber: PlayerNumber, key: string): string | undefined {
    return this.players.get(playerNumber)?.get(key);
  }

  set(playerNumber: PlayerNumber, key: string, commandId: string): void {
    let commitments = this.players.get(playerNumber);
    if (!commitments) {
      commitments = new Map();
      this.players.set(playerNumber, commitments);
    }
    commitments.set(key, commandId);
  }

  delete(playerNumber: PlayerNumber, key: string): void {
    const commitments = this.players.get(playerNumber);
    commitments?.delete(key);
    if (commitments?.size === 0) this.players.delete(playerNumber);
  }

  clear(): void {
    this.players.clear();
  }

  /** Stable player/key ordering is used by save, reconnect and authoritative state hashing. */
  snapshot(): NonNullable<GameCommandAuthorityState["activeCommitmentsByPlayer"]> {
    return Object.fromEntries(
      [...this.players.entries()]
        .sort(([left], [right]) => left - right)
        .map(([playerNumber, commitments]) => [
          playerNumber,
          Object.fromEntries([...commitments.entries()].sort(([left], [right]) => left.localeCompare(right)))
        ])
    );
  }

  /**
   * New snapshots restore exact player/key pairs. Legacy commands carry a server-validated player prefix;
   * archives with custom IDs can use an exact saved outcome. Missing ownership fails closed.
   */
  restore(state: GameCommandAuthorityState): void {
    this.clear();
    if (state.activeCommitmentsByPlayer !== undefined) {
      for (const [player, commitments] of Object.entries(state.activeCommitmentsByPlayer)) {
        const playerNumber = Number(player);
        if (!Number.isSafeInteger(playerNumber) || playerNumber < 0) throw new Error("Invalid commitment player");
        for (const [key, commandId] of Object.entries(commitments)) this.set(playerNumber, key, commandId);
      }
      return;
    }
    for (const [key, commandId] of Object.entries(state.activeCommitments ?? {})) {
      const prefix = /^(\d+):/.exec(commandId)?.[1];
      const playerNumber =
        prefix !== undefined
          ? Number(prefix)
          : state.outcomes.find((outcome) => outcome.commandId === commandId && outcome.commitmentKey === key)
              ?.playerNumber;
      if (playerNumber === undefined || !Number.isSafeInteger(playerNumber) || playerNumber < 0) {
        throw new Error("Legacy commitment has no player identity");
      }
      this.set(playerNumber, key, commandId);
    }
  }
}
