import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ScoreTableComponent } from "./score-table.component";
import {
  createPlayerLobbyDefinition,
  FactionType,
  type PlayerScoreData,
  type PositionPlayerDefinition,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWafflePlayerType,
  STANDARD_METRICS
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.stub";
import { ScoreDataService } from "../../../services/score-data.service";

describe("ScoreTableComponent", () => {
  let component: ScoreTableComponent;
  let fixture: ComponentFixture<ScoreTableComponent>;

  const scoreDataServiceStub = {
    getSortedPlayersByScore: (): PlayerScoreData[] => []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: ScoreDataService, useValue: scoreDataServiceStub }
      ],
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
    gameInstanceClientServiceStub.createGameInstance(
      "test",
      ProbableWaffleGameInstanceVisibility.Private,
      ProbableWaffleGameInstanceType.Skirmish
    );

    gameInstanceClientServiceStub.addAiPlayer();
    const gameInstance = gameInstanceClientServiceStub.gameInstance!;
    const playerDefinition = {
      player: createPlayerLobbyDefinition(gameInstance.players.length + 1, gameInstance.players.length),
      factionType: FactionType.Skaduwee,
      playerType: ProbableWafflePlayerType.AI
    } satisfies PositionPlayerDefinition;
    gameInstance.players[0].playerController.data.playerDefinition = playerDefinition;

    component.ngOnInit();
    expect(component["players"].length).toBe(0); // no score data in stub
  });

  it("should display player scores when provided as input", () => {
    const mockScores: PlayerScoreData[] = [
      {
        playerNumber: 1,
        playerName: "Player 1",
        playerType: "Human",
        factionType: "Unknown",
        gameResult: "win",
        eliminated: false,
        finalScore: 100,
        metrics: {
          [STANDARD_METRICS.UNITS_PRODUCED]: 10
        }
      }
    ];

    fixture.componentRef.setInput("playerScores", mockScores);
    component.ngOnInit();
    fixture.detectChanges();

    expect(component["players"].length).toBe(1);
    expect(component["players"][0].playerName).toBe("Player 1");
  });
});
