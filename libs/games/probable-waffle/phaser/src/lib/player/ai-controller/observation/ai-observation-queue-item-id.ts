import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";

/** Command-backed items keep shared identity after index shifts/restoration; legacy positional IDs retain no such guarantee. */
export function aiObservationQueueItemId(actorId: string, item: UnifiedQueueItem, legacyIndex: number): string {
  const commandId = item.commandContext?.execution.commandId;
  return commandId ? `queue:${actorId}:${commandId}` : `${actorId}:${legacyIndex}:${item.type}`;
}
