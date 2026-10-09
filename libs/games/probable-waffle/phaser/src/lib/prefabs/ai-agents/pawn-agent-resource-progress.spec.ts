import Phaser from "phaser";
import { State } from "mistreevous";
import { Subject } from "rxjs";
import type { GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { OrderData } from "../../ai/OrderData";
import { OrderType } from "../../ai/order-type";
import { getActorComponent } from "../../data/actor-component";
import { GathererComponent } from "../../entity/components/resource/gatherer-component";
import { ResourceSourceComponent } from "../../entity/components/resource/resource-source-component";
import { OwnerComponent } from "../../entity/components/owner-component";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../world/services/simulation-tick.service";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { AiCommandReconciliation } from "../../player/ai-controller/ai-command-reconciliation";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { PawnAgentResources } from "./pawn-agent-resources";

jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

function fixture() {
  const scene = { sys: { isActive: () => true, queueDepthSort: () => undefined } } as unknown as Phaser.Scene;
  const actor = new Phaser.GameObjects.GameObject(scene, "fixture");
  const board = new PawnAiBlackboard();
  const order = new OrderData(OrderType.Gather, {
    targetGameObject: actor,
    commandContext: {
      playerNumber: 2,
      actorIds: ["pawn"],
      execution: {
        schemaVersion: 1,
        source: "ai",
        commandId: "gather",
        commitmentKey: "food",
        authorityEpoch: 0,
        sequence: 15,
        intentId: "food:intent",
        effectId: "food:effect"
      }
    }
  });
  board.setCurrentOrder(order);
  const stream = new Subject<GameCommandOutcome>(),
    events: GameCommandOutcome[] = [];
  let tick = 1126,
    owner = 2;
  const bus = {
    commandOutcome$: stream.asObservable(),
    getAuthorityState: () => ({ authorityEpoch: 0 }),
    reportPersistedOutcome: (event: GameCommandOutcome) => {
      events.push(event);
      stream.next(event);
    }
  } as unknown as CommandBusService;
  const reconciliation = new AiCommandReconciliation(2, bus);
  const admitted = {
    schemaVersion: 1,
    kind: "dispatched",
    reason: "accepted_for_dispatch",
    tick,
    playerNumber: 2,
    commandId: "gather",
    commitmentKey: "food",
    authorityEpoch: 0,
    sequence: 15,
    intentId: "food:intent",
    effectId: "food:effect",
    actorIds: ["pawn"],
    worldLinkIds: []
  } satisfies GameCommandOutcome;
  stream.next(admitted);
  stream.next({ ...admitted, kind: "applied", reason: "applied" });
  const gatherResources = jest.fn(async () => 2),
    returnResources = jest.fn(async () => 2);
  jest.mocked(getActorComponent).mockImplementation((_actor, token) =>
    token === GathererComponent
      ? ({
          remainingCooldown: 0,
          isCapacityFull: () => false,
          startGatheringResources: () => true,
          gatherResources,
          returnResources
        } as never)
      : token === ResourceSourceComponent
        ? ({ getCurrentResources: () => 10 } as never)
        : token === IdComponent
          ? ({ id: "pawn" } as never)
          : token === OwnerComponent
            ? ({ getOwner: () => owner } as never)
            : undefined
  );
  jest.mocked(getSceneService).mockImplementation((_scene, token) =>
    token === CommandBusService
      ? (bus as never)
      : token === SimulationTickService
        ? ({
            get currentTick() {
              return tick;
            }
          } as never)
        : undefined
  );
  const resources = new PawnAgentResources(actor, board, {
    SelfIsAlive: () => true,
    InRange: async () => State.SUCCEEDED,
    AcquireNewResourceSource: jest.fn()
  });
  return {
    actor,
    board,
    order,
    resources,
    events,
    reconciliation,
    gatherResources,
    returnResources,
    setTick: (value: number) => {
      tick = value;
    },
    setOwner: (value: number) => {
      owner = value;
    }
  };
}

describe("native resource work renews command progress only on actual positive transfers", () => {
  beforeEach(() => jest.resetAllMocks());

  it.each(["gather", "drop_off"] as const)(
    "%s progress prevents a false timeout but still expires stalled work",
    async (operation) => {
      const f = fixture();
      f.setTick(8000);
      if (operation === "gather") await f.resources.GatherResource();
      else await f.resources.DropOffResources();
      expect(f.events).toEqual([
        expect.objectContaining({
          kind: "active",
          tick: 8000,
          commandId: "gather",
          sequence: 15,
          intentId: "food:intent",
          effectId: "food:effect",
          actorIds: ["pawn"]
        })
      ]);
      f.reconciliation.observeTick(8326);
      expect(f.reconciliation.getState().health).toBe("reconciling");
      expect(f.events).toHaveLength(1);
      f.reconciliation.observeTick(15200);
      expect(f.events.at(-1)).toMatchObject({ kind: "failed", reason: "lost_outcome" });
      f.reconciliation.destroy();
    }
  );

  it.each([0, -1, NaN, Infinity])("does not renew a no-progress result %s", async (amount) => {
    const f = fixture();
    f.gatherResources.mockResolvedValue(amount);
    await f.resources.GatherResource();
    expect(f.events).toEqual([]);
    f.reconciliation.observeTick(8326);
    expect(f.events.at(-1)).toMatchObject({ kind: "failed", reason: "lost_outcome" });
    f.reconciliation.destroy();
  });

  it.each(["replacement", "conversion", "inactive", "unstamped"] as const)(
    "does not renew after %s",
    async (boundary) => {
      const f = fixture();
      let resolve: ((amount: number) => void) | undefined;
      f.returnResources.mockImplementation(
        () =>
          new Promise<number>((release) => {
            resolve = release;
          })
      );
      const pending = f.resources.DropOffResources();
      if (boundary === "replacement") f.board.setCurrentOrder(new OrderData(OrderType.Stop));
      if (boundary === "conversion") f.setOwner(1);
      if (boundary === "inactive") f.actor.active = false;
      if (boundary === "unstamped") f.order.data.commandContext = undefined;
      if (!resolve) throw new Error("return_pending_missing");
      resolve(2);
      await pending;
      expect(f.events).toEqual([]);
      f.reconciliation.destroy();
    }
  );
});
