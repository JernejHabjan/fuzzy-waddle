import type { Page } from "@playwright/test";
import type { RuntimePageController } from "./skirmish-ai-runtime-controller";
import type { RuntimePageParts } from "./skirmish-ai-runtime-parts";
import type { RuntimePageTickService } from "./skirmish-ai-runtime-tick-service";

declare global {
  interface Window {
    __fuzzyWaddleAiRuntimeParts?: (playerNumber: number) => RuntimePageParts | null;
  }
}

export async function installRuntimeAccessor(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: unknown;
        __fuzzyWaddleAiMultiplayerBrowserTest?: unknown };
      return !!(realm.__fuzzyWaddleAiRuntimeBrowserTest ?? realm.__fuzzyWaddleAiMultiplayerBrowserTest);
    },
    undefined,
    { timeout: 120_000 }
  );
  await page.evaluate(() => {
    window.__fuzzyWaddleAiRuntimeParts = (playerNumber: number) => {
      type Host = {
        game: {
          scene: {
            getScenes(active: boolean): {
              scene: { key: string };
              getSceneGameData?: () => { systems: unknown[]; services: unknown[]; components: unknown[] };
            }[];
          };
        };
      };
      const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: Host;
        __fuzzyWaddleAiMultiplayerBrowserTest?: Host };
      const host = realm.__fuzzyWaddleAiRuntimeBrowserTest ?? realm.__fuzzyWaddleAiMultiplayerBrowserTest;
      const scene = host?.game.scene
        .getScenes(true)
        .find((candidate) => candidate.scene.key.startsWith("Map") && candidate.getSceneGameData);
      const graph = scene?.getSceneGameData?.();
      if (!graph) return null;
      const handler = graph.systems.find(
        (candidate): candidate is { getAiPlayerController(player: number): RuntimePageController | undefined } =>
          !!candidate && typeof (candidate as { getAiPlayerController?: unknown }).getAiPlayerController === "function"
      );
      const tickService = graph.services.find(
        (candidate): candidate is RuntimePageTickService =>
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
      const component = (
        actor: ReturnType<NonNullable<typeof actorIndex>["getOwnedActors"]>[number],
        componentName: string
      ): Record<string, unknown> | undefined => {
        const data = actor.getData("actorData");
        return data
          ? [...data.components.entries()].find(([constructor]) => constructor.name === componentName)?.[1]
          : undefined;
      };
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
            dispatchHumanRaid(
              humanPlayerNumber: number,
              targetActorId: string,
              maximumAttackers: number,
              attackerObjectNames?: readonly string[]
            ) {
              const actorIds = actorIndex
                .getOwnedActors(humanPlayerNumber)
                .filter(
                  (actor) =>
                    component(actor, "AttackComponent") &&
                    component(actor, "ActorTranslateComponent") &&
                    (!attackerObjectNames || attackerObjectNames.includes(actor.name))
                )
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
