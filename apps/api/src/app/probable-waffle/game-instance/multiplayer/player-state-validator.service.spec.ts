import {
  type ProbableWaffleGameInstance,
  type ProbableWafflePlayerDataChangeEvent,
  ResourceType
} from "@fuzzy-waddle/api-interfaces";
import { PlayerStateValidatorService } from "./player-state-validator.service";

describe("PlayerStateValidatorService", () => {
  const service = new PlayerStateValidatorService();

  function createGameInstance(carriedWood: number = 0, selectionOwnerId: number = 1): ProbableWaffleGameInstance {
    return {
      getPlayerByNumber: jest.fn().mockReturnValue({
        playerController: {
          data: {
            userId: "user-1"
          }
        },
        playerState: {
          data: {
            resources: {
              [ResourceType.Wood]: 100,
              [ResourceType.Stone]: 100,
              [ResourceType.Minerals]: 100
            },
            housing: {
              currentHousing: 5,
              maxHousing: 10
            }
          }
        }
      }),
      gameInstanceMetadata: {
        data: {
          createdBy: "user-1",
          currentHostUserId: "user-1"
        }
      },
      gameState: {
        data: {
          actors: carriedWood
            ? [
                {
                  id: { id: "gatherer-1" },
                  owner: { ownerId: 1 },
                  gatherer: {
                    carriedResourceType: ResourceType.Wood,
                    carriedResourceAmount: carriedWood
                  }
                }
              ]
            : [
                {
                  id: { id: "unit-1" },
                  owner: { ownerId: selectionOwnerId }
                }
              ]
        }
      }
    } as unknown as ProbableWaffleGameInstance;
  }

  function createEvent(
    property: ProbableWafflePlayerDataChangeEvent["property"],
    resources: Partial<Record<ResourceType, number>>
  ): ProbableWafflePlayerDataChangeEvent {
    return {
      gameInstanceId: "gi-1",
      emitterUserId: "user-1",
      property,
      data: {
        playerNumber: 1,
        playerStateData: {
          resources: resources as Record<ResourceType, number>
        }
      }
    };
  }

  function createSelectionGroupsEvent(actorIds: string[]): ProbableWafflePlayerDataChangeEvent {
    return {
      gameInstanceId: "gi-1",
      emitterUserId: "user-1",
      property: "playerController.data.selectionGroups",
      data: {
        playerNumber: 1,
        playerControllerData: {
          selectionGroups: [
            {
              groupKey: 1,
              actorIds,
              timestamp: 123
            }
          ]
        }
      }
    };
  }

  it("rejects resource removals that exceed the mirrored player resources", () => {
    expect(
      service.validate(createEvent("resource.removed", { [ResourceType.Wood]: 200 }), createGameInstance(), {
        id: "user-1"
      } as never)
    ).toBe(false);
  });

  it("accepts gathered resource additions when the mirrored gatherer is carrying them", () => {
    expect(
      service.validate(createEvent("resource.added", { [ResourceType.Wood]: 20 }), createGameInstance(25), {
        id: "user-1"
      } as never)
    ).toBe(true);
  });

  it("rejects unexplained resource additions", () => {
    expect(
      service.validate(createEvent("resource.added", { [ResourceType.Wood]: 20 }), createGameInstance(), {
        id: "user-1"
      } as never)
    ).toBe(false);
  });

  it("accepts valid selection groups for owned actors", () => {
    expect(
      service.validate(createSelectionGroupsEvent(["unit-1"]), createGameInstance(), { id: "user-1" } as never)
    ).toBe(true);
  });

  it("rejects selection groups that reference actors owned by another player", () => {
    expect(
      service.validate(createSelectionGroupsEvent(["unit-1"]), createGameInstance(0, 2), { id: "user-1" } as never)
    ).toBe(false);
  });
});
