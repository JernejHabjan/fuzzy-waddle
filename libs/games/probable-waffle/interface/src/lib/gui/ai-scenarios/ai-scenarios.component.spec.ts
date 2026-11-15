import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { ProbableWaffleGameInstance, ProbableWaffleMapEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { activeAiScenarios } from "./active-ai-scenario";
import type { AiScenarioCatalog } from "./ai-scenario-catalog";
import type { AiScenarioRecipe } from "./ai-scenario-recipe";
import { AiScenariosComponent } from "./ai-scenarios.component";

describe("AiScenariosComponent", () => {
  const assetRoot = "dev/ai-scenarios";
  const catalog = {
    sourceRevision: "a".repeat(40),
    scenarios: [
      { id: "C-05", title: "Protect the home base", group: "Combat", setup: null, outcome: "Resist bait",
        unavailable: null, recipe: { name: "recipe-1.json", digest: "fnv1a32:aaaaaaaa" } },
      { id: "H-29", title: "Island landing", group: "Transport", setup: null, outcome: null,
        unavailable: "The island map is unavailable.", recipe: null }
    ]
  } satisfies AiScenarioCatalog;
  const variant = { id: "tivara-bait", seed: 759940, aiFaction: "Tivara", humanFaction: "Skaduwee", difficulty: "Normal" } as const;
  const recipe = {
    purpose: "Bait and pursuit", scenarioIds: ["C-05"],
    acceptance: { actions: ["Bait the defenders"], required: ["Protect the base"], forbidden: ["Chase too far"],
      measurements: ["Defender position"] },
    recipe: { mapLabel: "AI Open Economy (test only)", aiPlayerNumber: 2,
      variants: [variant, { ...variant, id: "peer-only", requiresMultiplayer: true }] }
  } satisfies AiScenarioRecipe;

  it("filters the grouped catalog and starts the selected local variant", async () => {
    const match = new ProbableWaffleGameInstance();
    const client = {
      gameInstance: match,
      createGameInstance: jest.fn(), gameModeChanged: jest.fn(), startGame: jest.fn(),
      addSelfAsPlayer: jest.fn(), addAiPlayer: jest.fn().mockResolvedValue({ player: { playerNumber: 2 } })
    };
    TestBed.configureTestingModule({
      imports: [AiScenariosComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: GameInstanceClientService, useValue: client }]
    });
    const fixture = TestBed.createComponent(AiScenariosComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${assetRoot}/catalog.json`).flush(catalog);
    await fixture.whenStable();
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    expect(page.textContent).toContain("Transport");
    const search = page.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = "bait";
    search.dispatchEvent(new Event("input"));
    fixture.detectChanges();
    expect(page.querySelectorAll(".scenario-row")).toHaveLength(1);
    page.querySelector<HTMLButtonElement>(".scenario-row")!.click();
    http.expectOne(`${assetRoot}/recipe-1.json`).flush(recipe);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain("Bait and pursuit");
    expect(page.textContent).toContain("Protect the base");
    expect(page.textContent).toContain("Chase too far");
    expect(page.textContent).toContain("Defender position");
    const actions = page.querySelectorAll<HTMLButtonElement>(".variants button");
    expect(actions[1].disabled).toBe(true);
    actions[0].click();
    await fixture.whenStable();
    expect(client.gameModeChanged).toHaveBeenCalledWith("map", { map: ProbableWaffleMapEnum.AiOpenEconomy });
    expect(client.startGame).toHaveBeenCalledTimes(1);
    expect(activeAiScenarios.get(match)?.config.seed).toBe(759940);
    http.verify();
  });
});
