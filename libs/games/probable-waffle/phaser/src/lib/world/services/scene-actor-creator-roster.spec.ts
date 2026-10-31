import Phaser from "phaser";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { SceneActorCreator } from "./scene-actor-creator";
import type GameProbableWaffleScene from "../scenes/GameProbableWaffleScene";
import EditorOwner from "../scenes/editor-components/EditorOwner";
import { setFullActorDataFromName } from "../../data/actor-data";

jest.mock("../../data/actor-data", () => ({ setFullActorDataFromName: jest.fn() }));
jest.mock("../../data/load-game", () => ({
  LoadGame: class {
    load() {}
  }
}));
jest.mock("./multiplayer/actor-id-authority.service", () => ({ ActorIdAuthorityService: class {} }));
jest.mock("../../data/actor-component", () => ({ getActorComponent: () => undefined }));

function fixture(owner?: EditorOwner["owner_id"], playerNumbers = [1, 2]) {
  const events = new Phaser.Events.EventEmitter();
  const scene = {
    events,
    sys: { events, queueDepthSort: () => undefined },
    baseGameData: {
      gameInstance: {
        gameInstanceMetadata: { isStartupLoad: () => false }
      }
    },
    isHost: false,
    players: playerNumbers.map((playerNumber) => ({
      playerNumber,
      playerController: { data: { playerDefinition: { player: { playerNumber } } } }
    }))
  } as unknown as GameProbableWaffleScene;
  const actor = new Phaser.GameObjects.GameObject(scene, "fixture");
  actor.name = ObjectNames.SkaduweeWorkerMale;
  if (owner !== undefined) new EditorOwner(actor).owner_id = owner;
  Object.assign(scene, { children: { getChildren: () => [actor] } });
  const creator = new SceneActorCreator(scene);
  const register = jest.spyOn(creator, "registerAndSaveNewActor").mockImplementation(() => undefined);
  const destroyed = jest.fn();
  actor.once(Phaser.GameObjects.Events.DESTROY, destroyed);
  return { creator, actor, register, destroyed };
}

describe("direct editor actors follow the resolved match roster", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it("destroys absent-player actors before components can publish player changes or register them", () => {
    const f = fixture("3");
    f.creator.initInitialActors();
    expect(setFullActorDataFromName).not.toHaveBeenCalled();
    expect(f.register).not.toHaveBeenCalled();
    expect(f.destroyed).toHaveBeenCalledTimes(1);
    expect(f.actor.active).toBe(false);
  });

  it.each([undefined, "-1", "1"] as const)("keeps neutral or participating owner %s", (owner) => {
    const f = fixture(owner);
    f.creator.initInitialActors();
    expect(setFullActorDataFromName).toHaveBeenCalledWith(
      f.actor,
      expect.objectContaining({
        owner: { ownerId: owner === undefined ? undefined : Number(owner) }
      })
    );
    expect(f.register).toHaveBeenCalledWith(f.actor);
    expect(f.destroyed).not.toHaveBeenCalled();
  });

  it("preserves authored campaign player three when it belongs to the resolved roster", () => {
    const f = fixture("3", [1, 2, 3]);
    f.creator.initInitialActors();
    expect(setFullActorDataFromName).toHaveBeenCalledWith(f.actor, expect.objectContaining({ owner: { ownerId: 3 } }));
    expect(f.register).toHaveBeenCalledWith(f.actor);
    expect(f.destroyed).not.toHaveBeenCalled();
  });
});
