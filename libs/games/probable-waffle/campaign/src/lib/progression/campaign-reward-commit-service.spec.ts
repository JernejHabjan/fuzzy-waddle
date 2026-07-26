import {
  CampaignMissionOutcome,
  type CampaignVictoryCommitRequest,
  FactionType,
  ObjectNames,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { asCampaignContentId } from "../contracts/campaign-content-id";
import type { CampaignProgressionDefinitions } from "../contracts/campaign-progression-definition";
import type { MissionRewardBundle, MissionRewardDefinition } from "../contracts/mission-reward-bundle";
import { CampaignProgressionRegistry } from "../registry/campaign-progression-registry";
import { createInitialCampaignProgressionProfile } from "./campaign-progression-resolver";
import { CampaignRewardCommitService } from "./campaign-reward-commit-service";

describe("CampaignRewardCommitService", () => {
  it("commits permanent categories once and returns duplicate requests idempotently", () => {
    const registry = progressionRegistry();
    const service = new CampaignRewardCommitService(registry);
    const profile = createInitialCampaignProgressionProfile(registry);
    const bundle = rewardBundle([
      reward({ kind: "currency", currencyId: "crystal", amount: 2 }),
      reward({ kind: "stat-tome", upgradeId: "health" }, "tome"),
      reward(
        { kind: "unit-unlock", unlockId: asCampaignContentId("maceman"), objectName: ObjectNames.TivaraMacemanMale },
        "unit"
      ),
      reward({ kind: "item", itemDefinitionId: "relic", quantity: 1, consumable: false }, "item")
    ]);
    const request = victoryRequest(bundle.rewards.map((item) => item.id));

    const first = service.commit("profile-1", profile, request, bundle);
    const duplicate = service.commit("profile-1", first.profile, request, bundle);

    expect(first.status).toBe("committed");
    expect(first.profile.wallet.balances.crystal).toBe(3);
    expect(first.profile.permanentUpgradeIds).toContain("health");
    expect(first.profile.unlockIds).toContain("maceman");
    expect(first.profile.inventory).toHaveLength(1);
    expect(duplicate.status).toBe("already-committed");
    expect(duplicate.profile).toEqual(first.profile);
  });

  it("does not persist temporary rewards and rejects defeat, replay, and invalidated runs", () => {
    const registry = progressionRegistry();
    const service = new CampaignRewardCommitService(registry);
    const profile = createInitialCampaignProgressionProfile(registry);
    const bundle = rewardBundle([
      reward({ kind: "temporary-boost", temporaryBoostId: "haste" }),
      reward({ kind: "temporary-resource", resourceType: ResourceType.Wood, amount: 50 }, "wood"),
      reward({ kind: "temporary-unit", objectName: ObjectNames.TivaraMacemanMale, count: 2 }, "reinforcements")
    ]);
    const rewardIds = bundle.rewards.map((item) => item.id);

    const temporary = service.commit("profile-1", profile, victoryRequest(rewardIds), bundle);
    const defeat = service.commit(
      "profile-2",
      profile,
      { ...victoryRequest(rewardIds), runId: "defeat", outcome: CampaignMissionOutcome.Defeat },
      bundle
    );
    const replay = service.commit(
      "profile-3",
      profile,
      { ...victoryRequest(rewardIds), runId: "replay", replayPlayback: true },
      bundle
    );
    const invalid = service.commit(
      "profile-4",
      profile,
      {
        ...victoryRequest(rewardIds),
        runId: "invalid",
        integrity: { eligibleForRewards: false, invalidationReasons: ["developer-command"] }
      },
      bundle
    );

    expect(temporary.profile.wallet).toEqual(profile.wallet);
    expect(temporary.profile.inventory).toEqual([]);
    expect(defeat.status).toBe("rejected");
    expect(replay.status).toBe("rejected");
    expect(invalid.status).toBe("rejected");
  });

  it("rolls back an immediate tome on defeat and persists it on victory", () => {
    const registry = progressionRegistry();
    const service = new CampaignRewardCommitService(registry);
    const profile = createInitialCampaignProgressionProfile(registry);
    const bundle = rewardBundle([reward({ kind: "stat-tome", upgradeId: "health" }, "tome")]);
    const discovered = bundle.rewards.map((item) => item.id);

    const defeat = service.commit(
      "profile-1",
      profile,
      { ...victoryRequest(discovered), runId: "defeat", outcome: CampaignMissionOutcome.Defeat },
      bundle
    );
    const victory = service.commit("profile-1", profile, victoryRequest(discovered), bundle);

    expect(defeat.profile.permanentUpgradeIds).toEqual([]);
    expect(victory.profile.permanentUpgradeIds).toEqual(["health"]);
  });

  it("commits one shared discovery independently for two eligible profiles", () => {
    const registry = progressionRegistry();
    const service = new CampaignRewardCommitService(registry);
    const profile = createInitialCampaignProgressionProfile(registry);
    const bundle = rewardBundle([reward({ kind: "currency", currencyId: "crystal", amount: 1 })]);
    const request = victoryRequest(bundle.rewards.map((item) => item.id));

    const first = service.commit("profile-1", profile, request, bundle);
    const second = service.commit("profile-2", profile, request, bundle);

    expect(first.profile.wallet.balances.crystal).toBe(2);
    expect(second.profile.wallet.balances.crystal).toBe(2);
  });

  it("allows repeatable rewards across distinct runs and preserves removed reward claim history", () => {
    const registry = progressionRegistry();
    const service = new CampaignRewardCommitService(registry);
    const profile = createInitialCampaignProgressionProfile(registry);
    const repeatable = {
      ...reward({ kind: "currency", currencyId: "crystal", amount: 1 }),
      oneTime: false
    };
    const bundle = rewardBundle([repeatable]);
    const first = service.commit("profile-1", profile, victoryRequest([repeatable.id]), bundle);
    const second = service.commit(
      "profile-1",
      first.profile,
      { ...victoryRequest([repeatable.id]), runId: "run-2", baseProfileRevision: first.profile.revision },
      bundle
    );
    const removedProfile = { ...second.profile, rewardClaimIds: ["dreams:removed"] };
    const removed = service.commit(
      "profile-1",
      removedProfile,
      { ...victoryRequest(["removed"]), runId: "run-3", baseProfileRevision: removedProfile.revision },
      rewardBundle([])
    );

    expect(second.profile.wallet.balances.crystal).toBe(3);
    expect(removed.profile.rewardClaimIds).toContain("dreams:removed");
    expect(removed.warnings[0]).toContain("no longer registered");
  });

  it("requires optional and hidden reward objectives and rejects stale profile revisions explicitly", () => {
    const registry = progressionRegistry();
    const service = new CampaignRewardCommitService(registry);
    const profile = { ...createInitialCampaignProgressionProfile(registry), revision: 2 };
    const optional = reward({ kind: "currency", currencyId: "crystal", amount: 1 }, "optional", ["secret"]);
    const bundle = rewardBundle([optional]);

    const stale = service.commit("profile-1", profile, victoryRequest([optional.id]), bundle);
    const ineligible = service.commit("profile-2", { ...profile, revision: 0 }, victoryRequest([optional.id]), bundle);

    expect(stale.rejectionReason).toContain("Profile revision changed");
    expect(ineligible.skippedRewardIds).toEqual(["optional"]);
  });
});

function progressionRegistry(): CampaignProgressionRegistry {
  const definitions: CampaignProgressionDefinitions = {
    currencies: [{ id: "crystal", title: "Crystal", initialBalance: 1 }],
    heroes: [],
    unlocks: [
      {
        id: "maceman",
        title: "Maceman",
        kind: "unit",
        faction: FactionType.Tivara,
        objectName: ObjectNames.TivaraMacemanMale
      }
    ],
    upgrades: [
      {
        id: "health",
        title: "Health",
        currencyId: "crystal",
        cost: 1,
        scope: { kind: "global" },
        modifiers: [{ stat: "maximum-health", operation: "multiply", value: 1.1 }]
      }
    ],
    items: [{ id: "relic", title: "Relic", consumable: false }],
    temporaryBoosts: [{ id: "haste", title: "Haste", modifiers: [] }]
  };
  return new CampaignProgressionRegistry(definitions);
}

/**
 * Defines the reward specific alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
type RewardSpecific = MissionRewardDefinition extends infer TReward
  ? TReward extends MissionRewardDefinition
    ? Omit<TReward, "id" | "titleTextId" | "scope" | "oneTime" | "objectiveIds">
    : never
  : never;

function reward(
  specific: RewardSpecific,
  id = "crystal",
  objectiveIds: readonly string[] = []
): MissionRewardDefinition {
  return {
    ...specific,
    id: asCampaignContentId(id),
    titleTextId: asCampaignContentId(`${id}-title`),
    scope: { kind: "global" },
    oneTime: true,
    objectiveIds: objectiveIds.map((objectiveId) => asCampaignContentId(objectiveId))
  } as MissionRewardDefinition;
}

function rewardBundle(rewards: readonly MissionRewardDefinition[]): MissionRewardBundle {
  return { schemaVersion: 1, missionId: "dreams", rewards };
}

function victoryRequest(discoveredRewardIds: readonly string[]): CampaignVictoryCommitRequest {
  return {
    runId: "run-1",
    missionId: "dreams",
    missionRevision: 1,
    baseProfileRevision: 0,
    discoveredRewardIds,
    completedObjectiveIds: [],
    difficulty: "normal",
    outcome: CampaignMissionOutcome.Victory,
    replayPlayback: false,
    integrity: { eligibleForRewards: true, invalidationReasons: [] }
  };
}
