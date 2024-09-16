import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ScoreThroughTimeComponent } from "./score-through-time.component";
import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FactionType,
  PlayerLobbyDefinition,
  PlayerStateActionBuildingConstructed,
  PlayerStateActionBuildingDestroyed,
  PlayerStateActionUnitKilled,
  PlayerStateActionUnitProduced,
  PositionPlayerDefinition,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWafflePlayerType
} from "@fuzzy-waddle/api-interfaces";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.spec";
import { BaseChartDirective } from "ng2-charts";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";

@Component({
  selector: "probable-waffle-score-through-time",
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: "./score-through-time.component.html",
  styleUrls: ["./score-through-time.component.scss"]
})
export class ScoreThroughTimeTestingComponent {
  @Input({ required: true }) summaryType!: "units" | "buildings" | "resources";
}
describe("ScoreThroughTimeComponent", () => {
  let component: ScoreThroughTimeComponent;
  let fixture: ComponentFixture<ScoreThroughTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScoreThroughTimeComponent],
      providers: [{ provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }]
    }).compileComponents();

    fixture = TestBed.createComponent(ScoreThroughTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should create chart", async () => {
    const gameInstanceService = gameInstanceClientServiceStub;

    await gameInstanceService.createGameInstance(
      "test",
      ProbableWaffleGameInstanceVisibility.Private,
      ProbableWaffleGameInstanceType.Skirmish
    );

    await gameInstanceService.addAiPlayer();
    await gameInstanceService.addAiPlayer();
    const players = gameInstanceService.gameInstance!.players!;
    players[0].playerController.data.playerDefinition = {
      player: {
        playerNumber: 1,
        playerName: "Player 1",
        playerPosition: 1,
        joined: true
      } satisfies PlayerLobbyDefinition, // TODO THIS IS DUPLICATED EVERYWHERE
      factionType: FactionType.Skaduwee,
      playerType: ProbableWafflePlayerType.AI
    } satisfies PositionPlayerDefinition;
    players[1].playerController.data.playerDefinition = {
      player: {
        playerNumber: 2,
        playerName: "Player 2",
        playerPosition: 2,
        joined: true
      } satisfies PlayerLobbyDefinition, // TODO THIS IS DUPLICATED EVERYWHERE
      factionType: FactionType.Skaduwee,
      playerType: ProbableWafflePlayerType.AI
    } satisfies PositionPlayerDefinition;

    players[0].playerState.data.summary.push(
      {
        data: {
          unitName: "test"
        },
        time: 2000,
        type: "unit_produced"
      } satisfies PlayerStateActionUnitProduced,

      {
        data: {
          unitName: "test_2"
        },
        time: 3000,
        type: "unit_produced"
      } satisfies PlayerStateActionUnitProduced,
      {
        data: {
          unitName: "test_2",
          killedPlayerNr: 1
        },
        time: 32000,
        type: "unit_killed"
      } satisfies PlayerStateActionUnitKilled
    );
    players[1].playerState.data.summary.push(
      {
        data: {
          unitName: "test"
        },
        time: 1000,
        type: "unit_produced"
      } satisfies PlayerStateActionUnitProduced,
      {
        data: {
          unitName: "test_3"
        },
        time: 8000,
        type: "unit_produced"
      } satisfies PlayerStateActionUnitProduced,
      {
        data: {
          unitName: "test_3"
        },
        time: 10500,
        type: "unit_produced"
      } satisfies PlayerStateActionUnitProduced
    );

    players[0].playerState.data.summary.push({
      data: {
        buildingName: "test"
      },
      time: 1000,
      type: "building_constructed"
    } satisfies PlayerStateActionBuildingConstructed);
    players[1].playerState.data.summary.push(
      {
        data: {
          buildingName: "test"
        },
        time: 3000,
        type: "building_constructed"
      } satisfies PlayerStateActionBuildingConstructed,
      {
        data: {
          buildingName: "test_3",
          killedPlayerNr: 0
        },
        time: 8000,
        type: "building_destroyed"
      } satisfies PlayerStateActionBuildingDestroyed
    );

    component.ngOnInit();

    expect(component).toBeTruthy();
  });
});
