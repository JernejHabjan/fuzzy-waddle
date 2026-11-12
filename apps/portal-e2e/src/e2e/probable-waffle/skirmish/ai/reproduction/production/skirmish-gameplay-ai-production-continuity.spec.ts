import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { digestCanonicalAiValue } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/persistence/canonical-ai-serialization";
import type { AiRuntimeBrowserTestHost } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/browser/ai-runtime-browser-test-host";
import type { RuntimeFixture } from "../../contracts/skirmish-ai-runtime-fixture";
import { prepareRuntimeVariant } from "../../setup/skirmish-ai-runtime-variant-setup";
import { advanceRuntimeFrames } from "../../runner/skirmish-ai-runtime-frame-driver";

test.skip(process.env.AI_GAMEPLAY_RELIABILITY !== "1", "Explicit bounded gameplay reliability checks only");
test.setTimeout(600_000);

test("AI fills C-03's native army deficit with useful paid units", async ({ page }, testInfo) => {
  const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  const source = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const fixture: RuntimeFixture = JSON.parse(
    readFileSync(
      join(
        root,
        "tools/probable-waffle/skirmish/ai/testing/fixtures/native/classic-rts/c-03-army-total-grows-with-useful-affordable-mission-demand-respects-worker-supply-runtime.json"
      ),
      "utf8"
    )
  );
  const selected = fixture.recipe.variants.find((entry) => entry.id === "c-03-tivara-deficit");
  if (!selected?.presetWorld) throw new Error("ai_production_fixture_missing");
  const variant = {
    ...selected,
    scenarioIds: ["C-03"],
    captureCombat: true as const
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

  const finalTick = 4000;
  await advanceRuntimeFrames(page, 2, finalTick);
  const evidence = await page.evaluate((finalTick) => {
    const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
      .__fuzzyWaddleAiRuntimeBrowserTest;
    const roles = host?.presetApplication?.createdActorIds;
    const capture = host?.productionCapture?.capture?.(2, finalTick);
    const opposingCapture = host?.productionCapture?.captureHuman?.(1, finalTick);
    if (!roles || !capture || !opposingCapture) throw new Error("ai_production_capture_missing");
    const armyIds = Object.entries(roles)
      .filter(([role]) => /^army-[0-3]$/.test(role))
      .map(([, actorId]) => actorId);
    const selectedProduction = capture.facts.flatMap((fact) =>
      fact.kind === "decision_selected"
        ? fact.decision.acceptedIntents.flatMap((intent) =>
            intent.kind === "produce" && intent.objectName === "TivaraMacemanMale"
              ? [
                  {
                    tick: fact.tick,
                    intentId: intent.intentId,
                    reasonCode: intent.reasonCode,
                    producerId: intent.producerId
                  }
                ]
              : []
          )
        : []
    );
    const completions = capture.facts.flatMap((fact) =>
      fact.kind === "queue_completion" && fact.completion.phase === "after"
        ? [
            {
              tick: fact.tick,
              objectName: fact.completion.requestedCanonicalObjectName,
              source: fact.completion.originatingCommandContext?.execution.source,
              actorId: fact.completion.createdActor?.actorId,
              producerId: fact.completion.actorId
            }
          ]
        : []
    );
    const completedIds = new Set(completions.flatMap((completion) => (completion.actorId ? [completion.actorId] : [])));
    const nativeHits = opposingCapture.facts.flatMap((fact) =>
      fact.kind === "native_damage" && fact.damage.initiator?.actorId && completedIds.has(fact.damage.initiator.actorId)
        ? [{ tick: fact.tick, actorId: fact.damage.initiator.actorId, amount: fact.damage.amount }]
        : []
    );
    return {
      tick: finalTick,
      dropped: capture.droppedFactCount + opposingCapture.droppedFactCount,
      armyIds,
      selectedProduction,
      completions,
      nativeHits
    };
  }, finalTick);
  writeFileSync(testInfo.outputPath("ai-production-continuity.json"), JSON.stringify({ source, evidence, errors }));

  expect(errors).toEqual([]);
  expect(evidence.dropped).toBe(0);
  expect(evidence.armyIds).toHaveLength(4);
  expect(evidence.selectedProduction.length, "AI selects useful deficit production").toBeGreaterThan(0);
  const produced = evidence.completions.filter(
    (completion) =>
      completion.objectName === "TivaraMacemanMale" && completion.source === "ai" && completion.actorId !== undefined
  );
  expect(produced.length, "AI-paid fighters complete in the native producer").toBeGreaterThanOrEqual(4);
  expect(evidence.nativeHits.length, "an AI-produced fighter deals native damage").toBeGreaterThan(0);
});
