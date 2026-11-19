/** The development server stages this index from the checked-in manifest and requirement tables. */
export interface AiScenarioCatalog {
  readonly sourceRevision: string;
  readonly scenarios: readonly AiScenarioEntry[];
}

/** A catalog row may document a case even when there is no runnable fixture. */
export interface AiScenarioEntry {
  readonly id: string;
  readonly title: string;
  readonly group: string;
  readonly setup: string | null;
  readonly outcome: string | null;
  readonly unavailable: string | null;
  readonly recipe: { readonly name: string; readonly digest: string } | null;
}
