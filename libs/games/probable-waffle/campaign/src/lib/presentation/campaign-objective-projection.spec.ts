import { CampaignFaction } from "@fuzzy-waddle/probable-waffle-protocol";
import { asCampaignContentId } from "../contracts/campaign-content-id";
import type { MissionDialogueBundle } from "../contracts/mission-dialogue-bundle";
import type { MissionObjectiveDefinition } from "../contracts/mission-objective-definition";
import { createCampaignMissionRuntimeState } from "../runtime/campaign-mission-runtime";
import { createDefaultCampaignInputPromptRegistry } from "./campaign-input-prompt-registry";
import { buildCampaignObjectiveProjection } from "./campaign-objective-projection";
import { AOTA_CAMPAIGN_MISSIONS } from "../catalog/ashes-of-the-ancients-content";

const id = asCampaignContentId;

describe("campaign objective projection", () => {
  it("hides unrevealed text and keeps completed or expired optional objectives visible", () => {
    const hidden = objective("secret", "hidden");
    const completed = objective("bonus", "optional");
    const expired = objective("expired", "optional");
    const state = createCampaignMissionRuntimeState("ashes-of-the-ancients", mission([hidden, completed, expired]));
    state.objectives["bonus"]!.status = "completed";
    state.objectives["expired"]!.status = "impossible";
    state.missionMessageHistory.push({
      sequence: 1,
      tick: 1,
      kind: "objective",
      sourceId: "secret",
      textId: "secret-title",
      state: "active"
    });

    const projection = buildCampaignObjectiveProjection([hidden, completed, expired], dialogue(), state, {
      inputMode: "keyboard-mouse",
      inputPrompts: createDefaultCampaignInputPromptRegistry()
    });

    expect(projection.questLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "optional",
          entries: expect.arrayContaining([expect.objectContaining({ type: "undiscovered", title: "Undiscovered quest" })])
        })
      ])
    );
    expect(projection.history).toEqual([]);
    expect(projection.tracker.map((item) => [item.id, item.statusText])).toEqual([
      ["bonus", "Completed"],
      ["expired", "Expired"]
    ]);
  });

  it("keeps authored order while placing revealed failures in Main and redacting hidden identifiers", () => {
    const primary = objective("primary", "primary");
    const hiddenFailure = objective("secret-failure", "failure");
    const optional = objective("optional", "optional");
    const state = createCampaignMissionRuntimeState("ashes-of-the-ancients", mission([primary, hiddenFailure, optional]));
    state.objectives.primary!.status = "active";
    state.objectives.optional!.status = "active";
    const projection = buildCampaignObjectiveProjection([primary, hiddenFailure, optional], dialogue(), state, {
      inputMode: "keyboard-mouse", inputPrompts: createDefaultCampaignInputPromptRegistry()
    });

    const main = projection.questLog.find((section) => section.id === "main")!;
    expect(main.entries.map((entry) => entry.type === "objective" ? entry.objective.id : entry.title)).toEqual([
      "primary", "Undiscovered quest"
    ]);
    expect(JSON.stringify(main.entries)).not.toContain("secret-failure");
  });

  it.each([
    ["keyboard-mouse", "Left-click a unit to select it"],
    ["touch", "Tap a unit to select it"]
  ] as const)("selects %s tutorial prompt text", (inputMode, expected) => {
    const tutorial = objective("select", "tutorial", {
      checklist: [
        {
          id: id("select-unit"),
          textId: id("select-unit-text"),
          complete: { kind: "never" },
          inputPrompt: { action: "selection.primary" }
        }
      ]
    });
    const state = createCampaignMissionRuntimeState("ashes-of-the-ancients", mission([tutorial]));
    state.objectives["select"]!.status = "active";

    const projection = buildCampaignObjectiveProjection([tutorial], dialogue(), state, {
      inputMode,
      inputPrompts: createDefaultCampaignInputPromptRegistry()
    });

    expect(projection.tracker[0]?.checklist[0]?.inputPrompt?.text).toBe(expected);
  });

  it("collapses a completed tutorial hint after save restoration when policy permits", () => {
    const tutorial = objective("select", "tutorial", {
      checklist: [
        {
          id: id("select-unit"),
          textId: id("select-unit-text"),
          complete: { kind: "never" },
          inputPrompt: { action: "selection.primary", seenPolicy: "collapse" }
        }
      ]
    });
    const state = createCampaignMissionRuntimeState("ashes-of-the-ancients", mission([tutorial]));
    state.objectives["select"]!.status = "active";
    state.objectives["select"]!.checklist["select-unit"]!.status = "completed";

    const projection = buildCampaignObjectiveProjection([tutorial], dialogue(), state, {
      inputMode: "touch",
      inputPrompts: createDefaultCampaignInputPromptRegistry()
    });

    expect(projection.tracker[0]?.checklist[0]?.inputPrompt).toMatchObject({
      collapsed: true,
      text: "Select a unit"
    });
  });
});

function objective(
  objectiveId: string,
  kind: MissionObjectiveDefinition["kind"],
  overrides: Partial<MissionObjectiveDefinition> = {}
): MissionObjectiveDefinition {
  return {
    id: id(objectiveId),
    kind,
    titleTextId: id(`${objectiveId}-title`),
    reveal: { kind: "never" },
    complete: { kind: "never" },
    display: { announceReveal: true, announceCompletion: true, showInTracker: true },
    ...overrides
  };
}

function dialogue(): MissionDialogueBundle {
  return {
    schemaVersion: 1,
    missionId: "dreams",
    texts: ["secret-title", "bonus-title", "expired-title", "select-title", "select-unit-text"].map((textId) => ({
      id: id(textId),
      text: textId.replaceAll("-", " ")
    })),
    speakers: [],
    lines: [],
    cinematics: []
  };
}

function mission(objectives: readonly MissionObjectiveDefinition[]) {
  return {
    schemaVersion: 1 as const,
    id: "dreams" as const,
    chapterId: "prologue" as const,
    revision: 1,
    mapKey: "MapSandbox",
    prerequisites: [],
    catalogue: {
      order: 1,
      title: "Test",
      faction: CampaignFaction.Tivara,
      environment: "test",
      briefing: "test",
      objectiveSummaries: []
    },
    implementation: AOTA_CAMPAIGN_MISSIONS[0]!.implementation,
    participants: [],
    progressionAllowance: { loadoutSlotCount: 0 },
    initialState: { activePhaseIds: [], facts: [], counters: [], timers: [] },
    phases: [],
    objectives,
    checkpoints: [],
    difficulty: { story: {}, normal: {}, hard: {} },
    contentStatus: "skeleton" as const
  };
}
