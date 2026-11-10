import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { digestCanonicalAiValue } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/persistence/canonical-ai-serialization";
import type { AiRuntimeBrowserTestHost } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/browser/ai-runtime-browser-test-host";
import type GameProbableWaffleScene from "@fuzzy-waddle/probable-waffle-phaser/world/scenes/GameProbableWaffleScene";
import type { ActorIndexSystem } from "@fuzzy-waddle/probable-waffle-phaser/world/services/ActorIndexSystem";
import type { RuntimeFixture } from "../../contracts/skirmish-ai-runtime-fixture";
import { prepareRuntimeVariant } from "../../setup/skirmish-ai-runtime-variant-setup";
import { advanceRuntimeFrames } from "../../runner/skirmish-ai-runtime-frame-driver";

test.skip(process.env.AI_GAMEPLAY_RELIABILITY !== "1", "Explicit bounded gameplay reliability checks only");
test.setTimeout(180_000);

test("a minor infantry injury does not abandon a favorable fight", async ({ page }, testInfo) => {
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
  if (!selected?.presetWorld) throw new Error("minor_injury_fixture_missing");
  const variant = {
    ...selected,
    presetWorld: {
      ...selected.presetWorld,
      fixtureId: "gameplay-minor-injury-favorable-fight",
      events: [
        {
          id: "minor-infantry-injury",
          tick: 5,
          kind: "damage_owned_actor" as const,
          owner: 2,
          objectName: ObjectNames.TivaraMacemanMale,
          fixtureActorId: "army-0",
          damage: 1
        }
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
  const samples = [];
  for (const tick of [0, 5, 20, 40, 60, 80, 100, 120, 160, 200]) {
    if (tick) await advanceRuntimeFrames(page, fixture.recipe.aiPlayerNumber, tick);
    samples.push(
      await page.evaluate(() => {
        const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
          .__fuzzyWaddleAiRuntimeBrowserTest;
        const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
          | GameProbableWaffleScene
          | undefined;
        const index = scene
          ?.getSceneGameData()
          .services.find((service): service is ActorIndexSystem => "getActorById" in service);
        const roles = host?.presetApplication?.createdActorIds;
        if (!index || !roles) throw new Error("minor_injury_roles_missing");
        const enemy = index.getActorById(roles["contact-group"] ?? "");
        const injured = index.getActorById(roles["army-0"] ?? "");
        const injuredHealth =
          injured &&
          ([...((injured.getData("actorData")?.components as Map<unknown, unknown>) ?? []).values()].find(
            (value) => !!(value as { healthComponentData?: unknown })?.healthComponentData
          ) as { healthComponentData: { health: number; armour: number } } | undefined);
        const health =
          enemy &&
          ([...((enemy.getData("actorData")?.components as Map<unknown, unknown>) ?? []).values()].find(
            (value) => !!(value as { healthComponentData?: unknown })?.healthComponentData
          ) as
            | {
                healthComponentData: { health: number };
                latestDamage?: { damageInitiator?: unknown; simulationTick?: number };
              }
            | undefined);
        const controller = window.__fuzzyWaddleAiRuntimeParts?.(2)?.controller;
        const armyIds = Object.entries(roles)
          .filter(([role]) => role.startsWith("army-"))
          .map(([, id]) => id);
        return {
          tick: window.__fuzzyWaddleAiRuntimeParts?.(2)?.tickService.currentTick,
          injury: host.presetApplication?.eventResults.find((event) => event.id === "minor-infantry-injury"),
          injuredId: roles["army-0"],
          injuredHealth: injuredHealth?.healthComponentData.health,
          injuredArmour: injuredHealth?.healthComponentData.armour,
          enemyHealth: health?.healthComponentData.health ?? 0,
          hitTick: health?.latestDamage?.simulationTick,
          hitByArmy:
            !!health?.latestDamage?.damageInitiator &&
            armyIds.some((id) => index.getActorById(id) === health.latestDamage?.damageInitiator),
          squads:
            controller
              ?.getBrainState()
              ?.squads.filter((squad) => squad.actorIds.some((id) => armyIds.includes(id)))
              .map((squad) => ({ state: squad.state, actorIds: squad.actorIds })) ?? []
        };
      })
    );
  }
  writeFileSync(testInfo.outputPath("minor-injury.json"), JSON.stringify({ source, samples, errors }));
  expect(samples[1]?.injury).toMatchObject({ tick: 5, affectedActors: 1, affectedActorId: samples[1]?.injuredId });
  expect((samples[1]?.injuredHealth ?? 0) + (samples[1]?.injuredArmour ?? 0)).toBe(
    (samples[0]?.injuredHealth ?? 0) + (samples[0]?.injuredArmour ?? 0) - 1
  );
  expect(samples[0]?.enemyHealth).toBeGreaterThan(0);
  const combat = samples.filter((sample) => (sample.tick ?? 0) >= 20 && (sample.tick ?? 0) <= 100);
  expect(combat.some((sample) => sample.squads.length > 0)).toBe(true);
  expect(combat.every((sample) => sample.squads.every((squad) => squad.state !== "retreat"))).toBe(true);
  expect(samples.some((sample) => sample.hitByArmy && (sample.hitTick ?? 0) > 5)).toBe(true);
  expect(samples.at(-1)?.enemyHealth).toBe(0);
  expect(errors).toEqual([]);
});
