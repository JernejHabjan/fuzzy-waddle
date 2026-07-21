import type { ScenarioActorReferenceData } from "@fuzzy-waddle/probable-waffle-protocol";
import { isCampaignContentId } from "@fuzzy-waddle/probable-waffle-campaign";

/** Persisted stable story role attached to an actor independently of ownership and runtime ID. */
export class ScenarioActorReferenceComponent {
  private roleId?: string;
  private tags: string[] = [];

  setData(data: ScenarioActorReferenceData): void {
    const roleId = data.roleId.trim();
    if (!isCampaignContentId(roleId)) throw new Error("Scenario actor role ID must use lowercase kebab-case");
    const tags = normalizeScenarioList(data.tags);
    const invalidTag = tags.find((tag) => !isCampaignContentId(tag));
    if (invalidTag) throw new Error(`Scenario actor tag '${invalidTag}' must use lowercase kebab-case`);
    this.roleId = roleId;
    this.tags = tags;
  }

  getData(): ScenarioActorReferenceData | undefined {
    if (!this.roleId) return undefined;
    return { roleId: this.roleId, tags: [...this.tags] };
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }
}

export function normalizeScenarioList(values: readonly string[] | string): string[] {
  const entries = typeof values === "string" ? values.split(",") : values;
  return [...new Set(entries.map((value) => value.trim()).filter(Boolean))].sort();
}
