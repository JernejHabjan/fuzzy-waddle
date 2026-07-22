import type { CampaignMissionRuntimeState } from "@fuzzy-waddle/probable-waffle-protocol";
import type {
  MissionPortraitDefinition,
  MissionDialogueBundle,
  MissionDialogueLine
} from "../contracts/mission-dialogue-bundle";

export interface CampaignDialogueLineProjection {
  readonly lineId: string;
  readonly ownerToken: string;
  readonly speakerName: string;
  readonly text: string;
  readonly delivery: MissionDialogueLine["delivery"];
  readonly portrait?: MissionPortraitDefinition;
  readonly portraitFallback: string;
  readonly audioAssetKey?: string;
}

export interface CampaignDialogueLogProjectionItem extends CampaignDialogueLineProjection {
  readonly sequence: number;
  readonly tick: number;
}

export interface CampaignDialogueProjection {
  readonly active: readonly CampaignDialogueLineProjection[];
  readonly log: readonly CampaignDialogueLogProjectionItem[];
}

/** Pure local projection for subtitles and the searchable dialogue-only history. */
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
