import { Subscription } from "rxjs";
import { ProbableWaffleGameInstance, ProbableWaffleGameState } from "@fuzzy-waddle/probable-waffle-protocol";
import { GameSessionState } from "@fuzzy-waddle/platform-game-sessions";
import { SaveGame } from "./save-game";
import { getSceneService } from "../world/services/scene-component-helpers";
import { SceneActorCreator } from "../world/services/scene-actor-creator";

jest.mock("../world/services/scene-component-helpers", () => ({
  getSceneService: jest.fn(), getSceneSystem: jest.fn(), getSceneComponent: jest.fn()
}));

it("cannot emit an old scene's save into the new match after awaited screenshot completion", async () => {
  const gameInstance = new ProbableWaffleGameInstance();
  gameInstance.gameState = new ProbableWaffleGameState();
  gameInstance.gameInstanceMetadata.data.sessionState = GameSessionState.InProgress;
  const emit = jest.fn(), owner = Object.create(SaveGame.prototype) as SaveGame;
  const scene = { sys: { isActive: () => true }, baseGameData: { gameInstance },
    communicator: { utilityEvents: { emit } }, input: { keyboard: { off: jest.fn() } } };
  Reflect.set(owner, "scene", scene);
  Reflect.set(owner, "saveGameSubscription", new Subscription());
  for (const method of ["saveCurrentPlayerData", "saveAiPlayersState", "saveAoeZones", "saveResearchState",
    "saveRandomState", "saveCommandAuthority"]) Reflect.set(owner, method, () => undefined);
  let release: ((image: string) => void) | undefined;
  Reflect.set(owner, "takeScreenshot", () => new Promise<string>((resolve) => { release = resolve; }));
  (getSceneService as jest.Mock).mockImplementation((_scene, token) => token === SceneActorCreator
    ? { saveAllKnownActorsToGameState: () => undefined } : undefined);
  const lifecycle = owner as unknown as { onSaveGame(): Promise<void>; destroy(): void };
  const saving = lifecycle.onSaveGame();
  if (!release) throw new Error("Save did not reach asynchronous screenshot boundary");
  lifecycle.destroy();
  release("late-image");
  await saving;
  expect(emit).not.toHaveBeenCalled();
  await lifecycle.onSaveGame();
  expect(emit).not.toHaveBeenCalled();
});
