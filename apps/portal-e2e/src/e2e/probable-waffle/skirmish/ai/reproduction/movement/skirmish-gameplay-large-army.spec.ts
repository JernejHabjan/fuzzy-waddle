import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { digestCanonicalAiValue } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/persistence/canonical-ai-serialization";
import type { AiObservedActor } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/contracts/observation/ai-observation";
import type { AiRuntimeBrowserTestHost } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/browser/ai-runtime-browser-test-host";
import type GameProbableWaffleScene from "@fuzzy-waddle/probable-waffle-phaser/world/scenes/GameProbableWaffleScene";
import type { ActorIndexSystem } from "@fuzzy-waddle/probable-waffle-phaser/world/services/ActorIndexSystem";
import type { NavigationService } from "@fuzzy-waddle/probable-waffle-phaser/world/services/navigation.service";
import type { RuntimeFixture } from "../../contracts/skirmish-ai-runtime-fixture";
import { prepareRuntimeVariant } from "../../setup/skirmish-ai-runtime-variant-setup";
import { advanceRuntimeFrames } from "../../runner/skirmish-ai-runtime-frame-driver";

test.skip(process.env.AI_GAMEPLAY_RELIABILITY !== "1", "Explicit bounded gameplay reliability checks only");
test.setTimeout(180_000);

for (const addProduction of [false, true])
  test(
    addProduction
      ? "a large army keeps its progress as paid production completes"
      : "a large army makes physical progress without repeated movement orders",
    async ({ page }, testInfo) => {
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
      if (!selected?.presetWorld) throw new Error("large_army_fixture_missing");
      const extra = Array.from({ length: 4 }, (_, index) => ({
        fixtureActorId: `army-extra-${index}`,
        actorName: ObjectNames.TivaraMacemanMale,
        owner: 2,
        position: { x: 64 + 32 * index, y: 912 + 16 * index, z: 0 }
      }));
      const variant = {
        ...selected,
        scenarioIds: [],
        captureConstruction: true as const,
        captureCombat: true as const,
        presetWorld: {
          ...selected.presetWorld,
          fixtureId: "large-army-progress",
          actors: [...selected.presetWorld.actors, ...extra],
          controls: addProduction
            ? [
                {
                  id: "add-army-fighter",
                  producerFixtureActorId: "ready-producer",
                  requestTick: 40,
                  applicationTick: 40,
                  action: { kind: "produce" as const, actorName: ObjectNames.TivaraMacemanMale }
                }
              ]
            : []
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
      const startingGeometry = await page.evaluate(() => {
        const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
          .__fuzzyWaddleAiRuntimeBrowserTest;
        const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
          | GameProbableWaffleScene
          | undefined;
        const services = scene?.getSceneGameData().services;
        const index = services?.find((service): service is ActorIndexSystem => "getActorById" in service);
        const navigation = services?.find(
          (service): service is NavigationService => "getCenterTileCoordUnderObject" in service
        );
        if (!index || !navigation || !host?.presetApplication) throw new Error("large_army_geometry_missing");
        return Object.entries(host.presetApplication.createdActorIds)
          .filter(([role]) => role.startsWith("army-"))
          .map(([role, id]) => {
            const actor = index.getActorById(id);
            const tile = actor && navigation.getCenterTileCoordUnderObject(actor);
            return { role, tile, navigable: !!tile && navigation.isTileNavigable(tile) };
          });
      });
      const samples: { tick: number; actors: AiObservedActor[]; ownedIds: string[] }[] = [];
      const ticks = addProduction
        ? [20, 40, 80, 120, 160, 200, 240, 320, 400, 500, 600, 700, 800]
        : [20, 40, 80, 120, 160, 200, 240];
      const finalTick = addProduction ? 800 : 240;
      for (const tick of ticks) {
        await advanceRuntimeFrames(page, 2, tick);
        samples.push(
          await page.evaluate(() => {
            const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
              .__fuzzyWaddleAiRuntimeBrowserTest;
            const roles = host?.presetApplication?.createdActorIds;
            const observation = window.__fuzzyWaddleAiRuntimeParts?.(2)?.controller?.getCommittedObservation();
            if (!roles || !observation) throw new Error("large_army_observation_missing");
            const ids = Object.entries(roles)
              .filter(([id]) => id.startsWith("army-"))
              .map(([, id]) => id);
            return {
              tick: observation.tick,
              actors: observation.actors.filter((actor) => ids.includes(actor.actorId)),
              ownedIds: observation.actors.filter((actor) => actor.relation === "self").map((actor) => actor.actorId)
            };
          })
        );
      }
      const evidence = await page.evaluate((finalTick) => {
        const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
          .__fuzzyWaddleAiRuntimeBrowserTest;
        const roles = host?.presetApplication?.createdActorIds;
        const capture = host?.productionCapture?.capture?.(2, finalTick);
        const opposingCapture = host?.productionCapture?.captureHuman?.(1, finalTick);
        if (!roles || !capture || !opposingCapture) throw new Error("large_army_capture_missing");
        return {
          roles,
          dropped: capture.droppedFactCount + opposingCapture.droppedFactCount,
          facts: [
            ...capture.facts.filter((fact) => fact.kind === "spatial_authority" || fact.kind === "queue_completion"),
            ...opposingCapture.facts.filter((fact) => fact.kind === "native_damage")
          ]
        };
      }, finalTick);
      writeFileSync(
        testInfo.outputPath("large-army.json"),
        JSON.stringify({ source, startingGeometry, samples, evidence, errors })
      );
      expect(
        startingGeometry.every((actor) => actor.navigable),
        "all fighters start on navigable terrain"
      ).toBe(true);
      expect(errors).toEqual([]);
      expect(evidence.dropped).toBe(0);
      const first = samples[0],
        last = samples.at(-1);
      if (!first || !last) throw new Error("large_army_samples_missing");
      const armyIds = Object.entries(evidence.roles)
        .filter(([id]) => id.startsWith("army-"))
        .map(([, id]) => id);
      expect(armyIds).toHaveLength(12);
      if (addProduction) {
        const created = evidence.facts.filter(
          (fact) =>
            fact.kind === "queue_completion" &&
            fact.completion.phase === "after" &&
            fact.completion.actorId === evidence.roles["ready-producer"] &&
            fact.completion.originatingCommandContext?.execution.source === "human" &&
            fact.completion.requestedCanonicalObjectName === ObjectNames.TivaraMacemanMale &&
            fact.completion.createdActor?.actorId &&
            fact.completion.createdActorInProducerScene === true
        );
        expect(created.length, "a paid fighter actually completes").toBeGreaterThan(0);
        expect(
          created.some(
            (fact) =>
              fact.kind === "queue_completion" &&
              samples.some((sample) => sample.ownedIds.includes(fact.completion.createdActor?.actorId ?? ""))
          )
        ).toBe(true);
        const completedTick = Math.min(...created.map((fact) => fact.tick));
        const afterProduction = samples.find((sample) => sample.tick > completedTick);
        const later = samples.find((sample) => sample.tick >= completedTick + 100);
        if (!afterProduction || !later) throw new Error("production_progress_samples_missing");
        const movedAfter = armyIds.filter((id) => {
          const before = afterProduction.actors.find((actor) => actor.actorId === id)?.logicalPosition;
          const after = later.actors.find((actor) => actor.actorId === id)?.logicalPosition;
          return (
            before?.status === "known" &&
            after?.status === "known" &&
            Math.hypot(after.value.x - before.value.x, after.value.y - before.value.y) >= 2
          );
        });
        expect(movedAfter.length, "existing fighters continue moving after production").toBeGreaterThanOrEqual(6);
        expect(
          evidence.facts.some(
            (fact) =>
              fact.kind === "native_damage" &&
              fact.tick >= completedTick &&
              fact.damage.amount > 0 &&
              armyIds.includes(fact.damage.initiator?.actorId ?? "")
          )
        ).toBe(true);
      }
      const moved = armyIds.filter((id) => {
        const before = first.actors.find((actor) => actor.actorId === id)?.logicalPosition;
        const after = last.actors.find((actor) => actor.actorId === id)?.logicalPosition;
        return (
          before?.status === "known" &&
          after?.status === "known" &&
          Math.hypot(after.value.x - before.value.x, after.value.y - before.value.y) >= 2
        );
      });
      expect(moved.length, "a useful portion of the army must physically progress").toBeGreaterThanOrEqual(6);
      let movementStarts = 0;
      for (const id of armyIds) {
        const starts = evidence.facts.filter(
          (fact) =>
            fact.kind === "spatial_authority" &&
            fact.spatial.kind === "movement" &&
            fact.spatial.phase === "started" &&
            fact.spatial.source.actorId === id
        );
        movementStarts += starts.length;
        const failuresByTile = new Map<string, number>();
        for (const fact of evidence.facts) {
          if (
            fact.kind !== "spatial_authority" ||
            fact.spatial.kind !== "movement" ||
            fact.tick > 240 ||
            fact.spatial.source.actorId !== id ||
            fact.spatial.phase !== "returned_false" ||
            !fact.spatial.actualTile
          )
            continue;
          const { x, y } = fact.spatial.actualTile;
          const key = `${x},${y}`;
          failuresByTile.set(key, (failuresByTile.get(key) ?? 0) + 1);
        }
        expect(
          Math.max(0, ...failuresByTile.values()),
          `repeated failed movement without progress for ${id}`
        ).toBeLessThanOrEqual(3);
      }
      expect(movementStarts, "the AI movement history must be captured").toBeGreaterThan(0);
      expect(
        evidence.facts.some(
          (fact) =>
            fact.kind === "native_damage" &&
            fact.damage.amount > 0 &&
            armyIds.includes(fact.damage.initiator?.actorId ?? "")
        )
      ).toBe(true);
    }
  );
