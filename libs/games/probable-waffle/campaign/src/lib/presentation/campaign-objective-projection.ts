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

/**
 * Defines the structured campaign objective checklist projection contract for this module. Its declared
 * surface makes id, text, status, progress text, input prompt explicit to every consumer. Use this shared
 * shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignObjectiveChecklistProjection {
  /**
   * stable id used by {@link CampaignObjectiveChecklistProjection} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly id: string;
  /**
   * human-facing text for {@link CampaignObjectiveChecklistProjection}. It supports UI, narration, or
   * diagnostics and must not be used as the stable identity of the record.
   */
  readonly text: string;
  /**
   * discriminator for {@link CampaignObjectiveChecklistProjection}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly status: CampaignMissionObjectiveChecklistStatus;
  /**
   * Optional human-facing progress text for {@link CampaignObjectiveChecklistProjection}. It supports UI,
   * narration, or diagnostics and must not be used as the stable identity of the record.
   */
  readonly progressText?: string;
  /**
   * Optional input prompt value carried by {@link CampaignObjectiveChecklistProjection}. Its declared type is
   * the compatibility boundary for producers, validators, and consumers; do not replace it with a broader
   * inferred shape.
   */
  readonly inputPrompt?: CampaignInputPromptPresentation;
}

/**
 * Defines the structured campaign objective projection item contract for this module. Its declared surface
 * makes id, kind, status, status text, title explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignObjectiveProjectionItem {
  /**
   * stable id used by {@link CampaignObjectiveProjectionItem} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly id: MissionObjectiveId;
  /**
   * discriminator for {@link CampaignObjectiveProjectionItem}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly kind: CampaignObjectiveKind;
  /**
   * discriminator for {@link CampaignObjectiveProjectionItem}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly status: CampaignMissionObjectiveStatus;
  /**
   * human-facing status text for {@link CampaignObjectiveProjectionItem}. It supports UI, narration, or
   * diagnostics and must not be used as the stable identity of the record.
   */
  readonly statusText: string;
  /**
   * human-facing title for {@link CampaignObjectiveProjectionItem}. It supports UI, narration, or diagnostics
   * and must not be used as the stable identity of the record.
   */
  readonly title: string;
  /**
   * Optional human-facing description for {@link CampaignObjectiveProjectionItem}. It supports UI, narration, or
   * diagnostics and must not be used as the stable identity of the record.
   */
  readonly description?: string;
  /**
   * early completed value carried by {@link CampaignObjectiveProjectionItem}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly earlyCompleted: boolean;
  /**
   * collection value on {@link CampaignObjectiveProjectionItem}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly checklist: readonly CampaignObjectiveChecklistProjection[];
  /**
   * Optional focus value carried by {@link CampaignObjectiveProjectionItem}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly focus?: MissionObjectiveFocusDefinition;
}

/**
 * Defines the structured campaign mission history projection item contract for this module. Its declared
 * surface makes sequence, tick, kind, source id, text explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignMissionHistoryProjectionItem {
  /**
   * numeric sequence carried by {@link CampaignMissionHistoryProjectionItem}. Its units and valid range are
   * defined by {@link CampaignMissionHistoryProjectionItem} and must remain consistent across producers and
   * consumers.
   */
  readonly sequence: number;
  /**
   * temporal value for {@link CampaignMissionHistoryProjectionItem}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  readonly tick: number;
  /**
   * discriminator for {@link CampaignMissionHistoryProjectionItem}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly kind: CampaignMissionMessageHistoryEntry["kind"];
  /**
   * stable source id used by {@link CampaignMissionHistoryProjectionItem} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly sourceId: string;
  /**
   * human-facing text for {@link CampaignMissionHistoryProjectionItem}. It supports UI, narration, or
   * diagnostics and must not be used as the stable identity of the record.
   */
  readonly text: string;
  /**
   * Optional discriminator for {@link CampaignMissionHistoryProjectionItem}. It selects the valid branch and
   * behavior, so producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly state?: CampaignMissionMessageHistoryEntry["state"];
}

/**
 * Defines the structured campaign objective projection contract for this module. Its declared surface makes
 * tracker, quest log, history explicit to every consumer. Use this shared shape rather than an ad-hoc object
 * so adapters, persistence, and callers remain compatible.
 */
export interface CampaignObjectiveProjection {
  /**
   * collection value on {@link CampaignObjectiveProjection}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly tracker: readonly CampaignObjectiveProjectionItem[];
  /**
   * collection value on {@link CampaignObjectiveProjection}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly questLog: Readonly<Record<CampaignObjectiveKind, readonly CampaignObjectiveProjectionItem[]>>;
  /**
   * collection value on {@link CampaignObjectiveProjection}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly history: readonly CampaignMissionHistoryProjectionItem[];
}

/**
 * Defines the structured campaign objective projection options contract for this module. Its declared surface
 * makes input mode, seen input actions, input prompts explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignObjectiveProjectionOptions {
  /**
   * discriminator for {@link CampaignObjectiveProjectionOptions}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly inputMode: CampaignInputMode;
  /**
   * Optional collection owned by {@link CampaignObjectiveProjectionOptions}. Preserve the declared element
   * contract and any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly seenInputActions?: ReadonlySet<MissionSemanticInputAction>;
  /**
   * input prompts value carried by {@link CampaignObjectiveProjectionOptions}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly inputPrompts: CampaignInputPromptRegistry;
}

/**
 * Converts persisted objective state into a stable, local presentation model. It keeps
 * hidden/optional/impossible semantics intact, resolves authored text separately from
 * state, and orders active/history items deterministically so the HUD never becomes a
 * second authority for mission progress.
 */
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
