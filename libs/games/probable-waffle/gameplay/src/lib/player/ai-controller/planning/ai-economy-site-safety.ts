import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { isAiProducerPositionExposed, observedAiProducerThreats } from "./ai-producer-safety";

/** Reuses current permitted weapon facts; includes adjacent worker contact cells, without inventing hidden threats. */
export function aiEconomySiteSafety(observation: AiObservationV1) {
  const threats = observedAiProducerThreats(observation);
  const positionSafe = (position: Vector3Simple): boolean => {
    for (let y = -1; y <= 1; y += 1)
      for (let x = -1; x <= 1; x += 1)
        if (isAiProducerPositionExposed({ x: position.x + x, y: position.y + y, z: position.z }, threats)) return false;
    return true;
  };
  return {
    positionSafe,
    actorSafe: (actor: AiObservedActorV1): boolean =>
      actor.logicalPosition.status !== "known" || positionSafe(actor.logicalPosition.value)
  };
}
