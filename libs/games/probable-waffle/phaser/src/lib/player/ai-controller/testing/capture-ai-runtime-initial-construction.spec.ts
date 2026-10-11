import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import Phaser from "phaser";
import { ConstructionStateEnum, ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { ConstructionSiteComponent } from "../../../entity/components/construction/construction-site-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { captureAiRuntimeInitialConstruction } from "./capture-ai-runtime-initial-construction";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ isSnapshotApplyInProgress: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

function fixture(count = 1) {
  const scene = {
    players: [{ playerNumber: 1 }, { playerNumber: 2 }],
    sys: { queueDepthSort: jest.fn() }
  } as unknown as ProbableWaffleScene;
  const actors = Array.from({ length: count }, () => {
    const actor = new Phaser.GameObjects.GameObject(scene, "initial-site-fixture");
    actor.name = ObjectNames.Sandhold;
    return actor;
  });
  const data = {
    state: ConstructionStateEnum.Constructing,
    remainingConstructionTime: 75,
    progressPercentage: 0.5,
    assignedBuilders: [],
    assignedRepairers: [],
    playingBuildSound: false
  };
  const owners = new Map<Phaser.GameObjects.GameObject, number | undefined>(actors.map((actor) => [actor, 1]));
  const read = jest.fn(() => data);
  jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
  jest.mocked(getActorComponent).mockImplementation((actor, component) => {
    if (component === IdComponent) return { id: `site:${actors.indexOf(actor)}` } as never;
    if (component === OwnerComponent) return { getOwner: () => owners.get(actor) } as never;
    if (component === ConstructionSiteComponent) return { isFinished: false, getData: read } as never;
    return undefined;
  });
  jest.mocked(getSceneService).mockReturnValue({
    getActorById: (id: string) => actors.find((actor) => getActorComponent(actor, IdComponent)?.id === id)
  } as never);
  return { scene, actors, data, read, owners };
}

describe("installation-time construction inventory", () => {
  it("retains detached actual work/state per owner and does not include another player's sites", () => {
    const f = fixture();
    const result = captureAiRuntimeInitialConstruction(f.scene, f.actors, 12);
    expect(result.get(1)).toMatchObject({
      tick: 12,
      snapshotRestoreInProgress: false,
      sites: [
        {
          site: { actorId: "site:0", playerNumber: 1, indexed: true },
          state: ConstructionStateEnum.Constructing,
          remainingWorkMs: 75
        }
      ],
      gaps: []
    });
    expect(result.get(2)?.sites).toEqual([]);
    const actor = requireAiTestEntry(f.actors, 0);
    if (!actor) throw new Error("synthetic_actor_missing");
    f.data.remainingConstructionTime = 0;
    actor.active = false;
    expect(requireAiTestEntry(result.get(1)?.sites, 0)).toMatchObject({ remainingWorkMs: 75, site: { active: true } });
  });

  it("discards the whole overflowing owner inventory and preserves an empty other-owner inventory", () => {
    const f = fixture(257);
    const result = captureAiRuntimeInitialConstruction(f.scene, f.actors, 12);
    expect(result.get(1)).toMatchObject({ sites: [], gaps: ["production_construction_initial_overflow"] });
    expect(result.get(2)).toMatchObject({ sites: [], gaps: [] });
  });

  it("excludes known neutral ownership but cannot prove membership when a site has no owner authority", () => {
    const f = fixture(2);
    const other = requireAiTestEntry(f.actors, 1);
    if (!other) throw new Error("synthetic_actor_missing");
    f.owners.set(other, 999);
    expect(captureAiRuntimeInitialConstruction(f.scene, f.actors, 12).get(1)?.sites).toHaveLength(1);
    f.owners.set(other, undefined);
    expect(captureAiRuntimeInitialConstruction(f.scene, f.actors, 12).get(1)).toMatchObject({
      sites: [],
      gaps: ["production_construction_initial_reader_missing"]
    });
  });

  it("records restore at installation and makes reader failure unavailable rather than retaining partial membership", () => {
    const f = fixture(2);
    jest.mocked(isSnapshotApplyInProgress).mockReturnValue(true);
    expect(captureAiRuntimeInitialConstruction(f.scene, f.actors, 12).get(1)?.snapshotRestoreInProgress).toBe(true);
    f.read.mockImplementationOnce(() => {
      throw new Error("native_missing_builder_identity");
    });
    const result = captureAiRuntimeInitialConstruction(f.scene, f.actors, 12);
    expect(result.get(1)).toMatchObject({ sites: [], gaps: ["production_construction_initial_reader_missing"] });
    expect(result.get(2)).toMatchObject({ sites: [], gaps: ["production_construction_initial_reader_missing"] });
  });
});
