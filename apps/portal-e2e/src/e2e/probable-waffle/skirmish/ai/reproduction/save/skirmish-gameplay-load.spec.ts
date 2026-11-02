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
import { saveAndReloadNativeMatch } from "./skirmish-ai-native-save-reload";

test.skip(process.env.AI_GAMEPLAY_RELIABILITY !== "1", "Explicit bounded gameplay reliability checks only");
test.setTimeout(240_000);

test("preserves elevated ground, building and flying projections through repeated real encrypted save/load", async ({
  page
}) => {
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
  const names = [ObjectNames.TivaraWorkerMale, ObjectNames.Temple, ObjectNames.Banshee];
  const ids = await page.evaluate((names) => {
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
  }, names);
  const original = await projection(page, ids);
  expect(original.actors).toHaveLength(3);
  expect(original.humanPlayerNumber).toBe(1);
  for (const actor of original.actors) {
    expect(actor.logical.z).toBe(64);
    expect(actor.rendered.y).toBeLessThan(actor.logical.y);
  }
  for (let cycle = 0; cycle < 3; cycle++) {
    await saveAndReloadNativeMatch(page, fixture.recipe.aiPlayerNumber);
    expect(await projection(page, ids), `save/load cycle ${cycle + 1}`).toEqual(original);
  }
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
            rendered: { x: transform.x, y: transform.y }
          }
        ];
      })
      .sort((left, right) => left.id.localeCompare(right.id));
    return { humanPlayerNumber: scene.player.playerNumber, actors };
  }, ids);
}
