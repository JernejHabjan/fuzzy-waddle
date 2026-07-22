import type {
  CampaignMissionMessageHistoryEntry,
  CampaignMissionObjectiveChecklistStatus,
  CampaignMissionObjectiveStatus,
  CampaignMissionRuntimeState
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionDialogueBundle } from "../contracts/mission-dialogue-bundle";
import type { MissionObjectiveId, MissionTextId } from "../contracts/campaign-content-id";
import type { CampaignObjectiveKind } from "../contracts/campaign-content-kinds";
import type {
  MissionObjectiveDefinition,
  MissionObjectiveFocusDefinition,
  MissionSemanticInputAction
} from "../contracts/mission-objective-definition";
import type {
  CampaignInputMode,
  CampaignInputPromptPresentation,
  CampaignInputPromptRegistry
} from "./campaign-input-prompt-registry";

export interface CampaignObjectiveChecklistProjection {
  readonly id: string;
  readonly text: string;
  readonly status: CampaignMissionObjectiveChecklistStatus;
  readonly progressText?: string;
  readonly inputPrompt?: CampaignInputPromptPresentation;
}

export interface CampaignObjectiveProjectionItem {
  readonly id: MissionObjectiveId;
  readonly kind: CampaignObjectiveKind;
  readonly status: CampaignMissionObjectiveStatus;
  readonly statusText: string;
  readonly title: string;
  readonly description?: string;
  readonly earlyCompleted: boolean;
  readonly checklist: readonly CampaignObjectiveChecklistProjection[];
  readonly focus?: MissionObjectiveFocusDefinition;
}

export interface CampaignMissionHistoryProjectionItem {
  readonly sequence: number;
  readonly tick: number;
  readonly kind: CampaignMissionMessageHistoryEntry["kind"];
  readonly sourceId: string;
  readonly text: string;
  readonly state?: CampaignMissionMessageHistoryEntry["state"];
}

export interface CampaignObjectiveProjection {
  readonly tracker: readonly CampaignObjectiveProjectionItem[];
  readonly questLog: Readonly<Record<CampaignObjectiveKind, readonly CampaignObjectiveProjectionItem[]>>;
  readonly history: readonly CampaignMissionHistoryProjectionItem[];
}

export interface CampaignObjectiveProjectionOptions {
  readonly inputMode: CampaignInputMode;
  readonly seenInputActions?: ReadonlySet<MissionSemanticInputAction>;
  readonly inputPrompts: CampaignInputPromptRegistry;
}

export function buildCampaignObjectiveProjection(
  definitions: readonly MissionObjectiveDefinition[],
  dialogue: MissionDialogueBundle,
  state: CampaignMissionRuntimeState,
  options: CampaignObjectiveProjectionOptions
): CampaignObjectiveProjection {
  const text = createMissionTextResolver(dialogue);
  const hiddenObjectiveIds = new Set(
    definitions
      .filter((definition) => state.objectives[definition.id]?.status === "hidden")
      .map((definition) => String(definition.id))
  );
  const visible = definitions.flatMap((definition) => {
    const runtime = state.objectives[definition.id];
    if (!runtime || runtime.status === "hidden") return [];
    return [
      {
        id: definition.id,
        kind: definition.kind,
        status: runtime.status,
        statusText: objectiveStatusText(definition.kind, runtime.status),
        title: text(definition.titleTextId),
        description: definition.descriptionTextId ? text(definition.descriptionTextId) : undefined,
        earlyCompleted: runtime.earlyCompleted,
        checklist: (definition.checklist ?? []).map((checklist) => {
          const checklistState = runtime.checklist[checklist.id];
          const collapsed =
            checklist.inputPrompt?.seenPolicy === "collapse" &&
            (checklistState?.status === "completed" || !!options.seenInputActions?.has(checklist.inputPrompt.action));
          return {
            id: checklist.id,
            text: text(checklist.textId),
            status: checklistState?.status ?? "pending",
            progressText:
              checklist.progress && checklistState
                ? formatProgress(checklistState.current ?? 0, checklist.progress.target, checklist.progress.display)
                : undefined,
            inputPrompt: checklist.inputPrompt
              ? options.inputPrompts.resolve(checklist.inputPrompt.action, options.inputMode, collapsed)
              : undefined
          };
        }),
        focus: definition.display.focus
      } satisfies CampaignObjectiveProjectionItem
    ];
  });
  const questLog: Record<CampaignObjectiveKind, CampaignObjectiveProjectionItem[]> = {
    primary: [],
    secondary: [],
    optional: [],
    hidden: [],
    tutorial: [],
    failure: []
  };
  for (const objective of visible) questLog[objective.kind].push(objective);
  return {
    tracker: visible.filter((objective) => {
      const definition = definitions.find((candidate) => candidate.id === objective.id)!;
      return (
        definition.display.showInTracker &&
        (objective.status === "active" ||
          (definition.kind === "optional" &&
            (objective.status === "completed" || objective.status === "failed" || objective.status === "impossible")))
      );
    }),
    questLog,
    history: state.missionMessageHistory
      .filter((entry) => !hiddenObjectiveIds.has(entry.sourceId))
      .map((entry) => ({ ...entry, text: text(entry.textId as MissionTextId) }))
  };
}

export function createMissionTextResolver(dialogue: MissionDialogueBundle): (id: MissionTextId) => string {
  const texts = new Map<MissionTextId, string>();
  for (const entry of dialogue.texts ?? []) texts.set(entry.id, entry.text);
  for (const line of dialogue.lines) texts.set(line.textId, line.text);
  return (id) => texts.get(id) ?? id;
}

function objectiveStatusText(kind: CampaignObjectiveKind, status: CampaignMissionObjectiveStatus): string {
  if (status === "impossible") return kind === "optional" ? "Expired" : "Impossible";
  return status[0]!.toUpperCase() + status.slice(1);
}

function formatProgress(current: number, target: number, display: "count" | "percentage"): string {
  if (display === "count") return `${Math.min(current, target)} / ${target}`;
  if (target <= 0) return "100%";
  return `${Math.round(Math.max(0, Math.min(1, current / target)) * 100)}%`;
}
