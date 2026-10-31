import type Phaser from "phaser";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../../data/actor-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

it("retains the last actual indexed identity after destruction without retaining live-state credit", () => {
  const actor = {
    scene: {} as Phaser.Scene,
    name: ObjectNames.TivaraMacemanMale,
    active: true
  } as Phaser.GameObjects.GameObject;
  let id: string | undefined = "native-one";
  jest
    .mocked(getActorComponent)
    .mockImplementation(
      (_actor, component) =>
        (component === IdComponent && id
          ? { id }
          : component === OwnerComponent && id
            ? { getOwner: () => 2 }
            : undefined) as never
    );
  jest.mocked(getSceneService).mockReturnValue({ getActorById: () => actor } as never);
  expect(captureAiRuntimeCreatedActor(actor)).toMatchObject({ actorId: "native-one", playerNumber: 2, indexed: true });
  // A restore/rebind changes the live canonical identity before this particular object is later destroyed.
  id = "native-two";
  expect(captureAiRuntimeCreatedActor(actor).actorId).toBe("native-two");
  id = undefined;
  actor.active = false;
  expect(captureAiRuntimeCreatedActor(actor)).toMatchObject({
    actorId: "native-two",
    playerNumber: 2,
    active: false,
    alive: false,
    indexed: false
  });
  const unknown = { ...actor } as Phaser.GameObjects.GameObject;
  expect(captureAiRuntimeCreatedActor(unknown).actorId).toBeNull();
});

it("uses the explicitly supplied owner index for actors whose scene service context is unavailable", () => {
  const actor = { scene: {} as Phaser.Scene, name: ObjectNames.TivaraMacemanMale, active: true } as
    Phaser.GameObjects.GameObject;
  jest.mocked(getActorComponent).mockImplementation((_actor, component) =>
    (component === IdComponent ? { id: "owner-indexed-actor" } : undefined) as never);
  jest.mocked(getSceneService).mockClear();
  const ownerIndex = { getActorById: (id: string) => id === "owner-indexed-actor" ? actor : null };
  expect(captureAiRuntimeCreatedActor(actor, ownerIndex)).toMatchObject({ actorId: "owner-indexed-actor", indexed: true });
  expect(getSceneService).not.toHaveBeenCalled();
});
