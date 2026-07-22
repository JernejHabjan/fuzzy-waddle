import { CampaignFaction, FactionType, type ProbableWaffleMapEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignMissionContent } from "../contracts/campaign-mission-content";
import { asCampaignContentId } from "../contracts/campaign-content-id";
import type { MissionActionDefinition } from "../contracts/mission-action-definition";
import type { MissionDialogueBundle } from "../contracts/mission-dialogue-bundle";
import type { MissionObjectiveDefinition } from "../contracts/mission-objective-definition";
import type { MissionPhaseDefinition, MissionTransitionDefinition } from "../contracts/mission-phase-definition";
import type { MissionTriggerDefinition } from "../contracts/mission-trigger-definition";
import { CampaignMissionRuntime, serializeCampaignMissionRuntimeState } from "./campaign-mission-runtime";
import type { CampaignWorldActionAdapter } from "./actions/campaign-action-runtime";
import type { CampaignWorldConditionAdapter } from "./conditions/campaign-condition-evaluator";
import { AOTA_CAMPAIGN_MISSIONS } from "../catalog/ashes-of-the-ancients-content";

const id = asCampaignContentId;

describe("CampaignMissionRuntime", () => {
  it("runs sequential entry, timer, objective, transition, reward, and outcome deterministically", () => {
    const start = phase("start", {
      entryActions: [action("start-timer", "start-clock", { timerId: id("clock"), durationTicks: 2 })],
      triggers: [
        trigger("timer-finished", {
          condition: { kind: "timer", timerId: id("clock"), state: "elapsed" },
          actions: [action("set-fact", "mark-ready", { factId: id("ready"), value: true })]
        })
      ],
      transitions: [transition("finish", "finish", { kind: "fact", factId: id("ready"), equals: true })]
    });
    const finish = phase("finish", {
      entryActions: [action("request-outcome", "win", { outcome: "victory", reasonId: id("mission-complete") })]
    });
    const objective: MissionObjectiveDefinition = {
      id: id("survive"),
      kind: "survive",
      titleTextId: id("survive-title"),
      reveal: { kind: "always" },
      complete: { kind: "fact", factId: id("ready"), equals: true },
      rewardIds: [id("survival-reward")],
      display: { announceReveal: true, announceCompletion: true, showInTracker: true }
    };
    const runtime = new CampaignMissionRuntime("ashes-of-the-ancients", mission([start, finish], [objective]));

    runtime.start(0);
    expect(runtime.state.status).toBe("running");
    expect(runtime.state.objectives["survive"]?.status).toBe("active");
    runtime.advanceTo(2);

    expect(runtime.state.status).toBe("victory");
    expect(runtime.state.completedPhaseIds).toEqual(["start"]);
    expect(runtime.state.activePhaseIds).toEqual(["finish"]);
    expect(runtime.state.objectives["survive"]?.status).toBe("completed");
    expect(runtime.state.claimedRewardIds).toEqual(["survival-reward"]);
    expect(runtime.claimOutcome()).toBe("victory");
    expect(runtime.claimOutcome()).toBeUndefined();
  });

  it("activates parallel branches and waits for every predecessor before a join", () => {
    const runtime = new CampaignMissionRuntime(
      "ashes-of-the-ancients",
      mission([
        phase("root", {
          mode: "parallel",
          transitions: [transition("to-left", "left"), transition("to-right", "right")]
        }),
        phase("left", { transitions: [transition("left-to-join", "join")] }),
        phase("right", { transitions: [transition("right-to-join", "join")] }),
        phase("join", {
          entryActions: [action("set-fact", "joined", { factId: id("joined"), value: true })]
        })
      ])
    );

    runtime.start(0);

    expect(runtime.state.completedPhaseIds).toEqual(["left", "right", "root"]);
    expect(runtime.state.activePhaseIds).toEqual(["join"]);
    expect(runtime.state.pendingPhaseIds).toEqual([]);
    expect(runtime.state.facts["joined"]).toBe(true);
  });

  it("orders event triggers by priority then stable id", () => {
    const runtime = new CampaignMissionRuntime(
      "ashes-of-the-ancients",
      mission([
        phase("start", {
          triggers: [
            trigger("b-trigger", {
              kind: "event",
              eventKinds: ["actor.killed"],
              actions: [action("set-counter", "set-two", { counterId: id("order"), value: 2 })]
            }),
            trigger("a-trigger", {
              kind: "event",
              eventKinds: ["actor.killed"],
              actions: [action("set-counter", "set-one", { counterId: id("order"), value: 1 })]
            })
          ]
        })
      ])
    );
    runtime.start(0);
    runtime.enqueueEvent({ tick: 1, kind: "actor.killed", sourceId: "actor-7" });
    runtime.advanceTo(1);

    expect(runtime.state.counters["order"]).toBe(2);
    expect(runtime.state.claimedTriggerIds).toEqual(["a-trigger", "b-trigger"]);
  });

  it("restores without replaying entry actions", () => {
    const content = mission([
      phase("start", {
        entryActions: [action("increment-counter", "enter", { counterId: id("entries"), amount: 1 })]
      })
    ]);
    const first = new CampaignMissionRuntime("ashes-of-the-ancients", content);
    first.start(5);
    const restored = new CampaignMissionRuntime("ashes-of-the-ancients", content, first.snapshot());

    restored.start(5);

    expect(restored.state.counters["entries"]).toBe(1);
    expect(restored.state.integrity.lastProcessedTick).toBe(5);
  });

  it("claims a checkpoint only after its required actions settle and requests its identified save", () => {
    const savedCheckpointIds: string[] = [];
    const adapter: CampaignWorldActionAdapter = {
      execute: (_context, definition) => {
        if (definition.kind === "create-checkpoint") savedCheckpointIds.push(definition.checkpointId);
        return { status: "completed" };
      }
    };
    const content: CampaignMissionContent = {
      ...mission([phase("start")]),
      checkpoints: [
        {
          id: id("first-safe-point"),
          titleTextId: id("first-safe-point-title"),
          trigger: { kind: "always" },
          requiredActions: [action("set-fact", "checkpoint-ready", { factId: id("safe"), value: true })],
          savePolicy: "when-stable",
          retryCleanupActions: [action("set-fact", "checkpoint-retry-cleanup", { factId: id("safe"), value: false })]
        }
      ]
    };
    const runtime = new CampaignMissionRuntime("ashes-of-the-ancients", content, undefined, {
      actionAdapter: adapter
    });

    runtime.start(0);

    expect(runtime.state.facts["safe"]).toBe(true);
    expect(runtime.state.claimedCheckpointIds).toEqual(["first-safe-point"]);
    expect(runtime.state.lastCheckpointId).toBe("first-safe-point");
    expect(savedCheckpointIds).toEqual(["first-safe-point"]);
    runtime.retryFromCheckpoint("first-safe-point", 0);
    expect(runtime.state.facts["safe"]).toBe(false);
  });

  it("persists deterministic alliance changes in synchronized mission state", () => {
    const content = {
      ...mission([
        phase("start", {
          entryActions: [
            action("update-alliance", "join-teams", {
              playerNumber: 1,
              otherPlayerNumber: 2,
              allied: true
            })
          ]
        })
      ]),
      participants: [
        {
          slotId: id("commander"),
          controller: "human" as const,
          faction: FactionType.Tivara,
          teamId: id("allies"),
          economy: "normal" as const,
          fogPolicy: "normal" as const
        },
        {
          slotId: id("enemy"),
          controller: "full-ai" as const,
          faction: FactionType.Skaduwee,
          teamId: id("enemy"),
          economy: "normal" as const,
          fogPolicy: "omniscient-ai" as const
        }
      ]
    } satisfies CampaignMissionContent;
    const adapter: CampaignWorldActionAdapter = { execute: () => ({ status: "completed" }) };
    const runtime = new CampaignMissionRuntime("ashes-of-the-ancients", content, undefined, {
      actionAdapter: adapter
    });

    runtime.start(0);
    expect(runtime.state.participantTeams).toEqual({ "1": 1, "2": 1 });
    const restored = new CampaignMissionRuntime("ashes-of-the-ancients", content, runtime.snapshot(), {
      actionAdapter: adapter
    });
    expect(restored.state.participantTeams).toEqual({ "1": 1, "2": 1 });
  });

  it("applies cooldown and edge firing policies on simulation ticks", () => {
    const runtime = new CampaignMissionRuntime(
      "ashes-of-the-ancients",
      mission([
        phase("start", {
          triggers: [
            trigger("arm", {
              kind: "event",
              eventKinds: ["arm"],
              actions: [action("set-fact", "set-armed", { factId: id("armed"), value: true })],
              firing: { kind: "repeatable", cooldownTicks: 0 },
              priority: 10
            }),
            trigger("disarm", {
              kind: "event",
              eventKinds: ["disarm"],
              actions: [action("set-fact", "clear-armed", { factId: id("armed"), value: false })],
              firing: { kind: "repeatable", cooldownTicks: 0 },
              priority: 10
            }),
            trigger("armed-edge", {
              condition: { kind: "fact", factId: id("armed"), equals: true },
              actions: [action("increment-counter", "edge-count", { counterId: id("edges"), amount: 1 })],
              firing: { kind: "edge" }
            }),
            trigger("pulse", {
              actions: [action("increment-counter", "pulse-count", { counterId: id("pulses"), amount: 1 })],
              firing: { kind: "repeatable", cooldownTicks: 2 }
            })
          ]
        })
      ])
    );
    runtime.start(0);
    runtime.enqueueEvent({ tick: 1, kind: "arm", sourceId: "test" });
    runtime.enqueueEvent({ tick: 3, kind: "disarm", sourceId: "test" });
    runtime.enqueueEvent({ tick: 4, kind: "arm", sourceId: "test" });

    runtime.advanceTo(5);

    expect(runtime.state.counters["edges"]).toBe(2);
    expect(runtime.state.counters["pulses"]).toBe(3);
  });

  it("produces byte-equivalent state for skipped and uninterrupted ticks", () => {
    const content = mission([
      phase("start", {
        entryActions: [action("start-timer", "clock", { timerId: id("clock"), durationTicks: 8 })],
        triggers: [
          trigger("pulse", {
            firing: { kind: "while", cadenceTicks: 2 },
            actions: [action("increment-counter", "count", { counterId: id("pulses"), amount: 1 })]
          })
        ]
      })
    ]);
    const skipped = new CampaignMissionRuntime("ashes-of-the-ancients", content);
    const uninterrupted = new CampaignMissionRuntime("ashes-of-the-ancients", content);
    skipped.start(0);
    uninterrupted.start(0);

    skipped.advanceTo(10);
    for (let tick = 1; tick <= 10; tick += 1) uninterrupted.advanceTo(tick);

    expect(serializeCampaignMissionRuntimeState(skipped.snapshot())).toBe(
      serializeCampaignMissionRuntimeState(uninterrupted.snapshot())
    );
    expect(JSON.stringify(skipped.snapshot())).toBe(JSON.stringify(uninterrupted.snapshot()));
  });

  it("fails closed with deterministic transition budget diagnostics", () => {
    const runtime = new CampaignMissionRuntime(
      "ashes-of-the-ancients",
      mission([
        phase("root", {
          mode: "parallel",
          transitions: [transition("to-left", "left"), transition("to-right", "right")]
        }),
        phase("left"),
        phase("right")
      ]),
      undefined,
      { maxTransitionsPerTick: 1 }
    );

    runtime.start(0);

    expect(runtime.state.status).toBe("failed");
    expect(runtime.state.integrity.diagnostic).toEqual({
      code: "transition-budget-exceeded",
      message: "Transition budget 1 exceeded",
      tick: 0,
      sourceId: "root"
    });
  });

  it("reports a deterministic diagnostic when invalid content attempts a phase cycle", () => {
    const runtime = new CampaignMissionRuntime(
      "ashes-of-the-ancients",
      mission([
        phase("a", { transitions: [transition("a-to-b", "b")] }),
        phase("b", { transitions: [transition("b-to-a", "a")] })
      ])
    );

    runtime.start(0);

    expect(runtime.state.status).toBe("failed");
    expect(runtime.state.integrity.diagnostic).toMatchObject({
      code: "invalid-runtime-state",
      tick: 0,
      sourceId: "a"
    });
  });

  it("rejects saved state from a different mission revision", () => {
    const content = mission([phase("start")]);
    const runtime = new CampaignMissionRuntime("ashes-of-the-ancients", content);
    const snapshot = runtime.snapshot();
    snapshot.missionRevision = 99;

    expect(() => new CampaignMissionRuntime("ashes-of-the-ancients", content, snapshot)).toThrow(
      "Campaign mission runtime identity mismatch"
    );
  });

  it("keeps deterministic runtime traces bounded", () => {
    const runtime = new CampaignMissionRuntime(
      "ashes-of-the-ancients",
      mission([
        phase("start", {
          triggers: [
            trigger("pulse", {
              actions: [action("increment-counter", "count", { counterId: id("pulses"), amount: 1 })],
              firing: { kind: "while", cadenceTicks: 1 }
            })
          ]
        })
      ])
    );
    runtime.start(0);

    runtime.advanceTo(150);

    expect(runtime.state.integrity.recentTrace).toHaveLength(128);
    expect(runtime.state.integrity.recentTrace.at(-1)).toMatchObject({ tick: 150, sourceId: "count" });
  });

  it("restores waiting action continuations without replaying their start", () => {
    const content = mission([
      phase("start", {
        entryActions: [action("wait-ticks", "wait-for-beat", { durationTicks: 3 })]
      })
    ]);
    const first = new CampaignMissionRuntime("ashes-of-the-ancients", content);
    first.start(0);
    expect(first.state.actionContinuations["wait-for-beat"]).toMatchObject({ startedAtTick: 0 });

    const restored = new CampaignMissionRuntime("ashes-of-the-ancients", content, first.snapshot());
    restored.advanceTo(2);
    expect(restored.state.actionContinuations["wait-for-beat"]).toBeDefined();
    restored.advanceTo(3);
    expect(restored.state.actionContinuations).toEqual({});
  });

  it("releases only phase-owned resources when their phase exits", () => {
    const releaseOwnedResources = jest.fn(() => []);
    const adapter: CampaignWorldActionAdapter = {
      execute: () => ({
        status: "completed",
        ownedResources: [{ resourceId: "bridge-lock", kind: "world-object", state: { value: false } }]
      }),
      releaseOwnedResources
    };
    const runtime = new CampaignMissionRuntime(
      "ashes-of-the-ancients",
      mission([
        phase("start", {
          entryActions: [action("toggle-world-object", "lock-bridge", { actorId: id("bridge"), value: false })],
          transitions: [transition("leave", "finish")]
        }),
        phase("finish")
      ]),
      undefined,
      { actionAdapter: adapter }
    );

    runtime.start(0);

    expect(releaseOwnedResources).toHaveBeenCalledWith(
      "phase:start:direct:lock-bridge",
      [expect.objectContaining({ resourceId: "bridge-lock" })],
      "phase-exited"
    );
    expect(runtime.state.ownedResources).toEqual({});
  });

  it("converts thrown world action errors into deterministic diagnostics", () => {
    const adapter: CampaignWorldActionAdapter = {
      execute: () => {
        throw new Error("bridge authority unavailable");
      }
    };
    const runtime = new CampaignMissionRuntime(
      "ashes-of-the-ancients",
      mission([
        phase("start", {
          entryActions: [action("toggle-world-object", "lock-bridge", { actorId: id("bridge"), value: false })]
        })
      ]),
      undefined,
      { actionAdapter: adapter }
    );

    expect(() => runtime.start(4)).not.toThrow();
    expect(runtime.state).toMatchObject({
      status: "failed",
      integrity: {
        diagnostic: {
          code: "action-failed",
          tick: 4,
          actionId: "lock-bridge",
          message: "Action 'lock-bridge' threw: bridge authority unavailable"
        }
      }
    });
  });

  it("converts thrown continuation cancellation errors into deterministic diagnostics", () => {
    const adapter: CampaignWorldActionAdapter = {
      execute: () => ({ status: "waiting", continuationState: { pending: true } }),
      cancel: () => {
        throw new Error("bridge cancellation unavailable");
      }
    };
    const runtime = new CampaignMissionRuntime(
      "ashes-of-the-ancients",
      mission([
        phase("start", {
          entryActions: [action("toggle-world-object", "lock-bridge", { actorId: id("bridge"), value: false })],
          transitions: [transition("leave", "finish")]
        }),
        phase("finish")
      ]),
      undefined,
      { actionAdapter: adapter }
    );

    expect(() => runtime.start(0)).not.toThrow();
    expect(runtime.state).toMatchObject({
      status: "failed",
      integrity: {
        diagnostic: {
          code: "action-failed",
          tick: 0,
          phaseId: "start",
          actionId: "lock-bridge",
          message: "Action 'lock-bridge' cancellation threw: bridge cancellation unavailable"
        }
      }
    });
  });

  it.each([
    ["skip", "running", false],
    ["wait", "running", true],
    ["fail-mission", "failed", false]
  ] as const)("applies the %s missing-reference policy", (policy, expectedStatus, waiting) => {
    const adapter: CampaignWorldActionAdapter = {
      execute: () => ({
        status: "failed",
        code: "missing-reference",
        message: "Bridge is missing",
        continuationState: { retryMissingReference: true }
      }),
      resume: () => ({ status: "waiting", continuationState: { retryMissingReference: true } })
    };
    const runtime = new CampaignMissionRuntime(
      "ashes-of-the-ancients",
      mission([
        phase("start", {
          entryActions: [
            {
              id: id("missing-bridge"),
              kind: "toggle-world-object",
              actorId: id("bridge"),
              value: false,
              missingReferencePolicy: policy
            }
          ]
        })
      ]),
      undefined,
      { actionAdapter: adapter }
    );

    runtime.start(0);

    expect(runtime.state.status).toBe(expectedStatus);
    expect(!!runtime.state.actionContinuations["missing-bridge"]).toBe(waiting);
    if (policy === "fail-mission") {
      expect(runtime.state.integrity.diagnostic).toMatchObject({
        code: "missing-reference",
        phaseId: "start",
        actionId: "missing-bridge"
      });
    }
  });

  it("executes a declared fallback for a missing world reference", () => {
    const adapter: CampaignWorldActionAdapter = {
      execute: () => ({ status: "failed", code: "missing-reference", message: "Missing actor" })
    };
    const runtime = new CampaignMissionRuntime(
      "ashes-of-the-ancients",
      mission([
        phase("start", {
          entryActions: [
            {
              id: id("try-bridge"),
              kind: "toggle-world-object",
              actorId: id("bridge"),
              value: false,
              missingReferencePolicy: "fallback",
              fallbackAction: action("set-fact", "mark-fallback", { factId: id("fallback-used"), value: true })
            }
          ]
        })
      ]),
      undefined,
      { actionAdapter: adapter }
    );

    runtime.start(0);

    expect(runtime.state.facts["fallback-used"]).toBe(true);
    expect(runtime.state.status).toBe("running");
  });

  it("passes deterministic co-op initiator context into event conditions", () => {
    const evaluate = jest.fn(() => true);
    const conditionAdapter: CampaignWorldConditionAdapter = { evaluate };
    const runtime = new CampaignMissionRuntime(
      "ashes-of-the-ancients",
      mission([
        phase("start", {
          triggers: [
            trigger("hero-created", {
              kind: "event",
              eventKinds: ["actor.created"],
              condition: { kind: "actor-exists", actorId: id("hero") },
              actions: [action("set-fact", "mark-created", { factId: id("created"), value: true })]
            })
          ]
        })
      ]),
      undefined,
      { conditionAdapter }
    );
    runtime.start(0);
    runtime.enqueueEvent({
      tick: 1,
      kind: "actor.created",
      sourceId: "hero",
      initiatorPlayerNumber: 2,
      initiatorFaction: "skaduwee"
    });
    runtime.advanceTo(1);

    expect(runtime.state.facts["created"]).toBe(true);
    expect(evaluate.mock.calls.some(([context]) => context.event?.initiatorPlayerNumber === 2)).toBe(true);
  });

  it("reacts to objective and encounter changes in their owning simulation tick", () => {
    const objective: MissionObjectiveDefinition = {
      id: id("survive"),
      kind: "primary",
      titleTextId: id("survive-title"),
      reveal: { kind: "never" },
      complete: { kind: "never" },
      display: { announceReveal: false, announceCompletion: false, showInTracker: true }
    };
    const runtime = new CampaignMissionRuntime(
      "ashes-of-the-ancients",
      mission(
        [
          phase("start", {
            entryActions: [
              action("set-objective-state", "activate-objective", { objectiveId: id("survive"), state: "active" }),
              action("set-encounter-state", "start-ambush", { encounterId: id("ambush"), state: "active" })
            ],
            triggers: [
              trigger("objective-signal", {
                kind: "event",
                eventKinds: ["objective.changed"],
                actions: [action("increment-counter", "objective-count", { counterId: id("signals"), amount: 1 })]
              }),
              trigger("encounter-signal", {
                kind: "event",
                eventKinds: ["encounter.changed"],
                actions: [action("increment-counter", "encounter-count", { counterId: id("signals"), amount: 1 })]
              })
            ]
          })
        ],
        [objective]
      )
    );

    runtime.start(7);

    expect(runtime.state.counters["signals"]).toBe(2);
    expect(runtime.state.integrity.lastProcessedTick).toBe(7);
    expect(runtime.state.pendingEvents).toEqual([]);
  });

  it("routes checklist actions and conditions through objective invariants in the same tick", () => {
    const objective: MissionObjectiveDefinition = {
      id: id("learn-selection"),
      kind: "tutorial",
      titleTextId: id("learn-selection-title"),
      reveal: { kind: "always" },
      complete: {
        kind: "objective-checklist",
        objectiveId: id("learn-selection"),
        checklistId: id("select-unit"),
        state: "completed"
      },
      checklist: [{ id: id("select-unit"), textId: id("select-unit-text"), complete: { kind: "never" } }],
      display: { announceReveal: true, announceCompletion: true, showInTracker: true }
    };
    const runtime = new CampaignMissionRuntime(
      "ashes-of-the-ancients",
      mission(
        [
          phase("start", {
            entryActions: [
              action("set-objective-checklist-state", "finish-selection", {
                objectiveId: id("learn-selection"),
                checklistId: id("select-unit"),
                state: "completed"
              })
            ],
            triggers: [
              trigger("checklist-event", {
                kind: "event",
                eventKinds: ["objective.changed"],
                condition: {
                  kind: "objective-checklist",
                  objectiveId: id("learn-selection"),
                  checklistId: id("select-unit"),
                  state: "completed"
                },
                actions: [action("set-fact", "mark-tutorial-signal", { factId: id("tutorial-signalled"), value: true })]
              })
            ]
          })
        ],
        [objective]
      )
    );

    const result = runtime.start(9);

    expect(runtime.state.objectives["learn-selection"]).toMatchObject({
      status: "completed",
      earlyCompleted: true,
      completedAtTick: 9,
      checklist: { "select-unit": { status: "completed", updatedAtTick: 9 } }
    });
    expect(result.effects.filter((effect) => effect.kind === "objective-changed")).toHaveLength(2);
    expect(runtime.state.facts["tutorial-signalled"]).toBe(true);
  });

  it.each([false, true])("runs the same deterministic cinematic finalize path when skipped is %s", (skipped) => {
    const bundle = dialogueBundle({
      gameplayPrelude: [action("set-fact", "cinematic-prelude", { factId: id("prepared"), value: true })],
      gameplayFinalize: [
        action("set-fact", "cinematic-finalize", { factId: id("finalized"), value: true }),
        action("increment-counter", "count-cinematic-finalize", { counterId: id("finalize-count"), amount: 1 })
      ]
    });
    const adapter = presentationAdapter();
    const runtime = new CampaignMissionRuntime(
      "ashes-of-the-ancients",
      mission([
        phase("start", {
          entryActions: [
            action("start-cinematic", "play-intro", {
              cinematicId: id("intro"),
              waitForCompletion: true
            })
          ]
        })
      ]),
      undefined,
      { actionAdapter: adapter, dialogue: bundle }
    );

    runtime.start(0);
    expect(runtime.state.facts).toMatchObject({ prepared: true });
    expect(runtime.state.facts["finalized"]).toBeUndefined();
    expect(runtime.state.cinematics["intro"]).toMatchObject({ stage: "presenting", finalizeRequested: false });

    runtime.enqueueEvent({
      tick: 1,
      kind: "cinematic.finished",
      sourceId: "intro",
      payload: { cinematicId: "intro", skipped }
    });
    runtime.enqueueEvent({
      tick: 1,
      kind: "cinematic.finished",
      sourceId: "intro-racing-finish",
      payload: { cinematicId: "intro", skipped: !skipped }
    });
    runtime.advanceTo(1);

    expect(runtime.state.facts).toMatchObject({ prepared: true, finalized: true });
    expect(runtime.state.counters["finalize-count"]).toBe(1);
    expect(runtime.state.cinematics["intro"]).toMatchObject({
      stage: "completed",
      finalizeRequested: true,
      finalized: true,
      skipped
    });
    expect(runtime.state.activeCinematicId).toBeUndefined();
    expect(runtime.state.actionContinuations).toEqual({});
  });

  it("fails closed when a cinematic action cannot be expanded", () => {
    const runtime = new CampaignMissionRuntime(
      "ashes-of-the-ancients",
      mission([
        phase("start", {
          entryActions: [action("start-cinematic", "play-missing", { cinematicId: id("missing") })]
        })
      ])
    );

    expect(() => runtime.start(0)).not.toThrow();
    expect(runtime.state.status).toBe("failed");
    expect(runtime.state.integrity.diagnostic).toMatchObject({
      code: "action-failed",
      actionId: "play-missing"
    });
  });

  it("restores cinematic prelude, presenting, and finalizing stages without replaying completed actions", () => {
    const bundle = dialogueBundle({
      gameplayPrelude: [
        action("increment-counter", "count-prelude", { counterId: id("prelude-count"), amount: 1 }),
        action("wait-ticks", "wait-prelude", { durationTicks: 2 })
      ],
      gameplayFinalize: [
        action("increment-counter", "count-finalize", { counterId: id("finalize-count"), amount: 1 }),
        action("wait-ticks", "wait-finalize", { durationTicks: 2 })
      ]
    });
    const content = mission([
      phase("start", {
        entryActions: [action("start-cinematic", "play-intro", { cinematicId: id("intro") })]
      })
    ]);
    const options = { actionAdapter: presentationAdapter(), dialogue: bundle };
    const prelude = new CampaignMissionRuntime("ashes-of-the-ancients", content, undefined, options);
    prelude.start(0);
    expect(prelude.state.cinematics["intro"]?.stage).toBe("prelude");

    const presenting = new CampaignMissionRuntime("ashes-of-the-ancients", content, prelude.snapshot(), options);
    presenting.advanceTo(2);
    expect(presenting.state.cinematics["intro"]?.stage).toBe("presenting");
    expect(presenting.state.counters["prelude-count"]).toBe(1);
    presenting.enqueueEvent({
      tick: 3,
      kind: "cinematic.finished",
      sourceId: "intro",
      payload: { cinematicId: "intro", skipped: false }
    });
    presenting.advanceTo(3);
    expect(presenting.state.cinematics["intro"]?.stage).toBe("finalizing");

    const finalizing = new CampaignMissionRuntime("ashes-of-the-ancients", content, presenting.snapshot(), options);
    finalizing.advanceTo(5);
    expect(finalizing.state.cinematics["intro"]?.stage).toBe("completed");
    expect(finalizing.state.counters).toMatchObject({ "prelude-count": 1, "finalize-count": 1 });
  });

  it("restores a blocking dialogue acknowledgement by owner token without duplicating history", () => {
    const content = mission([
      phase("start", {
        entryActions: [
          action("start-dialogue", "play-greeting", {
            lineId: id("greeting"),
            waitForAcknowledgement: true
          })
        ]
      })
    ]);
    const adapter: CampaignWorldActionAdapter = {
      execute: (_context, definition) =>
        definition.kind === "start-dialogue"
          ? { status: "waiting", continuationState: { lineId: definition.lineId } }
          : { status: "completed" },
      resume: (context, definition, continuationState) =>
        definition.kind === "start-dialogue" &&
        context.state.dialoguePresentations[context.ownerToken]?.status === "acknowledged"
          ? { status: "completed" }
          : { status: "waiting", continuationState }
    };
    const dialogue: MissionDialogueBundle = {
      schemaVersion: 1,
      missionId: "dreams",
      speakers: [{ id: id("narrator"), nameTextId: id("narrator-name") }],
      texts: [{ id: id("narrator-name"), text: "Narrator" }],
      lines: [
        {
          id: id("greeting"),
          speakerId: id("narrator"),
          textId: id("greeting-text"),
          text: "Welcome.",
          delivery: "blocking"
        }
      ],
      cinematics: []
    };
    const first = new CampaignMissionRuntime("ashes-of-the-ancients", content, undefined, {
      actionAdapter: adapter,
      dialogue
    });
    first.start(0);
    const ownerToken = "phase:start:direct:play-greeting";
    expect(first.state.dialogueHistory).toEqual([{ sequence: 1, tick: 0, lineId: "greeting", ownerToken }]);

    const restored = new CampaignMissionRuntime("ashes-of-the-ancients", content, first.snapshot(), {
      actionAdapter: adapter,
      dialogue
    });
    restored.enqueueEvent({
      tick: 1,
      kind: "dialogue.acknowledged",
      sourceId: "greeting",
      payload: { lineId: "greeting", ownerToken }
    });
    restored.advanceTo(1);

    expect(restored.state.dialoguePresentations[ownerToken]).toMatchObject({
      status: "acknowledged",
      acknowledgedAtTick: 1
    });
    expect(restored.state.dialogueHistory).toHaveLength(1);
    expect(restored.state.actionContinuations).toEqual({});
  });

  it("records local presentation progress without exposing it to deterministic mission triggers", () => {
    const runtime = new CampaignMissionRuntime(
      "ashes-of-the-ancients",
      mission([
        phase("start", {
          triggers: [
            trigger("local-cue-trigger", {
              kind: "event",
              eventKinds: ["dialogue.presented", "cinematic.cue"],
              actions: [
                action("set-fact", "mutate-from-local-cue", {
                  factId: id("local-cue-mutated-gameplay"),
                  value: true
                })
              ]
            })
          ]
        })
      ])
    );
    runtime.start(0);
    runtime.enqueueEvent({
      tick: 1,
      kind: "dialogue.presented",
      sourceId: "greeting",
      payload: { lineId: "greeting", ownerToken: "mission:greeting" }
    });
    runtime.enqueueEvent({
      tick: 1,
      kind: "cinematic.cue",
      sourceId: "intro",
      payload: { cinematicId: "intro", cueIndex: 2 }
    });
    runtime.advanceTo(1);

    expect(runtime.state.dialoguePresentations["mission:greeting"]?.status).toBe("presenting");
    expect(runtime.state.facts["local-cue-mutated-gameplay"]).toBeUndefined();
    expect(runtime.state.pendingEvents).toEqual([]);
  });
});

function presentationAdapter(): CampaignWorldActionAdapter {
  return {
    execute: (_context, definition) =>
      definition.kind === "start-cinematic"
        ? { status: "waiting", continuationState: { cinematicId: definition.cinematicId } }
        : { status: "completed" },
    resume: (context, definition, continuationState) =>
      definition.kind === "start-cinematic" && context.state.cinematics[definition.cinematicId]?.finalizeRequested
        ? { status: "completed" }
        : { status: "waiting", continuationState }
  };
}

function dialogueBundle(overrides: Partial<MissionDialogueBundle["cinematics"][number]> = {}): MissionDialogueBundle {
  return {
    schemaVersion: 1,
    missionId: "dreams",
    speakers: [],
    lines: [],
    cinematics: [
      {
        id: id("intro"),
        mode: "paused",
        seenSkipPolicy: "tap",
        timeline: [],
        gameplayFinalizeActionIds: [],
        ...overrides
      }
    ]
  };
}

function mission(
  phases: readonly MissionPhaseDefinition[],
  objectives: readonly MissionObjectiveDefinition[] = []
): CampaignMissionContent {
  return {
    schemaVersion: 1,
    id: "dreams",
    chapterId: "prologue",
    revision: 1,
    mapId: 1 as ProbableWaffleMapEnum,
    prerequisites: [],
    catalogue: {
      order: 1,
      title: "Test mission",
      faction: CampaignFaction.Tivara,
      environment: "test",
      briefing: "test",
      objectiveSummaries: []
    },
    implementation: AOTA_CAMPAIGN_MISSIONS[0]!.implementation,
    participants: [],
    progressionAllowance: { loadoutSlotCount: 0 },
    initialState: {
      activePhaseIds: phases.length > 0 ? [phases[0]!.id] : [],
      facts: [],
      counters: [],
      timers: []
    },
    phases,
    objectives,
    checkpoints: [],
    difficulty: { story: {}, normal: {}, hard: {} },
    contentStatus: "playable"
  };
}

function phase(phaseId: string, overrides: Partial<Omit<MissionPhaseDefinition, "id">> = {}): MissionPhaseDefinition {
  return {
    id: id(phaseId),
    mode: "sequential",
    entryActions: [],
    exitActions: [],
    triggers: [],
    transitions: [],
    ...overrides
  };
}

function transition(
  transitionId: string,
  targetId: string,
  condition: MissionTransitionDefinition["condition"] = { kind: "always" }
): MissionTransitionDefinition {
  return {
    id: id(transitionId),
    targetPhaseIds: [id(targetId)],
    condition,
    actions: [],
    priority: 0
  };
}

function trigger(
  triggerId: string,
  overrides: Partial<Omit<MissionTriggerDefinition, "id">> = {}
): MissionTriggerDefinition {
  return {
    id: id(triggerId),
    kind: "condition",
    condition: { kind: "always" },
    actions: [],
    firing: { kind: "once" },
    priority: 0,
    ...overrides
  };
}

function action<TKind extends MissionActionDefinition["kind"]>(
  kind: TKind,
  actionId: string,
  data: Omit<Extract<MissionActionDefinition, { kind: TKind }>, "id" | "kind">
): Extract<MissionActionDefinition, { kind: TKind }> {
  return { id: id(actionId), kind, ...data } as Extract<MissionActionDefinition, { kind: TKind }>;
}
