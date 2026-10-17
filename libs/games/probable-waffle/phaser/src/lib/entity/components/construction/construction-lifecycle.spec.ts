import Phaser from "phaser";
import { Subject } from "rxjs";
import { ConstructionStateEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { getActorComponent } from "../../../data/actor-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { ConstructionSiteComponent } from "./construction-site-component";
import { startConstructionPayment, refundConstructionPayment } from "./construction-payment";
import { CONSTRUCTION_AUTHORITY_EVENT, type ConstructionAuthorityEvent } from "./construction-authority-event";
// prettier-ignore
import type { ConstructionSiteDefinition } from
  "@fuzzy-waddle/probable-waffle-gameplay/entity/components/construction/construction-site-definition";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";
import { HealthComponent } from "../combat/components/health-component";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ isSnapshotApplyInProgress: () => false }));
jest.mock("../../../data/actor-data", () => ({ upgradeFromConstructingToFullActorData: jest.fn() }));
jest.mock("../../../data/actor-level-utils", () => ({ getResearchedLevelForActor: () => null }));
jest.mock("../../../data/game-object-helper", () => ({
  onObjectReady: jest.fn(),
  getGameObjectVisibility: () => undefined
}));
jest.mock("../../../prefabs/definitions/actor-definitions", () => ({ getPwActorDefinition: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("./construction-progress-ui-component", () => ({ ConstructionProgressUiComponent: class {} }));
jest.mock("./construction-payment", () => ({
  startConstructionPayment: jest.fn(),
  refundConstructionPayment: jest.fn()
}));

/** Real component state/restore/teardown order with isolated payment calls; no executed live-game proof. */
describe("construction lifecycle boundaries", () => {
  beforeEach(() => jest.clearAllMocks());

  function fixture(overrides: Partial<ConstructionSiteDefinition> = {}) {
    const actorEvents = new Phaser.Events.EventEmitter();
    const sceneEvents = new Phaser.Events.EventEmitter();
    const ticks = new Subject<number>();
    const site = {
      name: "site",
      scene: { events: sceneEvents },
      on: actorEvents.on.bind(actorEvents),
      once: actorEvents.once.bind(actorEvents),
      off: actorEvents.off.bind(actorEvents)
    } as unknown as Phaser.GameObjects.GameObject;
    const definition = {
      components: { productionCost: { costType: 0, productionTime: 150, resources: { food: 11 }, refundFactor: 1 } }
    };
    jest.mocked(getPwActorDefinition).mockReturnValue(definition as never);
    jest.mocked(getActorComponent).mockReturnValue(undefined);
    jest.mocked(getSceneService).mockReturnValue({ tick$: ticks } as never);
    const records: ConstructionAuthorityEvent[] = [];
    sceneEvents.on(CONSTRUCTION_AUTHORITY_EVENT, (event: ConstructionAuthorityEvent) => records.push(event));
    const policy = {
      startImmediately: false,
      consumesBuilders: false,
      maxAssignedBuilders: 1,
      maxAssignedRepairers: 1,
      progressMadeAutomatically: 0,
      progressMadePerBuilder: 1,
      repairFactor: 1,
      initialHealthPercentage: 0.1,
      refundFactor: 0.5,
      canBeDragPlaced: false,
      ...overrides
    } satisfies ConstructionSiteDefinition;
    const component = new ConstructionSiteComponent(site, policy);
    return { component, site, actorEvents, records, ticks, definition };
  }

  it("captures real start/restore/finish transitions with actual remaining work and resamples current definitions", () => {
    const f = fixture();
    f.component.startConstruction();
    expect(startConstructionPayment).toHaveBeenCalledWith(f.site, f.definition.components.productionCost, 0, 0, false);
    expect(f.records[0]).toMatchObject({ kind: "lifecycle", transition: "started", state: 1, remainingWorkMs: 150 });
    f.component.setData({ state: ConstructionStateEnum.Constructing, remainingConstructionTime: 75 });
    expect(f.records[1]).toMatchObject({ transition: "restored", remainingWorkMs: 75 });
    f.definition.components.productionCost.resources.food = 20;
    f.component.cancelConstruction();
    expect(refundConstructionPayment).toHaveBeenCalledWith(
      f.site,
      f.definition.components.productionCost,
      0.5,
      expect.any(Function),
      ConstructionStateEnum.Constructing,
      75
    );
    f.component.completeConstruction();
    expect(f.records).toHaveLength(2);
    expect(f.component.isFinished).toBe(false);
    f.component.cancelConstruction();
    expect(refundConstructionPayment).toHaveBeenCalledTimes(1);
  });

  it("unstarted killed/destroy teardown cannot refund an unpaid site and disposes once", () => {
    const f = fixture();
    f.actorEvents.emit(HealthComponent.KilledEvent);
    f.actorEvents.emit(Phaser.GameObjects.Events.DESTROY);
    expect(f.records.map((record) => [record.kind, record.state, record.remainingWorkMs])).toEqual([
      ["lifecycle", ConstructionStateEnum.NotStarted, 0]
    ]);
    expect(refundConstructionPayment).not.toHaveBeenCalled();
    expect(f.ticks.observed).toBe(false);
    expect(f.component.getData().state).toBe(ConstructionStateEnum.NotStarted);
  });

  it("started killed/destroy teardown refunds once and releases the scheduler even when the callback throws", () => {
    const f = fixture();
    f.component.startConstruction();
    const failure = new Error("refund callback");
    jest.mocked(refundConstructionPayment).mockImplementationOnce(() => {
      throw failure;
    });
    expect(() => f.actorEvents.emit(HealthComponent.KilledEvent)).toThrow(failure);
    f.actorEvents.emit(Phaser.GameObjects.Events.DESTROY);
    expect(refundConstructionPayment).toHaveBeenCalledTimes(1);
    expect(f.ticks.observed).toBe(false);
  });
  it("settles cancellation once across direct calls, reentrancy and later death", () => {
    const f = fixture();
    f.component.startConstruction();
    jest.mocked(refundConstructionPayment).mockImplementationOnce(() => f.component.cancelConstruction());
    f.component.cancelConstruction();
    f.component.cancelConstruction();
    f.actorEvents.emit(HealthComponent.KilledEvent);
    expect(refundConstructionPayment).toHaveBeenCalledTimes(1);
    expect(f.component.startConstruction(true)).toBe(false);
  });
  it("saves cancelled-site settlement and cannot reopen its refund after restore", () => {
    const original = fixture();
    original.component.startConstruction();
    original.component.cancelConstruction();
    const saved = original.component.getData();
    expect(saved.cancellationSettled).toBe(true);
    const restored = fixture();
    restored.component.setData(saved);
    jest.mocked(refundConstructionPayment).mockClear();
    restored.component.cancelConstruction();
    restored.actorEvents.emit(HealthComponent.KilledEvent);
    expect(refundConstructionPayment).not.toHaveBeenCalled();
    expect(restored.component.canAssignBuilder()).toBe(false);
  });
  it("releases every builder even when resetting an earlier builder mutates site membership", () => {
    const f = fixture();
    const first = {} as Phaser.GameObjects.GameObject;
    const second = {} as Phaser.GameObjects.GameObject;
    const resets: Phaser.GameObjects.GameObject[] = [];
    f.component.assignBuilder(first);
    f.component.assignBuilder(second);
    jest.mocked(getActorComponent).mockImplementation((actor, token) =>
      token === PawnAiController
        ? ({
            blackboard: {
              resetCurrentOrder: () => {
                resets.push(actor);
                f.component.unAssignBuilder(actor);
              }
            }
          } as never)
        : undefined
    );
    f.component.cancelConstruction();
    expect(resets).toEqual([first, second]);
  });
  it("does not count duplicate builder assignments as extra construction work", () => {
    const f = fixture();
    const builder = {} as Phaser.GameObjects.GameObject;
    f.component.assignBuilder(builder);
    f.component.assignBuilder(builder);
    jest.mocked(getActorComponent).mockReturnValue({ id: "builder" } as never);
    expect(f.component.getData().assignedBuilders).toEqual(["builder"]);
  });

  it("cleans builder orders after a refund callback fails and does not replay the failed settlement", () => {
    const f = fixture();
    const builder = {} as Phaser.GameObjects.GameObject;
    f.component.assignBuilder(builder);
    f.component.startConstruction();
    const reset = jest.fn();
    jest
      .mocked(getActorComponent)
      .mockImplementation((_actor, token) =>
        token === PawnAiController ? ({ blackboard: { resetCurrentOrder: reset } } as never) : undefined
      );
    const failure = new Error("refund failed");
    jest.mocked(refundConstructionPayment).mockImplementationOnce(() => {
      throw failure;
    });
    expect(() => f.component.cancelConstruction()).toThrow(failure);
    f.component.cancelConstruction();
    expect(reset).toHaveBeenCalledTimes(1);
    expect(refundConstructionPayment).toHaveBeenCalledTimes(1);
  });
  it("does not resume a site destroyed synchronously during its payment callback", () => {
    const f = fixture();
    jest.mocked(startConstructionPayment).mockImplementationOnce(() => {
      f.actorEvents.emit(HealthComponent.KilledEvent);
    });
    expect(f.component.startConstruction()).toBe(false);
    expect(f.component.getData().cancellationSettled).toBe(true);
    expect(refundConstructionPayment).toHaveBeenCalledTimes(1);
    expect(f.ticks.observed).toBe(false);
  });
  it("consumes all assigned builders when native death callbacks shrink membership", () => {
    const f = fixture({ consumesBuilders: true });
    const builders = [0, 1].map(() => ({ destroy: jest.fn() }));
    for (const builder of builders) {
      const actor = builder as unknown as Phaser.GameObjects.GameObject;
      builder.destroy.mockImplementation(() => f.component.unAssignBuilder(actor));
      f.component.assignBuilder(actor);
    }
    f.component.completeConstruction();
    for (const builder of builders) expect(builder.destroy).toHaveBeenCalledTimes(1);
  });
  it("retains original builder cleanup when the refund callback removes site membership", () => {
    const f = fixture();
    const builder = {} as Phaser.GameObjects.GameObject;
    f.component.assignBuilder(builder);
    f.component.startConstruction();
    const reset = jest.fn();
    jest
      .mocked(getActorComponent)
      .mockImplementation((_actor, token) =>
        token === PawnAiController ? ({ blackboard: { resetCurrentOrder: reset } } as never) : undefined
      );
    jest.mocked(refundConstructionPayment).mockImplementationOnce(() => f.component.unAssignBuilder(builder));
    f.component.cancelConstruction();
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
