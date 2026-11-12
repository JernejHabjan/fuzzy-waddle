import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { digestCanonicalAiValue } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/persistence/canonical-ai-serialization";
import type { AiRuntimeBrowserTestHost } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/browser/ai-runtime-browser-test-host";
import type GameProbableWaffleScene from "@fuzzy-waddle/probable-waffle-phaser/world/scenes/GameProbableWaffleScene";
import type { ActorIndexSystem } from "@fuzzy-waddle/probable-waffle-phaser/world/services/ActorIndexSystem";
import type { NavigationService } from "@fuzzy-waddle/probable-waffle-phaser/world/services/navigation.service";
import type { RuntimeFixture } from "../../contracts/skirmish-ai-runtime-fixture";
import { prepareRuntimeVariant } from "../../setup/skirmish-ai-runtime-variant-setup";
import { advanceRuntimeFrames } from "../../runner/skirmish-ai-runtime-frame-driver";

test.skip(process.env.AI_GAMEPLAY_RELIABILITY !== "1", "Explicit bounded gameplay reliability checks only");
test.setTimeout(60_000);

test("a ranged unit uses its melee weapon against an adjacent ground target", async ({ page }) => {
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
  const selected = fixture.recipe.variants.find((entry) => entry.id === "fight-01-tivara-quiet");
  if (!selected?.presetWorld) throw new Error("close_range_fixture_missing");
  const variant = {
    ...selected,
    captureConstruction: true as const,
    presetWorld: {
      fixtureId: "close-range-weapon-selection",
      resourceGrants: [],
      actors: [
        {
          fixtureActorId: "close-attacker",
          actorName: ObjectNames.TivaraSlingshotFemale,
          owner: 2,
          position: { x: 576, y: 1280, z: 0 }
        },
        {
          fixtureActorId: "close-target",
          actorName: ObjectNames.SkaduweeWorkerMale,
          owner: 1,
          position: { x: 608, y: 1296, z: 0 }
        }
      ],
      controls: [
        {
          id: "close-attack",
          producerFixtureActorId: "close-attacker",
          requestTick: 2,
          applicationTick: 2,
          action: { kind: "attack" as const, targetFixtureActorId: "close-target" }
        }
      ],
      events: [],
      terrainPatches: []
    }
  };
  const errors: string[] = [];
  await prepareRuntimeVariant(
    page,
    fixture,
    variant,
    selected.seed,
    source,
    digestCanonicalAiValue({ fixture, variant }),
    false,
    errors
  );
  const initial = await page.evaluate(() => {
    const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
      .__fuzzyWaddleAiRuntimeBrowserTest;
    const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
      | GameProbableWaffleScene
      | undefined;
    const index = scene
      ?.getSceneGameData()
      .services.find((service): service is ActorIndexSystem => "getActorById" in service);
    const navigation = scene
      ?.getSceneGameData()
      .services.find((service): service is NavigationService => "getCenterTileCoordUnderObject" in service);
    const roles = host?.presetApplication?.createdActorIds;
    const attacker = roles && index?.getActorById(roles["close-attacker"] ?? "");
    const target = roles && index?.getActorById(roles["close-target"] ?? "");
    const handler = scene
      ?.getSceneGameData()
      .systems.find(
        (entry): entry is { setPlayerEnabled(playerNumber: number, enabled: boolean): boolean } =>
          typeof (entry as { setPlayerEnabled?: unknown }).setPlayerEnabled === "function"
      );
    if (!roles || !attacker || !target || !navigation || !handler?.setPlayerEnabled(2, false))
      throw new Error("close_range_setup_missing");
    const components = attacker.getData("actorData")?.components as Map<unknown, unknown> | undefined;
    const attack = [...(components?.values() ?? [])].find(
      (entry) => typeof (entry as { getAttack?: unknown })?.getAttack === "function"
    ) as { getAttack(enemy: unknown): { minRange: number; range: number } | null } | undefined;
    if (!attack) throw new Error("close_range_attack_component_missing");
    const from = navigation.getCenterTileCoordUnderObject(attacker);
    const to = navigation.getCenterTileCoordUnderObject(target);
    if (!from || !to) throw new Error("close_range_tiles_missing");
    return {
      roles,
      from,
      to,
      selected: attack.getAttack(target)
    };
  });
  expect(Math.hypot(initial.from.x - initial.to.x, initial.from.y - initial.to.y)).toBe(1);
  expect(initial.selected).toMatchObject({ minRange: 0 });
  await advanceRuntimeFrames(page, 2, 100);
  const capture = await page.evaluate(() => {
    const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
      .__fuzzyWaddleAiRuntimeBrowserTest;
    const evidence = host?.productionCapture?.captureHuman?.(1, 100);
    if (!evidence) throw new Error("close_range_capture_missing");
    return {
      dropped: evidence.droppedFactCount,
      facts: evidence.facts.filter((fact) => fact.kind === "native_damage")
    };
  });
  expect(errors).toEqual([]);
  expect(capture.dropped).toBe(0);
  expect(
    capture.facts.some(
      (fact) =>
        fact.kind === "native_damage" &&
        fact.damage.amount > 0 &&
        fact.damage.initiator?.actorId === initial.roles["close-attacker"] &&
        fact.damage.target.actorId === initial.roles["close-target"]
    )
  ).toBe(true);
});
