import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import { digestRuntimeValue } from "./skirmish-ai-runtime-digest";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";
import { captureRuntimeProductionAuthority } from "./skirmish-ai-runtime-production-capture";

test.skip(
  process.env.AI_SKIRMISH_PRESET_LOSS !== "1",
  "Explicit finite native preset lifecycle check; not PRO release coverage."
);
test.setTimeout(300_000);

test("both faction worlds lose the pinned original while preserving another same-type producer", async ({
  browser
}, testInfo) => {
  const root = resolve(__dirname, "../../../..");
  const source = JSON.parse(
    readFileSync(resolve(root, "tools/ai/fixtures/production-economy-runtime.json"), "utf8")
  ) as RuntimeFixtureV1;
  const revision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  const results: unknown[] = [];
  for (const base of source.recipe.variants) {
    const preset = base.presetWorld!;
    const producer = preset.actors.find((actor) => actor.fixtureActorId === "producer")!;
    const product = base.aiFaction === "Tivara" ? "TivaraMacemanMale" : "SkaduweeWarriorMale";
    const variant: RuntimeVariantV1 = {
      ...base,
      id: `${base.id}-pinned-loss`,
      scenarioIds: ["PRO-06"],
      checkpointTicks: [20, 200, 400],
      presetWorld: {
        ...preset,
        fixtureId: `${preset.fixtureId}-pinned-loss`,
        actors: [
          ...preset.actors,
          { ...producer, fixtureActorId: "other-producer", position: { x: 480, y: 848, z: 0 } }
        ],
        queues: [{ producerFixtureActorId: "producer", actorName: product, count: 1 }],
        events: [
          {
            id: "original-producer-loss",
            tick: 240,
            kind: "destroy_owned_actor",
            owner: 2,
            objectName: producer.actorName,
            fixtureActorId: "producer"
          }
        ]
      }
    };
    // PRO-06 enables the existing capture owner. This check asserts setup/loss only, not its full causal scenario oracle.
    const fixture: RuntimeFixtureV1 = {
      ...source,
      scenarioIds: ["PRO-06"],
      recipe: { ...source.recipe, checkpointTicks: [20, 200, 400], variants: [variant] },
      assertions: {
        "PRO-06": {
          maximumTick: 400,
          minimumDecisions: 1,
          minimumAppliedCommands: 0,
          requiredAiFactions: [base.aiFaction]
        }
      }
    };
    const fundingErrors: string[] = [];
    const result = await runVariant(
      browser,
      fixture,
      variant,
      null,
      ["PRO-06"],
      revision,
      digestRuntimeValue(fixture),
      async (page, checkpoint) => {
        if (checkpoint === -1) {
          page.on("pageerror", (error) => {
            if (error.message.includes("Cannot afford building costs")) fundingErrors.push(error.message);
          });
          await captureRuntimeProductionAuthority(page, fixture.recipe.aiPlayerNumber, 400);
        }
      }
    );
    const originalId = result.presetCreatedActorIds["producer"]!;
    const otherId = result.presetCreatedActorIds["other-producer"]!;
    const capture = result.productionCapture!;
    expect(result.aiErrors).toEqual([]);
    expect(fundingErrors).toEqual([]);
    expect(capture.droppedFactCount).toBe(0);
    expect(capture.droppedSnapshotCount).toBe(0);
    expect(capture.setup?.actors.length).toBeGreaterThan(0);
    expect(capture.setupGaps).toEqual([]);
    expect(capture.frontiers?.closedThroughTick).toBe(400);
    expect(capture.frontiers?.intervals.at(-1)?.capturedAtTick).toBe(401);
    expect(capture.frontiers?.gaps).toEqual([]);
    expect(result.perturbations).toContainEqual({
      id: "original-producer-loss",
      tick: 240,
      dispatchedActors: 1,
      subjectName: producer.actorName,
      affectedActorId: originalId
    });
    const loss = capture.facts
      .filter((fact) => fact.kind === "actor_unregistered")
      .filter((fact) => fact.actorId === originalId);
    expect(loss).toHaveLength(1);
    expect(loss[0]?.actor?.alive).toBe(false);
    expect(capture.facts.filter((fact) => fact.kind === "actor_unregistered" && fact.actorId === otherId)).toEqual([]);
    const final = capture.snapshots.at(-1)!;
    expect(final.ownedActors.some((actor) => actor.actorId === originalId)).toBe(false);
    expect(final.ownedActors.some((actor) => actor.actorId === otherId)).toBe(true);
    const completed = capture.facts.filter(
      (fact) =>
        fact.kind === "queue_completion" &&
        fact.completion.actorId === originalId &&
        fact.completion.phase === "after" &&
        fact.completion.createdActor?.actorId
    );
    expect(completed.length).toBeGreaterThan(0);
    results.push({
      faction: base.aiFaction,
      revision,
      fixtureDigest: digestRuntimeValue(fixture),
      seed: result.seed,
      finalTick: final.tick,
      closedThroughTick: capture.frontiers?.closedThroughTick,
      setupActors: capture.setup?.actors.length,
      originalId,
      otherId,
      lossTicks: loss.map((fact) => fact.tick),
      completionTicks: completed.map((fact) => fact.tick),
      fundingErrorCount: fundingErrors.length,
      omittedSelectedCases: 0
    });
  }
  await testInfo.attach("native-pinned-loss-summary", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json"
  });
  console.log(`AI_PRESET_LOSS_V1:${JSON.stringify(results)}`);
});
