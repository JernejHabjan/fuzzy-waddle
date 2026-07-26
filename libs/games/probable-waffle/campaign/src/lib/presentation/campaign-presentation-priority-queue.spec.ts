import { CampaignPresentationPriorityQueue } from "./campaign-presentation-priority-queue";

describe("CampaignPresentationPriorityQueue", () => {
  it("orders critical combat, dialogue, objective, tutorial, and ambient messages without duplicates", () => {
    const queue = new CampaignPresentationPriorityQueue();
    queue.enqueue({ id: "tutorial", category: "tutorial", text: "Tutorial" });
    queue.enqueue({ id: "ambient", category: "ambient", text: "Ambient" });
    queue.enqueue({ id: "objective", category: "objective", text: "Objective" });
    queue.enqueue({ id: "dialogue", category: "blocking-dialogue", text: "Dialogue" });
    queue.enqueue({ id: "combat", category: "critical-combat", text: "Combat" });
    expect(queue.enqueue({ id: "combat", category: "critical-combat", text: "Duplicate" })).toBe(false);

    expect(Array.from({ length: queue.size }, () => queue.take()?.id)).toEqual([
      "combat",
      "dialogue",
      "objective",
      "tutorial",
      "ambient"
    ]);
    expect(queue.enqueue({ id: "ambient", category: "ambient", text: "Replay after interruption" })).toBe(true);
  });
});
