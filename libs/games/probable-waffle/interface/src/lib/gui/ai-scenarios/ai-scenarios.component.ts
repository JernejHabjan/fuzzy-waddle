import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import type { AiScenarioCatalog, AiScenarioEntry } from "./ai-scenario-catalog";
import type { AiScenarioRecipe, AiScenarioVariant } from "./ai-scenario-recipe";
import { launchAiScenario, scenarioMapLabel, scenarioPlaybackBlocker } from "./launch-ai-scenario";

const assets = "dev/ai-scenarios";

@Component({
  templateUrl: "./ai-scenarios.component.html",
  styleUrl: "./ai-scenarios.component.scss",
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiScenariosComponent {
  private readonly http = inject(HttpClient);
  private readonly client = inject(GameInstanceClientService);
  private readonly lifetime = new AbortController();
  private readonly recipes = new Map<string, Promise<AiScenarioRecipe>>();
  private selectionRequest = 0;

  protected readonly catalog = signal<AiScenarioCatalog | null>(null);
  protected readonly catalogError = signal(false);
  protected readonly query = signal("");
  protected readonly group = signal("");
  protected readonly selected = signal<AiScenarioEntry | null>(null);
  protected readonly recipe = signal<AiScenarioRecipe | null>(null);
  protected readonly loadingRecipe = signal(false);
  protected readonly error = signal("");
  protected readonly launching = signal<string | null>(null);
  protected readonly groups = computed(() => [...new Set(this.catalog()?.scenarios.map((entry) => entry.group) ?? [])]);
  protected readonly visibleGroups = computed(() => {
    const query = this.query().trim().toLowerCase();
    const category = this.group();
    const filtered = (this.catalog()?.scenarios ?? []).filter((entry) =>
      (!category || entry.group === category) &&
      [entry.id, entry.title, entry.group, entry.setup, entry.outcome].join(" ").toLowerCase().includes(query)
    );
    return this.groups().map((name) => ({ name, entries: filtered.filter((entry) => entry.group === name) }))
      .filter(({ entries }) => entries.length > 0);
  });
  protected readonly variants = computed(() => {
    const recipe = this.recipe();
    const scenario = this.selected();
    if (!recipe || !scenario) return [];
    return recipe.recipe.variants.filter((variant) => variant.scenarioIds?.includes(scenario.id) ?? true)
      .map((variant) => ({ variant, map: scenarioMapLabel(recipe, variant),
        blocker: scenarioPlaybackBlocker(scenario.id, recipe, variant) }));
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.lifetime.abort());
    void this.loadCatalog();
  }

  protected async loadCatalog(): Promise<void> {
    this.catalogError.set(false);
    try {
      this.catalog.set(await firstValueFrom(this.http.get<AiScenarioCatalog>(`${assets}/catalog.json`)));
    } catch {
      this.catalogError.set(true);
    }
  }

  /** A late response can populate the cache without replacing a newer selection. */
  protected async select(scenario: AiScenarioEntry): Promise<void> {
    const request = ++this.selectionRequest;
    this.selected.set(scenario);
    this.recipe.set(null);
    this.error.set("");
    this.loadingRecipe.set(!!scenario.recipe);
    if (!scenario.recipe) return;
    const name = scenario.recipe.name;
    try {
      let recipe = this.recipes.get(name);
      if (!recipe) {
        recipe = firstValueFrom(this.http.get<AiScenarioRecipe>(`${assets}/${name}`));
        this.recipes.set(name, recipe);
      }
      const loaded = await recipe;
      if (!loaded.scenarioIds.includes(scenario.id)) throw new Error("Mismatched scenario recipe");
      if (request === this.selectionRequest) this.recipe.set(loaded);
    } catch {
      this.recipes.delete(name);
      if (request === this.selectionRequest) this.error.set("The scenario setup could not be loaded.");
    } finally {
      if (request === this.selectionRequest) this.loadingRecipe.set(false);
    }
  }

  protected async play(variant: AiScenarioVariant): Promise<void> {
    const scenario = this.selected();
    const recipe = this.recipe();
    const catalog = this.catalog();
    if (!scenario || !recipe || !catalog || this.launching()) return;
    this.error.set("");
    this.launching.set(variant.id);
    try {
      await launchAiScenario(this.client, scenario, recipe, variant, catalog.sourceRevision, this.lifetime.signal);
    } catch (error) {
      if (!this.lifetime.signal.aborted) {
        this.error.set(error instanceof Error ? error.message : "The scenario could not be started.");
      }
    } finally {
      this.launching.set(null);
    }
  }
}
