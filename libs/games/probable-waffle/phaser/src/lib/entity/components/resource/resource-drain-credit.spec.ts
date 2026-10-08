import type Phaser from "phaser";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { ResourceDrainComponent } from "./resource-drain-component";
import { ResourceServiceObservation } from "./resource-service-observation";
import type { ResourceServiceEvent } from "./resource-service-event";
import { getActorComponent } from "../../../data/actor-component";
import { emitResource, getPlayer, getCommunicator, isSnapshotApplyInProgress } from "../../../data/scene-data";
import { waitForSimulationDuration } from "../../../world/services/simulation-time";

jest.mock("../../../data/game-object-helper", () => ({ onObjectReady: jest.fn() }));
jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ emitResource: jest.fn(), getPlayer: jest.fn(),
  getCommunicator: jest.fn(), isSnapshotApplyInProgress: jest.fn() }));
jest.mock("../../../world/services/simulation-time", () => ({ waitForSimulationDuration: jest.fn() }));

describe("native drain credit policy (unrun until final gate)", () => {
  it.each(["normal", "granted", "none"] as const)("preserves %s economy and full native return after the wait", async (economy) => {
    jest.clearAllMocks();
    const scene = {} as Phaser.Scene, actor = { scene } as Phaser.GameObjects.GameObject;
    const target = { scene } as Phaser.GameObjects.GameObject;
    let resolve: (() => void) | undefined;
    jest.mocked(waitForSimulationDuration).mockReturnValue(new Promise<void>((settle) => { resolve = settle; }));
    jest.mocked(getActorComponent).mockReturnValue({ getOwner: () => 2 } as never);
    jest.mocked(getPlayer).mockReturnValue({ playerController: { data: { playerDefinition: { campaignEconomy: economy } } },
      getResources: () => ({ food: 10, wood: 10, stone: 10, minerals: 10 }) } as never);
    jest.mocked(getCommunicator).mockReturnValue({} as never);
    jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
    const records: ResourceServiceEvent[] = [], release = ResourceServiceObservation.subscribe(actor, (event) => records.push(event));
    const drain = new ResourceDrainComponent(target, { cooldown: 100, resourceTypes: [ResourceType.Wood] });
    const subject = jest.fn(); drain.onResourcesReturned.subscribe(subject);
    const pending = drain.returnResources(actor, ResourceType.Wood, 3);
    expect(emitResource).not.toHaveBeenCalled(); expect(subject).not.toHaveBeenCalled();
    if (!resolve) throw new Error("drain_wait_missing"); resolve();
    expect(await pending).toBe(3); expect(subject).toHaveBeenCalledWith([ResourceType.Wood, 3, actor]);
    expect(emitResource).toHaveBeenCalledTimes(economy === "normal" ? 1 : 0);
    expect(records.at(-1)).toMatchObject({ kind: "resource_credit", ownerArgument: 2, beneficiary: 2, amount: 3,
      status: economy === "normal" ? "returned" : "campaign_suppressed", balanceMatches: false });
    release();
  });
});
