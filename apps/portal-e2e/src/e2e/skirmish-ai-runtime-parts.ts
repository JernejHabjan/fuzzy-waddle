import type { RuntimePageController } from "./skirmish-ai-runtime-controller";
import type { RuntimePageTickService } from "./skirmish-ai-runtime-tick-service";

export interface RuntimePageParts {
  readonly controller: RuntimePageController;
  readonly tickService: RuntimePageTickService;
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
    maximumAttackers: number,
    attackerObjectNames?: readonly string[]
  ): { status: string; dispatchedActors: number };
}
