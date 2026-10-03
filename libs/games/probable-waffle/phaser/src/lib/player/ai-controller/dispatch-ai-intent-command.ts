import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { GameCommandInput } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import type { CommandBusService, GameCommandDispatchReceipt } from "../../world/services/multiplayer/command-bus.service";
import { AI_INTENT_COMMAND_DISPATCH_EVENT, type AiIntentCommandDispatchEvent } from "./ai-intent-command-dispatch-event";

/** Observes the accepted intent before synchronous application; shared bus admission remains the only authority. */
export function dispatchAiIntentCommand(
  scene: ProbableWaffleScene,
  bus: CommandBusService,
  command: GameCommandInput,
  intent: AiIntentV1
): GameCommandDispatchReceipt {
  const correlation = {
    intentId: intent.intentId.replace(/^intent:/, ""),
    effectId: intent.effectId.replace(/^effect:/, ""),
    commitmentKey: `ai:${intent.effectId}`
  };
  if (!scene.events.listenerCount(AI_INTENT_COMMAND_DISPATCH_EVENT)) return bus.dispatchAi(command, correlation);
  const emit = (event: AiIntentCommandDispatchEvent) =>
    scene.events.emit(AI_INTENT_COMMAND_DISPATCH_EVENT, structuredClone(event));
  emit({ kind: "requested", playerNumber: command.playerNumber, correlation, command,
    claims: intent.claims, proposedTick: intent.proposedTick, acceptedIntent: intent });
  try {
    const receipt = bus.dispatchAi(command, correlation);
    emit({ kind: "finished", playerNumber: command.playerNumber, correlation, receipt });
    return receipt;
  } catch (error) {
    emit({ kind: "threw", playerNumber: command.playerNumber, correlation });
    throw error;
  }
}
