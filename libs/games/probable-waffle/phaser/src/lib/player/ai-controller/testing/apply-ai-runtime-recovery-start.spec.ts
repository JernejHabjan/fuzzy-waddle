import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { EventEmitter } from "node:events";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { getActorComponent } from "../../../data/actor-component";
import { emitResource, getPlayer } from "../../../data/scene-data";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { GathererComponent } from "../../../entity/components/resource/gatherer-component";
import { ResourceSourceComponent } from "../../../entity/components/resource/resource-source-component";
import { applyAiRuntimeRecoveryStart } from "./apply-ai-runtime-recovery-start";
import { AI_RUNTIME_RECOVERY_SETUP_EVENT, type AiRuntimeRecoverySetup } from "./ai-runtime-recovery-setup";

jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ emitResource: jest.fn(), getPlayer: jest.fn() }));

function fixture(workerCount = 1, remaining = 0) {
  const workers = Array.from({ length: workerCount }, (_, index) => ({ name: ObjectNames.TivaraWorkerMale, id: `worker-${index}` }));
  const home = { name: ObjectNames.Sandhold, id: "home" }, tree = { name: ObjectNames.Tree1, id: "tree" };
  const events = new EventEmitter(), captured: AiRuntimeRecoverySetup[] = [];
  events.on(AI_RUNTIME_RECOVERY_SETUP_EVENT, (value) => captured.push(value));
  const scene = { events } as unknown as ProbableWaffleScene;
  (getSceneService as jest.Mock).mockImplementation((_scene, token) => token === SimulationTickService ? { currentTick: 0 }
    : { getOwnedActors: () => [...workers, home], getAllIdActors: () => [...workers, home, tree] });
  (getActorComponent as jest.Mock).mockImplementation((actor, component) => component === IdComponent
    ? { id: actor.id } : component === GathererComponent && workers.includes(actor) ? {}
    : component === ResourceSourceComponent && actor === tree ? { getCurrentResources: () => remaining,
      getResourceType: () => ResourceType.Wood, resourceSourceDefinition: { respawnOnDepletion: false } } : undefined);
  const bank = { food: 900, wood: 900, stone: 900, minerals: 900 };
  (getPlayer as jest.Mock).mockReturnValue({ getResources: () => ({ ...bank }) });
  (emitResource as jest.Mock).mockImplementation((_scene, kind, amounts: Partial<typeof bank>) => {
    for (const type of Object.values(ResourceType)) bank[type] += (kind === "resource.added" ? 1 : -1) * (amounts[type] ?? 0);
  });
  return { scene, bank, captured };
}

it.each(["one_worker", "bootstrap", "infeasible"] as const)("authors only a pre-tick definition-derived %s budget", (branch) => {
  const f = fixture(branch === "bootstrap" ? 0 : 1);
  applyAiRuntimeRecoveryStart(f.scene, branch);
  const setup = requireAiTestEntry(f.captured, 0);
  expect(setup.workerIds).toHaveLength(branch === "bootstrap" ? 0 : 1);
  expect(setup.steps.map((step) => step.objectName)).toContain(ObjectNames.Field);
  expect(setup.steps.map((step) => step.objectName)).toContain(ObjectNames.Granary);
  expect(setup.sources).toEqual([{ actorId: "tree", resourceType: ResourceType.Wood, available: 0, renewable: false }]);
  expect(f.bank).toEqual(setup.bank);
  expect(f.bank.wood).toBe(branch === "infeasible" ? 0 : 140);
  if (branch === "bootstrap") expect(f.bank.food).toBeGreaterThan(0);
  else expect(f.bank.food).toBe(0);
});

it("refuses unexhausted native sources or extra workers instead of labelling a zero bank infeasible", () => {
  const source = fixture(1, 1);
  expect(() => applyAiRuntimeRecoveryStart(source.scene, "infeasible")).toThrow("source_exhaustion_not_proven");
  expect(source.captured).toEqual([]);
  const extra = fixture(2);
  expect(() => applyAiRuntimeRecoveryStart(extra.scene, "one_worker")).toThrow("worker_count_mismatch");
  expect(extra.captured).toEqual([]);
});
