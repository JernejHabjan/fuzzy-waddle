import type Phaser from "phaser";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import type { GameCommandOutcomeKind } from "@fuzzy-waddle/probable-waffle-protocol";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";

/** Reconciles the original saved purchase identity with its native terminal effect. */
export function reportQueueTerminalOutcome(
  producer: Phaser.GameObjects.GameObject,
  item: UnifiedQueueItem,
  kind: Extract<GameCommandOutcomeKind, "completed" | "cancelled" | "failed">,
  worldLinkIds: readonly string[],
  detail?: string
): void {
  const context = item.commandContext;
  if (!context) return;
  const tick = getSceneService(producer.scene, SimulationTickService)?.currentTick ?? 0;
  getSceneService(producer.scene, CommandBusService)?.reportPersistedOutcome({
    schemaVersion: 1,
    kind,
    reason: kind === "cancelled" ? "cancelled" : kind === "failed" ? "application_failed" : "applied",
    tick,
    playerNumber: context.playerNumber,
    commandId: context.execution.commandId,
    commitmentKey: context.execution.commitmentKey,
    authorityEpoch: context.execution.authorityEpoch,
    sequence: context.execution.sequence,
    ...(context.execution.intentId ? { intentId: context.execution.intentId } : {}),
    ...(context.execution.effectId ? { effectId: context.execution.effectId } : {}),
    actorIds: [...context.actorIds],
    worldLinkIds: [...worldLinkIds],
    detail
  });
}
