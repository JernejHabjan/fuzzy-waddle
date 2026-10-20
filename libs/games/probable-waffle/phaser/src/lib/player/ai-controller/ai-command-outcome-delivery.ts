import type { GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
import type { CommandBusService } from "../../world/services/multiplayer/command-bus.service";

/** Consumer-local delivery policy; native application and the shared public outcome stream are never intercepted. */
export interface AiCommandOutcomeDelivery {
  deliver(outcome: GameCommandOutcome, accept: (outcome: GameCommandOutcome) => void): void;
  /** Null means the reconciliation checkpoint is unavailable, never authoritative absence/non-application. */
  history(outcomes: readonly GameCommandOutcome[]): readonly GameCommandOutcome[] | null;
}

const deliveries = new WeakMap<CommandBusService, Map<number, AiCommandOutcomeDelivery>>();

/** Explicit scene-owned test transport opt-in. Refuse overlapping owners; disposal cannot remove a later installation. */
export function installAiCommandOutcomeDelivery(bus: CommandBusService, player: number, delivery: AiCommandOutcomeDelivery) {
  const players = deliveries.get(bus) ?? new Map<number, AiCommandOutcomeDelivery>();
  if (players.has(player)) throw new Error("ai_outcome_delivery_already_owned");
  players.set(player, delivery);
  deliveries.set(bus, players);
  return () => {
    if (players.get(player) === delivery) players.delete(player);
    if (!players.size) deliveries.delete(bus);
  };
}

/** Ordinary matches take the direct callback path; only a registered consumer can delay its own receipt. */
export function deliverAiCommandOutcome(bus: CommandBusService, outcome: GameCommandOutcome,
  accept: (outcome: GameCommandOutcome) => void) {
  const delivery = deliveries.get(bus)?.get(outcome.playerNumber);
  if (delivery) delivery.deliver(outcome, accept);
  else accept(outcome);
}

/** The caller supplies an actual shared checkpoint; a test transport may make delivery unavailable without editing it. */
export function readAiCommandOutcomeHistory(bus: CommandBusService, player: number, outcomes: readonly GameCommandOutcome[]) {
  const delivery = deliveries.get(bus)?.get(player);
  return delivery ? delivery.history(outcomes) : outcomes;
}
