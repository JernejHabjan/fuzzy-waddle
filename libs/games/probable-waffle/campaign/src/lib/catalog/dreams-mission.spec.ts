import {
  CampaignMissionOutcome,
  type CampaignMissionRuntimeState,
  type CampaignVictoryCommitRequest
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionActionDefinition } from "../contracts/mission-action-definition";
import type { MissionConditionDefinition } from "../contracts/mission-condition-definition";
import type {
  CampaignMissionActionContext,
  CampaignMissionActionResult,
  CampaignWorldActionAdapter
} from "../runtime/actions/campaign-action-runtime";
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

describe("Dreams playable mission", () => {
  it.each(["story", "normal", "hard"] as const)(
    "completes its deterministic solo path on %s difficulty",
    (difficulty) => {
      const result = completeDream({ difficulty, skipped: false, roundTripCheckpoints: true });

      expect(result.status).toBe("awaiting-outcome");
      expect(result.facts["dream-witnessed"]).toBe(true);
      expect(result.activeControlPlayerNumber).toBe(1);
      expect(result.claimedRewardIds).toEqual(["unlock-cyclops-and-sheep"]);
      expect(result.claimedCheckpointIds).toEqual([
        "after-dream-intro",
        "after-faction-switch",
        "after-tivara-charge",
        "before-volcano-finale"
      ]);
      expect(result.objectives["direct-tivara-army"]?.status).toBe("completed");
      expect(result.objectives["direct-skaduwee-army"]?.status).toBe("completed");
      expect(result.objectives["witness-dream-outcome"]?.status).toBe("completed");
    }
  );

  it("produces equivalent gameplay state when every cinematic is skipped", () => {
    const watched = gameplayProjection(completeDream({ difficulty: "normal", skipped: false }));
    const skipped = gameplayProjection(completeDream({ difficulty: "normal", skipped: true }));

    expect(skipped).toEqual(watched);
  });

  it("declares one pending one-time story unlock without committing a profile in runtime", () => {
    const rewards = AOTA_CAMPAIGN_REWARDS[0]!;
    const reward = rewards.rewards.find((candidate) => candidate.id === "unlock-cyclops-and-sheep");

    expect(reward).toMatchObject({
      kind: "story-unlock",
      oneTime: true,
      unlockId: "mission-cyclops-and-sheep"
    });
    expect(completeDream({ difficulty: "normal", skipped: false }).claimedRewardIds).toEqual([
      "unlock-cyclops-and-sheep"
    ]);
  });

  it("commits the next-mission unlock once and rejects replay playback", () => {
    const service = new CampaignRewardCommitService(AOTA_CAMPAIGN_PROGRESSION_REGISTRY);
    const initial = createInitialCampaignProgressionProfile(AOTA_CAMPAIGN_PROGRESSION_REGISTRY);
    const bundle = AOTA_CAMPAIGN_REWARDS[0]!;
    const request: CampaignVictoryCommitRequest = {
      runId: "dreams-first-victory",
      missionId: "dreams",
      missionRevision: 2,
      baseProfileRevision: initial.revision,
      discoveredRewardIds: ["unlock-cyclops-and-sheep"],
      completedObjectiveIds: ["witness-dream-outcome"],
      difficulty: "normal",
      outcome: CampaignMissionOutcome.Victory,
      replayPlayback: false,
      integrity: { eligibleForRewards: true, invalidationReasons: [] }
    };

    const first = service.commit("profile", initial, request, bundle);
    const replay = service.commit(
      "profile",
      first.profile,
      {
        ...request,
        runId: "dreams-replay",
        baseProfileRevision: first.profile.revision,
        replayPlayback: true
      },
      bundle
    );
    const laterVictory = service.commit(
      "profile",
      first.profile,
      {
        ...request,
        runId: "dreams-later-victory",
        baseProfileRevision: first.profile.revision
      },
      bundle
    );

    expect(first.profile.unlockIds).toContain("mission-cyclops-and-sheep");
    expect(first.profile.rewardClaimIds).toEqual(["dreams:unlock-cyclops-and-sheep"]);
    expect(replay.status).toBe("rejected");
    expect(laterVictory.appliedRewardIds).toEqual([]);
    expect(laterVictory.profile.unlockIds.filter((id) => id === "mission-cyclops-and-sheep")).toHaveLength(1);
  });
});

function completeDream(options: {
  readonly difficulty: "story" | "normal" | "hard";
  readonly skipped: boolean;
  readonly roundTripCheckpoints?: boolean;
}): CampaignMissionRuntimeState {
  const world = new DreamsHarnessWorld();
  const content = AOTA_CAMPAIGN_MISSIONS[0]!;
  const harness = new CampaignMissionTestHarness(ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID, content, undefined, {
    actionAdapter: world,
    conditionAdapter: world,
    dialogue: AOTA_CAMPAIGN_CONTENT_REGISTRY.getDialogue("dreams"),
    difficulty: options.difficulty
  });

  expect(harness.start().activeCinematicId).toBe("dream-intro-cinematic");
  if (options.roundTripCheckpoints) harness.roundTrip();
  finishCinematic(harness, "dream-intro-cinematic", options.skipped);
  if (options.roundTripCheckpoints) harness.roundTrip();

  world.tivaraReachedBattle = true;
  harness.advance(1);
  harness.advance(90);
  expect(harness.snapshot().activeCinematicId).toBe("faction-handoff-cinematic");
  if (options.roundTripCheckpoints) harness.roundTrip();

  finishCinematic(harness, "faction-handoff-cinematic", options.skipped);
  expect(harness.snapshot().activeControlPlayerNumber).toBe(3);
  if (options.roundTripCheckpoints) harness.roundTrip();

  world.skaduweeReachedBattle = true;
  harness.advance(1);
  harness.advance(90);
  harness.advance(180);
  expect(harness.snapshot().activeCinematicId).toBe("volcano-overwhelms-cinematic");
  if (options.roundTripCheckpoints) harness.roundTrip();

  finishCinematic(harness, "volcano-overwhelms-cinematic", options.skipped);
  expect(harness.snapshot().activeCinematicId).toBe("ashes-title-cinematic");
  if (options.roundTripCheckpoints) harness.roundTrip();
  finishCinematic(harness, "ashes-title-cinematic", options.skipped);
  return harness.snapshot();
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

function gameplayProjection(state: CampaignMissionRuntimeState): unknown {
  return {
    status: state.status,
    activePhaseIds: state.activePhaseIds,
    completedPhaseIds: state.completedPhaseIds,
    facts: state.facts,
    counters: state.counters,
    timers: state.timers,
    objectives: state.objectives,
    activeControlPlayerNumber: state.activeControlPlayerNumber,
    claimedCheckpointIds: state.claimedCheckpointIds,
    claimedRewardIds: state.claimedRewardIds,
    rewardIntegrity: state.rewardIntegrity
  };
}

class DreamsHarnessWorld implements CampaignWorldActionAdapter, CampaignWorldConditionAdapter {
  tivaraReachedBattle = false;
  skaduweeReachedBattle = false;

  execute(context: CampaignMissionActionContext, definition: MissionActionDefinition): CampaignMissionActionResult {
    if (definition.kind === "start-cinematic" && definition.presentationOnly) {
      return context.state.cinematics[definition.cinematicId]?.finalizeRequested
        ? { status: "completed" }
        : { status: "waiting", continuationState: { cinematicId: definition.cinematicId } };
    }
    return { status: "completed" };
  }

  resume(context: CampaignMissionActionContext, definition: MissionActionDefinition): CampaignMissionActionResult {
    return definition.kind === "start-cinematic" && context.state.cinematics[definition.cinematicId]?.finalizeRequested
      ? { status: "completed" }
      : { status: "waiting", continuationState: { waiting: true } };
  }

  evaluate(context: { readonly state: CampaignMissionRuntimeState }, definition: MissionConditionDefinition): boolean {
    if (definition.kind === "difficulty") {
      return definition.values.includes(context.state.difficulty.difficulty);
    }
    if (definition.kind !== "region-occupancy") return false;
    const actorIds = definition.selector?.actorIds ?? [];
    if (actorIds.includes("tivara-dream-captain")) return this.tivaraReachedBattle;
    if (actorIds.includes("skaduwee-dream-captain")) return this.skaduweeReachedBattle;
    return false;
  }
}
