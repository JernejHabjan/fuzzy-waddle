import {
  ProbableWaffleGameCommandTypes,
  ProbableWaffleGameInstanceType,
  ProbableWafflePlayerType,
  type GameCommandInput
} from "@fuzzy-waddle/probable-waffle-protocol";
import { CommandBusService } from "../command-bus.service";
import { commandBusTestScene } from "./command-bus-test-scene";

const input = {
  type: ProbableWaffleGameCommandTypes.Concede,
  playerNumber: 2,
  actorIds: [],
  reason: "spectator-authority-test"
} satisfies GameCommandInput;
const correlation = { intentId: "intent", effectId: "effect", commitmentKey: "spectator-authority-test" };

function setup(isHost: boolean) {
  const scene = commandBusTestScene();
  Object.defineProperties(scene, {
    isHost: { value: isHost },
    isSpectator: { value: true }
  });
  const bus = new CommandBusService(scene);
  const applied = jest.fn();
  bus.command$.subscribe(applied);
  return { scene, bus, applied };
}

it("lets a spectator host apply AI orders while blocking direct spectator input", () => {
  const { bus, applied } = setup(true);

  expect(bus.dispatch(input)).toEqual({ status: "rejected", reason: "application_failed" });
  const receipt = bus.dispatchAi(input, correlation);
  expect(receipt.status).toBe("dispatched");
  if (receipt.status !== "dispatched") throw new Error("Expected an AI command");
  expect(receipt.command.execution?.source).toBe("ai");
  expect(applied).toHaveBeenCalledWith(receipt.command);
  expect(bus.dispatch(receipt.command)).toEqual({ status: "rejected", reason: "application_failed" });
  expect(applied).toHaveBeenCalledTimes(1);

  bus.destroy();
});

it("blocks AI dispatch from a spectator without host authority", () => {
  const { bus, applied } = setup(false);

  expect(bus.dispatchAi(input, correlation)).toEqual({ status: "rejected", reason: "invalid_owner" });
  expect(applied).not.toHaveBeenCalled();

  bus.destroy();
});

it("blocks a spectator host from submitting an AI order for a human slot", () => {
  const { scene, bus, applied } = setup(true);
  const definition = scene.players.find((player) => player.playerNumber === input.playerNumber)?.playerController.data
    .playerDefinition;
  if (!definition) throw new Error("Expected a player definition");
  definition.playerType = ProbableWafflePlayerType.Human;

  expect(bus.dispatchAi(input, correlation)).toEqual({ status: "rejected", reason: "invalid_owner" });
  expect(applied).not.toHaveBeenCalled();

  bus.destroy();
});

it("keeps replays read-only for a spectator host", () => {
  const { scene, bus, applied } = setup(true);
  scene.baseGameData.gameInstance.gameInstanceMetadata.data.type = ProbableWaffleGameInstanceType.Replay;

  expect(bus.dispatchAi(input, correlation)).toEqual({ status: "rejected", reason: "application_failed" });
  expect(applied).not.toHaveBeenCalled();

  bus.destroy();
});
