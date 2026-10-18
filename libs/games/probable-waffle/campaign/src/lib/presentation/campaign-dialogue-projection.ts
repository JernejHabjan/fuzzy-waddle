import type { CampaignMissionRuntimeState } from "@fuzzy-waddle/probable-waffle-protocol";
import type {
  MissionDialogueBundle,
  MissionDialogueLine,
  MissionPortraitDefinition
} from "../contracts/mission-dialogue-bundle";

/**
 * Defines the structured campaign dialogue line projection contract for this module. Its declared surface
 * makes line id, owner token, speaker name, text, delivery explicit to every consumer. Use this shared shape
 * rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignDialogueLineProjection {
  /**
   * stable line id used by {@link CampaignDialogueLineProjection} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly lineId: string;
  /**
   * string owner token carried by {@link CampaignDialogueLineProjection}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly ownerToken: string;
  /**
   * human-facing speaker name for {@link CampaignDialogueLineProjection}. It supports UI, narration, or
   * diagnostics and must not be used as the stable identity of the record.
   */
  readonly speakerName: string;
  /**
   * human-facing text for {@link CampaignDialogueLineProjection}. It supports UI, narration, or diagnostics and
   * must not be used as the stable identity of the record.
   */
  readonly text: string;
  /**
   * delivery value carried by {@link CampaignDialogueLineProjection}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly delivery: MissionDialogueLine["delivery"];
  /**
   * Optional presentation metadata for {@link CampaignDialogueLineProjection}. Rendering adapters consume it
   * locally; deterministic identity and behavior remain owned by the linked contract fields.
   */
  readonly portrait?: MissionPortraitDefinition;
  /**
   * string portrait fallback carried by {@link CampaignDialogueLineProjection}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly portraitFallback: string;
  /**
   * Optional stable audio asset key used by {@link CampaignDialogueLineProjection} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  readonly audioAssetKey?: string;
}

/**
 * Defines the structured campaign dialogue log projection item contract for this module. Its declared surface
 * makes sequence, tick explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface CampaignDialogueLogProjectionItem extends CampaignDialogueLineProjection {
  /**
   * numeric sequence carried by {@link CampaignDialogueLogProjectionItem}. Its units and valid range are defined
   * by {@link CampaignDialogueLogProjectionItem} and must remain consistent across producers and consumers.
   */
  readonly sequence: number;
  /**
   * temporal value for {@link CampaignDialogueLogProjectionItem}. It anchors ordering, expiry, or presentation
   * timing and must use the time domain declared by the enclosing contract.
   */
  readonly tick: number;
}

/**
 * Defines the structured campaign dialogue projection contract for this module. Its declared surface makes
 * active, log explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface CampaignDialogueProjection {
  /**
   * collection value on {@link CampaignDialogueProjection}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly active: readonly CampaignDialogueLineProjection[];
  /**
   * collection value on {@link CampaignDialogueProjection}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly log: readonly CampaignDialogueLogProjectionItem[];
}

/** Documents the build campaign dialogue projection member and its declared contract at this boundary. */
export function buildCampaignDialogueProjection(
  dialogue: MissionDialogueBundle,
  state: CampaignMissionRuntimeState
): CampaignDialogueProjection {
  const linesById = new Map(dialogue.lines.map((line) => [String(line.id), line]));
  const speakersById = new Map(dialogue.speakers.map((speaker) => [String(speaker.id), speaker]));
  const portraitsById = new Map((dialogue.portraits ?? []).map((portrait) => [String(portrait.id), portrait]));
  const textsById = new Map((dialogue.texts ?? []).map((text) => [String(text.id), text.text]));
  const resolve = (lineId: string, ownerToken: string): CampaignDialogueLineProjection | undefined => {
    const line = linesById.get(lineId);
    if (!line) return undefined;
    const speaker = speakersById.get(String(line.speakerId));
    const speakerName = speaker
      ? (textsById.get(String(speaker.nameTextId)) ?? String(speaker.nameTextId))
      : "Narrator";
    const portraitId = line.portraitId ?? speaker?.portraitId;
    const portrait = portraitId ? portraitsById.get(String(portraitId)) : undefined;
    return {
      lineId,
      ownerToken,
      speakerName,
      text: line.text || textsById.get(String(line.textId)) || String(line.textId),
      delivery: line.delivery,
      ...(portrait ? { portrait } : {}),
      portraitFallback: speakerName,
      ...(line.audioAssetKey ? { audioAssetKey: line.audioAssetKey } : {})
    };
  };
  return {
    active: Object.values(state.dialoguePresentations)
      .filter((presentation) => presentation.status === "presenting")
      .sort(
        (left, right) => left.startedAtTick - right.startedAtTick || left.ownerToken.localeCompare(right.ownerToken)
      )
      .flatMap((presentation) => resolve(presentation.lineId, presentation.ownerToken) ?? []),
    log: [...state.dialogueHistory]
      .sort((left, right) => left.sequence - right.sequence)
      .flatMap((entry) => {
        const line = resolve(entry.lineId, entry.ownerToken);
        return line ? [{ ...line, sequence: entry.sequence, tick: entry.tick }] : [];
      })
  };
}

export function searchCampaignDialogueLog(
  entries: readonly CampaignDialogueLogProjectionItem[],
  query: string
): readonly CampaignDialogueLogProjectionItem[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return entries;
  return entries.filter((entry) => `${entry.speakerName}\n${entry.text}`.toLocaleLowerCase().includes(normalized));
}
