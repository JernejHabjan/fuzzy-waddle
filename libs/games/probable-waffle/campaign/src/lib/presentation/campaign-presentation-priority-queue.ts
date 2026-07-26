/**
 * Defines the closed campaign presentation category value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
export type CampaignPresentationCategory =
  | "critical-combat"
  | "blocking-dialogue"
  | "objective-failure"
  | "objective"
  | "tutorial"
  | "ambient";

/**
 * Defines the structured campaign presentation message contract for this module. Its declared surface makes
 * id, category, text, source id explicit to every consumer. Use this shared shape rather than an ad-hoc object
 * so adapters, persistence, and callers remain compatible.
 */
export interface CampaignPresentationMessage {
  /**
   * stable id used by {@link CampaignPresentationMessage} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  readonly id: string;
  /**
   * category value carried by {@link CampaignPresentationMessage}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly category: CampaignPresentationCategory;
  /**
   * human-facing text for {@link CampaignPresentationMessage}. It supports UI, narration, or diagnostics and
   * must not be used as the stable identity of the record.
   */
  readonly text: string;
  /**
   * Optional stable source id used by {@link CampaignPresentationMessage} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly sourceId?: string;
}

/**
 * Defines the structured queued campaign presentation message contract for this module. Its declared surface
 * makes message, sequence explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
interface QueuedCampaignPresentationMessage {
  /**
   * message value carried by {@link QueuedCampaignPresentationMessage}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly message: CampaignPresentationMessage;
  /**
   * numeric sequence carried by {@link QueuedCampaignPresentationMessage}. Its units and valid range are defined
   * by {@link QueuedCampaignPresentationMessage} and must remain consistent across producers and consumers.
   */
  readonly sequence: number;
}

const CATEGORY_PRIORITY: Readonly<Record<CampaignPresentationCategory, number>> = {
  "critical-combat": 500,
  "blocking-dialogue": 400,
  "objective-failure": 350,
  objective: 300,
  tutorial: 200,
  ambient: 100
};

/** Defines the campaign presentation priority queue contract used by this module; its declared members form the compatible boundary for linked consumers. */
export class CampaignPresentationPriorityQueue {
  private readonly queued: QueuedCampaignPresentationMessage[] = [];
  private readonly knownIds = new Set<string>();
  private nextSequence = 1;

  enqueue(message: CampaignPresentationMessage): boolean {
    if (this.knownIds.has(message.id)) return false;
    this.knownIds.add(message.id);
    this.queued.push({ message, sequence: this.nextSequence++ });
    this.queued.sort(compareQueuedMessages);
    return true;
  }

  take(): CampaignPresentationMessage | undefined {
    const message = this.queued.shift()?.message;
    if (message) this.knownIds.delete(message.id);
    return message;
  }

  peek(): CampaignPresentationMessage | undefined {
    return this.queued[0]?.message;
  }

  clear(): void {
    this.queued.length = 0;
    this.knownIds.clear();
  }

  get size(): number {
    return this.queued.length;
  }
}

function compareQueuedMessages(
  left: QueuedCampaignPresentationMessage,
  right: QueuedCampaignPresentationMessage
): number {
  return (
    CATEGORY_PRIORITY[right.message.category] - CATEGORY_PRIORITY[left.message.category] ||
    left.sequence - right.sequence ||
    left.message.id.localeCompare(right.message.id)
  );
}
