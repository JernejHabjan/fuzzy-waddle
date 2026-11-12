import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { createWriteStream, readFileSync, writeFileSync } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";
import { stringifyChunked } from "@discoveryjs/json-ext";
import { join } from "node:path";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { digestCanonicalAiValue } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/persistence/canonical-ai-serialization";
import type { RuntimeFixture } from "../../contracts/skirmish-ai-runtime-fixture";
import type { AiRuntimeBrowserTestHost } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/browser/ai-runtime-browser-test-host";
import { runVariant } from "../../runner/skirmish-ai-runtime-variant-runner";
import { captureRuntimeHumanAuthority } from "../../capture/skirmish-ai-runtime-human-capture";
import {
  nativeScenarioContext,
  nativeScenarioRequiresResourceCoverage
} from "../../contracts/skirmish-ai-native-scenario-context";
import { nativeWeaponHits } from "../../combat/effects/skirmish-ai-native-combat-effects";

test.skip(process.env.AI_GAMEPLAY_RELIABILITY !== "1", "Explicit bounded gameplay reliability checks only");
test.setTimeout(240_000);

for (const { faction, readyCounter, groundOnly, hidden = false, missingTemple = false } of [
  { faction: "Tivara", readyCounter: false, groundOnly: false },
  { faction: "Tivara", readyCounter: true, groundOnly: false },
  { faction: "Skaduwee", readyCounter: false, groundOnly: false },
  { faction: "Tivara", readyCounter: false, groundOnly: true },
  { faction: "Tivara", readyCounter: false, groundOnly: false, hidden: true },
  { faction: "Tivara", readyCounter: false, groundOnly: false, missingTemple: true }
] as const) {
  const title = missingTemple
    ? "three-flyer raid builds missing counter infrastructure and produces counters"
    : hidden
      ? "flyers do not request anti-air before discovery"
      : groundOnly
        ? "ground-only raid does not request anti-air"
        : `three-flyer raid produces and uses compatible ${faction} counters (ready counter=${readyCounter})`;
  test(title, async ({ browser }, testInfo) => {
    const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
    const source = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    const original: RuntimeFixture = JSON.parse(
      readFileSync(
        join(
          root,
          "tools/probable-waffle/skirmish/ai/testing/fixtures/native/technology/technology-native-gameplay.json"
        ),
        "utf8"
      )
    );
    const selected = original.recipe.variants.find((variant) => variant.id === "technology-air-four");
    if (!selected?.presetWorld) throw new Error("air_counter_fixture_missing");
    const raiders = selected.presetWorld.actors
      .filter((actor) => actor.fixtureActorId.startsWith("flyer-"))
      .slice(0, 3)
      .map((actor, index) => {
        if (hidden) return { ...actor, position: { x: -768, y: 800 + 64 * index, z: 0 } };
        return groundOnly ? { ...actor, actorName: ObjectNames.SkaduweeWarriorMale } : actor;
      });
    const counter = faction === "Tivara" ? ObjectNames.TivaraSlingshotFemale : ObjectNames.SkaduweeRangedFemale;
    const skaduweeEquivalents = new Map<ObjectNames, ObjectNames>([
      [ObjectNames.AnkGuard, ObjectNames.InfantryInn],
      [ObjectNames.Olival, ObjectNames.Emberstone],
      [ObjectNames.TivaraWorkerMale, ObjectNames.SkaduweeWorkerMale],
      [ObjectNames.TivaraMacemanMale, ObjectNames.SkaduweeWarriorMale]
    ]);
    const variant = {
      ...selected,
      aiFaction: faction,
      id: `gameplay-three-air-${readyCounter ? "ready" : "unready"}`,
      captureConstruction: true as const,
      captureCombat: true as const,
      presetWorld: {
        ...selected.presetWorld,
        existingActorBindings: selected.presetWorld.existingActorBindings?.map((binding) =>
          faction === "Skaduwee" && binding.owner === 2 && binding.actorName === ObjectNames.Sandhold
            ? { ...binding, actorName: ObjectNames.FrostForge }
            : binding
        ),
        fixtureId: `gameplay-three-air-${readyCounter ? "ready" : "unready"}`,
        actors: [
          ...selected.presetWorld.actors
            .filter((actor) => !actor.fixtureActorId.startsWith("flyer-"))
            .filter((actor) => !missingTemple || actor.actorName !== ObjectNames.Temple)
            .filter((actor) => faction === "Tivara" || actor.actorName !== ObjectNames.Temple)
            .map((actor) =>
              faction === "Skaduwee" && actor.owner === 2
                ? { ...actor, actorName: skaduweeEquivalents.get(actor.actorName as ObjectNames) ?? actor.actorName }
                : actor
            ),
          ...raiders,
          ...(readyCounter
            ? [
                {
                  fixtureActorId: "ready-counter",
                  actorName: counter,
                  owner: 2,
                  position: { x: 896, y: 736, z: 0 }
                }
              ]
            : [])
        ],
        controls: hidden
          ? []
          : raiders.map((actor, index) => ({
              id: `air-raid-${index}`,
              producerFixtureActorId: actor.fixtureActorId,
              requestTick: 100,
              applicationTick: 100,
              action: { kind: "attack" as const, targetFixtureActorId: `worker-${index + 1}` }
            }))
      }
    };
    // Building a missing Temple delays the first counter until tick 879; leave time for it to reach combat.
    const finalTick = missingTemple ? 1200 : 1000;
    const fixture: RuntimeFixture = {
      ...original,
      assertions: missingTemple
        ? Object.fromEntries(
            Object.entries(original.assertions).map(([id, assertion]) => [id, { ...assertion, maximumTick: finalTick }])
          )
        : original.assertions,
      recipe: {
        ...original.recipe,
        simulationTimeScale: 1,
        fixedStepFrames: true,
        checkpointTicks: missingTemple
          ? [...original.recipe.checkpointTicks, finalTick]
          : original.recipe.checkpointTicks,
        variants: [variant]
      }
    };
    const fixtureDigest = digestCanonicalAiValue({ fixture, variant });
    let opponentCapture: Awaited<ReturnType<typeof captureRuntimeHumanAuthority>> | undefined;
    const result = await runVariant(
      browser,
      fixture,
      variant,
      selected.seed,
      ["TECH-03"],
      source,
      fixtureDigest,
      async (page, index) => {
        if (index === -1) {
          await captureRuntimeHumanAuthority(page, 1, finalTick);
          await page.evaluate(
            ({ roles, groundOnly }) => {
              const host = (window as unknown as { __fuzzyWaddleAiRuntimeBrowserTest?: AiRuntimeBrowserTestHost })
                .__fuzzyWaddleAiRuntimeBrowserTest;
              const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map"));
              if (!scene || !host?.presetApplication) throw new Error("air_counter_native_setup_missing");
              for (const role of roles) {
                const id = host.presetApplication.createdActorIds[role];
                const actor = scene.children.getChildren().find((entry) => {
                  const data = entry.getData("actorData") as
                    | { components: Map<{ name: string }, { id?: string }> }
                    | undefined;
                  return (
                    data &&
                    [...data.components.entries()].some(
                      ([token, value]) => token.name === "IdComponent" && value.id === id
                    )
                  );
                });
                const components = actor?.getData("actorData")?.components as
                  | Map<unknown, { flightDefinition?: { height: number } }>
                  | undefined;
                const flies =
                  components && [...components.values()].some((value) => (value.flightDefinition?.height ?? 0) > 0);
                if (!components || flies === groundOnly)
                  throw new Error(`air_counter_unexpected_flight_capability:${role}:${actor?.name}`);
              }
            },
            { roles: raiders.map((actor) => actor.fixtureActorId), groundOnly }
          );
        }
        if (index === fixture.recipe.checkpointTicks.length - 1)
          opponentCapture = await captureRuntimeHumanAuthority(page, 1);
      }
    );
    const full = { ...result, opponentCapture };
    // Use the existing combat coverage policy; production still requires its separate complete queue authority below.
    const context = nativeScenarioContext(full, finalTick, undefined, {
      requireResourceCoverage: nativeScenarioRequiresResourceCoverage("DOMAIN-06")
    });
    const counterEffects = new Set(
      result.productionEvidenceV2?.decisions.flatMap((decision) =>
        decision.result.acceptedIntents
          .filter((intent) => intent.kind === "produce" && intent.demandId === "demand:adapt:anti_air")
          .map((intent) => intent.effectId.replace(/^effect:/, ""))
      ) ?? []
    );
    const counters =
      result.productionEvidenceV2?.lifecycle.queues.filter(
        (event) =>
          event.kind === "complete" &&
          event.productKey === counter &&
          event.createdActorId &&
          counterEffects.has(event.effectId)
      ) ?? [];
    const produced = new Set(counters.map((event) => event.createdActorId));
    const raiderIds = new Set(raiders.map((actor) => result.presetCreatedActorIds[actor.fixtureActorId]));
    const decisions = result.productionEvidenceV2?.decisions ?? [];
    const counterBuildingIntents = decisions
      .flatMap((decision) => decision.result.acceptedIntents)
      .filter(
        (intent) =>
          intent.kind === "construct" &&
          intent.objectName === ObjectNames.Temple &&
          intent.reasonCode.startsWith("counter_infrastructure:")
      );
    const firstSighting = decisions.find((decision) =>
      decision.result.input?.observation?.actors.some(
        (actor) => raiderIds.has(actor.actorId) && actor.relation === "enemy" && actor.visibility === "visible"
      )
    )?.inputTick;
    const observedRaiders = new Set(
      result.productionEvidenceV2?.decisions.flatMap(
        (decision) =>
          decision.result.input?.observation?.actors
            .filter(
              (actor) =>
                raiderIds.has(actor.actorId) &&
                actor.relation === "enemy" &&
                actor.visibility === "visible" &&
                (groundOnly || actor.capabilities.some((capability) => capability.domains.includes("air")))
            )
            .map((actor) => actor.actorId) ?? []
      ) ?? []
    );
    const hits = nativeWeaponHits(context).filter((fact) => raiderIds.has(fact.damage.target.actorId ?? ""));
    const producedHits = hits.filter((fact) => produced.has(fact.damage.initiator?.actorId ?? ""));
    const readyId = result.presetCreatedActorIds["ready-counter"];
    const readyHits = hits.filter((fact) => fact.damage.initiator?.actorId === readyId);
    const readyTrace =
      readyCounter && readyId
        ? context.frames.map((frame) => {
            const defender = frame.tacticalBoundary?.actors.find((actor) => actor.identity.actorId === readyId);
            const squads = frame.decision.missionState?.squads.filter((squad) => squad.actorIds.includes(readyId)) ?? [];
            return {
              tick: frame.tick,
              actor: defender
                ? {
                    tile: defender.tile,
                    visible: defender.visible,
                    health: defender.health,
                    alive: defender.identity.alive
                  }
                : null,
              observedOrder: frame.decision.input?.observation?.actors.find((actor) => actor.actorId === readyId)
                ?.activeOrder,
              targets: (frame.tacticalBoundary?.actors ?? [])
                .filter((actor) => raiderIds.has(actor.identity.actorId))
                .map((actor) => ({ id: actor.identity.actorId, tile: actor.tile, alive: actor.identity.alive })),
              squads: squads.map((squad) => ({ role: squad.role, objectiveId: squad.objectiveId, state: squad.state })),
              intents: frame.decision.acceptedIntents
                .filter((intent) => intent.actorIds?.includes(readyId))
                .map((intent) => ({
                  kind: intent.kind,
                  targetActorId: "targetActorId" in intent ? intent.targetActorId : undefined,
                  logicalPosition: "logicalPosition" in intent ? intent.logicalPosition : undefined
                }))
            };
          })
        : [];
    const readyAttackOps =
      readyCounter && readyId
        ? (result.productionCapture?.facts ?? [])
            .flatMap((fact) => {
              if (
                fact.kind !== "native_combat" ||
                fact.operation.actor.actorId !== readyId ||
                (fact.operation.kind !== "attack_requested" && fact.operation.kind !== "attack_committed")
              )
                return [];
              return [
                {
                  tick: fact.tick,
                  kind: fact.operation.kind,
                  target: fact.operation.target.actorId,
                  actorTile: fact.operation.actorTile,
                  targetTile: fact.operation.targetTile,
                  distance: fact.operation.distance,
                  weapon: fact.operation.weapon.weaponType
                }
              ];
            })
        : [];
    const readyRouteOrders =
      readyCounter && readyId
        ? (result.productionCapture?.facts ?? []).flatMap((fact) =>
            fact.kind === "spatial_authority" &&
            fact.spatial.kind === "route_order" &&
            fact.spatial.source.actorId === readyId
              ? [
                  {
                    tick: fact.tick,
                    orderType: fact.spatial.order.orderType,
                    targetId: fact.spatial.order.target?.actorId,
                    targetTile: fact.spatial.order.targetTile
                  }
                ]
              : []
          )
        : [];
    const { productionCausality, ...retained } = full;
    void productionCausality;
    console.log(
      "GAMEPLAY_AIR_COUNTER",
      JSON.stringify({
        source,
        groundOnly,
        hidden,
        missingTemple,
        counterBuildings: counterBuildingIntents.length,
        firstSighting,
        observedRaiders: observedRaiders.size,
        emergencyOrders: counterEffects.size,
        readyCounter,
        counters: counters.length,
        compatibleHits: hits.length,
        producedHits: producedHits.length,
        readyHits: readyHits.length,
        readyTrace,
        readyAttackOps,
        readyRouteOrders,
        failures: context.failures,
        gaps: result.productionEvidenceV2?.gaps,
        errors: result.aiErrors
      })
    );
    if (readyTrace.length)
      writeFileSync(
        testInfo.outputPath("ready-counter-trace.json"),
        JSON.stringify({ decisions: readyTrace, attacks: readyAttackOps, orders: readyRouteOrders })
      );
    await pipeline(
      Readable.from(stringifyChunked({ source, fixtureDigest, readyCounter, result: retained })),
      createGzip(),
      createWriteStream(testInfo.outputPath("air-counter-runtime.json.gz"))
    );
    expect(result.aiErrors).toEqual([]);
    expect(context.failures).toEqual([]);
    expect(result.productionEvidenceV2?.gaps).toEqual([]);
    expect(result.productionEvidenceV2?.failures).toEqual([]);
    expect(result.productionEvidenceV2?.lifecycle.gaps).toEqual([]);
    expect(result.productionEvidenceV2?.lifecycle.failures).toEqual([]);
    expect(observedRaiders.size, "all raiders are eventually observed through fair input").toBe(3);
    if (missingTemple) expect(counterBuildingIntents.length, "the AI orders its missing prerequisite").toBe(1);
    if (hidden) {
      expect(firstSighting, "flyers remain unseen through the opening").toBeGreaterThan(400);
      expect(
        decisions
          .filter((decision) => decision.inputTick < (firstSighting ?? Infinity))
          .flatMap((decision) => decision.result.acceptedIntents)
          .filter((intent) => intent.kind === "produce" && intent.demandId === "demand:adapt:anti_air")
      ).toEqual([]);
      expect(counters.length, "discovered flyers trigger actual production").toBeGreaterThan(0);
      return;
    }
    if (groundOnly) {
      expect(counterEffects.size, "no visible air threat must yield no emergency anti-air orders").toBe(0);
      const defenseEffects = new Set(
        context.frames.flatMap(({ decision }) =>
          decision.acceptedIntents
            .filter((intent) => intent.kind === "attack" && intent.planId === "plan:squad:defense:home")
            .map((intent) => intent.effectId.replace(/^effect:/, ""))
        )
      );
      const applied = new Set<string>();
      const lastOrders = new Map<string, { commandId?: string; targetId?: string | null }>();
      const weaponHitSequences = new Set(hits.filter(({ tick }) => tick >= 100).map(({ sequence }) => sequence));
      const defendedRaiders = new Set<string>();
      let defenseHits = 0;
      for (const fact of context.facts) {
        if (
          fact.kind === "outcome" &&
          fact.outcome.kind === "applied" &&
          defenseEffects.has(fact.outcome.effectId ?? "")
        ) {
          applied.add(fact.outcome.commandId);
        } else if (fact.kind === "spatial_authority" && fact.spatial.kind === "route_order") {
          const { source, order } = fact.spatial;
          if (source.playerNumber === 2 && source.actorId) {
            lastOrders.set(source.actorId, {
              commandId: order.commandContext?.execution.commandId,
              targetId: order.orderType === "Attack" ? order.target?.actorId : undefined
            });
          }
        } else if (fact.kind === "native_damage" && weaponHitSequences.has(fact.sequence)) {
          const order = lastOrders.get(fact.damage.initiator?.actorId ?? "");
          const targetId = fact.damage.target.actorId;
          if (targetId && order?.targetId === targetId && order.commandId && applied.has(order.commandId)) {
            defendedRaiders.add(targetId);
            defenseHits++;
          }
        }
      }
      console.log("GAMEPLAY_GROUND_DEFENSE", JSON.stringify({ defenseHits, raidersHit: defendedRaiders.size }));
      expect(
        defendedRaiders.size,
        "applied home-defense orders produce weapon hits on multiple raiders"
      ).toBeGreaterThan(1);
      return;
    }
    expect(counters.length, "actual completed anti-air production").toBeGreaterThan(0);
    expect(producedHits.length, "newly produced counter physically damages the real flying attackers").toBeGreaterThan(
      0
    );
    if (readyCounter) expect(readyHits.length, "the existing compatible defender is actually used").toBeGreaterThan(0);
  });
}
