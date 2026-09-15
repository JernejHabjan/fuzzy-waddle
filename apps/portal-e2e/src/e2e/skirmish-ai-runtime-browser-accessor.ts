import type { Page } from "@playwright/test";
import type { RuntimePageControllerV1 } from "./skirmish-ai-runtime-controller";
import type { RuntimePagePartsV1 } from "./skirmish-ai-runtime-parts";
import type { RuntimePageTickServiceV1 } from "./skirmish-ai-runtime-tick-service";

declare global {
  interface Window {
    __fuzzyWaddleAiRuntimePartsV1?: (playerNumber: number) => RuntimePagePartsV1 | null;
  }
}

export async function installRuntimeAccessor(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      !!(
        window as unknown as {
          __fuzzyWaddleAiRuntimeBrowserTestV1?: unknown;
        }
      ).__fuzzyWaddleAiRuntimeBrowserTestV1,
    undefined,
    { timeout: 120_000 }
  );
  await page.evaluate(() => {
    window.__fuzzyWaddleAiRuntimePartsV1 = (playerNumber: number) => {
      const host = (
        window as unknown as {
          __fuzzyWaddleAiRuntimeBrowserTestV1?: {
            game: {
              scene: {
                getScenes(active: boolean): {
                  scene: { key: string };
                  getSceneGameData?: () => { systems: unknown[]; services: unknown[]; components: unknown[] };
                }[];
              };
            };
          };
        }
      ).__fuzzyWaddleAiRuntimeBrowserTestV1;
      const scene = host?.game.scene
        .getScenes(true)
        .find((candidate) => candidate.scene.key.startsWith("Map") && candidate.getSceneGameData);
      const graph = scene?.getSceneGameData?.();
      if (!graph) return null;
      const handler = graph.systems.find(
        (candidate): candidate is { getAiPlayerController(player: number): RuntimePageControllerV1 | undefined } =>
          !!candidate && typeof (candidate as { getAiPlayerController?: unknown }).getAiPlayerController === "function"
      );
      const tickService = graph.services.find(
        (candidate): candidate is RuntimePageTickServiceV1 =>
          !!candidate &&
          typeof (candidate as { setSimulationTimeScale?: unknown }).setSimulationTimeScale === "function" &&
          typeof (candidate as { currentTick?: unknown }).currentTick === "number"
      );
      const actorIndex = graph.services.find(
        (
          candidate
        ): candidate is {
          getOwnedActors(playerNumber: number): {
            name: string;
            getData(key: string): {
              components: Map<{ name: string }, Record<string, unknown>>;
            } | null;
          }[];
        } => !!candidate && typeof (candidate as { getOwnedActors?: unknown }).getOwnedActors === "function"
      );
      const commandBus = graph.services.find(
        (
          candidate
        ): candidate is {
          dispatchDeterministic(command: {
            type: "ACTOR_ACTION";
            playerNumber: number;
            actorIds: string[];
            orderType: "Attack";
            targetObjectIds: string[];
            queue: false;
          }): { status: string };
          getAuthorityState(): {
            outcomes: {
              kind: string;
              reason: string;
              detail?: string;
              effectId?: string;
            }[];
          };
        } =>
          !!candidate &&
          typeof (candidate as { dispatchDeterministic?: unknown }).dispatchDeterministic === "function" &&
          typeof (candidate as { getAuthorityState?: unknown }).getAuthorityState === "function"
      );
      const scoreTracker = graph.systems.find(
        (
          candidate
        ): candidate is {
          getScoreData(): Map<number, { metrics: Record<string, number>; gameResult: string }> | undefined;
        } =>
          !!candidate &&
          typeof (candidate as { calculateFinalScore?: unknown }).calculateFinalScore === "function" &&
          typeof (candidate as { getMetric?: unknown }).getMetric === "function"
      );
      const controller = handler?.getAiPlayerController(playerNumber);
      return controller && tickService && actorIndex && commandBus && scoreTracker
        ? {
            controller,
            tickService,
            sceneComponentNames: graph.components.map((component) => component?.constructor?.name ?? "unknown"),
            getScore(requestedPlayerNumber: number) {
              const row = scoreTracker.getScoreData()?.get(requestedPlayerNumber);
              return { metrics: { ...(row?.metrics ?? {}) }, gameResult: row?.gameResult ?? null };
            },
            getRawOwnedActorNames(requestedPlayerNumber: number) {
              return actorIndex
                .getOwnedActors(requestedPlayerNumber)
                .map((actor) => actor.name)
                .sort();
            },
            getCommandOutcomes() {
              return commandBus.getAuthorityState().outcomes;
            },
            dispatchHumanRaid(humanPlayerNumber: number, targetActorId: string, maximumAttackers: number) {
              const component = (
                actor: ReturnType<typeof actorIndex.getOwnedActors>[number],
                componentName: string
              ): Record<string, unknown> | undefined => {
                const data = actor.getData("actorData");
                return data
                  ? [...data.components.entries()].find(([constructor]) => constructor.name === componentName)?.[1]
                  : undefined;
              };
              const actorIds = actorIndex
                .getOwnedActors(humanPlayerNumber)
                .filter((actor) => component(actor, "AttackComponent") && component(actor, "ActorTranslateComponent"))
                .map((actor) => component(actor, "IdComponent")?.["id"])
                .filter((id): id is string => typeof id === "string")
                .sort()
                .slice(0, Math.max(1, maximumAttackers));
              if (actorIds.length === 0) return { status: "no_attackers", dispatchedActors: 0 };
              const receipt = commandBus.dispatchDeterministic({
                type: "ACTOR_ACTION",
                playerNumber: humanPlayerNumber,
                actorIds,
                orderType: "Attack",
                targetObjectIds: [targetActorId],
                queue: false
              });
              return { status: receipt.status, dispatchedActors: actorIds.length };
            }
          }
        : null;
    };
  });
}
