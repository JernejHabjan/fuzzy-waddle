import type { CommandLockstep } from "./command-lockstep";
import type { GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";

/** Restore unsent local input once, before relay startup. A restored save does not mint new effects or imply application. */
export function restoreSavedCommandInput(transport: CommandLockstep, inputDelayTicks: number): void {
  const instance = transport.scene.baseGameData.gameInstance;
  if (!instance.gameInstanceMetadata.data.startOptions.loadFromSave) return;
  const batches = instance.gameState?.data.pendingCommandBatches ?? [];
  const authority = instance.gameState?.data.commandAuthority;
  const seen = new Set<string>();
  if (!Array.isArray(batches) || batches.length > 2048) throw new Error("invalid_saved_command_batches");
  if (batches.length && !authority) throw new Error("saved_command_authority_missing");
  const staged = new Map<number, GameCommand[]>();
  for (const batch of batches) {
    if (!Number.isSafeInteger(batch.tick) || batch.tick < 0 || batch.playerNumber !== transport.localPlayerNumber ||
        !Array.isArray(batch.commands)) throw new Error("invalid_saved_command_batch");
    for (const command of batch.commands) {
      const execution = command.execution;
      if (!execution || execution.schemaVersion !== 1 || !Number.isSafeInteger(execution.sequence) || execution.sequence < 0 ||
          !Number.isSafeInteger(execution.authorityEpoch) || execution.authorityEpoch < 0 ||
          typeof execution.commandId !== "string" || !execution.commandId.length ||
          typeof execution.commitmentKey !== "string" || !execution.commitmentKey.length ||
          !["human", "ai", "campaign", "replay"].includes(execution.source) ||
          execution.intentId !== undefined && typeof execution.intentId !== "string" ||
          execution.effectId !== undefined && typeof execution.effectId !== "string" ||
          seen.has(execution.commandId) || seen.size >= 2048 || command.tick !== batch.tick ||
          !transport.scene.players.some((player) => player.playerNumber === command.playerNumber))
        throw new Error("invalid_saved_command_identity");
      seen.add(execution.commandId);
      if (authority && (execution.authorityEpoch !== authority.authorityEpoch ||
          authority.processedCommandIds.includes(execution.commandId) ||
          execution.sequence <= (authority.processedSequenceWatermarkByPlayer?.[command.playerNumber] ?? -1))) continue;
      const tick = Math.max(batch.tick, (transport.tickService?.currentTick ?? 0) + inputDelayTicks + 1);
      const commands = staged.get(tick) ?? [];
      commands.push(structuredClone({ ...command, tick }));
      staged.set(tick, commands);
    }
  }
  // Publish only after the complete saved input passes validation; malformed tails cannot partially enqueue.
  for (const [tick, commands] of [...staged].sort(([left], [right]) => left - right)) {
    transport.pendingOutbound.set(tick, commands);
  }
}
