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

test("a damaged scout keeps its withdrawal when scouting questions change", async ({ page }, testInfo) => {
  const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  const source = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const fixture: RuntimeFixture = JSON.parse(
    readFileSync(
      join(
        root,
        "tools/probable-waffle/skirmish/ai/testing/fixtures/native/recovery/h-01-cumulative-episode-deadline-still-escalates-and-restores-useful-duty-runtime.json"
      ),
      "utf8"
    )
  );
  const selected = fixture.recipe.variants.find((variant) => variant.id === "h-01-tivara-clears-early");
  if (!selected?.presetWorld) throw new Error("scout_withdrawal_fixture_missing");
  const variant = {
    ...selected,
    captureConstruction: true as const,
    presetWorld: {
      ...selected.presetWorld,
      actors: [
        ...selected.presetWorld.actors,
        {
          fixtureActorId: "scout-pursuer",
          actorName: ObjectNames.SkaduweeWarriorMale,
          owner: 1,
          position: { x: (5 - 26) * 32 + 32, y: (5 + 26) * 16 + 16, z: 0 }
        }
      ],
      controls: [
        ...(selected.presetWorld.controls ?? []),
        {
          id: "pursue-scout",
          producerFixtureActorId: "scout-pursuer",
          requestTick: 300,
          applicationTick: 300,
          action: { kind: "attack" as const, targetFixtureActorId: "scout-probe" }
        }
      ],
      events: [
        ...(selected.presetWorld.events ?? []),
        {
          id: "scout-injury",
          tick: 330,
          kind: "damage_owned_actor" as const,
          owner: 2,
          objectName: ObjectNames.TivaraMacemanMale,
          fixtureActorId: "scout-probe",
          damage: 7
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
    digestCanonicalAiValue({ fixture, variant }),
    false,
    errors
  );
  const samples = [];
  for (let tick = 20; tick <= 600; tick += 20) {
    await advanceRuntimeFrames(page, 2, tick);
    samples.push(
      await page.evaluate(() => {
        const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
          .__fuzzyWaddleAiRuntimeBrowserTest;
        const id = host?.presetApplication?.createdActorIds["scout-probe"];
        const controller = window.__fuzzyWaddleAiRuntimeParts?.(2)?.controller;
        if (!id || !controller) throw new Error("scout_withdrawal_actor_missing");
        const actor = controller.getCommittedObservation()?.actors.find((entry) => entry.actorId === id);
        const squad = controller
          .getBrainState()
          ?.squads.find((entry) => entry.role === "scout" && entry.actorIds.includes(id));
        return {
          tick: window.__fuzzyWaddleAiRuntimeParts?.(2)?.tickService.currentTick,
          id,
          position: actor?.logicalPosition,
          health: actor?.healthPermille,
          order: actor?.activeOrder,
          state: squad?.state,
          script: squad?.tactics?.script,
          objective: squad?.objectiveId
        };
      })
    );
  }
  const capture = await page.evaluate(() => {
    const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
      .__fuzzyWaddleAiRuntimeBrowserTest;
    const id = host?.presetApplication?.createdActorIds["scout-probe"];
    const result = host?.productionCapture?.capture(2, 600);
    if (!id || !result) throw new Error("scout_withdrawal_capture_missing");
    return {
      pursuerId: host?.presetApplication?.createdActorIds["scout-pursuer"],
      dropped: result.droppedFactCount,
      facts: result.facts.filter(
        (fact) =>
          (fact.kind === "native_damage" && fact.damage.target.actorId === id) ||
          (fact.kind === "intent_dispatch" &&
            fact.event.kind === "requested" &&
            fact.event.acceptedIntent &&
            "actorIds" in fact.event.acceptedIntent &&
            fact.event.acceptedIntent.actorIds.includes(id))
      )
    };
  });
  writeFileSync(testInfo.outputPath("scout-withdrawal.json"), JSON.stringify({ source, samples, capture, errors }));
  expect(errors).toEqual([]);
  expect(capture.dropped).toBe(0);
  expect(
    capture.facts.some(
      (fact) =>
        fact.kind === "native_damage" && fact.damage.amount > 0 && fact.damage.initiator?.actorId === capture.pursuerId
    )
  ).toBe(true);
  const retreats = samples.filter((sample) => sample.state === "retreat" && sample.script === "protected_retreat");
  expect(retreats.length).toBeGreaterThan(1);
  expect(
    retreats.some(
      (sample, index) =>
        index > 0 &&
        sample.position?.status === "known" &&
        retreats[0]?.position?.status === "known" &&
        (sample.position.value.x !== retreats[0].position.value.x ||
          sample.position.value.y !== retreats[0].position.value.y)
    )
  ).toBe(true);
  for (const sample of retreats) {
    expect(
      capture.facts.some(
        (fact) =>
          fact.kind === "intent_dispatch" &&
          fact.tick === sample.tick &&
          fact.event.kind === "requested" &&
          fact.event.acceptedIntent?.kind === "scout"
      )
    ).toBe(false);
  }
});
