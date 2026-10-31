import type Phaser from "phaser";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { getActorComponent } from "../../../data/actor-component";
import { HealthComponent } from "../combat/components/health-component";
import { ConstructionWorkerMembership } from "./construction-worker-membership";

jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));

function fixture() {
  jest.clearAllMocks();
  const old = { name: "old", active: true } as Phaser.GameObjects.GameObject;
  const next = { name: "new", active: true } as Phaser.GameObjects.GameObject;
  const indexed = new Map<string, Phaser.GameObjects.GameObject>();
  let dead = false;
  jest
    .mocked(getActorComponent)
    .mockImplementation((actor, component) =>
      component === IdComponent
        ? ({ id: actor.name } as never)
        : component === HealthComponent
          ? ({ killed: actor === old && dead } as never)
          : undefined
    );
  jest.mocked(getSceneService).mockReturnValue({ getActorById: (id: string) => indexed.get(id) ?? null } as never);
  const membership = new ConstructionWorkerMembership({} as Phaser.Scene);
  return {
    old,
    next,
    indexed,
    membership,
    kill: () => {
      dead = true;
    }
  };
}

describe("construction saved worker membership", () => {
  it("preserves unique unresolved IDs across repeated partial saves without counting them as workers", () => {
    const f = fixture();
    f.membership.restore(["old", "old"]);
    expect(f.membership.actors).toEqual([]);
    expect(f.membership.savedIds).toEqual(["old"]);
    f.membership.restore(undefined);
    expect(f.membership.savedIds).toEqual(["old"]);
    f.indexed.set("old", f.old);
    f.membership.resolve();
    expect(f.membership.actors).toEqual([f.old]);
    expect(f.membership.savedIds).toEqual(["old"]);
  });

  it("drops a saved worker known to have died instead of granting work through its corpse", () => {
    const f = fixture();
    f.indexed.set("old", f.old);
    f.kill();
    f.membership.restore(["old"]);
    expect(f.membership.actors).toEqual([]);
    expect(f.membership.savedIds).toEqual([]);
  });

  it("lets a fresh native assignment supersede unresolved saved membership without resurrecting it later", () => {
    const f = fixture();
    f.membership.restore(["old"]);
    f.membership.add(f.next);
    f.indexed.set("old", f.old);
    f.membership.resolve();
    expect(f.membership.actors).toEqual([f.next]);
    expect(f.membership.savedIds).toEqual(["new"]);
  });

  it("does not re-add an explicitly removed saved worker when its index reference arrives", () => {
    const f = fixture();
    f.membership.restore(["old"]);
    f.membership.remove(f.old);
    f.indexed.set("old", f.old);
    f.membership.resolve();
    expect(f.membership.actors).toEqual([]);
    expect(f.membership.savedIds).toEqual([]);
  });
});
