import {
  CampaignMissionOutcome,
  type CampaignMissionOwnedResourceRuntimeState,
  type CampaignMissionRuntimeState,
  type CampaignVictoryCommitRequest
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionActionDefinition } from "../contracts/mission-action-definition";
import type { MissionConditionDefinition, MissionNumericComparison } from "../contracts/mission-condition-definition";
import type {
  CampaignMissionActionContext,
  CampaignMissionActionResult,
  CampaignWorldActionAdapter
} from "../runtime/actions/campaign-action-runtime";
import type {
  CampaignEncounterSpawnResult,
  CampaignEncounterWorldAdapter
} from "../runtime/encounters/campaign-encounter-service";
import type { MissionEncounterSpawnGroupDefinition } from "../contracts/mission-encounter-definition";
import type { CampaignWorldConditionAdapter } from "../runtime/conditions/campaign-condition-evaluator";
import { CampaignMissionTestHarness } from "../tooling/campaign-mission-test-harness";
import {
  ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID,
  AOTA_CAMPAIGN_CONTENT_REGISTRY,
  AOTA_CAMPAIGN_MISSIONS,
  AOTA_CAMPAIGN_REWARDS
} from "./ashes-of-the-ancients-content";
import { AOTA_CAMPAIGN_PROGRESSION_REGISTRY } from "./ashes-of-the-ancients-progression";
import { createInitialCampaignProgressionProfile } from "../progression/campaign-progression-resolver";
import { CampaignRewardCommitService } from "../progression/campaign-reward-commit-service";

describe("Cyclops & Sheep playable mission", () => {
  it.each(["story", "normal", "hard"] as const)(
    "completes the narrated, checkpointable main path on %s difficulty",
    (difficulty) => {
      const result = completeRiverCrossing({ difficulty, skipped: false, roundTrip: true });

      expect(result.state.status).toBe("victory");
      expect(result.state.facts["mission-complete"]).toBe(true);
      expect(result.state.facts["cyclops-fooled"]).toBe(true);
      expect(result.state.missionItems).toEqual({ "boar-tusk": 0, shears: 0, "sheep-wool": 0 });
      expect(result.state.claimedRewardIds).toEqual(["unlock-snow-wendigo-and-fire"]);
      expect(result.state.claimedCheckpointIds).toEqual([
        "before-counterattack",
        "bridge-won",
        "companions-rescued",
        "disguise-prepared",
        "frogs-delivered",
        "tusks-acquired"
      ]);
      expect(result.state.objectives["complete-river-crossing"]?.status).toBe("completed");
      expect(result.state.objectives["learn-carry"]?.status).toBe("completed");
      expect(result.state.objectives["learn-melee"]?.status).toBe("completed");
      expect(result.state.objectives["learn-shearing"]?.status).toBe("completed");
      expect(result.state.objectives["learn-stealth"]?.status).toBe("completed");
      expect(result.world.owners.get("captive-maceman-a")).toBe(1);
      expect(result.world.owners.get("captive-maceman-b")).toBe(1);
      expect(result.world.disguisedActors.size).toBe(0);
      expect(result.state.ownedResources["disguise:party-sheep-disguise"]).toBeUndefined();
    }
  );

  it("preserves early optional completion and its one-time reward", () => {
    const world = new RiverCrossingHarnessWorld();
    world.alive.set("corpy-nest", false);
    const harness = createHarness(world, "normal");

    harness.start();
    harness.advance(1);

    expect(harness.snapshot().facts["nest-destroyed"]).toBe(true);
    expect(harness.snapshot().objectives["optional-destroy-corpy-nest"]?.status).toBe("completed");
    expect(harness.snapshot().claimedRewardIds).toEqual(["riverland-crystal"]);
    expect(harness.roundTrip().claimedRewardIds).toEqual(["riverland-crystal"]);
  });

  it("fails forward after early Cyclops detection", () => {
    const { harness, world } = reachBoarPhase("hard");
    world.cyclopsNear = true;

    harness.advance(1);

    expect(harness.snapshot().facts["cyclops-detected"]).toBe(true);
    expect(harness.snapshot().status).toBe("running");
    expect(world.teleports.get("tivara-protagonist")).toBe("hero-recovery-point");
  });

  it("defeats the mission when the protagonist dies", () => {
    const world = new RiverCrossingHarnessWorld();
    const harness = createHarness(world, "normal");
    harness.start();
    world.alive.set("tivara-protagonist", false);

    harness.advance(1);

    expect(harness.snapshot().facts["mission-failed"]).toBe(true);
    expect(harness.snapshot().status).toBe("defeat");
    expect(harness.snapshot().objectives["protagonist-survival"]?.status).toBe("active");
  });

  it("restores critical quest actors and acquired items instead of softlocking", () => {
    const world = new RiverCrossingHarnessWorld();
    const harness = createHarness(world, "normal");
    harness.start();
    finishCinematic(harness, "pond-intro-cinematic", false);
    world.alive.set("dry-frog-a", false);

    harness.advance(1);

    expect(world.alive.get("dry-frog-a")).toBe(true);
    expect(world.teleports.get("dry-frog-a")).toBe("frog-fallback-point");

    const boar = reachBoarPhase("normal");
    boar.world.alive.set("tusk-boar", false);
    boar.harness.advance(1);
    const damaged = boar.harness.snapshot();
    damaged.missionItems = { "boar-tusk": 1, shears: 0 };
    const restored = createHarness(boar.world, "normal", damaged);
    restored.advance(damaged.integrity.lastProcessedTick + 31);

    expect(restored.snapshot().missionItems).toMatchObject({ "boar-tusk": 2, shears: 1 });
  });

  it("produces equivalent gameplay state when every cinematic is skipped", () => {
    const watched = gameplayProjection(completeRiverCrossing({ difficulty: "normal", skipped: false }).state);
    const skipped = gameplayProjection(completeRiverCrossing({ difficulty: "normal", skipped: true }).state);

    expect(skipped).toEqual(watched);
  });

  it("commits story and optional rewards once and rejects replay playback", () => {
    const service = new CampaignRewardCommitService(AOTA_CAMPAIGN_PROGRESSION_REGISTRY);
    const initial = createInitialCampaignProgressionProfile(AOTA_CAMPAIGN_PROGRESSION_REGISTRY);
    const bundle = AOTA_CAMPAIGN_REWARDS[1]!;
    const request: CampaignVictoryCommitRequest = {
      runId: "cyclops-first-victory",
      missionId: "cyclops-and-sheep",
      missionRevision: 1,
      baseProfileRevision: initial.revision,
      discoveredRewardIds: ["riverland-crystal", "unlock-snow-wendigo-and-fire"],
      completedObjectiveIds: ["complete-river-crossing", "optional-destroy-corpy-nest"],
      difficulty: "normal",
      outcome: CampaignMissionOutcome.Victory,
      replayPlayback: false,
      integrity: { eligibleForRewards: true, invalidationReasons: [] }
    };

    const first = service.commit("profile", initial, request, bundle);
    const later = service.commit(
      "profile",
      first.profile,
      { ...request, runId: "cyclops-later-victory", baseProfileRevision: first.profile.revision },
      bundle
    );
    const replay = service.commit(
      "profile",
      first.profile,
      {
        ...request,
        runId: "cyclops-replay",
        baseProfileRevision: first.profile.revision,
        replayPlayback: true
      },
      bundle
    );

    expect(first.profile.unlockIds).toContain("mission-snow-wendigo-and-fire");
    expect(first.profile.wallet.balances["campaign-crystal"]).toBe(2);
    expect(first.profile.rewardClaimIds).toEqual([
      "cyclops-and-sheep:riverland-crystal",
      "cyclops-and-sheep:unlock-snow-wendigo-and-fire"
    ]);
    expect(later.appliedRewardIds).toEqual([]);
    expect(replay.status).toBe("rejected");
  });
});

function completeRiverCrossing(options: {
  readonly difficulty: "story" | "normal" | "hard";
  readonly skipped: boolean;
  readonly roundTrip?: boolean;
}): { readonly state: CampaignMissionRuntimeState; readonly world: RiverCrossingHarnessWorld } {
  const world = new RiverCrossingHarnessWorld();
  const harness = createHarness(world, options.difficulty);

  expect(harness.start().activeCinematicId).toBe("pond-intro-cinematic");
  roundTripActiveCinematic(harness, options.roundTrip);
  finishCinematic(harness, "pond-intro-cinematic", options.skipped);

  world.enter("frog-pickup-region");
  harness.advance(1);
  expect(harness.snapshot().ownedResources["quest-carry:dry-frog-a"]?.kind).toBe("quest-carry");
  expect(harness.snapshot().ownedResources["quest-carry:dry-frog-b"]?.kind).toBe("quest-carry");
  if (options.roundTrip) harness.roundTrip();
  world.leave("frog-pickup-region");
  world.enter("frog-drop-region");
  harness.advance(1);
  expect(harness.snapshot().activeCinematicId).toBe("bridge-reveal-cinematic");
  roundTripActiveCinematic(harness, options.roundTrip);
  finishCinematic(harness, "bridge-reveal-cinematic", options.skipped);

  harness.advance(100);
  world.alive.set("bridge-guardian", false);
  world.killEncounter("bridge-blockers");
  harness.advance(2);
  world.enter("captive-rescue-region");
  harness.advance(1);
  advanceUntil(harness, (state) => state.activeCinematicId === "cyclops-warning-cinematic");
  expect(harness.snapshot().activeCinematicId).toBe("cyclops-warning-cinematic");
  roundTripActiveCinematic(harness, options.roundTrip);
  finishCinematic(harness, "cyclops-warning-cinematic", options.skipped);
  advanceUntil(harness, (state) => state.activePhaseIds.includes("boar-tusks"));

  world.alive.set("tusk-boar", false);
  advanceUntil(harness, (state) => state.facts["tusks-acquired"] === true);
  world.enter("sheep-clearing-region");
  advanceUntil(harness, (state) => state.activeCinematicId === "sheep-clearing-cinematic");
  expect(harness.snapshot().activeCinematicId).toBe("sheep-clearing-cinematic");
  roundTripActiveCinematic(harness, options.roundTrip);
  finishCinematic(harness, "sheep-clearing-cinematic", options.skipped);
  harness.advance(220);
  world.killEncounter("corpy-counterattack");
  advanceUntil(harness, (state) => state.activePhaseIds.includes("prepare-disguise"));

  world.enter("disguise-preparation-region");
  advanceUntil(harness, (state) => state.facts["disguise-prepared"] === true);
  expect(harness.snapshot().ownedResources["disguise:party-sheep-disguise"]?.kind).toBe("disguise");
  if (options.roundTrip) harness.roundTrip();
  world.enter("cyclops-fool-region");
  advanceUntil(harness, (state) => state.activeCinematicId === "cyclops-fooled-cinematic");
  expect(harness.snapshot().activeCinematicId).toBe("cyclops-fooled-cinematic");
  roundTripActiveCinematic(harness, options.roundTrip);
  finishCinematic(harness, "cyclops-fooled-cinematic", options.skipped);
  advanceUntil(harness, (state) => state.activeCinematicId === "mission-outro-cinematic");
  expect(harness.snapshot().activeCinematicId).toBe("mission-outro-cinematic");
  roundTripActiveCinematic(harness, options.roundTrip);
  finishCinematic(harness, "mission-outro-cinematic", options.skipped);
  advanceUntil(harness, (state) => state.status === "victory");

  return { state: harness.snapshot(), world };
}

function reachBoarPhase(difficulty: "story" | "normal" | "hard"): {
  readonly harness: CampaignMissionTestHarness;
  readonly world: RiverCrossingHarnessWorld;
} {
  const world = new RiverCrossingHarnessWorld();
  const harness = createHarness(world, difficulty);
  harness.start();
  finishCinematic(harness, "pond-intro-cinematic", false);
  world.enter("frog-pickup-region");
  harness.advance(1);
  world.leave("frog-pickup-region");
  world.enter("frog-drop-region");
  harness.advance(1);
  finishCinematic(harness, "bridge-reveal-cinematic", false);
  harness.advance(100);
  world.alive.set("bridge-guardian", false);
  world.killEncounter("bridge-blockers");
  harness.advance(2);
  world.enter("captive-rescue-region");
  harness.advance(1);
  advanceUntil(harness, (state) => state.activeCinematicId === "cyclops-warning-cinematic");
  finishCinematic(harness, "cyclops-warning-cinematic", false);
  advanceUntil(harness, (state) => state.activePhaseIds.includes("boar-tusks"));
  return { harness, world };
}

function createHarness(
  world: RiverCrossingHarnessWorld,
  difficulty: "story" | "normal" | "hard",
  restored?: CampaignMissionRuntimeState
): CampaignMissionTestHarness {
  return new CampaignMissionTestHarness(ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID, AOTA_CAMPAIGN_MISSIONS[1]!, restored, {
    actionAdapter: world,
    conditionAdapter: world,
    encounterAdapter: world,
    dialogue: AOTA_CAMPAIGN_CONTENT_REGISTRY.getDialogue("cyclops-and-sheep"),
    difficulty
  });
}

function finishCinematic(
  harness: CampaignMissionTestHarness,
  cinematicId: string,
  skipped: boolean
): CampaignMissionRuntimeState {
  return harness.emit({
    kind: "cinematic.finished",
    sourceId: cinematicId,
    payload: { cinematicId, skipped }
  });
}

function roundTripActiveCinematic(harness: CampaignMissionTestHarness, enabled: boolean | undefined): void {
  if (!enabled) return;
  const cinematicId = harness.snapshot().activeCinematicId;
  expect(cinematicId).toBeDefined();
  expect(harness.roundTrip().activeCinematicId).toBe(cinematicId);
}

function advanceUntil(
  harness: CampaignMissionTestHarness,
  predicate: (state: CampaignMissionRuntimeState) => boolean,
  maximumTicks = 8
): CampaignMissionRuntimeState {
  for (let tick = 0; tick <= maximumTicks; tick += 1) {
    const state = harness.snapshot();
    if (predicate(state)) return state;
    harness.advance(1);
  }
  const state = harness.snapshot();
  throw new Error(
    `Mission state did not settle within ${maximumTicks} ticks: ${JSON.stringify({
      status: state.status,
      activePhaseIds: state.activePhaseIds,
      facts: state.facts,
      encounters: state.encounters,
      activeCinematicId: state.activeCinematicId,
      actionContinuations: state.actionContinuations,
      diagnostic: state.integrity.diagnostic
    })}`
  );
}

function gameplayProjection(state: CampaignMissionRuntimeState): unknown {
  return {
    status: state.status,
    activePhaseIds: state.activePhaseIds,
    completedPhaseIds: state.completedPhaseIds,
    facts: state.facts,
    counters: state.counters,
    missionItems: state.missionItems,
    objectives: state.objectives,
    encounters: state.encounters,
    activeControlPlayerNumber: state.activeControlPlayerNumber,
    claimedCheckpointIds: state.claimedCheckpointIds,
    claimedRewardIds: state.claimedRewardIds,
    rewardIntegrity: state.rewardIntegrity
  };
}

class RiverCrossingHarnessWorld
  implements CampaignWorldActionAdapter, CampaignWorldConditionAdapter, CampaignEncounterWorldAdapter
{
  readonly alive = new Map<string, boolean>();
  readonly owners = new Map<string, number>();
  readonly regions = new Set<string>();
  readonly teleports = new Map<string, string>();
  readonly disguisedActors = new Set<string>();
  readonly encounterActorIds = new Map<string, string[]>();
  readonly restoredResourceIds = new Set<string>();
  cyclopsNear = false;

  constructor() {
    for (const actorId of [
      "bridge-guardian",
      "corpy-nest",
      "dry-frog-a",
      "dry-frog-b",
      "mission-sheep-a",
      "mission-sheep-b",
      "mission-sheep-c",
      "pond-frog-c",
      "pond-frog-d",
      "roaming-cyclops",
      "tivara-protagonist",
      "tusk-boar"
    ]) {
      this.alive.set(actorId, true);
      this.owners.set(actorId, 1);
    }
  }

  enter(regionId: string): void {
    this.regions.add(regionId);
  }

  leave(regionId: string): void {
    this.regions.delete(regionId);
  }

  killEncounter(encounterId: string): void {
    for (const actorId of this.encounterActorIds.get(encounterId) ?? []) this.alive.set(actorId, false);
  }

  execute(context: CampaignMissionActionContext, definition: MissionActionDefinition): CampaignMissionActionResult {
    if (definition.kind === "start-cinematic" && definition.presentationOnly) {
      return context.state.cinematics[definition.cinematicId]?.finalizeRequested
        ? { status: "completed" }
        : { status: "waiting", continuationState: { cinematicId: definition.cinematicId } };
    }
    if (definition.kind === "spawn-set") {
      for (const actor of definition.actors) {
        if (!actor.scenarioRoleId) continue;
        this.alive.set(actor.scenarioRoleId, true);
        this.owners.set(actor.scenarioRoleId, actor.ownerPlayerNumber ?? 0);
      }
    } else if (definition.kind === "convert-owner") {
      this.owners.set(definition.actorId, definition.ownerPlayerNumber);
    } else if (definition.kind === "carry-actor") {
      return {
        status: "completed",
        ownedResources: [
          {
            resourceId: `quest-carry:${definition.actorId}`,
            kind: "quest-carry",
            state: { actorId: definition.actorId, carrierActorId: definition.carrierActorId }
          }
        ]
      };
    } else if (definition.kind === "drop-carried-actor") {
      delete context.state.ownedResources[`quest-carry:${definition.actorId}`];
      this.teleports.set(definition.actorId, definition.pointId);
    } else if (definition.kind === "apply-disguise") {
      for (const actorId of definition.actorIds) this.disguisedActors.add(actorId);
      return {
        status: "completed",
        ownedResources: [
          {
            resourceId: `disguise:${definition.disguiseId}`,
            kind: "disguise",
            state: { disguiseId: definition.disguiseId, actorIds: definition.actorIds }
          }
        ]
      };
    } else if (definition.kind === "remove-disguise") {
      delete context.state.ownedResources[`disguise:${definition.disguiseId}`];
      this.disguisedActors.clear();
    } else if (definition.kind === "teleport-actor") {
      this.teleports.set(definition.actorId, definition.pointId);
    } else if (definition.kind === "revive-actor") {
      this.alive.set(definition.actorId, true);
    }
    return { status: "completed" };
  }

  resume(context: CampaignMissionActionContext, definition: MissionActionDefinition): CampaignMissionActionResult {
    return definition.kind === "start-cinematic" && context.state.cinematics[definition.cinematicId]?.finalizeRequested
      ? { status: "completed" }
      : { status: "waiting", continuationState: { waiting: true } };
  }

  restoreOwnedResources(resources: readonly CampaignMissionOwnedResourceRuntimeState[]): void {
    for (const resource of resources) this.restoredResourceIds.add(resource.resourceId);
  }

  evaluate(context: { readonly state: CampaignMissionRuntimeState }, definition: MissionConditionDefinition): boolean {
    switch (definition.kind) {
      case "difficulty":
        return definition.values.includes(context.state.difficulty.difficulty);
      case "actor-exists":
        return this.alive.has(definition.actorId);
      case "actor-alive":
        return this.alive.get(definition.actorId) === true;
      case "actor-owner":
        return this.owners.get(definition.actorId) === definition.playerNumber;
      case "actor-distance":
        return compare(this.cyclopsNear ? 0 : 10000, definition.comparison, definition.value);
      case "region-occupancy":
        return this.regions.has(definition.regionId);
      case "actor-count":
      case "produced-count":
      case "building-count":
        return compare(0, definition.comparison, definition.value);
      default:
        return false;
    }
  }

  spawnWave(
    encounterId: string,
    _waveId: string,
    groups: readonly MissionEncounterSpawnGroupDefinition[],
    spawnCursor: number
  ): CampaignEncounterSpawnResult {
    const actors = groups.flatMap((group, groupIndex) =>
      group.actors.map((actor, actorIndex) => {
        const actorRuntimeId = `${encounterId}:${spawnCursor + groupIndex + actorIndex}`;
        this.alive.set(actorRuntimeId, true);
        return { actorRuntimeId, ownerPlayerNumber: actor.ownerPlayerNumber };
      })
    );
    this.encounterActorIds.set(
      encounterId,
      actors.map((actor) => actor.actorRuntimeId)
    );
    return { status: "spawned", actors };
  }

  isActorAlive(actorRuntimeId: string): boolean {
    return this.alive.get(actorRuntimeId) === true;
  }
}

function compare(left: number, comparison: MissionNumericComparison, right: number): boolean {
  switch (comparison) {
    case "equal":
      return left === right;
    case "not-equal":
      return left !== right;
    case "less":
      return left < right;
    case "less-or-equal":
      return left <= right;
    case "greater":
      return left > right;
    case "greater-or-equal":
      return left >= right;
  }
}
