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
import type { AiObservedActor } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/contracts/observation/ai-observation";
import { prepareRuntimeVariant } from "../../setup/skirmish-ai-runtime-variant-setup";
import { advanceRuntimeFrames } from "../../runner/skirmish-ai-runtime-frame-driver";

test.skip(process.env.AI_GAMEPLAY_RELIABILITY !== "1", "Explicit bounded gameplay reliability checks only");
test.setTimeout(180_000);

for (const { severe, ranged } of [
  { severe: false, ranged: false },
  { severe: true, ranged: false },
  { severe: true, ranged: true }
])
  test(
    ranged
      ? "a critically wounded ranged fighter stays protected during combat"
      : severe
        ? "a critically wounded infantry fighter withdraws while healthy allies keep fighting"
        : "a minor infantry injury does not abandon a favorable fight",
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
      const selected = fixture.recipe.variants.find((variant) => variant.id === "fight-01-tivara-quiet");
      if (!selected?.presetWorld) throw new Error("minor_injury_fixture_missing");
      const injuredRole = ranged ? "ranged-probe" : "army-0";
      const damage = ranged ? 80 : severe ? 120 : 1;
      const variant = {
        ...selected,
        ...(severe ? { captureConstruction: true as const } : {}),
        presetWorld: {
          ...selected.presetWorld,
          actors: ranged
            ? selected.presetWorld.actors.map((actor) => {
                const replacementRole =
                  actor.fixtureActorId === "army-0"
                    ? "ranged-probe"
                    : actor.fixtureActorId === "ranged-probe"
                      ? "army-0"
                      : undefined;
                const replacement = selected.presetWorld?.actors.find(
                  (candidate) => candidate.fixtureActorId === replacementRole
                );
                return replacement ? { ...actor, position: replacement.position } : actor;
              })
            : selected.presetWorld.actors,
          fixtureId: "gameplay-minor-injury-favorable-fight",
          events: [
            {
              id: "minor-infantry-injury",
              tick: 5,
              kind: "damage_owned_actor" as const,
              owner: 2,
              objectName: ranged ? ObjectNames.TivaraSlingshotFemale : ObjectNames.TivaraMacemanMale,
              fixtureActorId: injuredRole,
              damage
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
          await page.evaluate((role) => {
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
            const injured = index.getActorById(roles[role] ?? "");
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
              injuredId: roles[role],
              injuredHealth: injuredHealth?.healthComponentData.health,
              injuredArmour: injuredHealth?.healthComponentData.armour,
              injuredObservation: controller
                ?.getCommittedObservation()
                ?.actors.find((actor) => actor.actorId === roles[role]),
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
          }, injuredRole)
        );
      }
      writeFileSync(testInfo.outputPath("minor-injury.json"), JSON.stringify({ source, samples, errors }));
      expect(samples[1]?.injury).toMatchObject({ tick: 5, affectedActors: 1, affectedActorId: samples[1]?.injuredId });
      expect((samples[1]?.injuredHealth ?? 0) + (samples[1]?.injuredArmour ?? 0)).toBe(
        (samples[0]?.injuredHealth ?? 0) + (samples[0]?.injuredArmour ?? 0) - damage
      );
      expect(samples[0]?.enemyHealth).toBeGreaterThan(0);
      const combat = samples.filter((sample) => (sample.tick ?? 0) >= 20 && (sample.tick ?? 0) <= 100);
      expect(combat.some((sample) => sample.squads.length > 0)).toBe(true);
      expect(combat.every((sample) => sample.squads.every((squad) => squad.state !== "retreat"))).toBe(true);
      if (severe) {
        const observedMove = combat.some(
          (sample) =>
            sample.injuredObservation?.activeOrder?.status === "known" &&
            sample.injuredObservation.activeOrder.value?.orderType === "Move"
        );
        expect(observedMove, "the injured fighter receives an actual withdrawal order").toBe(true);
        expect(combat.some((sample) => sample.squads.some((squad) => squad.state === "engage"))).toBe(true);
        const firstMove = combat.find(
          (sample) =>
            sample.injuredObservation?.activeOrder?.status === "known" &&
            sample.injuredObservation.activeOrder.value?.orderType === "Move"
        );
        const start = firstMove?.injuredObservation?.logicalPosition;
        expect(
          samples.some((sample) => {
            const current = sample.injuredObservation?.logicalPosition;
            return (
              (sample.tick ?? 0) > (firstMove?.tick ?? Infinity) &&
              start?.status === "known" &&
              current?.status === "known" &&
              (current.value.x !== start.value.x || current.value.y !== start.value.y)
            );
          }),
          "the wounded fighter actually moves after withdrawal"
        ).toBe(true);
        expect(
          samples.some((sample) => sample.hitByArmy && (sample.hitTick ?? 0) >= (firstMove?.tick ?? Infinity)),
          "allies deal damage after the wounded fighter withdraws"
        ).toBe(true);
      }
      expect(samples.some((sample) => sample.hitByArmy && (sample.hitTick ?? 0) > 5)).toBe(true);
      expect(samples.at(-1)?.enemyHealth).toBe(0);
      expect(errors).toEqual([]);
    }
  );

for (const mixed of [false, true])
  test(
    mixed
      ? "a losing ground force re-engages with mixed air and ground reinforcements"
      : "a losing squad withdraws and re-engages when nearby reinforcements arrive",
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
      const selected = fixture.recipe.variants.find((variant) => variant.id === "fight-01-tivara-quiet");
      if (!selected?.presetWorld) throw new Error("retreat_fixture_missing");
      const enemies = Array.from({ length: 7 }, (_, index) => ({
        fixtureActorId: `enemy-force-${index}`,
        actorName: ObjectNames.SkaduweeWarriorMale,
        owner: 1,
        position: { x: 64 + (index % 4) * 32, y: 800 + Math.floor(index / 4) * 32, z: 0 }
      }));
      const reserves = Array.from({ length: 8 }, (_, index) => ({
        fixtureActorId: `own-reserve-${index}`,
        actorName: mixed && index >= 6 ? ObjectNames.TivaraAlchemist : ObjectNames.TivaraMacemanMale,
        owner: 2,
        position: {
          x: (45 + (index % 4) - (42 + Math.floor(index / 4))) * 32 + 32,
          y: (45 + (index % 4) + 42 + Math.floor(index / 4)) * 16 + 16,
          z: 0
        }
      }));
      const variant = {
        ...selected,
        captureConstruction: true as const,
        presetWorld: {
          ...selected.presetWorld,
          fixtureId: "gameplay-retreat-reinforcement",
          actors: [
            ...selected.presetWorld.actors.filter(
              (actor) =>
                (!actor.fixtureActorId.startsWith("army-") || ["army-0", "army-1"].includes(actor.fixtureActorId)) &&
                !["scout-probe", "ranged-probe", "support-probe"].includes(actor.fixtureActorId)
            ),
            ...enemies,
            ...reserves
          ],
          controls: reserves.map((actor, index) => ({
            id: `reserve-move-${index}`,
            producerFixtureActorId: actor.fixtureActorId,
            requestTick: 120,
            applicationTick: 120,
            action: {
              kind: "move" as const,
              worldPosition: { x: 128 + (index % 4) * 32, y: 896 + Math.floor(index / 4) * 32, z: 0 }
            }
          }))
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
      const samples: Array<{
        tick: number | undefined;
        roles: Readonly<Record<string, string>>;
        squads: { id: string; state: string; actorIds: readonly string[] }[];
        observed: {
          id: string;
          relation: string;
          position: AiObservedActor["logicalPosition"];
          health: AiObservedActor["healthPermille"];
          order: AiObservedActor["activeOrder"];
        }[];
      }> = [];
      for (let tick = 20; tick <= 400; tick += 20) {
        await advanceRuntimeFrames(page, fixture.recipe.aiPlayerNumber, tick);
        samples.push(
          await page.evaluate(() => {
            const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
              .__fuzzyWaddleAiRuntimeBrowserTest;
            const roles = host?.presetApplication?.createdActorIds;
            const controller = window.__fuzzyWaddleAiRuntimeParts?.(2)?.controller;
            if (!roles || !controller) throw new Error("retreat_roles_missing");
            const initial = [roles["army-0"], roles["army-1"]];
            return {
              tick: window.__fuzzyWaddleAiRuntimeParts?.(2)?.tickService.currentTick,
              roles,
              squads:
                controller
                  .getBrainState()
                  ?.squads.filter((squad) => squad.actorIds.some((id) => initial.includes(id)))
                  .map((squad) => ({ id: squad.squadId, state: squad.state, actorIds: squad.actorIds })) ?? [],
              observed:
                controller
                  .getCommittedObservation()
                  ?.actors.filter((actor) => Object.values(roles).includes(actor.actorId))
                  .map((actor) => ({
                    id: actor.actorId,
                    relation: actor.relation,
                    position: actor.logicalPosition,
                    health: actor.healthPermille,
                    order: actor.activeOrder
                  })) ?? []
            };
          })
        );
      }
      const authority = await page.evaluate(() => {
        const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
          .__fuzzyWaddleAiRuntimeBrowserTest;
        const capture = host?.productionCapture?.capture(2, 400);
        const opponent = host?.productionCapture?.captureHuman?.(1, 400);
        if (!capture || !opponent) throw new Error("retreat_authority_missing");
        return {
          dropped: capture.droppedFactCount,
          opponentDropped: opponent.droppedFactCount,
          facts: capture.facts.filter(
            (fact) =>
              fact.kind === "native_damage" ||
              fact.kind === "preset_control" ||
              fact.kind === "intent_dispatch" ||
              fact.kind === "outcome" ||
              (fact.kind === "spatial_authority" && fact.spatial.kind === "movement")
          ),
          opponentDamage: opponent.facts.filter((fact) => fact.kind === "native_damage")
        };
      });
      writeFileSync(
        testInfo.outputPath("retreat-reinforcement.json"),
        JSON.stringify({ source, samples, authority, errors })
      );
      expect(errors).toEqual([]);
      expect(authority.dropped).toBe(0);
      expect(authority.opponentDropped).toBe(0);
      const roles = samples[0]?.roles;
      if (!roles) throw new Error("retreat_fixture_roles_missing");
      if (mixed) {
        const airIds = [roles["own-reserve-6"], roles["own-reserve-7"]];
        expect(
          authority.opponentDamage.some(
            (fact) =>
              fact.kind === "native_damage" &&
              fact.tick <= 120 &&
              fact.damage.amount > 0 &&
              airIds.includes(fact.damage.initiator?.actorId ?? "")
          )
        ).toBe(true);
      }
      expect(
        samples.some((sample) => (sample.tick ?? 0) < 120 && sample.squads.some((squad) => squad.state === "retreat"))
      ).toBe(true);
      expect(
        samples.some((sample) => (sample.tick ?? 0) > 120 && sample.squads.some((squad) => squad.state === "engage"))
      ).toBe(true);
      expect(
        samples
          .filter((sample) => (sample.tick ?? 0) >= 40 && (sample.tick ?? 0) <= (mixed ? 100 : 120))
          .every((sample) => sample.squads.some((squad) => squad.state === "retreat"))
      ).toBe(true);
      expect(
        samples
          .filter((sample) => (sample.tick ?? 0) >= 140)
          .every((sample) => sample.squads.some((squad) => squad.state === "engage"))
      ).toBe(true);
      const initialIds = [roles["army-0"], roles["army-1"]].filter((id): id is string => !!id);
      const reserveIds = Object.entries(roles)
        .filter(([role]) => role.startsWith("own-reserve-"))
        .map(([, id]) => id);
      const enemyIds = Object.entries(roles)
        .filter(([role]) => role.startsWith("enemy-force-"))
        .map(([, id]) => id);
      expect(initialIds).toHaveLength(2);
      expect(reserveIds).toHaveLength(8);
      const retreatEffects = authority.facts.flatMap((fact) => {
        if (
          fact.kind !== "intent_dispatch" ||
          fact.event.kind !== "requested" ||
          fact.event.acceptedIntent?.kind !== "move" ||
          !fact.event.acceptedIntent.reasonCode.includes("protected_retreat") ||
          !initialIds.some(
            (id) =>
              fact.event.kind === "requested" &&
              fact.event.acceptedIntent?.kind === "move" &&
              fact.event.acceptedIntent.actorIds.includes(id)
          )
        )
          return [];
        return [fact.event.correlation.effectId];
      });
      expect(retreatEffects.length).toBeGreaterThan(0);
      const applied = authority.facts.flatMap((fact) =>
        fact.kind === "outcome" &&
        fact.outcome.kind === "applied" &&
        fact.outcome.reason === "applied" &&
        fact.outcome.effectId &&
        retreatEffects.includes(fact.outcome.effectId)
          ? fact.outcome.actorIds
          : []
      );
      const movement = authority.facts.flatMap((fact) =>
        fact.kind === "spatial_authority" &&
        fact.spatial.kind === "movement" &&
        fact.spatial.caller?.order?.commandContext?.execution.effectId &&
        retreatEffects.includes(fact.spatial.caller.order.commandContext.execution.effectId) &&
        fact.spatial.source.actorId &&
        initialIds.includes(fact.spatial.source.actorId) &&
        applied.includes(fact.spatial.source.actorId) &&
        fact.spatial.actualTile
          ? [{ tick: fact.tick, ...fact.spatial }]
          : []
      );
      const completedMovementEvidence = movement.some(
        (start) =>
          start.phase === "started" &&
          start.actualTile &&
          movement.some(
            (later) =>
              later.executionId === start.executionId &&
              later.tick <= 140 &&
              later.actualTile &&
              (later.actualTile.x !== start.actualTile?.x || later.actualTile.y !== start.actualTile?.y)
          )
      );
      const ongoingMovementEvidence = movement.some((start) => {
        const id = start.source.actorId;
        if (start.phase !== "started" || !id || !start.actualTile || start.tick > 80) return false;
        const before = samples.find((sample) => sample.tick === 80)?.observed.find((actor) => actor.id === id);
        const after = samples.find((sample) => sample.tick === 120)?.observed.find((actor) => actor.id === id);
        if (
          before?.position.status !== "known" ||
          after?.position.status !== "known" ||
          before.order?.status !== "known" ||
          after.order?.status !== "known" ||
          before.order.value?.orderType !== "Move" ||
          after.order.value?.orderType !== "Move" ||
          !before.order.value.targetPosition ||
          !after.order.value.targetPosition
        )
          return false;
        const sameDestination =
          JSON.stringify(before.order.value.targetPosition) === JSON.stringify(after.order.value.targetPosition);
        const changedPosition =
          before.position.value.x !== after.position.value.x || before.position.value.y !== after.position.value.y;
        const replaced = authority.facts.some(
          (fact) =>
            fact.kind === "intent_dispatch" &&
            fact.event.kind === "requested" &&
            fact.tick > start.tick &&
            fact.tick <= 120 &&
            fact.event.acceptedIntent &&
            "actorIds" in fact.event.acceptedIntent &&
            fact.event.acceptedIntent.actorIds.includes(id)
        );
        return sameDestination && changedPosition && !replaced;
      });
      expect(completedMovementEvidence || ongoingMovementEvidence).toBe(true);
      const position = (tick: number, id: string) => {
        const value = samples
          .find((sample) => sample.tick === tick)
          ?.observed.find((actor) => actor.id === id)?.position;
        return value?.status === "known" ? value.value : undefined;
      };
      const moved = (id: string, fromTick: number, toTick: number) => {
        const from = position(fromTick, id),
          to = position(toTick, id);
        return from && to ? Math.hypot(to.x - from.x, to.y - from.y) : 0;
      };
      expect(initialIds.some((id) => moved(id, 80, 120) >= 1)).toBe(true);
      expect(reserveIds.some((id) => moved(id, 20, 140) >= 5)).toBe(true);
      expect(reserveIds.some((id) => moved(id, 120, 200) >= 2)).toBe(true);
      expect(
        authority.opponentDamage.some(
          (fact) =>
            fact.kind === "native_damage" &&
            fact.tick >= 140 &&
            fact.damage.amount > 0 &&
            fact.damage.initiator?.actorId != null &&
            [...initialIds, ...reserveIds].includes(fact.damage.initiator.actorId) &&
            fact.damage.target.actorId != null &&
            enemyIds.includes(fact.damage.target.actorId)
        )
      ).toBe(true);
      if (mixed) {
        const airIds = [roles["own-reserve-6"], roles["own-reserve-7"]];
        const groundIds = [...initialIds, ...reserveIds.filter((id) => !airIds.includes(id))];
        for (const group of [airIds, groundIds]) {
          expect(
            authority.opponentDamage.some(
              (fact) =>
                fact.kind === "native_damage" &&
                fact.tick >= 140 &&
                fact.damage.amount > 0 &&
                group.includes(fact.damage.initiator?.actorId ?? "") &&
                enemyIds.includes(fact.damage.target.actorId ?? "")
            )
          ).toBe(true);
        }
      }
    }
  );
