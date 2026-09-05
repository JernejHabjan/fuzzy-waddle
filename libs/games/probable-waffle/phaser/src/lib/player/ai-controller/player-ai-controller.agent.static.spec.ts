import { State } from "mistreevous";
import { AiDecisionTrace } from "./ai-decision-trace";
import { PlayerAiControllerAgent } from "./player-ai-controller.agent";

describe("PlayerAiControllerAgent static correctness", () => {
  it("only identifies an opponent as weak when the AI has stronger military", () => {
    const agent = createAgent({ militaryStrength: 12, enemyMilitaryStrength: 8 });

    expect(agent.IsEnemyPlayerWeak()).toBe(true);
    expect(agent.getDebugSnapshot().events.at(-1)?.reason).toBe("enemy_weaker");
  });

  it("does not report idle workers as successful gathering", () => {
    const agent = createAgent({ workers: [] });

    expect(agent.GatherResources()).toBe(State.FAILED);
    expect(agent.getDebugSnapshot().events.at(-1)?.reason).toBe("no_active_gatherers");
  });

  it("does not report an unavailable upgrade as started", () => {
    const agent = createAgent({}, State.FAILED);

    expect(agent.StartUpgrade()).toBe(State.FAILED);
    expect(agent.getDebugSnapshot().events.at(-1)?.reason).toBe("no_legal_research");
  });
});

function createAgent(
  blackboard: Record<string, unknown>,
  researchState: State = State.SUCCEEDED
): PlayerAiControllerAgent {
  const agent = Object.create(PlayerAiControllerAgent.prototype) as PlayerAiControllerAgent;
  Reflect.set(agent, "blackboard", {
    militaryStrength: 0,
    enemyMilitaryStrength: 0,
    workers: [],
    ...blackboard
  });
  Reflect.set(agent, "decisionTrace", new AiDecisionTrace(1));
  Reflect.set(agent, "techManager", { tryStartResearch: () => researchState });
  return agent;
}
