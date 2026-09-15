import type { RuntimePageControllerV1 } from "./skirmish-ai-runtime-controller";
import type { RuntimePageTickServiceV1 } from "./skirmish-ai-runtime-tick-service";

export interface RuntimePagePartsV1 {
  readonly controller: RuntimePageControllerV1;
  readonly tickService: RuntimePageTickServiceV1;
  readonly sceneComponentNames: readonly string[];
  getScore(playerNumber: number): { metrics: Readonly<Record<string, number>>; gameResult: string | null };
  getRawOwnedActorNames(playerNumber: number): readonly string[];
  getCommandOutcomes(): readonly {
    kind: string;
    reason: string;
    detail?: string;
    effectId?: string;
  }[];
  dispatchHumanRaid(
    humanPlayerNumber: number,
    targetActorId: string,
    maximumAttackers: number
  ): { status: string; dispatchedActors: number };
}
