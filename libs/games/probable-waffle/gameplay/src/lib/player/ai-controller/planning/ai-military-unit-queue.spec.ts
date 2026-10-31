import { FactionType, ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiProductionPolicyFixture } from "../testing/ai-production-policy-fixture";
import { observeAiProductionTransition } from "./ai-production-transition";
import { proposeAiMilitaryUnits } from "./ai-military-unit-proposal";
import { AiMacroManager } from "./ai-macro-manager";

describe.each([FactionType.Tivara, FactionType.Skaduwee])("dated training queue %s", (faction) => {
  const fixture = () => {
    const f = createAiProductionPolicyFixture(faction);
    const transition = observeAiProductionTransition({
      ...f,
      domain: "ground",
      readyForce: 0,
      queuedForce: 0,
      openingComplete: true
    });
    if (!transition) throw new Error("queue_transition_missing");
    const head = {
      itemId: "head",
      kind: "production" as const,
      objectName: f.unitName,
      researchType: null,
      effectId: "effect:composition:effect:head"
    };
    const producer = {
      ...f.producer,
      queue: {
        status: "known" as const,
        observedTick: transition.beginsTick,
        value: { capacity: 5, occupied: 1, itemIds: ["head"], items: [head] }
      }
    };
    const state = {
      ...f.state,
      economyProduction: { ...f.state.economyProduction, transition },
      reservations: [
        {
          claimId: "claim:head" as const,
          subjectKey: `production:${producer.actorId}:0`,
          ownerPlanId: transition.planId,
          prerequisites: [],
          createdTick: transition.beginsTick,
          state: { kind: "applied_spending" as const, appliedTick: transition.beginsTick }
        }
      ]
    };
    const args: Parameters<typeof proposeAiMilitaryUnits>[0] = {
      observation: { ...f.observation, tick: transition.beginsTick },
      state,
      catalog: f.catalog,
      producers: [producer],
      military: [],
      queuedMilitary: [head],
      acceptedEffectCount: 0,
      targetMilitary: 12,
      rangedPermille: 0,
      pressureDomain: "ground",
      compositionPrefix: "composition",
      workforceRecoveryOwnsFood: false,
      priorIntents: [],
      ordinal: 0,
      transition
    };
    return { ...f, transition, head, producer, state, args };
  };

  it("maintains one compatible tail using a free admission lease without waiting for head completion", () => {
    const f = fixture();
    const proposal = proposeAiMilitaryUnits(f.args);
    expect(proposal).toHaveLength(1);
    expect(proposal[0]?.claims).toContainEqual({
      claimId: "composition:claim:0:0",
      kind: "production_slot",
      producerId: f.producer.actorId,
      slot: 1
    });
    const advanced = proposeAiMilitaryUnits({
      ...f.args,
      state: {
        ...f.state,
        reservations: f.state.reservations.map((lease) => ({
          ...lease,
          subjectKey: `production:${f.producer.actorId}:1`
        }))
      }
    });
    expect(advanced[0]?.claims).toContainEqual({
      claimId: "composition:claim:0:0",
      kind: "production_slot",
      producerId: f.producer.actorId,
      slot: 0
    });
    const occupied = {
      ...f.producer,
      queue: {
        ...f.producer.queue,
        value: {
          ...f.producer.queue.value,
          occupied: 2,
          itemIds: ["head", "tail"],
          items: [f.head, { ...f.head, itemId: "tail" }]
        }
      }
    };
    expect(proposeAiMilitaryUnits({ ...f.args, producers: [occupied] })).toEqual([]);
  });

  it("keeps research/unknown work, exhausted capacity, fulfilled demand and pre-start work out of the tail", () => {
    const f = fixture();
    for (const queue of [
      { ...f.producer.queue.value, capacity: 1 },
      { ...f.producer.queue.value, items: undefined },
      {
        ...f.producer.queue.value,
        items: [
          {
            ...f.head,
            kind: "research" as const,
            objectName: null,
            researchType: ResearchType.TivaraMacemanUpgradeLevel2
          }
        ]
      }
    ]) {
      expect(
        proposeAiMilitaryUnits({
          ...f.args,
          producers: [{ ...f.producer, queue: { ...f.producer.queue, value: queue } }]
        })
      ).toEqual([]);
    }
    expect(proposeAiMilitaryUnits({ ...f.args, transition: undefined })).toEqual([]);
    expect(proposeAiMilitaryUnits({ ...f.args, targetMilitary: 1 })).toEqual([]);
    expect(
      proposeAiMilitaryUnits({
        ...f.args,
        observation: {
          ...f.args.observation,
          resources: f.args.observation.resources.map((resource) => ({ ...resource, stockpile: 0 }))
        }
      })
    ).toEqual([]);
    expect(
      proposeAiMilitaryUnits({ ...f.args, observation: { ...f.args.observation, tick: f.transition.beginsTick - 1 } })
    ).toEqual([]);
  });

  it("gives the last dated unit to the nearer compatible producer rather than actor identity order", () => {
    const f = fixture();
    const nearHead = { ...f.head, itemId: "near-head", effectId: "effect:composition:effect:near-head" };
    const near = {
      ...f.producer,
      actorId: "z-near",
      queue: {
        ...f.producer.queue,
        value: { ...f.producer.queue.value, itemIds: [nearHead.itemId], items: [nearHead] }
      },
      logicalPosition: { status: "known" as const, value: { x: 29, y: 5, z: 0 }, observedTick: f.args.observation.tick }
    };
    const args = {
      ...f.args,
      producers: [f.producer, near],
      queuedMilitary: [f.head, nearHead],
      state: { ...f.state, reservations: [] },
      targetMilitary: 3
    };
    const proposal = proposeAiMilitaryUnits(args);
    expect(proposal).toHaveLength(1);
    expect(proposal[0]).toMatchObject({ kind: "produce", producerId: "z-near" });
    expect(proposeAiMilitaryUnits({ ...args, transition: undefined })).toEqual([]);
  });

  it("does not count an observed queue effect again as accepted-but-unobserved work", () => {
    const f = fixture();
    const headLease = f.state.reservations[0];
    if (!headLease) throw new Error("queue_lease_missing");
    const state = {
      ...f.state,
      reservations: [
        ...f.state.reservations,
        {
          ...headLease,
          claimId: "claim:head:effect" as const,
          subjectKey: "effect:composition:effect:head"
        }
      ]
    };
    const observation = {
      ...f.observation,
      tick: f.transition.beginsTick,
      actors: [...f.observation.actors.filter((a) => a.actorId !== f.producer.actorId), f.producer]
    };
    const result = new AiMacroManager(() => f.catalog).propose(observation, state);
    const demand = result.statePatch?.economyProduction?.demands?.find((d) => d.demandId === f.transition.demandId);
    expect(demand?.queuedIds).toEqual(["head"]);
    expect(demand?.acceptedNotObservedEffectIds).toEqual([]);
    const unseen = new AiMacroManager(() => f.catalog).propose(
      {
        ...observation,
        actors: observation.actors.map((a) =>
          a.actorId === f.producer.actorId
            ? {
                ...f.producer,
                queue: {
                  ...f.producer.queue,
                  value: { ...f.producer.queue.value, items: [{ ...f.head, effectId: undefined }] }
                }
              }
            : a
        )
      },
      state
    );
    expect(
      unseen.statePatch?.economyProduction?.demands?.find((d) => d.demandId === f.transition.demandId)
        ?.acceptedNotObservedEffectIds
    ).toHaveLength(1);
  });
});
