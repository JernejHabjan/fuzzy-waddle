import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { digestCanonicalAiValue } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/persistence/canonical-ai-serialization";
import type { AiRuntimeBrowserTestHost } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/browser/ai-runtime-browser-test-host";
import type GameProbableWaffleScene from "@fuzzy-waddle/probable-waffle-phaser/world/scenes/GameProbableWaffleScene";
import type { ActorIndexSystem } from "@fuzzy-waddle/probable-waffle-phaser/world/services/ActorIndexSystem";
import type { MovementOccupancyService } from "@fuzzy-waddle/probable-waffle-phaser/world/services/movement-occupancy.service";
import type { NavigationService } from "@fuzzy-waddle/probable-waffle-phaser/world/services/navigation.service";
import type { RuntimeFixture } from "../../contracts/skirmish-ai-runtime-fixture";
import { prepareRuntimeVariant } from "../../setup/skirmish-ai-runtime-variant-setup";
import { advanceRuntimeFrames } from "../../runner/skirmish-ai-runtime-frame-driver";

test.skip(process.env.AI_GAMEPLAY_RELIABILITY !== "1", "Explicit bounded gameplay reliability checks only");
test.setTimeout(180_000);

const tile = (x: number, y: number) => ({ x: (x - y) * 32 + 32, y: (x + y) * 16 + 16, z: 0 });

test("twelve workers clear opposing traffic through a three-tile corridor and settle", async ({ page }, testInfo) => {
  const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  const source = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const fixture: RuntimeFixture = JSON.parse(
    readFileSync(
      join(
        root,
        "tools/probable-waffle/skirmish/ai/testing/fixtures/native/technology/technology-native-gameplay.json"
      ),
      "utf8"
    )
  );
  const selected = fixture.recipe.variants.find((entry) => entry.id === "technology-air-four");
  if (!selected?.presetWorld) throw new Error("congestion_fixture_missing");
  const westStaging = [17, 18, 19].flatMap((x) => [28, 32].map((y) => ({ x, y })));
  const eastStaging = [35, 36, 37].flatMap((x) => [28, 32].map((y) => ({ x, y })));
  const traffic = [1, -1].flatMap((direction) =>
    Array.from({ length: 6 }, (_, index) => {
      const start = direction === 1 ? westStaging[index]! : eastStaging[index]!;
      const destination = direction === 1 ? eastStaging[index]! : westStaging[index]!;
      return {
        id: `traffic-${direction}-${index}`,
        start: tile(start.x, start.y),
        destination
      };
    })
  );
  const variant = {
    ...selected,
    scenarioIds: [],
    captureConstruction: true as const,
    presetWorld: {
      fixtureId: "gameplay-opposing-traffic",
      resourceGrants: [],
      requireFactionRoster: true as const,
      actors: traffic.map(({ id, start }) => ({
        fixtureActorId: id,
        actorName: ObjectNames.SkaduweeWorkerMale,
        owner: 1,
        position: start
      })),
      terrainPatches: Array.from({ length: 15 }, (_, index) =>
        [28, 32].map((y) => ({
          x: 20 + index,
          y,
          terrain: "grass" as const,
          blocked: true
        }))
      ).flat(),
      controls: traffic.map(({ id, destination }) => ({
        id: `move-${id}`,
        producerFixtureActorId: id,
        requestTick: 1,
        applicationTick: 1,
        action: { kind: "move" as const, worldPosition: tile(destination.x + 1, destination.y + 1) }
      }))
    }
  };
  const errors: string[] = [];
  await prepareRuntimeVariant(
    page,
    fixture,
    variant,
    variant.seed,
    source,
    digestCanonicalAiValue(variant),
    false,
    errors
  );
  const geometry = await page.evaluate((roles) => {
    const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
      .__fuzzyWaddleAiRuntimeBrowserTest;
    const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
      | GameProbableWaffleScene
      | undefined;
    const services = scene?.getSceneGameData().services;
    const index = services?.find((service): service is ActorIndexSystem => "getActorById" in service);
    const occupancy = services?.find((service): service is MovementOccupancyService => "getActorFootprintAtTile" in service);
    const navigation = services?.find((service): service is NavigationService => "isTileNavigable" in service);
    if (!host?.presetApplication || !index || !occupancy || !navigation) throw new Error("traffic_geometry_missing");
    return roles.map(({ id, destination }) => {
      const actorId = host.presetApplication?.createdActorIds[id];
      const actor = actorId && index.getActorById(actorId);
      if (!actor) throw new Error("traffic_actor_missing");
      const start = navigation.getCenterTileCoordUnderObject(actor);
      return {
        id,
        start,
        startNavigable: !!start && navigation.isTileNavigable(start),
        destination,
        destinationNavigable: navigation.isTileNavigable(destination),
        footprint: occupancy.getActorFootprintAtTile(actor, destination)
      };
    });
  }, traffic.map(({ id, destination }) => ({ id, destination })));
  writeFileSync(testInfo.outputPath("traffic-geometry.json"), JSON.stringify(geometry));
  expect(geometry.every((entry) => entry.startNavigable && entry.destinationNavigable), "staging routes are legal").toBe(
    true
  );
  const destinationFootprintKeys = geometry.flatMap((entry) =>
    entry.footprint.map((position) => `${position.x},${position.y}`)
  );
  expect(new Set(destinationFootprintKeys).size, "each actor has a distinct destination footprint").toBe(
    destinationFootprintKeys.length
  );
  const samples = [];
  for (const tick of [0, 40, 80, 120, 180, 240, 320, 400, 480, 640, 720]) {
    if (tick) await advanceRuntimeFrames(page, 2, tick);
    const positions = await page.evaluate(
      (roles) => {
        const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
          .__fuzzyWaddleAiRuntimeBrowserTest;
        const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map"));
        if (!scene || !host?.presetApplication) throw new Error("congestion_native_scene_missing");
        const positions = new Map<string, { x: number; y: number; z: number }>();
        for (const actor of scene.children.getChildren()) {
          const components = actor.getData("actorData")?.components as Map<{ name: string }, unknown> | undefined;
          const id = [...(components ?? [])].find(([token]) => token.name === "IdComponent")?.[1] as
            | { id: string }
            | undefined;
          const transform = [...(components?.values() ?? [])].find(
            (entry) => typeof (entry as { getActualLogicalZ?: unknown })?.getActualLogicalZ === "function"
          ) as { logicalWorldTransform: { x: number; y: number; z: number } } | undefined;
          if (id && transform && actor.active) positions.set(id.id, transform.logicalWorldTransform);
        }
        return roles.map((role) => positions.get(host.presetApplication!.createdActorIds[role] ?? "") ?? null);
      },
      traffic.map(({ id }) => id)
    );
    samples.push({ tick, positions });
  }
  const movement = await page.evaluate(
    (roles) => {
      const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
        .__fuzzyWaddleAiRuntimeBrowserTest;
      if (!host?.presetApplication || !host.productionCapture?.captureHuman)
        throw new Error("congestion_capture_missing");
      const actorIds = roles.map((role) => host.presetApplication!.createdActorIds[role]);
      const capture = host.productionCapture.captureHuman(1, 720);
      return {
        actorIds,
        dropped: capture.droppedFactCount,
        events: capture.facts.flatMap((fact) =>
          fact.kind === "spatial_authority" &&
          fact.spatial.kind === "movement" &&
          actorIds.includes(fact.spatial.source.actorId ?? undefined)
            ? [fact.spatial]
            : []
        )
      };
    },
    traffic.map(({ id }) => id)
  );
  writeFileSync(testInfo.outputPath("traffic.json"), JSON.stringify({ source, traffic, samples, movement, errors }));
  expect(errors).toEqual([]);
  expect(movement.dropped).toBe(0);
  expect(samples.at(-1)?.positions).toEqual(samples.at(-2)?.positions);
  for (const [index, actor] of traffic.entries()) {
    const events = movement.events.filter((event) => event.source.actorId === movement.actorIds[index]);
    expect(
      events.filter((event) => event.phase === "started"),
      actor.id
    ).toHaveLength(1);
    expect(events.find((event) => event.phase === "started")?.originalDestination, actor.id).toEqual(actor.destination);
    expect(events.find((event) => event.phase === "arrived")?.actualTile, actor.id).toEqual(actor.destination);
  }
});
