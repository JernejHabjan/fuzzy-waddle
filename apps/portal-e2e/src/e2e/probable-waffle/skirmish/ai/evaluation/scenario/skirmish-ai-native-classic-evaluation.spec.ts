import { expect, test } from "@playwright/test";
import type { nativeScenarioContext } from "../../contracts/skirmish-ai-native-scenario-context";
import { evaluateNativeClassic } from "./skirmish-ai-native-classic-evaluation";

function evidenceContext(confidence: number[]) {
  return {
    roles: { "contact-group": "contact" },
    role: (name: string) => {
      if (name !== "contact-group") throw new Error(`unexpected_test_role:${name}`);
      return "contact";
    },
    frames: confidence.map((confidencePermille, index) => ({
      tick: 100 + index * 20,
      decision: {
        economyProduction: {
          adaptation: {
            evidence: [{ sourceContactId: "contact", kind: "flyer", observedTick: 80, confidencePermille }]
          }
        }
      }
    }))
  } as unknown as ReturnType<typeof nativeScenarioContext>;
}

function scoutingAnswerContext(attackTick: number, appliedAttack: boolean) {
  const targetId = "contact",
    scoutId = "scout",
    scoutIntent = {
      kind: "scout",
      planId: "plan:squad:scout:primary",
      effectId: "effect:scout-order",
      actorIds: [scoutId]
    },
    attackIntent = {
      kind: "attack",
      planId: "plan:squad:attack:primary",
      effectId: "effect:attack-order",
      actorIds: ["attacker"],
      targetActorId: targetId
    },
    frames = [
      { tick: 20, state: "open", visible: false, intents: [scoutIntent] },
      { tick: 40, state: "answered", visible: true, intents: [] },
      { tick: attackTick, state: "answered", visible: true, intents: [attackIntent] }
    ].map((frame) => ({
      tick: frame.tick,
      tacticalBoundary: { searchPoints: [{ pointId: "search-point", visible: frame.visible }] },
      decision: {
        acceptedIntents: frame.intents,
        missionState: {
          squads: [{ squadId: "squad:scout:primary", objectiveId: "question:search" }],
          knowledge: { questions: [{ questionId: "question:search", state: frame.state }] }
        },
        input: {
          observation: {
            actors: [{ actorId: targetId, visibility: frame.visible ? "visible" : "hidden" }]
          }
        },
        economyProduction: { adaptation: { evidence: [] } }
      }
    }));
  const movement = {
    executionId: 1,
    callerAttributed: true,
    gaps: [],
    returned: "true",
    arrival: "original_destination",
    started: { tick: 20 },
    observations: [
      {
        tick: 20,
        spatial: { executionId: 1, caller: { order: { commandContext: { execution: { effectId: "scout-order" } } } } }
      },
      { tick: 40, spatial: { phase: "arrived" } }
    ]
  };
  const facts = appliedAttack
    ? [
        {
          tick: attackTick,
          kind: "spatial_authority",
          spatial: {
            kind: "route_order",
            sceneActive: true,
            snapshotRestoreInProgress: false,
            gaps: [],
            source: { playerNumber: 2, actorId: "attacker" },
            order: {
              orderType: "Attack",
              target: { actorId: targetId },
              commandContext: { execution: { source: "ai", effectId: "attack-order" } }
            }
          }
        }
      ]
    : [];
  return {
    roles: { "contact-group": targetId },
    role: () => targetId,
    frames,
    facts,
    capture: { facts: [] },
    arrived: () => [movement]
  } as unknown as ReturnType<typeof nativeScenarioContext>;
}

test("C-04 accepts confidence decay for unchanged dated evidence", () => {
  expect(evaluateNativeClassic("C-04", "confidence-control", evidenceContext([700, 300]))).not.toContain(
    "classic_unchanged_dated_evidence_inflated_confidence"
  );
});

test("C-04 rejects confidence inflation for unchanged dated evidence", () => {
  expect(evaluateNativeClassic("C-04", "confidence-control", evidenceContext([300, 700]))).toContain(
    "classic_unchanged_dated_evidence_inflated_confidence"
  );
});

test("C-04 accepts a scout answer only after the native scene applies its changed attack order", () => {
  expect(evaluateNativeClassic("C-04", "answered", scoutingAnswerContext(60, true))).not.toContain(
    "classic_relevant_scout_answer_has_no_changed_native_decision"
  );
  expect(evaluateNativeClassic("C-04", "answered", scoutingAnswerContext(60, false))).toContain(
    "classic_relevant_scout_answer_has_no_changed_native_decision"
  );
  expect(evaluateNativeClassic("C-04", "answered", scoutingAnswerContext(200, true))).toContain(
    "classic_relevant_scout_answer_has_no_changed_native_decision"
  );
});
