import type { Page } from "@playwright/test";
import type { RuntimePerturbationV1 } from "./skirmish-ai-runtime-perturbation";

export async function applyRuntimePerturbation(
  page: Page,
  perturbation: RuntimePerturbationV1,
  aiPlayerNumber: number
): Promise<{ id: string; tick: number; dispatchedActors: number; subjectName: string | null }> {
  const targetActorId = await page.evaluate(({ playerNumber, targetObjectName }) => {
      const observation = window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber)?.controller.getCommittedObservation();
      return observation?.actors.find(
        (actor) =>
          actor.relation === "self" &&
          actor.visibility === "owned" &&
          (targetObjectName
            ? actor.objectName === targetObjectName
            : actor.mainBuilding?.status === "known" && actor.mainBuilding.value)
      )?.actorId;
  }, { playerNumber: aiPlayerNumber, targetObjectName: perturbation.targetObjectName });
  if (!targetActorId) {
    return { id: perturbation.id, tick: perturbation.tick, dispatchedActors: 0, subjectName: perturbation.targetObjectName ?? null };
  }
  const dispatched = await page.evaluate(
    ({ playerNumber, input, targetId }) => {
      const parts = window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber);
      if (!parts) throw new Error("runtime_controller_unavailable");
      return parts.dispatchHumanRaid(1, targetId, input.maximumAttackers, input.attackerObjectNames);
    },
    { playerNumber: aiPlayerNumber, input: perturbation, targetId: targetActorId }
  );
  return {
    id: perturbation.id,
    tick: perturbation.tick,
    dispatchedActors: dispatched.status === "dispatched" ? dispatched.dispatchedActors : 0,
    subjectName: perturbation.targetObjectName ?? null
  };
}
