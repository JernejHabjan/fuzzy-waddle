import type Phaser from "phaser";
import { ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../../../data/actor-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { QueueComponent } from "../queue/queue-component";
import { HealthComponent } from "../combat/components/health-component";
import { hasPendingPlayerResearch } from "./has-pending-player-research";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

it("rejects the same paid research across owned producers while allowing other tech and released work", () => {
  const scene = {} as Phaser.Scene;
  const producer = { scene, active: true } as Phaser.GameObjects.GameObject;
  const other = { scene, active: true } as Phaser.GameObjects.GameObject;
  const allItems = [{ researchData: ResearchType.TivaraMacemanUpgradeLevel2 }];
  let killed = false;
  jest.mocked(getSceneService).mockReturnValue({ getOwnedActors: () => [producer, other] } as never);
  jest
    .mocked(getActorComponent)
    .mockImplementation(
      (actor, component) =>
        (component === QueueComponent
          ? { allItems: actor === other ? allItems : [] }
          : component === HealthComponent
            ? { killed: actor === other && killed }
            : undefined) as never
    );
  expect(hasPendingPlayerResearch(producer, 2, ResearchType.TivaraMacemanUpgradeLevel2)).toBe(true);
  expect(hasPendingPlayerResearch(producer, 2, ResearchType.TivaraMacemanUpgradeLevel3)).toBe(false);
  killed = true;
  expect(hasPendingPlayerResearch(producer, 2, ResearchType.TivaraMacemanUpgradeLevel2)).toBe(false);
  killed = false;
  allItems.length = 0;
  expect(hasPendingPlayerResearch(producer, 2, ResearchType.TivaraMacemanUpgradeLevel2)).toBe(false);
});
