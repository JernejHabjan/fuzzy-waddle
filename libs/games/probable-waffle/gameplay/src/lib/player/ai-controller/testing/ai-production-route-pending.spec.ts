import { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import { AiMacroManager } from "../planning/ai-macro-manager";
import { projectAiManagerState } from "../brain/project-ai-manager-state";
import { createAiProductionPolicyFixture } from "./ai-production-policy-fixture";

describe.each([FactionType.Tivara, FactionType.Skaduwee])("production route suspension %s", (faction) => {
  function fixture() {
    const f = createAiProductionPolicyFixture(faction);
    const manager = new AiMacroManager(() => f.catalog);
    const state = projectAiManagerState(f.state, [manager.propose(f.observation, f.state)]);
    return {
      ...f,
      manager,
      state: {
        ...state,
        strategy: {
          ...state.strategy,
          assessment: {
            ...f.state.strategy.assessment,
            choice: "scout" as const,
            reason: "route_pending",
            routeDomain: null
          }
        }
      }
    };
  }

  it("retains a visible unchanged force demand during route rebuild without sliding its dates", () => {
    const f = fixture();
    const patch = f.manager.propose({ ...f.observation, tick: 220 }, f.state).statePatch;
    expect(patch?.economyProduction?.transition).toEqual(f.state.economyProduction.transition);
    const late = f.manager.propose({ ...f.observation, tick: 800 }, f.state).statePatch;
    expect(late?.economyProduction?.transition).toMatchObject({ status: "expired", forceDeadlineTick: 790 });
  });

  it("retains queued work until the promised product force is actually ready, then fulfils during a route rebuild", () => {
    const f = fixture();
    const known = <T>(value: T) => ({ status: "known" as const, value, observedTick: 390 });
    const units = Array.from({ length: 11 }, (_, index) => ({
      ...f.producer,
      actorId: "ready-" + index,
      objectName: f.unitName,
      housingCost: known(1),
      queue: known({ capacity: 0, occupied: 0, itemIds: [] })
    }));
    const queued = {
      ...f.producer,
      queue: known({
        capacity: 1,
        occupied: 1,
        itemIds: ["last"],
        items: [{ itemId: "last", kind: "production" as const, objectName: f.unitName, researchType: null }]
      })
    };
    const observation = {
      ...f.observation,
      tick: 390,
      actors: [...f.observation.actors.filter((a) => a.actorId !== f.producer.actorId), queued, ...units]
    };
    expect(f.manager.propose(observation, f.state).statePatch?.economyProduction?.transition?.status).toBe("committed");
    const completed = {
      ...observation,
      tick: 400,
      actors: [
        ...f.observation.actors,
        ...units,
        { ...f.producer, actorId: "ready-last", objectName: f.unitName, housingCost: known(1) }
      ]
    };
    expect(f.manager.propose(completed, f.state).statePatch?.economyProduction?.transition?.status).toBe("fulfilled");
  });

  it.each(["missing", "retargeted", "satisfied"])("abandons an actually %s objective", (condition) => {
    const f = fixture();
    const observation =
      condition === "missing"
        ? { ...f.observation, tick: 220, actors: f.observation.actors.filter((actor) => actor.actorId !== "objective") }
        : { ...f.observation, tick: 220 };
    const assessment = {
      ...f.state.strategy.assessment,
      targetActorId: condition === "retargeted" ? "other" : "objective",
      requiredForce: condition === "satisfied" ? 0 : 12
    };
    const state = { ...f.state, strategy: { ...f.state.strategy, assessment } };
    expect(f.manager.propose(observation, state).statePatch?.economyProduction?.transition?.status).toBe("abandoned");
  });
});
