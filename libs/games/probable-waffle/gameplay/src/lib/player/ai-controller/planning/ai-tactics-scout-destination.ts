import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";

/** The information mission owns its destination; a scout's current position is not a replacement objective. */
export function aiTacticalScoutDestination(observation: AiObservationV1, squad: AiSquadStateV1): Vector3Simple | null {
  if (squad.role !== "scout") return null;
  const point = observation.map?.scoutSearchPoints?.find((point) => `question:${point.pointId}` === squad.objectiveId);
  if (point) return point.position;
  return (
    observation.map?.accessGraph?.nodes.find((node) => node.nodeId === squad.lifecycle?.targetRegionId)
      ?.representativePosition ?? null
  );
}
