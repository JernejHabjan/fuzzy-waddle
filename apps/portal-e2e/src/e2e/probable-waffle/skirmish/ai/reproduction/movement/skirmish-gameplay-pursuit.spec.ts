import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { digestCanonicalAiValue } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/persistence/canonical-ai-serialization";
import type { AiRuntimeBrowserTestHost } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/browser/ai-runtime-browser-test-host";
import type GameProbableWaffleScene from "@fuzzy-waddle/probable-waffle-phaser/world/scenes/GameProbableWaffleScene";
import type { ActorIndexSystem } from "@fuzzy-waddle/probable-waffle-phaser/world/services/ActorIndexSystem";
import type { NavigationService } from "@fuzzy-waddle/probable-waffle-phaser/world/services/navigation.service";
import type { PawnAiBlackboard } from "@fuzzy-waddle/probable-waffle-phaser/prefabs/ai-agents/controller/pawn-ai-blackboard";
import type { RuntimeFixture } from "../../contracts/skirmish-ai-runtime-fixture";
import { nativePresetControlSucceeded } from "../../combat/missions/skirmish-ai-native-mission-evidence";
import { prepareRuntimeVariant } from "../../setup/skirmish-ai-runtime-variant-setup";
import { advanceRuntimeFrames } from "../../runner/skirmish-ai-runtime-frame-driver";

test.skip(process.env.AI_GAMEPLAY_RELIABILITY !== "1", "Explicit bounded gameplay reliability checks only");
test.setTimeout(180_000);

const pursuitCases = {
  isolated: "native pawn pursuit lands repeated hits on a moving worker with the strategic coordinator paused",
  "human replacement": "a new human move cancels native pursuit",
  autonomous: "the attack squad preserves native pursuit into engagement",
  "equal speed": "an equally fast runner takes no pursuit damage while escaping",
  "removed target": "native pursuit releases a worker removed during the chase",
  unreachable: "native pursuit paces retries for an unreachable worker without phantom hits"
} as const;

for (const mode of Object.keys(pursuitCases) as (keyof typeof pursuitCases)[]) {
  const replaceOrder = mode === "human replacement";
  const equalSpeed = mode === "equal speed";
  const removeTarget = mode === "removed target";
  const unreachable = mode === "unreachable";
  test(pursuitCases[mode], async ({ page }, testInfo) => {
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
    const enclosure = Array.from({ length: 5 }, (_, dx) =>
      Array.from({ length: 5 }, (_, dy) => ({
        x: 43 + dx,
        y: 32 + dy,
        terrain: "grass" as const,
        blocked: true
      })).filter((_, dy) => dx === 0 || dx === 4 || dy === 0 || dy === 4)
    ).flat();
    const variant = {
      ...selected,
      captureCombat: undefined,
      captureConstruction: unreachable ? (true as const) : undefined,
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
            actorName: equalSpeed ? ObjectNames.Banshee : ObjectNames.TivaraWorkerMale,
            owner: replaceOrder ? 2 : 1,
            position: { x: 384, y: 1280, z: 0 }
          }
        ],
        ...(removeTarget
          ? {
              events: [
                {
                  id: "remove-pursuit-target",
                  tick: 120,
                  kind: "destroy_owned_actor" as const,
                  owner: 1,
                  objectName: ObjectNames.TivaraWorkerMale,
                  fixtureActorId: "runner"
                }
              ]
            }
          : {}),
        terrainPatches: unreachable ? enclosure : world.terrainPatches,
        controls: [
          ...(!unreachable
            ? [
                {
                  id: "flee",
                  producerFixtureActorId: "runner",
                  requestTick: 1,
                  applicationTick: 1,
                  action: { kind: "move" as const, worldPosition: { x: -384, y: 1280, z: 0 } }
                }
              ]
            : []),
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
    // The isolated controls leave movement and weapons active while pausing the strategic coordinator.
    if (mode !== "autonomous")
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
    const routeProbe = unreachable
      ? await page.evaluateHandle(() => {
          const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
            .__fuzzyWaddleAiRuntimeBrowserTest;
          const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
            | GameProbableWaffleScene
            | undefined;
          const services = scene?.getSceneGameData().services;
          const index = services?.find((service): service is ActorIndexSystem => "getActorById" in service);
          const pursuerId = host?.presetApplication?.createdActorIds["pursuer"];
          const pursuer = pursuerId && index?.getActorById(pursuerId);
          const navigation = services?.find(
            (service): service is NavigationService => "findAndUseNavigablePathBetweenGameObjectsWithRadius" in service
          );
          if (!navigation || !pursuer) throw new Error("unreachable_route_probe_missing");
          const original = navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius;
          const ticks: number[] = [];
          navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius = function (...args) {
            if (args[0] === pursuer) ticks.push(window.__fuzzyWaddleAiRuntimeParts?.(2)?.tickService.currentTick ?? -1);
            return original.apply(this, args);
          };
          return {
            ticks,
            restore: () => {
              navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius = original;
            }
          };
        })
      : undefined;
    if (unreachable) observations.push(await capturePursuit(page));
    for (let tick = 5; tick <= (equalSpeed ? 90 : removeTarget ? 115 : 240); tick += 5) {
      await advanceRuntimeFrames(page, fixture.recipe.aiPlayerNumber, tick);
      observations.push(await capturePursuit(page));
      if (mode === "autonomous" && tick === 40) {
        const decision = await page.evaluate(() => {
          const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
            .__fuzzyWaddleAiRuntimeBrowserTest;
          const bindings = host?.presetApplication?.createdActorIds;
          const controller = window.__fuzzyWaddleAiRuntimeParts?.(2)?.controller;
          const observation = controller?.getCommittedObservation();
          const ids = [bindings?.["pursuer"], bindings?.["runner"]];
          return {
            ids,
            tick: observation?.tick,
            actors: observation?.actors.filter((actor) => ids.some((id) => id === actor.actorId)),
            squads: controller?.getBrainState()?.squads.filter((squad) => squad.actorIds.some((id) => id === ids[0]))
          };
        });
        writeFileSync(testInfo.outputPath("pursuit-decision.json"), JSON.stringify(decision));
      }
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
        mode,
        replaceOrder,
        movingHits,
        observations
      })
    );
    console.log(
      "GAMEPLAY_PURSUIT",
      JSON.stringify({
        source,
        mode,
        movingHits: movingHits.length,
        hitTicks: movingHits.map((row) => row.hitTick),
        final: observations.at(-1)
      })
    );
    if (unreachable) {
      const first = observations[0];
      if (!first?.pursuer) throw new Error("unreachable_pursuer_position_missing");
      const authority = await page.evaluate(() => {
        const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
          .__fuzzyWaddleAiRuntimeBrowserTest;
        const capture = host?.productionCapture?.capture(2, 240);
        const pursuerId = host?.presetApplication?.createdActorIds["pursuer"];
        if (!capture || !pursuerId) throw new Error("unreachable_pursuit_capture_missing");
        return {
          pursuerId,
          dropped: capture.droppedFactCount,
          controls: capture.facts.filter((fact) => fact.kind === "preset_control" && fact.control.id === "pursue")
        };
      });
      writeFileSync(testInfo.outputPath("pursuit-unreachable-authority.json"), JSON.stringify(authority));
      expect(authority.dropped).toBe(0);
      const applied = authority.controls.filter(
        (fact) =>
          fact.kind === "preset_control" &&
          fact.control.actorId === authority.pursuerId &&
          nativePresetControlSucceeded(fact, "pursue")
      );
      expect(applied.map((fact) => fact.tick)).toEqual([2]);
      if (!routeProbe) throw new Error("unreachable_route_probe_missing");
      const routeTicks = await routeProbe.evaluate((probe) => {
        probe.restore();
        return probe.ticks;
      });
      writeFileSync(testInfo.outputPath("pursuit-unreachable-route-ticks.json"), JSON.stringify(routeTicks));
      expect(routeTicks.length).toBeGreaterThan(1);
      expect(routeTicks.length).toBeLessThanOrEqual(13);
      expect(routeTicks.slice(1).every((tick, index) => tick - (routeTicks[index] ?? tick) >= 20)).toBe(true);
      expect(observations.at(-1)?.tick).toBe(240);
      for (const row of observations) {
        expect(row.pursuer).toEqual(first.pursuer);
        expect([row.x, row.y, row.health, row.hitTick]).toEqual([first.x, first.y, first.health, undefined]);
      }
      expect(errors).toEqual([]);
      return;
    }
    if (equalSpeed) {
      const first = observations[0];
      const last = observations.at(-1);
      if (!first?.pursuer || !last?.pursuer) throw new Error("equal_speed_positions_missing");
      expect(first.chasingRunner).toBe(true);
      expect(last.x).toBeLessThan(first.x - 256);
      expect(last.pursuer.x).toBeLessThan(first.pursuer.x - 256);
      expect(observations.every((row) => row.health === first.health && !row.hitByPursuer)).toBe(true);
      expect(errors).toEqual([]);
      return;
    }
    expect(
      movingHits.filter((row) => !replaceOrder || (row.hitTick ?? Infinity) < 120).length,
      "repeated damage while the real target moves, not only after arrival"
    ).toBeGreaterThanOrEqual(2);
    if (removeTarget) {
      expect(observations.at(-1)?.chasingRunner).toBe(true);
      await advanceRuntimeFrames(page, fixture.recipe.aiPlayerNumber, 240);
      const loss = await page.evaluate(() => {
        const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
          .__fuzzyWaddleAiRuntimeBrowserTest;
        const application = host?.presetApplication;
        const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
          | GameProbableWaffleScene
          | undefined;
        const index = scene
          ?.getSceneGameData()
          .services.find((service): service is ActorIndexSystem => "getActorById" in service);
        const pursuerId = application?.createdActorIds["pursuer"];
        const runnerId = application?.createdActorIds["runner"];
        if (!application || !index || !pursuerId || !runnerId) throw new Error("pursuit_loss_roles_missing");
        const pursuer = index.getActorById(pursuerId);
        if (!pursuer?.active) throw new Error("pursuit_loss_pursuer_missing");
        const components = pursuer.getData("actorData").components as Map<unknown, object>;
        const pawn = [...components.values()].find(
          (value): value is { blackboard: PawnAiBlackboard } => "blackboard" in value
        );
        if (!pawn) throw new Error("pursuit_loss_order_missing");
        const target = pawn.blackboard.getCurrentOrder()?.data.targetGameObject;
        return {
          runnerId,
          removal: application.eventResults.find((event) => event.id === "remove-pursuit-target"),
          runnerIndexed: !!index.getActorById(runnerId),
          targetValid: !target || (target.active && target.scene === scene)
        };
      });
      writeFileSync(testInfo.outputPath("pursuit-loss.json"), JSON.stringify(loss));
      expect(loss.removal).toMatchObject({ tick: 120, affectedActorId: loss.runnerId });
      expect(loss.runnerIndexed).toBe(false);
      expect(loss.targetValid).toBe(true);
    }
    if (mode === "autonomous") {
      const engagement = observations.filter((row) => (row.tick ?? 0) >= 40 && (row.tick ?? 0) <= 60);
      expect(engagement).toHaveLength(5);
      expect(engagement.every((row) => row.chasingRunner)).toBe(true);
    }
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
  });
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
