import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { digestCanonicalAiValue } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/persistence/canonical-ai-serialization";
import type { AiRuntimeBrowserTestHost } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/browser/ai-runtime-browser-test-host";
import type { RuntimeFixture } from "../../contracts/skirmish-ai-runtime-fixture";
import { prepareRuntimeVariant } from "../../setup/skirmish-ai-runtime-variant-setup";
import { advanceRuntimeFrames } from "../../runner/skirmish-ai-runtime-frame-driver";

test.skip(process.env.AI_GAMEPLAY_RELIABILITY !== "1", "Explicit bounded gameplay reliability checks only");
test.setTimeout(180_000);

for (const replaceOrder of [false, true]) {
  test(
    replaceOrder
      ? "a new human move cancels native pursuit"
      : "native pawn pursuit lands repeated hits on a moving worker with the strategic coordinator paused",
    async ({ page }, testInfo) => {
      const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
      const source = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
      const fixture: RuntimeFixture = JSON.parse(
        readFileSync(
          join(
            root,
            "tools/probable-waffle/skirmish/ai/testing/fixtures/native/combat/fight-01-reassess-and-retreat-regroup-within-bound-runtime.json"
          ),
          "utf8"
        )
      );
      const selected = fixture.recipe.variants.find((variant) => variant.id === "fight-01-tivara-quiet");
      if (!selected?.presetWorld) throw new Error("pursuit_fixture_missing");
      // A mob pursuit is a native pawn control, not a faction-production acceptance case.
      const world = { ...selected.presetWorld };
      delete world.requireFactionRoster;
      const variant = {
        ...selected,
        captureCombat: undefined,
        captureConstruction: undefined,
        presetWorld: {
          ...world,
          fixtureId: "gameplay-banshee-worker-pursuit",
          actors: [
            ...selected.presetWorld.actors,
            {
              fixtureActorId: "pursuer",
              actorName: ObjectNames.Banshee,
              owner: replaceOrder ? 1 : 2,
              position: { x: 576, y: 1280, z: 0 }
            },
            {
              fixtureActorId: "runner",
              actorName: ObjectNames.TivaraWorkerMale,
              owner: replaceOrder ? 2 : 1,
              position: { x: 384, y: 1280, z: 0 }
            }
          ],
          controls: [
            {
              id: "flee",
              producerFixtureActorId: "runner",
              requestTick: 1,
              applicationTick: 1,
              action: { kind: "move" as const, worldPosition: { x: -384, y: 1280, z: 0 } }
            },
            {
              id: "pursue",
              producerFixtureActorId: "pursuer",
              requestTick: 2,
              applicationTick: 2,
              action: { kind: "attack" as const, targetFixtureActorId: "runner" }
            },
            ...(replaceOrder
              ? [
                  {
                    id: "replace-pursuit",
                    producerFixtureActorId: "pursuer",
                    requestTick: 120,
                    applicationTick: 120,
                    action: { kind: "move" as const, worldPosition: { x: 576, y: 1280, z: 0 } }
                  }
                ]
              : [])
          ]
        }
      };
      const errors: string[] = [];
      await prepareRuntimeVariant(
        page,
        fixture,
        variant,
        selected.seed,
        source,
        digestCanonicalAiValue({ fixture, presetWorld: variant.presetWorld }),
        false,
        errors
      );
      // Isolate the native pawn owner through the existing campaign API. Movement, weapons and pawn trees still run.
      // Autonomous mission replacement is a separate R5 acceptance boundary, retained in the diagnostic evidence.
      await page.evaluate(() => {
        const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
          .__fuzzyWaddleAiRuntimeBrowserTest;
        const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
          | {
              getSceneGameData(): { systems: unknown[] };
            }
          | undefined;
        const handler = scene?.getSceneGameData().systems.find(
          (
            entry
          ): entry is {
            setPlayerEnabled(playerNumber: number, enabled: boolean): boolean;
          } => typeof (entry as { setPlayerEnabled?: unknown })?.setPlayerEnabled === "function"
        );
        if (!handler?.setPlayerEnabled(2, false)) throw new Error("pursuit_strategic_pause_missing");
      });
      const observations: Awaited<ReturnType<typeof capturePursuit>>[] = [];
      for (let tick = 5; tick <= 240; tick += 5) {
        await advanceRuntimeFrames(page, fixture.recipe.aiPlayerNumber, tick);
        observations.push(await capturePursuit(page));
      }
      const movingHits = observations.filter((row, index) => {
        const previous = observations[index - 1];
        return (
          previous &&
          row.health < previous.health &&
          row.hitByPursuer &&
          Math.hypot(row.x - previous.x, row.y - previous.y) > 0.1
        );
      });
      writeFileSync(
        testInfo.outputPath("pursuit-observations.json"),
        JSON.stringify({
          source,
          strategicCoordinatorPaused: true,
          replaceOrder,
          movingHits,
          observations
        })
      );
      console.log(
        "GAMEPLAY_PURSUIT",
        JSON.stringify({
          source,
          strategicCoordinatorPaused: true,
          movingHits: movingHits.length,
          hitTicks: movingHits.map((row) => row.hitTick),
          final: observations.at(-1)
        })
      );
      expect(
        movingHits.filter((row) => !replaceOrder || (row.hitTick ?? Infinity) < 120).length,
        "repeated damage while the real target moves, not only after arrival"
      ).toBeGreaterThanOrEqual(2);
      if (replaceOrder) {
        const after = observations.filter((row) => (row.tick ?? 0) >= 125);
        expect(after.some((row) => row.order === "Move")).toBe(true);
        expect(after.every((row) => !row.chasingRunner)).toBe(true);
        expect(after.at(-1)?.hitTick).toBeLessThan(120);
        const firstX = after[0]?.pursuer?.x;
        const finalX = after.at(-1)?.pursuer?.x;
        if (firstX === undefined || finalX === undefined) throw new Error("pursuit_replacement_position_missing");
        expect(finalX).toBeGreaterThan(firstX + 64);
      }
      expect(errors).toEqual([]);
    }
  );
}

/** Independent physical reader; no receipt or tactical mission label counts as a weapon hit. */
async function capturePursuit(page: Page) {
  return page.evaluate(() => {
    const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
      .__fuzzyWaddleAiRuntimeBrowserTest;
    const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map"));
    const bindings = host?.presetApplication?.createdActorIds;
    if (!scene || !bindings) throw new Error("pursuit_scene_missing");
    const actors = scene.children.getChildren();
    const actor = (role: string) =>
      actors.find((entry) => {
        const data = entry.getData("actorData") as { components: Map<{ name: string }, { id?: string }> } | undefined;
        return (
          data &&
          [...data.components.entries()].some(
            ([token, value]) => token.name === "IdComponent" && value.id === bindings[role]
          )
        );
      });
    const runner = actor("runner"),
      pursuer = actor("pursuer");
    if (!runner || !pursuer) throw new Error("pursuit_bound_actor_missing");
    const pursuerComponents = [...(pursuer.getData("actorData").components as Map<unknown, unknown>).values()];
    const pursuerTransform = pursuerComponents.find(
      (value) => typeof (value as { getActualLogicalZ?: unknown })?.getActualLogicalZ === "function"
    ) as
      | {
          logicalWorldTransform: { x: number; y: number; z: number };
        }
      | undefined;
    const pawn = pursuerComponents.find((value) => !!(value as { blackboard?: unknown })?.blackboard) as
      | {
          blackboard: { getCurrentOrder(): { orderType: string; data: { targetGameObject?: unknown } } | undefined };
        }
      | undefined;
    const order = pawn?.blackboard.getCurrentOrder();
    const components = [...(runner.getData("actorData").components as Map<unknown, unknown>).values()];
    const health = components.find((value) => !!(value as { healthComponentData?: unknown })?.healthComponentData) as
      | {
          healthComponentData: { health: number };
          latestDamage?: { damageInitiator: unknown; simulationTick?: number };
        }
      | undefined;
    const transform = components.find(
      (value) => typeof (value as { getActualLogicalZ?: unknown })?.getActualLogicalZ === "function"
    ) as
      | {
          logicalWorldTransform: { x: number; y: number };
        }
      | undefined;
    if (!health || !transform) throw new Error("pursuit_component_missing");
    return {
      tick: window.__fuzzyWaddleAiRuntimeParts?.(2)?.tickService.currentTick,
      ...transform.logicalWorldTransform,
      health: health.healthComponentData.health,
      pursuer: pursuerTransform?.logicalWorldTransform,
      order: order?.orderType,
      chasingRunner: order?.data.targetGameObject === runner,
      hitByPursuer: health.latestDamage?.damageInitiator === pursuer,
      hitTick: health.latestDamage?.simulationTick
    };
  });
}
