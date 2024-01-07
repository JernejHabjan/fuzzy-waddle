import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PlayerSummary, ScoreScreenComponent } from "./score-screen.component";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../communicators/game-instance-client.service.spec";
import { RouterTestingModule } from "@angular/router/testing";
import { ProbableWaffleGameInstanceType, ProbableWaffleGameInstanceVisibility } from "@fuzzy-waddle/api-interfaces";
import { DebugElement } from "@angular/core";
import { By } from "@angular/platform-browser";

describe("ScoreScreenComponent", () => {
  let component: ScoreScreenComponent;
  let fixture: ComponentFixture<ScoreScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }],
      imports: [ScoreScreenComponent, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ScoreScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should set players correctly on initialization", () => {
    // Assuming you have some mock player data

    gameInstanceClientServiceStub.createGameInstance(
      "test",
      ProbableWaffleGameInstanceVisibility.Private,
      ProbableWaffleGameInstanceType.Skirmish
    );

    gameInstanceClientServiceStub.addAiPlayer();

    component.ngOnInit();
    expect(component["players"].length).toBe(1);
  });

  it("should display unit_produced value in the DOM", () => {
    // Assuming you have some mock player data
    // noinspection UnnecessaryLocalVariableJS
    const mockPlayers = [
      {
        name: "Player 1",
        unit_produced: 10,
        unit_killed: 5,
        building_constructed: 3,
        building_destroyed: 1,
        resource_collected: 100,
        resource_spent: 50
      }
    ] satisfies PlayerSummary[];

    // Set the component's players property
    component["players"] = mockPlayers;

    // Trigger change detection
    fixture.detectChanges();

    // Get the DebugElement for the unit_produced cell
    const unitProducedCell: DebugElement = fixture.debugElement.query(By.css("tbody tr td:nth-child(2)")); // Assuming 'unit_produced' is the second column

    // Extract the text content from the DebugElement
    const unitProducedValue = unitProducedCell.nativeElement.textContent.trim();

    // Assert the value in the DOM
    expect(unitProducedValue).toBe("10"); // Adjust this value based on your actual mock data
  });
});
