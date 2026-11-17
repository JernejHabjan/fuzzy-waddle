import { BaseScene } from "@fuzzy-waddle/platform-game-host/phaser/scene/base.scene";
import { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import {
  emitEventSelection,
  getCurrentPlayerNumber,
  getSelectedActors,
  listenToSelectionEvents,
  sendPlayerStateEvent
} from "../scene-data";
import GameProbableWaffleScene from "../../world/scenes/GameProbableWaffleScene";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { OwnerComponent } from "../../entity/components/owner-component";

describe("getCurrentPlayerNumber", () => {
  it("returns undefined for a spectator instead of requiring a local player", () => {
    const scene = Object.create(BaseScene.prototype);
    Object.defineProperty(scene, "isSpectator", { value: true });

    expect(getCurrentPlayerNumber(scene)).toBeUndefined();
  });

  it("uses the local player's slot when the scene is not a spectator", () => {
    const scene = Object.create(BaseScene.prototype);
    Object.defineProperties(scene, {
      isSpectator: { value: false },
      playerOrNull: { value: { playerNumber: 2 } },
      baseGameData: { value: { gameInstance: { gameState: undefined } } }
    });

    expect(getCurrentPlayerNumber(scene)).toBe(2);
  });

  it("keeps spectator selection local while allowing visible actors from any player", () => {
    const send = jest.fn();
    const communicator = { playerChanged: { send } };
    const actor = {
      getData: () =>
        ({
          components: new Map([
            [IdComponent, { id: "enemy-actor" }],
            [OwnerComponent, { getOwner: () => 2 }]
          ])
        })
    };
    const scene = Object.create(GameProbableWaffleScene.prototype);
    Object.defineProperties(scene, {
      isSpectator: { value: true },
      userId: { value: "spectator-user" },
      gameInstanceId: { value: "match-1" },
      communicator: { value: communicator },
      children: { value: { getChildren: () => [actor] } },
      events: { value: { once: jest.fn() } }
    });
    const hudScene = Object.create(ProbableWaffleScene.prototype);
    Object.defineProperties(hudScene, {
      isSpectator: { value: true },
      communicator: { value: communicator }
    });
    const events: string[] = [];
    listenToSelectionEvents(hudScene)?.subscribe((event) => events.push(event.property));

    emitEventSelection(scene, "selection.set", ["enemy-actor"]);

    expect(getSelectedActors(scene)).toEqual([actor]);
    expect(events).toEqual(["selection.set"]);
    expect(send).not.toHaveBeenCalled();

    emitEventSelection(scene, "selection.cleared");
    expect(getSelectedActors(scene)).toEqual([]);
    expect(send).not.toHaveBeenCalled();
  });

  it("does not create a player-owned selection for a spectator when no local selection listeners exist", () => {
    const scene = Object.create(ProbableWaffleScene.prototype);
    Object.defineProperties(scene, {
      isSpectator: { value: true },
      userId: { value: "spectator-user" },
      gameInstanceId: { value: "match-1" },
      communicator: { value: { playerChanged: { send: jest.fn() } } },
      events: { value: { once: jest.fn() } }
    });

    expect(() => emitEventSelection(scene, "selection.set", ["actor-id"])).not.toThrow();
  });

  it("sends an explicit player-state event for an observed player's state", () => {
    const send = jest.fn();
    const scene = Object.create(ProbableWaffleScene.prototype);
    Object.defineProperties(scene, {
      isSpectator: { value: true },
      userId: { value: "spectator-user" },
      gameInstanceId: { value: "match-1" },
      baseGameData: {
        value: {
          user: { userId: "spectator-user" },
          gameInstance: { gameInstanceMetadata: { data: { gameInstanceId: "match-1" } } },
          communicator: { playerChanged: { send } }
        }
      }
    });

    sendPlayerStateEvent(
      scene,
      "housing.removed",
      { playerStateData: { housing: { maxHousing: 10 } } },
      2
    );

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        property: "housing.removed",
        data: expect.objectContaining({ playerNumber: 2 }),
        gameInstanceId: "match-1",
        emitterUserId: "spectator-user"
      })
    );
  });

  it("silently skips unowned player-state events on a spectator", () => {
    const scene = Object.create(BaseScene.prototype);
    Object.defineProperties(scene, {
      isSpectator: { value: true },
      playerOrNull: { value: null },
      baseGameData: { value: { communicator: { playerChanged: { send: jest.fn() } } } }
    });
    const warning = jest.spyOn(console, "warn").mockImplementation();

    try {
      expect(() =>
        sendPlayerStateEvent(scene, "housing.removed", { playerStateData: { housing: { maxHousing: 10 } } })
      ).not.toThrow();
      expect(warning).not.toHaveBeenCalled();
    } finally {
      warning.mockRestore();
    }
  });
});
