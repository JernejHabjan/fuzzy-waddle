import { CampaignParticipantSceneAdapter } from "./campaign-participant-scene-adapter";
import { subscribeSceneResourceLoss } from "../../data/scene-resource-observation";

let mockEconomy: "normal" | "granted" | "none" = "normal";
jest.mock("@fuzzy-waddle/probable-waffle-campaign", () => ({
  AOTA_CAMPAIGN_CONTENT_REGISTRY: { getMission: () => ({ id: "fixture", participants: [{ slotId: "player" }], coop: false,
    difficulty: "normal", progressionAllowance: {} }) },
  CampaignContentAllowanceService: class {},
  resolveCampaignParticipantLaunchSlots: jest.fn(() => [{ playerNumber: 1, teamNumber: 1, participant: {
    slotId: "player", faction: "tivara", controller: "human", economy: mockEconomy, fogPolicy: "standard",
    startingResources: { food: 1.5, wood: 2.5, stone: 3.5, minerals: 4.5 }
  } }]),
  resolveMissionDifficulty: jest.fn(() => ({ damageScale: 1, aiAggressionScale: 1, startingResourceScale: 1 })),
  validateCampaignParticipants: jest.fn(() => [])
}));

function fixture(startupLoad: boolean, economy: "normal" | "granted" | "none" = "normal") {
  mockEconomy = economy;
  const scene = {} as never;
  const definition = { playerNumber: 1, joined: true } as never;
  const resources = { food: 10, wood: 10, stone: 10, minerals: 10 };
  const player = { playerNumber: 1, playerController: { data: { playerDefinition: definition } }, playerState: { data: { resources } } };
  const gameInstance = {
    gameInstanceMetadata: { data: { campaignContext: { missionId: "fixture", difficulty: "normal" }, isStartupLoad: () => startupLoad } },
    gameState: { data: { campaignMission: { participantTeams: { "1": 7 } } } }
  };
  Object.assign(scene, { players: [player], baseGameData: { gameInstance } });
  const configured = jest.fn(), allowances = { configurePlayer: configured };
  return { scene, player, resources, allowances, configured };
}

describe("campaign participant resource history boundary (authored; final gate pending)", () => {
  it("rounds campaign starting resources and fences before replacing the resource snapshot", () => {
    const f = fixture(false), losses: string[] = [];
    const release = subscribeSceneResourceLoss(f.scene, (reason) => {
      losses.push(reason);
      expect(f.resources).toEqual({ food: 10, wood: 10, stone: 10, minerals: 10 });
    });
    CampaignParticipantSceneAdapter.configure(f.scene, f.allowances as never);
    expect(losses).toEqual(["resource_campaign_setup"]);
    expect(f.resources).toEqual({ food: 2, wood: 3, stone: 4, minerals: 5 });
    expect(f.player.playerController.data.playerDefinition).toMatchObject({ team: 7, factionType: "tivara",
      campaignEconomy: "normal" });
    expect(f.configured).toHaveBeenCalledWith(1, [{}]);
    release();
  });

  it.each([
    ["normal", { food: 2, wood: 3, stone: 4, minerals: 5 }],
    ["granted", { food: 2, wood: 3, stone: 4, minerals: 5 }],
    ["none", { food: 0, wood: 0, stone: 0, minerals: 0 }]
  ] as const)("preserves campaign economy mode %s when applying resources", (economy, expected) => {
    const f = fixture(false, economy), release = subscribeSceneResourceLoss(f.scene, () => undefined);
    CampaignParticipantSceneAdapter.configure(f.scene, f.allowances as never);
    expect(f.resources).toEqual(expected);
    release();
  });

  it("preserves startup-loaded economy without fencing or replaying campaign resource setup", () => {
    const f = fixture(true), losses: string[] = [];
    const release = subscribeSceneResourceLoss(f.scene, (reason) => losses.push(reason));
    CampaignParticipantSceneAdapter.configure(f.scene, f.allowances as never);
    expect(f.resources).toEqual({ food: 10, wood: 10, stone: 10, minerals: 10 });
    expect(losses).toEqual([]);
    release();
  });
});
