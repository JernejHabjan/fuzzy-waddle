import { ProbableWaffleScene } from "./probable-waffle.scene";
import {
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceType,
  ProbableWafflePlayerType
} from "@fuzzy-waddle/probable-waffle-protocol";

function sceneFor(userId: string | null, playerNumber?: number) {
  const game = new ProbableWaffleGameInstance();
  game.gameInstanceMetadata.data.type = ProbableWaffleGameInstanceType.Skirmish;
  game.players = [ProbableWafflePlayerType.AI, ProbableWafflePlayerType.Human].map((playerType, index) =>
    game.initPlayer({
      userId: playerType === ProbableWafflePlayerType.AI ? null : userId,
      playerDefinition: { playerType, player: { joined: true, playerNumber: index + 1 } }
    })
  );
  const scene = Object.create(ProbableWaffleScene.prototype) as ProbableWaffleScene;
  Object.defineProperty(scene, "baseGameData", { value: { gameInstance: game, user: { userId, playerNumber } } });
  return { scene, game };
}

describe("local human scene binding", () => {
  it("resolves the restored offline slot instead of the first null-user AI", () => {
    const { scene, game } = sceneFor(null, 2);
    expect(scene.playerOrNull).toBe(game.players[1]);
  });
  it("does not let a missing or AI slot become the offline human", () => {
    expect(sceneFor(null).scene.playerOrNull).toBeNull();
    expect(sceneFor(null, 1).scene.playerOrNull).toBeNull();
  });
  it("keeps authenticated ownership tied to user identity", () => {
    const { scene, game } = sceneFor("human", 1);
    expect(scene.playerOrNull).toBe(game.players[1]);
  });
  it("does not use an unauthenticated slot to claim a network player", () => {
    const { scene, game } = sceneFor(null, 2);
    game.gameInstanceMetadata.data.type = ProbableWaffleGameInstanceType.SelfHosted;
    expect(scene.playerOrNull).toBeNull();
  });
});
