import { productionCaptureFixture } from "./ai-runtime-production-capture-fixtures";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ getPlayer: jest.fn(), isSnapshotApplyInProgress: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({
  getSceneService: jest.fn(),
  getSceneSystem: jest.fn()
}));

it("starts generic delta checks from an explicit paused setup overwrite without inventing income", () => {
  const fixture = productionCaptureFixture();
  fixture.money.food = 0;
  Reflect.set(fixture.ticks, "isPaused", true);
  fixture.capture.capture(2, 10);
  fixture.money.food = 20;
  fixture.changes.next({
    property: "resource.added",
    data: { playerNumber: 2, playerStateData: { resources: { food: 20 } } }
  });
  const changes = fixture.capture.capture(2).facts.filter((fact) => fact.kind === "resources_applied");
  expect(changes).toHaveLength(1);
  expect(changes[0]).toMatchObject({ before: { food: 0 }, after: { food: 20 }, balanceMatches: true });
  fixture.capture.dispose();
});
