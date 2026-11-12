import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { getPwActorDefinition } from "../../../../../prefabs/definitions/actor-definitions";
import type { AiRuntimePresetWorld } from "../../presets/setup/ai-runtime-preset-world";

it("distinguishes a fast ground mob from a native flying unit before gameplay", () => {
  expect(getPwActorDefinition(ObjectNames.Banshee, null)?.components?.flying).toBeUndefined();
  expect(getPwActorDefinition(ObjectNames.SkaduweeOwl, null)?.components?.flying?.height).toBeGreaterThan(0);
  expect(
    getPwActorDefinition(ObjectNames.TivaraSlingshotFemale, null)?.components?.attack?.attacks.some(
      (attack) => attack.canTargetAir && attack.damage > 0
    )
  ).toBe(true);
});

it.each(["access/defense-native-gameplay.json", "technology/technology-native-gameplay.json"])(
  "%s binds real flying actors and compatible raid selectors",
  (path) => {
    const fixture = JSON.parse(
      readFileSync(resolve(process.cwd(), "tools/probable-waffle/skirmish/ai/testing/fixtures/native", path), "utf8")
    ) as {
      recipe: {
        variants: {
          id: string;
          presetWorld: Omit<AiRuntimePresetWorld, "provenance">;
          perturbations?: { attackerObjectNames?: ObjectNames[] }[];
        }[];
      };
      assertions: Record<string, { requiredDefenseTargetName?: ObjectNames }>;
    };
    let checked = 0;
    for (const variant of fixture.recipe.variants) {
      const airActors = variant.presetWorld.actors.filter(
        (actor) => actor.fixtureActorId.startsWith("human-flyer-") || actor.fixtureActorId.startsWith("flyer-")
      );
      for (const actor of airActors) {
        expect({
          role: actor.fixtureActorId,
          flyingHeight: getPwActorDefinition(actor.actorName, null)?.components?.flying?.height
        }).toEqual({ role: actor.fixtureActorId, flyingHeight: expect.any(Number) });
        expect(actor.position.z).toBe(0);
        checked++;
      }
      if (variant.id === "tivara-air-raid-recovery") {
        expect(airActors).toHaveLength(3);
        const selectedNames = variant.perturbations?.flatMap((entry) => entry.attackerObjectNames ?? []);
        expect(selectedNames).toEqual([ObjectNames.SkaduweeOwl]);
        expect(airActors.every((actor) => selectedNames?.includes(actor.actorName))).toBe(true);
        expect(fixture.assertions["DOMAIN-06"]?.requiredDefenseTargetName).toBe(ObjectNames.SkaduweeOwl);
      }
    }
    expect(checked).toBeGreaterThan(0);
  }
);
