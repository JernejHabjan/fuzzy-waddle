import { Subject } from "rxjs";
import { ProbableWafflePlayerType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import type { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { getCommunicator } from "../../../data/scene-data";
import { AiMultiplayerDiagnostics } from "./ai-multiplayer-diagnostics";

jest.mock("../../../data/scene-data", () => ({ getCommunicator: jest.fn() }));

describe("AiMultiplayerDiagnostics", () => {
  it("retains only bounded credential-free real relay and local-hash facts", () => {
    const batches = new Subject<{ tick: number; playerNumber: number }>();
    const commands = new Subject<{ playerNumber: number; transportMeta?: { serverRelaySequence: number } }>();
    const hashes = new Subject<{ tick: number; hash: string; emitterUserId: string }>();
    jest.mocked(getCommunicator).mockReturnValue({
      gameCommandChanged: { on: commands }, stateHashChanged: { on: hashes }
    } as never);
    const scene = {
      userId: "host",
      playerOrNull: { playerNumber: 1 },
      baseGameData: { gameInstance: { players: [
        { playerNumber: 1, playerController: { data: { playerDefinition: { playerType: ProbableWafflePlayerType.Human } } } },
        { playerNumber: 2, playerController: { data: { playerDefinition: { playerType: ProbableWafflePlayerType.Human } } } },
        { playerNumber: 3, playerController: { data: { playerDefinition: { playerType: ProbableWafflePlayerType.AI } } } }
      ] } },
      events: { once: jest.fn() }
    } as unknown as ProbableWaffleScene;
    const bus = {
      commandBatch$: batches.asObservable(),
      getAuthorityState: () => ({ authorityEpoch: 2, processedCommandIds: ["3:2:1:game", "1:2:1:game"] })
    } as unknown as CommandBusService;
    const observer = new AiMultiplayerDiagnostics(scene, bus);
    batches.next({ tick: 20, playerNumber: 1 });
    batches.next({ tick: 20, playerNumber: 2 });
    commands.next({ playerNumber: 2, transportMeta: { serverRelaySequence: 4 } });
    hashes.next({ tick: 20, hash: "local", emitterUserId: "host" });
    hashes.next({ tick: 20, hash: "remote", emitterUserId: "peer" });

    expect(observer.getSnapshot(3)).toEqual({
      relay: {
        active: true,
        localPlayerNumber: 1,
        humanPlayerNumbers: [1, 2],
        authorityEpoch: 2,
        lastReceivedRelaySequenceByPlayer: { 2: 4 }
      },
      processedAiCommandIds: ["3:2:1:game"],
      hashes: [{ tick: 20, hash: "local" }]
    });
    observer.destroy();
    batches.next({ tick: 40, playerNumber: 1 });
    hashes.next({ tick: 40, hash: "late", emitterUserId: "host" });
    expect(observer.getSnapshot(3).hashes).toEqual([]);
  });
});
