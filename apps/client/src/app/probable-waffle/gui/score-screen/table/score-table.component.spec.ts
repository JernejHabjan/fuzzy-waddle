import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PlayerSummary, ScoreTableComponent } from "./score-table.component";
import {
  FactionType,
  PlayerLobbyDefinition,
  PositionPlayerDefinition,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWafflePlayerType
} from "@fuzzy-waddle/api-interfaces";
import { DebugElement } from "@angular/core";
import { By } from "@angular/platform-browser";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.stub";

describe("ScoreTableComponent", () => {
  let component: ScoreTableComponent;
  let fixture: ComponentFixture<ScoreTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }],
      imports: [ScoreTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ScoreTableComponent);
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
    const gameInstance = gameInstanceClientServiceStub.gameInstance!;
    const playerDefinition = {
      player: {
        playerNumber: gameInstance.players.length + 1,
        playerName: "Player " + (gameInstance.players.length + 1),
        playerPosition: gameInstance.players.length,
        joined: true
      } satisfies PlayerLobbyDefinition, // TODO THIS IS DUPLICATED EVERYWHERE
      factionType: FactionType.Skaduwee,
      playerType: ProbableWafflePlayerType.AI
    } satisfies PositionPlayerDefinition;
    gameInstance.players[0].playerController.data.playerDefinition = playerDefinition;

    component.ngOnInit();
    expect(component["players"].length).toBe(1);
  });

  it("should display unit_produced value in the DOM", () => {
    // Assuming you have some mock player data
    // noinspection UnnecessaryLocalVariableJS
    const mockPlayers = [
      {
        playerNumber: 1,
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
