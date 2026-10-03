import { FactionType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PureAiBrain } from "../brain/ai-brain";
import {
  canonicalizeAiBrainStateV1, digestCanonicalAiValue, serializeCanonicalAiValue
} from "../brain/canonical-ai-serialization";
import { migrateAiBrainState } from "../brain/migrate-ai-brain-state";
import { projectAiManagerState } from "../brain/project-ai-manager-state";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCommandOutcomeV1 } from "../contracts/ai-command-contracts";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import { AiMacroManager } from "../planning/ai-macro-manager";
import { createAiProductionPolicyFixture, createAiProducerThreat } from "./ai-production-policy-fixture";
import { createAiTestOwnedActor } from "./ai-test-fixtures";

describe.each([FactionType.Tivara, FactionType.Skaduwee])("production policy %s", (faction) => {
  const fixture = () => createAiProductionPolicyFixture(faction);

  it("commits normal idle-queue future demand, prebuilds once, and admits the dated product at the fixed start", () => {
    const run = () => {
      const { state, observation, catalog, profile, producer, producerName } = fixture();
      const brain = new PureAiBrain(profile, [new AiMacroManager(() => catalog)]);
      const first = brain.step(observation, state, []);
      const transition = first.nextState.economyProduction.transition;
      expect(state.economyProduction.transition).toBeUndefined();
      expect(transition).toMatchObject({ status: "committed", committedTick: 200, beginsTick: 350,
        forceDeadlineTick: 750, desiredForce: 12, desiredProducers: 2 });
      if (!transition) throw new Error("expected_transition");
      expect(first.acceptedIntents.filter((intent) => intent.kind === "construct")).toHaveLength(1);
      expect(first.acceptedIntents.some((intent) => intent.kind === "produce")).toBe(false);
      expect(first.nextState.reservations.some((lease) => lease.ownerPlanId === transition?.planId &&
        lease.state.kind === "forecast")).toBe(true);
      const site = { ...producer, actorId: "new-producer", objectName: producerName,
        constructionProgress: { status: "known" as const, value: 50, observedTick: 220 } };
      const next = brain.step({ ...observation, tick: 220, actors: [...observation.actors, site] }, first.nextState, []);
      expect(next.nextState.economyProduction.transition).toEqual(transition);
      expect(next.acceptedIntents.some((intent) => intent.kind === "construct")).toBe(false);
      const ready = { ...site, constructionProgress: { status: "known" as const, value: 100, observedTick: 350 } };
      const start = brain.step({ ...observation, tick: 350, actors: [...observation.actors, ready] }, next.nextState, []);
      const units = start.acceptedIntents.filter((intent) => intent.kind === "produce");
      expect(units).toHaveLength(2);
      expect(units.every((intent) => intent.planId === transition?.planId &&
        intent.demandId === transition.demandId && intent.objectName === transition.productObjectName)).toBe(true);
      return { first, next, start };
    };
    expect(new Set([run(), run(), run()].map(digestCanonicalAiValue)).size).toBe(1);
  });

  it("releases optional unspent forecast/leases after abandonment without inventing refunds or later capacity", () => {
    const { state, observation, catalog, profile } = fixture();
    const brain = new PureAiBrain(profile, [new AiMacroManager(() => catalog)]);
    const blocked: AiObservationV1 = { ...observation, map: { ...observation.map!, constructionCells: [] } };
    const first = brain.step(blocked, state, []);
    expect(first.nextState.economyProduction.transition?.status).toBe("committed");
    expect(first.acceptedIntents.some((intent) => intent.kind === "construct")).toBe(false);
    const abandonedInput = { ...first.nextState, strategy: { ...first.nextState.strategy,
      assessment: { ...state.strategy.assessment, choice: "scout" as const, targetActorId: null, requiredForce: 0 } } };
    const next = brain.step({ ...observation, tick: 220 }, abandonedInput, []);
    expect(next.nextState.economyProduction.transition?.status).toBe("abandoned");
    expect(next.nextState.reservations.filter((lease) =>
      lease.ownerPlanId === first.nextState.economyProduction.transition?.planId)).toHaveLength(0);
    expect(next.acceptedIntents.some((intent) => ["construct", "produce", "cancel"].includes(intent.kind))).toBe(false);
    const later = brain.step({ ...observation, tick: 800 }, next.nextState, []);
    expect(later.nextState.economyProduction.transition).toEqual(next.nextState.economyProduction.transition);
    expect(later.acceptedIntents.some((intent) => intent.kind === "construct" || intent.kind === "produce")).toBe(false);
    const unsent = brain.step(observation, state, []);
    const withdrawn = brain.step({ ...observation, tick: 220 }, { ...unsent.nextState,
      strategy: abandonedInput.strategy }, []);
    expect(withdrawn.nextState.reservations.some((lease) =>
      lease.ownerPlanId === unsent.nextState.economyProduction.transition?.planId)).toBe(false);
  });

  it("keeps dispatched/applied claims when the same decision abandons the optional plan", () => {
    const { state, observation, catalog, profile } = fixture();
    const brain = new PureAiBrain(profile, [new AiMacroManager(() => catalog)]);
    const first = brain.step(observation, state, []);
    const construct = first.acceptedIntents.find((intent) => intent.kind === "construct");
    expect(construct).toBeDefined();
    if (!construct) throw new Error("expected_construct");
    const identity: AiCommandOutcomeV1["identity"] = { matchId: "production-policy", authorityEpoch: 0, playerNumber: 1,
      sequence: 0, commandId: "command:construct", effectId: construct.effectId, intentId: construct.intentId };
    const input = { ...first.nextState, strategy: { ...first.nextState.strategy,
      assessment: { ...state.strategy.assessment, choice: "scout" as const, targetActorId: null, requiredForce: 0 } } };
    for (const outcome of [
      { kind: "dispatched", identity, tick: 205 },
      { kind: "applied", identity, tick: 205, worldLinkIds: ["new-site"] }
    ] satisfies AiCommandOutcomeV1[]) {
      const next = brain.step({ ...observation, tick: 220 }, input, [outcome]);
      const retained = next.nextState.reservations.filter((lease) => lease.ownerPlanId === construct.planId);
      expect(retained).toHaveLength(construct.claims.length);
      expect(retained.every((lease) => lease.state.kind === (outcome.kind === "dispatched" ? "dispatched" : "applied_spending")))
        .toBe(true);
    }
    const applied = brain.step({ ...observation, tick: 220 }, first.nextState,
      [{ kind: "applied", identity, tick: 205, worldLinkIds: ["new-site"] }]);
    const completed = brain.step({ ...observation, tick: 240 }, applied.nextState,
      [{ kind: "completed", identity, tick: 230, resultingActorIds: ["new-site"] }]);
    expect(completed.nextState.reservations.some((lease) => lease.subjectKey === `effect:${construct.effectId}`)).toBe(false);
  });

  it("round-trips the stable schedule, rejects malformed saved dates, and defaults older V1 to no commitment", () => {
    const { state, observation, catalog, profile } = fixture();
    const proposal = new AiMacroManager(() => catalog).propose(observation, state);
    const saved = canonicalizeAiBrainStateV1(projectAiManagerState(state, [proposal]));
    const context = { playerNumber: 1, faction, profile, tick: 200, archetypeId: "balanced", satisfiedOpeningStepIds: [] };
    const restored = migrateAiBrainState(JSON.parse(serializeCanonicalAiValue(saved)), context);
    expect(restored.economyProduction.transition).toEqual(saved.economyProduction.transition);
    expect(migrateAiBrainState(state, context).economyProduction.transition).toBeUndefined();
    const malformed = { ...saved, economyProduction: { ...saved.economyProduction,
      transition: { ...saved.economyProduction.transition, beginsTick: 100 } } };
    expect(() => migrateAiBrainState(malformed, context)).toThrow("invalid_ai_production_transition:schedule");
  });

  it("does not schedule from unpriced timing, a satisfied force, or cash pledged to existing obligations", () => {
    const { state, observation, catalog } = fixture();
    const withoutTiming = { ...catalog, entries: catalog.entries.map(({ productionTiming: _timing, ...entry }) => entry) };
    expect(new AiMacroManager(() => withoutTiming).propose(observation, state).statePatch?.economyProduction?.transition)
      .toBeUndefined();
    const pledged = { ...observation, resources: observation.resources.map((resource) => resource.resourceType === ResourceType.Food
      ? { ...resource, stockpile: 300, obligationsDue: 1 } : resource) };
    expect(new AiMacroManager(() => catalog).propose(pledged, state).statePatch?.economyProduction?.transition).toBeUndefined();
    const satisfied = { ...state, strategy: { ...state.strategy, assessment: { ...state.strategy.assessment, requiredForce: 0 } } };
    expect(new AiMacroManager(() => catalog).propose(observation, satisfied).statePatch?.economyProduction?.transition).toBeUndefined();
  });

  it("records a missed deadline instead of sliding dates or repeatedly reviving the same objective", () => {
    const { state, observation, catalog } = fixture();
    const manager = new AiMacroManager(() => catalog);
    const committed = projectAiManagerState(state, [manager.propose(observation, state)]);
    const late = manager.propose({ ...observation, tick: 800 }, committed);
    expect(late.statePatch?.economyProduction?.transition).toMatchObject({ status: "expired", beginsTick: 350,
      forceDeadlineTick: 750, reason: "force_deadline" });
    const later = manager.propose({ ...observation, tick: 1000 }, projectAiManagerState(committed, [late]));
    expect(later.statePatch?.economyProduction?.transition).toEqual(late.statePatch?.economyProduction?.transition);
    expect(later.intents.some((intent) => intent.kind === "construct" || intent.kind === "produce")).toBe(false);
  });

  it("funds one safe reachable critical survivor and declines safe-served, low-value, hidden and stale controls", () => {
    const { state, observation, catalog, producer, unitName } = fixture();
    const threat = createAiProducerThreat();
    const army = Array.from({ length: 10 }, (_, index) => ({ ...createAiTestOwnedActor(`unit-${index}`), objectName: unitName }));
    const input: AiObservationV1 = { ...observation, actors: [...observation.actors, ...army, threat],
      threatSummary: { ...observation.threatSummary, visibleEnemyActorIds: ["objective", threat.actorId] } };
    const manager = new AiMacroManager(() => catalog);
    const subject = manager.propose(input, state);
    const capacity = subject.intents.filter((intent) => intent.kind === "construct" && intent.reasonCode.includes("critical_exposed"));
    expect(capacity).toHaveLength(1);
    expect(capacity[0]?.kind === "construct" && Math.hypot(capacity[0].logicalPosition.x - 9,
      capacity[0].logicalPosition.y - 5) > 3).toBe(true);
    const safe = { ...producer, actorId: "safe-producer", logicalPosition: {
      status: "known" as const, value: { x: 2, y: 2, z: 0 }, observedTick: 200 } };
    const controls: readonly { observation: AiObservationV1; state: AiBrainStateV1 }[] = [
      { observation: { ...input, actors: [...input.actors, safe] }, state },
      { observation: { ...input, actors: [...input.actors, ...["unit-10", "unit-11"].map((actorId) =>
        ({ ...createAiTestOwnedActor(actorId), objectName: unitName }))] }, state: { ...state, strategy: { ...state.strategy,
        assessment: { ...state.strategy.assessment, requiredForce: 0 } } } },
      { observation: { ...input, actors: [...input.actors, ...["unit-10", "unit-11"].map((actorId) =>
        ({ ...createAiTestOwnedActor(actorId), objectName: unitName }))] }, state },
      { observation: { ...input, actors: [...observation.actors, ...army, { ...threat, visibility: "last_seen" }] }, state },
      { observation: { ...input, actors: [...observation.actors, ...army, createAiProducerThreat(180)] }, state }
    ];
    for (const control of controls) expect(manager.propose(control.observation, control.state).intents.some((intent) =>
      intent.kind === "construct")).toBe(false);
    const isolated = { ...input, actors: input.actors.map((actor) => actor.objectName === producer.objectName ? actor :
      { ...actor, logicalPosition: { status: "known" as const, value: { x: 8, y: 5, z: 0 }, observedTick: 200 } }),
      map: { ...input.map!, constructionCells: input.map?.constructionCells?.filter((cell) =>
        cell.tileKey === "8,5" || cell.tileKey === "2,2") } };
    expect(manager.propose(isolated, state).intents.some((intent) => intent.kind === "construct")).toBe(false);
    const survivor = { ...safe, actorId: "survivor" };
    const afterLoss = manager.propose({ ...input, tick: 220,
      actors: [...input.actors.filter((actor) => actor.actorId !== producer.actorId), survivor] },
      projectAiManagerState(state, [subject]));
    expect(afterLoss.intents).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "produce", producerId: survivor.actorId, objectName: unitName })
    ]));
    expect(afterLoss.intents.some((intent) => intent.kind === "construct")).toBe(false);
    const lost = manager.propose({ ...input, actors: input.actors.filter((actor) => actor.actorId !== producer.actorId) },
      projectAiManagerState(state, [subject]));
    expect(lost.intents).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "construct", objectName: producer.objectName,
        reasonCode: expect.stringContaining("critical_recovery") })
    ]));
    const permuted = new AiMacroManager(() => ({ ...catalog, entries: [...catalog.entries].reverse() }))
      .propose({ ...input, actors: [...input.actors].reverse() }, state);
    expect(digestCanonicalAiValue(permuted)).toBe(digestCanonicalAiValue(subject));
  });
});
