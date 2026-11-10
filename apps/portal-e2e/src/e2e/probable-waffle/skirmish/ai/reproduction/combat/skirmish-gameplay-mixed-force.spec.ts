import { expect, test } from "@playwright/test";
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

test("a mixed ground and air force keeps fighting together", async ({ page }, testInfo) => {
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
  if (!selected?.presetWorld) throw new Error("mixed_force_fixture_missing");
  const flyers = [0, 1].map((index) => ({
    fixtureActorId: `mixed-flyer-${index}`,
    actorName: ObjectNames.TivaraAlchemist,
    owner: 2,
    position: { x: 160 + index * 32, y: 832 + index * 16, z: 0 }
  }));
  const variant = {
    ...selected,
    captureConstruction: true as const,
    captureCombat: true as const,
    presetWorld: { ...selected.presetWorld, actors: [...selected.presetWorld.actors, ...flyers] }
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
  const samples = [];
  for (const tick of [20, 40, 60, 80, 100, 120, 160, 200, 240]) {
    await advanceRuntimeFrames(page, 2, tick);
    samples.push(
      await page.evaluate(() => {
        const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
          .__fuzzyWaddleAiRuntimeBrowserTest;
        const roles = host?.presetApplication?.createdActorIds;
        const state = window.__fuzzyWaddleAiRuntimeParts?.(2)?.controller?.getBrainState();
        if (!roles || !state) throw new Error("mixed_force_state_missing");
        return {
          tick: window.__fuzzyWaddleAiRuntimeParts?.(2)?.tickService.currentTick,
          squads: state.squads
            .filter((squad) => squad.actorIds.some((id) => Object.values(roles).includes(id)))
            .map((squad) => ({ id: squad.squadId, domain: squad.domain, state: squad.state, actorIds: squad.actorIds }))
        };
      })
    );
  }
  const evidence = await page.evaluate(() => {
    const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
      .__fuzzyWaddleAiRuntimeBrowserTest;
    const roles = host?.presetApplication?.createdActorIds;
    const capture = host?.productionCapture?.captureHuman?.(1, 240);
    if (!roles || !capture) throw new Error("mixed_force_capture_missing");
    return {
      roles,
      dropped: capture.droppedFactCount,
      hits: capture.facts.filter((fact) => fact.kind === "native_damage")
    };
  });
  writeFileSync(testInfo.outputPath("mixed-force.json"), JSON.stringify({ source, samples, evidence, errors }));
  expect(errors).toEqual([]);
  expect(evidence.dropped).toBe(0);
  const flyerIds = flyers.map((flyer) => evidence.roles[flyer.fixtureActorId]);
  const groundIds = Object.entries(evidence.roles)
    .filter(([id]) => id.startsWith("army-"))
    .map(([, id]) => id);
  const targetId = evidence.roles["contact-group"];
  expect(targetId).toBeTruthy();
  expect(
    samples.some((sample) =>
      sample.squads.some((squad) => squad.domain === "air" && squad.actorIds.some((id) => flyerIds.includes(id)))
    )
  ).toBe(true);
  expect(
    evidence.hits.some(
      (fact) =>
        fact.kind === "native_damage" &&
        fact.damage.amount > 0 &&
        fact.damage.target.actorId === targetId &&
        flyerIds.includes(fact.damage.initiator?.actorId ?? "")
    )
  ).toBe(true);
  expect(
    evidence.hits.some(
      (fact) =>
        fact.kind === "native_damage" &&
        fact.damage.amount > 0 &&
        fact.damage.target.actorId === targetId &&
        groundIds.includes(fact.damage.initiator?.actorId ?? "")
    )
  ).toBe(true);
});
