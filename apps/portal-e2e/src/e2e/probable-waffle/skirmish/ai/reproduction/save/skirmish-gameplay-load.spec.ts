import { expect, test, type Page } from "@playwright/test";
import type Phaser from "phaser";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { digestCanonicalAiValue } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/persistence/canonical-ai-serialization";
import type { ActorDefinition } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeBrowserTestHost } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/browser/ai-runtime-browser-test-host";
import type GameProbableWaffleScene from "@fuzzy-waddle/probable-waffle-phaser/world/scenes/GameProbableWaffleScene";
import type { RuntimeFixture } from "../../contracts/skirmish-ai-runtime-fixture";
import { prepareRuntimeVariant } from "../../setup/skirmish-ai-runtime-variant-setup";
import { advanceRuntimeFrames } from "../../runner/skirmish-ai-runtime-frame-driver";
import { reloadNativeMatch, saveAndReloadNativeMatch, saveNativeMatch } from "./skirmish-ai-native-save-reload";

test.skip(process.env.AI_GAMEPLAY_RELIABILITY !== "1", "Explicit bounded gameplay reliability checks only");
test.setTimeout(240_000);

for (const kind of ["fresh start", "quicksave", "autosave", "manual"] as const) {
  test(`preserves elevation, camera and human input after ${kind}`, async ({ page }) => {
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
    if (!selected) throw new Error("load_projection_fixture_missing");
    const errors: string[] = [];
    await prepareRuntimeVariant(
      page,
      fixture,
      { ...selected, captureCombat: undefined, captureConstruction: undefined },
      selected.seed,
      source,
      digestCanonicalAiValue(fixture),
      false,
      errors
    );
    await advanceRuntimeFrames(page, fixture.recipe.aiPlayerNumber, 20);
    const names = [ObjectNames.TivaraWorkerMale, ObjectNames.Temple, ObjectNames.SkaduweeOwl];
    const ids = await page.evaluate(
      ({ names, humanWorker }) => {
        const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
          .__fuzzyWaddleAiRuntimeBrowserTest;
        const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
          | GameProbableWaffleScene
          | undefined;
        if (!scene) throw new Error("load_projection_scene_missing");
        const creator = scene.getSceneGameData().services.find(
          (
            entry
          ): entry is {
            createActorFromDefinition(data: ActorDefinition): Phaser.GameObjects.GameObject | undefined;
          } => typeof (entry as { createActorFromDefinition?: unknown })?.createActorFromDefinition === "function"
        );
        if (!creator) throw new Error("load_projection_creator_missing");
        if (
          !creator.createActorFromDefinition({
            name: humanWorker,
            id: { id: "load-human-worker" },
            owner: { ownerId: scene.player.playerNumber },
            representable: { logicalWorldTransform: { x: -640, y: 800, z: 0 } }
          })
        )
          throw new Error("load_human_worker_missing");
        return names.map((name, index) => {
          const id = `load-projection-${index}`;
          const actor = creator.createActorFromDefinition({
            name,
            id: { id },
            owner: { ownerId: 2 },
            representable: { logicalWorldTransform: { x: 384 + index * 160, y: 864, z: 64 } }
          });
          if (!actor) throw new Error("load_projection_actor_missing");
          return id;
        });
      },
      { names, humanWorker: ObjectNames.SkaduweeWorkerMale }
    );
    const original = await projection(page, ids);
    expect(original.actors).toHaveLength(3);
    expect(original.humanPlayerNumber).toBe(1);
    for (const actor of original.actors) {
      expect(actor.logical.z).toBe(64);
      expect(actor.rendered.y).toBeLessThan(actor.logical.y);
    }
    if (kind !== "fresh start") {
      const cameraBefore = await readCamera(page, true);
      for (let cycle = 0; cycle < (kind === "quicksave" ? 3 : 1); cycle++) {
        const save = await saveNativeMatch(page, fixture.recipe.aiPlayerNumber, kind);
        await reloadNativeMatch(page, fixture.recipe.aiPlayerNumber, save);
        expect(await projection(page, ids), `save/load cycle ${cycle + 1}`).toEqual(original);
        const restoredCamera = await readCamera(page);
        expect(restoredCamera.x).toBeCloseTo(cameraBefore.x);
        expect(restoredCamera.y).toBeCloseTo(cameraBefore.y);
        expect(restoredCamera.zoom).toBeCloseTo(cameraBefore.zoom);
      }
    }
    const workerId = "load-human-worker";
    const restoredWorker = await projection(page, [workerId]);
    const [worker] = restoredWorker.actors;
    if (!worker) throw new Error("load_restored_worker_missing");
    const points = await page.evaluate(async ({ x, y }) => {
      const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
        .__fuzzyWaddleAiRuntimeBrowserTest;
      const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map"));
      if (!host || !scene) throw new Error("load_input_scene_missing");
      const camera = scene.cameras.main;
      camera.centerOn(x, y);
      host.game.loop.wake();
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const canvas = host.game.canvas;
      const bounds = canvas.getBoundingClientRect();
      return (
        [
          [x, y - 12],
          [x - 128, y + 64]
        ] as const
      ).map(([worldX, worldY]) => {
        const point = camera.matrixCombined.transformPoint(worldX, worldY);
        return {
          x: bounds.left + (point.x * bounds.width) / canvas.width,
          y: bounds.top + (point.y * bounds.height) / canvas.height
        };
      });
    }, worker.rendered);
    const [selectionPoint, movePoint] = points;
    if (!selectionPoint || !movePoint) throw new Error("load_input_points_missing");
    await page.mouse.click(selectionPoint.x, selectionPoint.y);
    await expect.poll(async () => (await projection(page, [workerId])).actors[0]?.selected).toBe(true);
    await page.mouse.click(movePoint.x, movePoint.y, { button: "right" });
    await advanceRuntimeFrames(page, fixture.recipe.aiPlayerNumber, 100);
    const moved = (await projection(page, [workerId])).actors[0];
    expect(moved?.logical.x).toBeLessThan(worker.logical.x - 32);
    expect(errors).toEqual([]);
  });
}

async function readCamera(page: Page, move = false) {
  return page.evaluate((move) => {
    const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
      .__fuzzyWaddleAiRuntimeBrowserTest;
    const camera = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map"))?.cameras.main;
    if (!camera) throw new Error("load_camera_missing");
    if (move) camera.centerOn(-608, 816);
    return { x: camera.scrollX, y: camera.scrollY, zoom: camera.zoom };
  }, move);
}

test("preserves editor-authored elevated stone blocks on River Crossing", async ({ page }) => {
  const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  const source = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const fixture: RuntimeFixture = JSON.parse(
    readFileSync(
      join(
        root,
        "tools/probable-waffle/skirmish/ai/testing/fixtures/native/continuous/continuous-land-native-gameplay.json"
      ),
      "utf8"
    )
  );
  const variant = fixture.recipe.variants.find((entry) => entry.id === "skaduwee-home-raid");
  if (!variant) throw new Error("river_crossing_fixture_missing");
  const errors: string[] = [];
  await prepareRuntimeVariant(
    page,
    fixture,
    variant,
    variant.seed,
    source,
    digestCanonicalAiValue(fixture),
    false,
    errors
  );
  await advanceRuntimeFrames(page, fixture.recipe.aiPlayerNumber, 20);
  const ids = await page.evaluate(() => {
    const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
      .__fuzzyWaddleAiRuntimeBrowserTest;
    const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key === "MapRiverCrossing");
    if (!scene) throw new Error("river_crossing_scene_missing");
    return scene.children.getChildren().flatMap((actor) => {
      if (!actor.name.startsWith("BlockStone") || !(Number(Reflect.get(actor, "z")) > 0)) return [];
      const data = actor.getData("actorData") as { components: Map<{ name: string }, { id?: string }> } | undefined;
      const id = data && [...data.components.entries()].find(([token]) => token.name === "IdComponent")?.[1].id;
      if (!id) throw new Error("elevated_stone_missing_saved_identity");
      return [id];
    });
  });
  expect(ids.length).toBeGreaterThan(0);
  const original = await projection(page, ids);
  expect(original.actors).toHaveLength(ids.length);
  for (let cycle = 0; cycle < 3; cycle++) {
    await saveAndReloadNativeMatch(page, fixture.recipe.aiPlayerNumber);
    expect(await projection(page, ids), `editor stone reload ${cycle + 1}`).toEqual(original);
  }
  const autosave = await saveNativeMatch(page, fixture.recipe.aiPlayerNumber, "autosave");
  await reloadNativeMatch(page, fixture.recipe.aiPlayerNumber, autosave);
  expect(await projection(page, ids), "editor stone autosave reload").toEqual(original);
  const manual = await saveNativeMatch(page, fixture.recipe.aiPlayerNumber, "manual");
  await reloadNativeMatch(page, fixture.recipe.aiPlayerNumber, manual);
  expect(await projection(page, ids), "editor stone manual reload").toEqual(original);
  expect(errors).toEqual([]);
});

/** Read the actual materialized actor components and Phaser coordinates, including the restored local binding. */
async function projection(page: Page, ids: readonly string[]) {
  return page.evaluate((ids) => {
    const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
      .__fuzzyWaddleAiRuntimeBrowserTest;
    const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
      | GameProbableWaffleScene
      | undefined;
    if (!scene) throw new Error("load_projection_scene_missing");
    const actors = scene.children
      .getChildren()
      .flatMap((actor) => {
        const data = actor.getData("actorData") as { components: Map<{ name: string }, unknown> } | undefined;
        const components = data ? [...data.components.entries()] : [];
        const identity = components.find(([token]) => token.name === "IdComponent")?.[1] as { id: string } | undefined;
        if (!identity || !ids.includes(identity.id)) return [];
        const component = components.find(
          ([, value]) =>
            typeof value === "object" &&
            value !== null &&
            typeof (value as { getActualLogicalZ?: unknown }).getActualLogicalZ === "function" &&
            "logicalWorldTransform" in value
        )?.[1] as
          | {
              logicalWorldTransform: { x: number; y: number; z: number };
            }
          | undefined;
        if (!component)
          throw new Error(`load_projection_transform_missing:${actor.name}:${components.map(([token]) => token.name)}`);
        const transform = actor as unknown as { x: number; y: number };
        return [
          {
            id: identity.id,
            name: actor.name,
            logical: { ...component.logicalWorldTransform },
            rendered: { x: transform.x, y: transform.y },
            selected:
              (
                components.find(([token]) => token.name === "SelectableComponent")?.[1] as
                  | { getSelected(): boolean }
                  | undefined
              )?.getSelected() ?? false
          }
        ];
      })
      .sort((left, right) => left.id.localeCompare(right.id));
    return { humanPlayerNumber: scene.player.playerNumber, actors };
  }, ids);
}
