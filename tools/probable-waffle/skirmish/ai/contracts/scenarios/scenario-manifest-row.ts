/** One stable scenario identity and its fixture-root-relative evidence bindings. */
export interface ScenarioManifestRow {
  id: string;
  name?: string;
  stages: number[];
  group: string;
  drivers: ("pure" | "runtime")[];
  fixture: string | null;
  authoredFixture?: string;
  runtimeRecipeDraft?: string;
  runtimeSupport?: { status: "deferred_content"; issue: number; reason: string };
}
