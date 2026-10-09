import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import Phaser from "phaser";
import { Subject } from "rxjs";
import { ConstructionStateEnum, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProductionCostDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/production-cost-definition";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { getActorComponent } from "../../../data/actor-component";
import { emitResource, getCommunicator, getPlayer, isSnapshotApplyInProgress } from "../../../data/scene-data";
import { CONSTRUCTION_AUTHORITY_EVENT, type ConstructionAuthorityEvent } from "./construction-authority-event";
import { startConstructionPayment, refundConstructionPayment } from "./construction-payment";
import { ConstructionSiteComponent } from "./construction-site-component";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { subscribeSceneResourceLoss } from "../../../data/scene-resource-observation";
import type { ConstructionSiteDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/construction/construction-site-definition";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({
  emitResource: jest.fn(),
  getCommunicator: jest.fn(),
  getPlayer: jest.fn(),
  isSnapshotApplyInProgress: jest.fn()
}));
jest.mock("../../../data/game-object-helper", () => ({
  onObjectReady: jest.fn(),
  getGameObjectVisibility: () => undefined
}));
jest.mock("../../../data/actor-data", () => ({ upgradeFromConstructingToFullActorData: jest.fn() }));
jest.mock("../../../data/actor-level-utils", () => ({ getResearchedLevelForActor: () => null }));
jest.mock("../../../prefabs/definitions/actor-definitions", () => ({ getPwActorDefinition: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: () => undefined }));
jest.mock("./construction-progress-ui-component", () => ({ ConstructionProgressUiComponent: class {} }));

function fixture(observe = true) {
  const changes = new Subject<{
    property: "resource.added" | "resource.removed";
    data: { playerNumber: number; playerStateData: { resources: Partial<Record<ResourceType, number>> } };
  }>();
  const money: Record<ResourceType, number> = { food: 100, wood: 100, stone: 100, minerals: 100 };
  const events = new Phaser.Events.EventEmitter();
  const actorEvents = new Phaser.Events.EventEmitter();
  const site = {
    scene: { events },
    name: "site",
    on: actorEvents.on.bind(actorEvents),
    once: actorEvents.once.bind(actorEvents)
  } as unknown as Phaser.GameObjects.GameObject;
  const records: ConstructionAuthorityEvent[] = [];
  if (observe) events.on(CONSTRUCTION_AUTHORITY_EVENT, (event: ConstructionAuthorityEvent) => records.push(event));
  const canPay = jest.fn(() => true);
  jest.mocked(getActorComponent).mockReturnValue({ getOwner: () => 2 } as never);
  jest.mocked(getPlayer).mockReturnValue({ canPayAllResources: canPay, getResources: () => money } as never);
  jest.mocked(getCommunicator).mockReturnValue({ playerChanged: { on: changes } } as never);
  jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
  jest.mocked(emitResource).mockImplementation((_scene, action, amounts, owner) => {
    if (isSnapshotApplyInProgress(site.scene)) return;
    Object.values(ResourceType).forEach((type) => {
      money[type] += (action === "resource.added" ? 1 : -1) * (amounts[type] ?? 0);
    });
    changes.next({ property: action, data: { playerNumber: owner ?? 2, playerStateData: { resources: amounts } } });
  });
  const definition = {
    costType: PaymentType.PayImmediately,
    productionTime: 150,
    resources: { food: 11 },
    refundFactor: 1
  } satisfies ProductionCostDefinition;
  return { site, records, money, changes, canPay, definition };
}

/** Native behavior characterization, including known policy defects and controlled resource callbacks. */
describe("construction payment authority", () => {
  beforeEach(() => jest.clearAllMocks());

  it.each(["paid", "denied", "throw"] as const)(
    "preserves actual %s payment before the caller's construction fence",
    (route) => {
      const f = fixture(false),
        order: string[] = [],
        error = new Error("native payment");
      f.definition.productionTime = 0;
      jest.mocked(getPwActorDefinition).mockReturnValue({ components: { productionCost: f.definition } } as never);
      const policy = {
        startImmediately: false,
        consumesBuilders: false,
        maxAssignedBuilders: 1,
        maxAssignedRepairers: 1,
        progressMadeAutomatically: 1,
        progressMadePerBuilder: 1,
        repairFactor: 1,
        initialHealthPercentage: 0.1,
        refundFactor: 0.5,
        canBeDragPlaced: false
      } satisfies ConstructionSiteDefinition;
      const component = new ConstructionSiteComponent(f.site, policy);
      const remove = subscribeSceneResourceLoss(f.site.scene, (reason) => {
        expect(reason).toBe("resource_actor_construction_change");
        expect(component.getData().state).toBe(ConstructionStateEnum.NotStarted);
        order.push("loss");
      });
      const native = jest.mocked(emitResource).getMockImplementation();
      jest.mocked(emitResource).mockImplementation((...args) => {
        expect(component.getData().state).toBe(ConstructionStateEnum.NotStarted);
        expect(order).toEqual([]);
        order.push("emit");
        if (route === "throw") throw error;
        native?.(...args);
      });
      component.constructionStateChanged.subscribe(() => order.push("state"));
      if (route === "denied") {
        f.canPay.mockReturnValue(false);
        expect(() => component.startConstruction()).toThrow("Cannot afford building costs");
      } else if (route === "throw") expect(() => component.startConstruction()).toThrow(error);
      else component.startConstruction();
      expect(order).toEqual(route === "paid" ? ["emit", "loss", "state"] : route === "throw" ? ["emit"] : []);
      expect(component.getData().state).toBe(
        route === "paid" ? ConstructionStateEnum.Constructing : ConstructionStateEnum.NotStarted
      );
      expect(f.money.food).toBe(route === "paid" ? 89 : 100);
      remove();
    }
  );

  it("retains the native time predicate instead of treating configured immediate cost as a charge", () => {
    const f = fixture();
    startConstructionPayment(f.site, f.definition, ConstructionStateEnum.NotStarted, 0);
    expect(emitResource).not.toHaveBeenCalled();
    expect(f.canPay).not.toHaveBeenCalled();
    expect(requireAiTestEntry(f.records, 0)).toMatchObject({
      kind: "resource",
      status: "skipped",
      requiredWorkMs: 150,
      configuredCostType: 0,
      requested: null,
      balanceMatches: false
    });
    expect(f.changes.observed).toBe(false);
  });

  it("observes the actual zero-time charge and preserves its original vector and detached pre-callback definition", () => {
    const f = fixture();
    const definition = { ...f.definition, productionTime: 0, costType: PaymentType.PayOverTime };
    startConstructionPayment(f.site, definition, ConstructionStateEnum.NotStarted, 0);
    expect(emitResource).toHaveBeenCalledWith(f.site.scene, "resource.removed", definition.resources, 2);
    expect(requireAiTestEntry(f.records, 0)).toMatchObject({
      status: "returned",
      configuredCostType: 1,
      configuredCost: { food: 11 },
      requested: { food: 11 },
      before: { food: 100 },
      after: { food: 89 },
      callbackCount: 1,
      balanceMatches: true
    });
    definition.resources.food = 99;
    const payment = requireAiTestEntry(f.records, 0);
    if (payment.kind !== "resource") throw new Error("synthetic_construction_payment_missing");
    expect(payment.configuredCost).toEqual({ food: 11 });
    expect(f.changes.observed).toBe(false);
  });

  it("retains denial and the native affordability error without an emission", () => {
    const f = fixture();
    f.canPay.mockReturnValue(false);
    expect(() =>
      startConstructionPayment(f.site, { ...f.definition, productionTime: 0 }, ConstructionStateEnum.NotStarted, 0)
    ).toThrow("Cannot afford building costs");
    expect(emitResource).not.toHaveBeenCalled();
    expect(requireAiTestEntry(f.records, 0)).toMatchObject({ status: "denied", callbackCount: 0 });
  });

  it("records native pre-start and repeated refunds separately, without inventing an earlier charge or cancellation guard", () => {
    const f = fixture();
    const definition = { ...f.definition, costType: PaymentType.PayOverTime };
    const progress = jest.fn(() => 0);
    refundConstructionPayment(f.site, definition, 0.5, progress, ConstructionStateEnum.NotStarted, 0);
    definition.resources.food = 20;
    refundConstructionPayment(f.site, definition, 0.5, progress, ConstructionStateEnum.NotStarted, 0);
    expect(progress).not.toHaveBeenCalled();
    expect(emitResource).toHaveBeenCalledTimes(2);
    expect(requireAiTestEntry(f.records, 0)).toMatchObject({
      operation: "cancel_refund",
      state: 0,
      requested: { food: 5 },
      refundFactor: 0.5
    });
    expect(requireAiTestEntry(f.records, 1)).toMatchObject({
      configuredCost: { food: 20 },
      requested: { food: 10 },
      before: { food: 105 },
      after: { food: 115 }
    });
  });

  it("uses the actual current progress multiplier for an immediate cancellation", () => {
    const f = fixture();
    const progress = jest.fn(() => 0.25);
    refundConstructionPayment(f.site, f.definition, 0.5, progress, ConstructionStateEnum.Constructing, 112.5);
    expect(progress).toHaveBeenCalledTimes(1);
    expect(requireAiTestEntry(f.records, 0)).toMatchObject({
      refundFactor: 0.125,
      requested: { food: 1 },
      balanceMatches: true
    });
  });

  it("keeps restore-suppressed emissions distinct from callback/balance application", () => {
    const f = fixture();
    jest.mocked(isSnapshotApplyInProgress).mockReturnValue(true);
    refundConstructionPayment(f.site, f.definition, 1, () => 0.5, ConstructionStateEnum.Constructing, 75);
    expect(requireAiTestEntry(f.records, 0)).toMatchObject({
      status: "returned",
      snapshotRestoreInProgress: true,
      before: { food: 100 },
      after: { food: 100 },
      callbackCount: 0,
      balanceMatches: false
    });
  });

  it("preserves the exact native error and releases callback observation even if diagnostics throw", () => {
    const f = fixture();
    const failure = new Error("native");
    f.site.scene.events.on(CONSTRUCTION_AUTHORITY_EVENT, () => {
      throw new Error("diagnostic");
    });
    jest.mocked(emitResource).mockImplementation(() => {
      throw failure;
    });
    expect(() =>
      refundConstructionPayment(f.site, f.definition, 1, () => 0.5, ConstructionStateEnum.Constructing, 75)
    ).toThrow(failure);
    expect(requireAiTestEntry(f.records, 0)).toMatchObject({
      status: "threw",
      callbackCount: 0,
      balanceMatches: false
    });
    expect(f.changes.observed).toBe(false);
  });

  it("takes the native path without diagnostic reads when no capture listens", () => {
    const f = fixture(false);
    jest.mocked(emitResource).mockImplementation(() => undefined);
    refundConstructionPayment(f.site, f.definition, 1, () => 0.5, ConstructionStateEnum.Constructing, 75);
    expect(emitResource).toHaveBeenCalledTimes(1);
    expect(getCommunicator).not.toHaveBeenCalled();
    expect(getPlayer).not.toHaveBeenCalled();
    expect(isSnapshotApplyInProgress).not.toHaveBeenCalled();
  });

  it("preserves the original emitter call when diagnostic setup fails", () => {
    const f = fixture();
    jest.mocked(isSnapshotApplyInProgress).mockImplementation(() => {
      throw new Error("diagnostic setup");
    });
    jest.mocked(emitResource).mockImplementation(() => undefined);
    refundConstructionPayment(f.site, f.definition, 1, () => 0.5, ConstructionStateEnum.Constructing, 75);
    expect(emitResource).toHaveBeenCalledTimes(1);
    expect(f.records).toEqual([]);
    expect(f.changes.observed).toBe(false);
  });

  it("requires the exact input-reference callback even when an unrelated equal vector matches the balance delta", () => {
    const f = fixture();
    jest.mocked(emitResource).mockImplementation((_scene, action, amounts) => {
      f.money.food += amounts.food ?? 0;
      f.changes.next({ property: action, data: { playerNumber: 2, playerStateData: { resources: { ...amounts } } } });
    });
    refundConstructionPayment(f.site, f.definition, 1, () => 0.5, ConstructionStateEnum.Constructing, 75);
    expect(requireAiTestEntry(f.records, 0)).toMatchObject({
      after: { food: 105 },
      callbackCount: 0,
      balanceMatches: false
    });
    expect(f.changes.observed).toBe(false);
  });

  it("bounds repeated callbacks and never promotes a saturated count to applied money", () => {
    const f = fixture();
    const native = jest.mocked(emitResource).getMockImplementation();
    jest.mocked(emitResource).mockImplementation((...args) => {
      for (let index = 0; index < 12; index++) native?.(...args);
    });
    refundConstructionPayment(f.site, f.definition, 1, () => 0.5, ConstructionStateEnum.Constructing, 75);
    expect(requireAiTestEntry(f.records, 0)).toMatchObject({ callbackCount: 9, balanceMatches: false });
    expect(f.changes.observed).toBe(false);
  });

  it("copies definition and request before the native callback can change their shared input", () => {
    const f = fixture();
    const native = jest.mocked(emitResource).getMockImplementation();
    jest.mocked(emitResource).mockImplementation((...args) => {
      native?.(...args);
      f.definition.resources.food = 99;
    });
    f.definition.productionTime = 0;
    startConstructionPayment(f.site, f.definition, ConstructionStateEnum.NotStarted, 0);
    expect(requireAiTestEntry(f.records, 0)).toMatchObject({
      configuredCost: { food: 11 },
      requested: { food: 11 },
      callbackAmounts: { food: 11 },
      balanceMatches: true
    });
  });

  it("fences an outer nested construction interval and preserves both native callbacks", () => {
    const f = fixture();
    let inner = false;
    const native = jest.mocked(emitResource).getMockImplementation();
    jest.mocked(emitResource).mockImplementation((...args) => {
      if (!inner) {
        inner = true;
        refundConstructionPayment(f.site, f.definition, 1, () => 0.5, ConstructionStateEnum.Constructing, 75);
      }
      native?.(...args);
    });
    refundConstructionPayment(f.site, f.definition, 1, () => 0.5, ConstructionStateEnum.Constructing, 75);
    expect(requireAiTestEntry(f.records, 0)).toMatchObject({
      nestedEmission: false,
      callbackCount: 1,
      balanceMatches: true
    });
    expect(requireAiTestEntry(f.records, 1)).toMatchObject({
      nestedEmission: true,
      callbackCount: 1,
      balanceMatches: false
    });
    expect(f.changes.observed).toBe(false);
  });
});
