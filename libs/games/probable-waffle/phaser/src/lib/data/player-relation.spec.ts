import { getPlayerRelation } from "./player-relation";

const scene = {
  baseGameData: {
    gameInstance: {
      players: [
        { playerNumber: 1, playerController: { data: { playerDefinition: { team: 7 } } } },
        { playerNumber: 2, playerController: { data: { playerDefinition: { team: 7 } } } },
        { playerNumber: 3, playerController: { data: { playerDefinition: { team: 9 } } } }
      ]
    }
  }
} as never;

describe("getPlayerRelation", () => {
  it("distinguishes self, allied teams, enemies and neutral ownership", () => {
    expect(getPlayerRelation(scene, 1, 1)).toBe("self");
    expect(getPlayerRelation(scene, 1, 2)).toBe("ally");
    expect(getPlayerRelation(scene, 1, 3)).toBe("enemy");
    expect(getPlayerRelation(scene, 1, undefined)).toBe("neutral");
    expect(getPlayerRelation(scene, 1, 99)).toBe("neutral");
  });
});
