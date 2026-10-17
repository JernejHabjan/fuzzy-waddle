import { FactionType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PureAiBrain } from "../brain/ai-brain";
import { digestCanonicalAiValue } from "../brain/canonical-ai-serialization";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCommandIdentityV1, AiCommandOutcomeV1 } from "../contracts/ai-command-contracts";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import { AiMacroManager } from "../planning/ai-macro-manager";
import { createAiProductionPolicyFixture } from "./ai-production-policy-fixture";
import { repeatedArmy } from "./ai-production-scenario-test-fixtures";

describe.each([FactionType.Tivara, FactionType.Skaduwee])("production capacity certification %s", (faction) => {
  function harness() {
    const fixture = createAiProductionPolicyFixture(faction);
    const manager = new AiMacroManager(() => fixture.catalog);
    // Isolate capacity admission; native recipes exercise the concurrent production/economy owners.
    const brain = new PureAiBrain(fixture.profile, [
      {
        managerId: manager.managerId,
        propose: (observation, state) => {
          const result = manager.propose(observation, state);
          return {
            ...result,
            intents: result.intents.filter(
              (intent) => intent.kind === "construct" && intent.objectName === fixture.producerName
            )
          };
        }
      }
    ]);
    let state: AiBrainStateV1 = fixture.state;
    let tick = 200;
    let actors = [...fixture.observation.actors];
    const step = (outcomes: readonly AiCommandOutcomeV1[] = []) => {
      const result = brain.step({ ...fixture.observation, tick: tick++, actors }, state, outcomes);
      state = result.nextState;
      return result;
    };
    const identity = (intent: AiIntentV1, sequence: number): AiCommandIdentityV1 => ({
      matchId: "capacity-certification",
      authorityEpoch: 0,
      playerNumber: 1,
      sequence,
      commandId: `command:capacity:${sequence}`,
      effectId: intent.effectId,
      intentId: intent.intentId
    });
    const addProducer = (actorId: string, progress = 100) => {
      actors.push({
        ...fixture.producer,
        actorId,
        constructionProgress: { status: "known", value: progress, observedTick: tick }
      });
    };
    return {
      fixture,
      step,
      identity,
      addProducer,
      get state() {
        return state;
      },
      setState: (value: AiBrainStateV1) => {
        state = value;
      },
      setForce: (count: number) => {
        actors = [
          ...actors.filter((actor) => !actor.actorId.startsWith("military-")),
          ...repeatedArmy(count, fixture.unitName)
        ];
      },
      removeProducer: (actorId: string) => {
        actors = actors.filter((actor) => actor.actorId !== actorId);
      }
    };
  }

  it("PRO-02 counts an unfinished producer and rejects capacity that the current economy cannot pay for", () => {
    const f = createAiProductionPolicyFixture(faction);
    const manager = new AiMacroManager(() => f.catalog);
    const site = {
      ...f.producer,
      actorId: "paid-site",
      constructionProgress: { status: "known" as const, value: 50, observedTick: 200 }
    };
    const pending = manager.propose({ ...f.observation, actors: [...f.observation.actors, site] }, f.state);
    expect(pending.intents.some((intent) => intent.kind === "construct")).toBe(false);
    expect(pending.statePatch?.economyProduction?.demands).toContainEqual(
      expect.objectContaining({
        constructingIds: ["paid-site"]
      })
    );
    const brain = new PureAiBrain(f.profile, [manager]);
    const poor = {
      ...f.observation,
      resources: f.observation.resources.map((resource) => ({
        ...resource,
        stockpile: resource.resourceType === ResourceType.Wood ? 199 : 0,
        reservedUnspent: 0,
        obligationsDue: 0
      }))
    };
    const result = brain.step(poor, f.state, []);
    expect(result.acceptedIntents.some((intent) => intent.kind === "construct")).toBe(false);
    expect(result.decisions).toContainEqual(expect.objectContaining({ reason: "resource_conflict" }));
    expect(new Set(Array.from({ length: 3 }, () => digestCanonicalAiValue(brain.step(poor, f.state, [])))).size).toBe(
      1
    );
  });

  it("PRO-05 holds one then three producers for 100 decisions and replaces only the lost capacity", () => {
    const run = () => {
      const h = harness();
      h.setForce(4);
      h.setState({
        ...h.state,
        strategy: { ...h.state.strategy, assessment: { ...h.fixture.state.strategy.assessment, requiredForce: 8 } }
      });
      for (let decision = 0; decision < 100; decision++) expect(h.step().acceptedIntents).toHaveLength(0);
      h.setForce(0);
      h.setState({
        ...h.state,
        strategy: { ...h.state.strategy, assessment: { ...h.fixture.state.strategy.assessment, requiredForce: 24 } }
      });
      const accepted: AiIntentV1[] = [];
      let nextIntent: AiIntentV1 | undefined;
      for (let sequence = 0; sequence < 2; sequence++) {
        const intent = nextIntent ?? h.step().acceptedIntents[0];
        expect(intent?.kind).toBe("construct");
        if (!intent) throw new Error("capacity_admission_missing");
        accepted.push(intent);
        const identity = h.identity(intent, sequence);
        const dispatched = { kind: "dispatched" as const, identity, tick: h.state.lastCommittedTick };
        expect(h.step([dispatched, dispatched]).acceptedIntents).toHaveLength(0);
        // The command applied before its site became visible. No extra site may be admitted for that obligation.
        const applied = {
          kind: "applied" as const,
          identity,
          tick: h.state.lastCommittedTick,
          worldLinkIds: [`new-${sequence}`]
        };
        expect(h.step([applied, applied]).acceptedIntents).toHaveLength(0);
        h.addProducer(`new-${sequence}`);
        const completed = {
          kind: "completed" as const,
          identity,
          tick: h.state.lastCommittedTick,
          resultingActorIds: [`new-${sequence}`]
        };
        const next = h.step([completed, completed]);
        expect(next.acceptedIntents).toHaveLength(sequence === 0 ? 1 : 0);
        nextIntent = next.acceptedIntents[0];
        // Late lower-sequence callbacks must neither resurrect a terminal lease nor remove the next obligation.
        expect(h.step([dispatched, applied]).acceptedIntents).toHaveLength(0);
      }
      for (let decision = 0; decision < 100; decision++) expect(h.step().acceptedIntents).toHaveLength(0);
      h.removeProducer("new-0");
      const replacement = h.step().acceptedIntents;
      expect(replacement).toHaveLength(1);
      const replacementIntent = replacement[0];
      if (!replacementIntent) throw new Error("replacement_admission_missing");
      const replacementIdentity = h.identity(replacementIntent, 2);
      h.addProducer("replacement");
      h.step([
        {
          kind: "completed",
          identity: replacementIdentity,
          tick: h.state.lastCommittedTick,
          resultingActorIds: ["replacement"]
        }
      ]);
      for (let decision = 0; decision < 100; decision++) expect(h.step().acceptedIntents).toHaveLength(0);
      return { accepted, replacement };
    };
    expect(new Set([run(), run(), run()].map(digestCanonicalAiValue)).size).toBe(1);
  });

  it("H-17 releases a failed output and keeps withdrawn demand closed without an empty-producer loop", () => {
    const f = createAiProductionPolicyFixture(faction);
    const brain = new PureAiBrain(f.profile, [new AiMacroManager(() => f.catalog)]);
    const first = brain.step(f.observation, f.state, []);
    const construct = first.acceptedIntents[0];
    if (!construct) throw new Error("capacity_admission_missing");
    const actors = [...f.observation.actors, { ...f.producer, actorId: "completed-site" }];
    const started = brain.step({ ...f.observation, tick: 390, actors }, first.nextState, []);
    const output = started.acceptedIntents.find((intent) => intent.kind === "produce");
    if (!output) throw new Error("useful_output_missing");
    const identity: AiCommandIdentityV1 = {
      matchId: "blocked-output",
      authorityEpoch: 0,
      playerNumber: 1,
      sequence: 1,
      commandId: "command:blocked-output",
      effectId: output.effectId,
      intentId: output.intentId
    };
    const applied = brain.step({ ...f.observation, tick: 391, actors }, started.nextState, [
      { kind: "applied", identity, tick: 390, worldLinkIds: ["queue:blocked"] }
    ]);
    expect(applied.nextState.reservations.some((lease) => lease.subjectKey === `effect:${output.effectId}`)).toBe(true);
    const failedOutput: AiCommandOutcomeV1 = { kind: "failed", identity, tick: 392, reason: "no_legal_spawn_location" };
    const input = {
      ...applied.nextState,
      strategy: {
        ...applied.nextState.strategy,
        assessment: { ...f.state.strategy.assessment, choice: "scout" as const, targetActorId: null, requiredForce: 0 }
      }
    };
    const withdrawn = brain.step({ ...f.observation, tick: 392, actors }, input, [failedOutput, failedOutput]);
    expect(withdrawn.nextState.economyProduction.transition?.status).toBe("abandoned");
    expect(withdrawn.nextState.reservations.some((lease) => lease.subjectKey === `effect:${output.effectId}`)).toBe(
      false
    );
    let state = withdrawn.nextState;
    for (let decision = 0; decision < 100; decision++) {
      const next = brain.step(
        { ...f.observation, tick: 393 + decision, actors },
        state,
        decision === 0 ? [{ kind: "applied", identity, tick: 390, worldLinkIds: ["queue:blocked"] }] : []
      );
      expect(next.acceptedIntents.some((intent) => ["construct", "produce", "cancel"].includes(intent.kind))).toBe(
        false
      );
      expect(next.nextState.reservations.some((lease) => lease.subjectKey === `effect:${output.effectId}`)).toBe(false);
      state = next.nextState;
    }
  });
});
