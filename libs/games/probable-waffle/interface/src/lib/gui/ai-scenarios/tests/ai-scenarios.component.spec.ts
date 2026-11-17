import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import {
  FactionType,
  ProbableWaffleGameInstance,
  ProbableWaffleMapEnum,
  ProbableWafflePlayerType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { activeAiScenarios } from "../active-ai-scenario";
import type { AiScenarioCatalog } from "../ai-scenario-catalog";
import type { AiScenarioRecipe } from "../ai-scenario-recipe";
import { AiScenariosComponent } from "../ai-scenarios.component";
import { launchAiScenario } from "../launch-ai-scenario";
import type { GameInstanceClientServiceInterface } from "../../../communicators/game-instance-client.service.interface";

describe("AiScenariosComponent", () => {
  const assetRoot = "dev/ai-scenarios";
  const catalog = {
    sourceRevision: "a".repeat(40),
    scenarios: [
      {
        id: "C-05",
        title: "Protect the home base",
        group: "Combat",
        setup: null,
        outcome: "Resist bait",
        unavailable: null,
        recipe: { name: "recipe-1.json", digest: "fnv1a32:aaaaaaaa" }
      },
      {
        id: "H-29",
        title: "Island landing",
        group: "Transport",
        setup: null,
        outcome: null,
        unavailable: "The island map is unavailable.",
        recipe: null
      }
    ]
  } satisfies AiScenarioCatalog;
  const variant = {
    id: "tivara-bait",
    seed: 759940,
    aiFaction: "Tivara",
    humanFaction: "Skaduwee",
    difficulty: "Normal"
  } as const;
  const recipe = {
    purpose: "Bait and pursuit",
    scenarioIds: ["C-05"],
    acceptance: {
      actions: ["Bait the defenders"],
      required: ["Protect the base"],
      forbidden: ["Chase too far"],
      measurements: ["Defender position"]
    },
    recipe: {
      mapLabel: "AI Open Economy (test only)",
      aiPlayerNumber: 2,
      variants: [variant, { ...variant, id: "peer-only", requiresMultiplayer: true }]
    }
  } satisfies AiScenarioRecipe;

  it("filters the grouped catalog and starts the selected local variant", async () => {
    const match = new ProbableWaffleGameInstance();
    const client = {
      gameInstance: match,
      createGameInstance: jest.fn().mockResolvedValue(undefined),
      gameModeChanged: jest.fn().mockResolvedValue(undefined),
      startGame: jest.fn().mockResolvedValue(undefined),
      playerSlotOpened: jest.fn().mockResolvedValue(undefined),
      addSelfAsSpectator: jest.fn().mockResolvedValue(undefined),
      addAiPlayer: jest.fn().mockResolvedValue({ player: { playerNumber: 2 } })
    };
    TestBed.configureTestingModule({
      imports: [AiScenariosComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: GameInstanceClientService, useValue: client }
      ]
    });
    const fixture = TestBed.createComponent(AiScenariosComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${assetRoot}/catalog.json`).flush(catalog);
    await fixture.whenStable();
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    expect(page.textContent).toContain("Transport");
    const search = page.querySelector<HTMLInputElement>('input[type="search"]');
    if (!search) throw new Error("scenario_search_missing");
    search.value = "bait";
    search.dispatchEvent(new Event("input"));
    fixture.detectChanges();
    expect(page.querySelectorAll(".scenario-row")).toHaveLength(1);
    const scenarioRow = page.querySelector<HTMLButtonElement>(".scenario-row");
    if (!scenarioRow) throw new Error("scenario_row_missing");
    scenarioRow.click();
    http.expectOne(`${assetRoot}/recipe-1.json`).flush(recipe);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(page.textContent).toContain("Bait and pursuit");
    expect(page.textContent).toContain("Protect the base");
    expect(page.textContent).toContain("Chase too far");
    expect(page.textContent).toContain("Defender position");
    const actions = page.querySelectorAll<HTMLButtonElement>(".variants button");
    const playable = actions.item(0);
    const blocked = actions.item(1);
    if (!playable || !blocked) throw new Error("scenario_actions_missing");
    expect(blocked.disabled).toBe(true);
    playable.click();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(client.gameModeChanged).toHaveBeenCalledWith("map", { map: ProbableWaffleMapEnum.AiOpenEconomy });
    expect(client.playerSlotOpened).toHaveBeenCalledWith(
      expect.objectContaining({
        player: expect.objectContaining({ playerNumber: 1, playerName: "Scenario opponent", joined: false }),
        playerType: ProbableWafflePlayerType.NetworkOpen,
        factionType: FactionType.Skaduwee
      })
    );
    expect(client.addSelfAsSpectator).toHaveBeenCalledTimes(1);
    expect(client.startGame).toHaveBeenCalledTimes(1);
    expect(activeAiScenarios.get(match)?.config.seed).toBe(759940);
    http.verify();
  });

  it("stops a pending launch before mutating a replacement match", async () => {
    let releaseSlot!: () => void;
    const slot = new Promise<void>((resolve) => {
      releaseSlot = resolve;
    });
    const client = {
      gameInstance: new ProbableWaffleGameInstance(),
      createGameInstance: jest.fn().mockResolvedValue(undefined),
      playerSlotOpened: jest.fn(() => slot),
      addSelfAsSpectator: jest.fn()
    };
    const scenario = catalog.scenarios[0];
    if (!scenario) throw new Error("scenario_fixture_missing");
    const launching = launchAiScenario(
      client as unknown as GameInstanceClientServiceInterface,
      scenario,
      recipe,
      variant,
      catalog.sourceRevision,
      new AbortController().signal
    );
    await Promise.resolve();
    expect(client.playerSlotOpened).toHaveBeenCalledTimes(1);
    client.gameInstance = new ProbableWaffleGameInstance();
    releaseSlot();
    await expect(launching).rejects.toThrow("The local match was replaced.");
    expect(client.addSelfAsSpectator).not.toHaveBeenCalled();
  });

  it("shows an error for malformed recipe data and allows a retry", async () => {
    TestBed.configureTestingModule({
      imports: [AiScenariosComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: GameInstanceClientService, useValue: {} }
      ]
    });
    const fixture = TestBed.createComponent(AiScenariosComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${assetRoot}/catalog.json`).flush(catalog);
    await fixture.whenStable();
    fixture.detectChanges();
    const select = () => fixture.nativeElement.querySelector(".scenario-row").click();
    select();
    http.expectOne(`${assetRoot}/recipe-1.json`).flush({ scenarioIds: ["C-05"], recipe: {} });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("The scenario setup could not be loaded.");
    select();
    http.expectOne(`${assetRoot}/recipe-1.json`).flush(recipe);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Bait and pursuit");
    http.verify();
  });

  it("does not replace a newer selection when an older recipe arrives late", async () => {
    TestBed.configureTestingModule({
      imports: [AiScenariosComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: GameInstanceClientService, useValue: {} }
      ]
    });
    const fixture = TestBed.createComponent(AiScenariosComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${assetRoot}/catalog.json`).flush({
      ...catalog,
      scenarios: [
        catalog.scenarios[0],
        {
          ...catalog.scenarios[0],
          id: "C-06",
          title: "Second",
          recipe: { name: "recipe-2.json", digest: "fnv1a32:bbbbbbbb" }
        }
      ]
    });
    await fixture.whenStable();
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(".scenario-row");
    buttons[0].click();
    const older = http.expectOne(`${assetRoot}/recipe-1.json`);
    buttons[1].click();
    http.expectOne(`${assetRoot}/recipe-2.json`).flush({ ...recipe, purpose: "Newer recipe", scenarioIds: ["C-06"] });
    await Promise.resolve();
    older.flush(recipe);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Newer recipe");
    expect(fixture.nativeElement.textContent).not.toContain("Bait and pursuit");
    http.verify();
  });
});
