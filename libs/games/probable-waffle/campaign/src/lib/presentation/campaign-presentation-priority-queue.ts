export type CampaignPresentationCategory =
  | "critical-combat"
  | "blocking-dialogue"
  | "objective-failure"
  | "objective"
  | "tutorial"
  | "ambient";

export interface CampaignPresentationMessage {
  readonly id: string;
  readonly category: CampaignPresentationCategory;
  readonly text: string;
  readonly sourceId?: string;
}

interface QueuedCampaignPresentationMessage {
  readonly message: CampaignPresentationMessage;
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

/** Local-only queue that keeps combat, blocking dialogue, objectives, and tutorial narration readable. */
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
