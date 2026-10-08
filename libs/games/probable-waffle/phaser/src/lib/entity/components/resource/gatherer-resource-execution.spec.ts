import type Phaser from "phaser";
import { Subject } from "rxjs";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../../../data/actor-component";
import { ResourceSourceComponent } from "./resource-source-component";
import { ResourceDrainComponent } from "./resource-drain-component";
import type { GathererComponent } from "./gatherer-component";
import { GathererResourceExecution } from "./gatherer-resource-execution";
import { OwnerComponent } from "../owner-component";
import { emitResource, getPlayer } from "../../../data/scene-data";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ emitResource: jest.fn(), getPlayer: jest.fn() }));

function fixture() {
  const actor = {} as Phaser.GameObjects.GameObject, target = {} as Phaser.GameObjects.GameObject;
  const state = { carriedResourceType: ResourceType.Wood, carriedResourceAmount: 1, remainingCooldown: 0,
    currentResourceSource: target, simulationTickService: { currentTick: 7 },
    onResourceGathered: new Subject(), onResourcesReturned: new Subject() } as unknown as GathererComponent;
  const callbacks = { setCarriedResourceAmount: jest.fn((amount: number) => {
    state.carriedResourceAmount = amount; if (amount <= 0) state.carriedResourceType = null;
  }), playGatherSound: jest.fn(), playGatherAnimation: jest.fn(), leaveCurrentResourceSource: jest.fn() };
  const execution = new GathererResourceExecution(actor, state, () => ({ resourceType: ResourceType.Wood,
    capacity: 3, amountPerGathering: 1, cooldown: 1000, range: 1, needsReturnToDrain: true }), callbacks);
  return { actor, target, state, callbacks, execution };
}

describe("native gatherer execution ownership (unrun until final gate)", () => {
  it("retains the selected source across extraction and uses the live carried amount at completion", async () => {
    const f = fixture(); let resolve: ((value: number) => void) | undefined;
    const extraction = new Promise<number>((settle) => { resolve = settle; });
    const extractResources = jest.fn(() => extraction);
    jest.mocked(getActorComponent).mockImplementation((_actor, component) => component === ResourceSourceComponent ?
      { extractResources, canAcceptGatherer: () => true, resourceSourceDefinition: {} } as never : undefined);
    const pending = f.execution.gatherResources(f.target);
    expect(extractResources).toHaveBeenCalledWith(f.actor, 1);
    f.state.currentResourceSource = null; f.state.carriedResourceAmount = 2;
    if (!resolve) throw new Error("extraction_not_started"); resolve(1);
    expect(await pending).toBe(1); expect(f.state.carriedResourceAmount).toBe(3);
    expect(f.state.cooldownStartedTick).toBe(7); expect(f.callbacks.leaveCurrentResourceSource).toHaveBeenCalledTimes(1);
  });

  it("keeps native drop-off arguments before the await and subtracts from live cargo afterwards", async () => {
    const f = fixture(); let resolve: ((value: number) => void) | undefined;
    const returned = new Promise<number>((settle) => { resolve = settle; });
    const returnResources = jest.fn(() => returned);
    jest.mocked(getActorComponent).mockImplementation((_actor, component) => component === ResourceDrainComponent ?
      { returnResources } as never : undefined);
    const pending = f.execution.returnResources(f.target);
    expect(returnResources).toHaveBeenCalledWith(f.actor, ResourceType.Wood, 1);
    f.state.carriedResourceAmount = 3;
    if (!resolve) throw new Error("return_not_started"); resolve(1);
    expect(await pending).toBe(1); expect(f.state.carriedResourceAmount).toBe(2);
  });

  it("preserves rejection without cargo callbacks and cooldown early return without extraction", async () => {
    const f = fixture(), error = new Error("native_drain");
    jest.mocked(getActorComponent).mockReturnValue({ returnResources: () => Promise.reject(error) } as never);
    await expect(f.execution.returnResources(f.target)).rejects.toBe(error);
    expect(f.callbacks.setCarriedResourceAmount).not.toHaveBeenCalled();
    jest.mocked(getActorComponent).mockClear(); f.state.remainingCooldown = 1;
    expect(await f.execution.gatherResources(f.target)).toBe(0); expect(getActorComponent).not.toHaveBeenCalled();
  });

  it("keeps immediate gathering credit on the source owner and returns extraction independently of the whole pile", async () => {
    const f = fixture();
    jest.mocked(getActorComponent).mockImplementation((_actor, component) => component === ResourceSourceComponent ?
      { extractResources: async () => 2, canAcceptGatherer: () => true, getCurrentResources: () => 0,
        resourceSourceDefinition: { needsReturnToDrain: false } } as never :
      component === OwnerComponent ? { getOwner: () => 2 } as never : undefined);
    jest.mocked(getPlayer).mockReturnValue({} as never);
    expect(await f.execution.gatherResources(f.target)).toBe(2);
    expect(emitResource).toHaveBeenCalledWith(f.actor.scene, "resource.added", { wood: 3 }, 2);
    expect(f.state.carriedResourceAmount).toBe(0);
  });
});
