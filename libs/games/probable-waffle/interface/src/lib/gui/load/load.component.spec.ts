import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoadComponent } from "./load.component";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../communicators/game-instance-client.service.stub";
import { provideRouter } from "@angular/router";
import { GameSaveService } from "../../services/game-save/game-save.service";
import { GameSaveServiceStub } from "../../services/game-save/game-save.service.stub";
import {
  GAME_SAVE_FORMAT_VERSION,
  GameSaveKind,
  GameSaveScope,
  GameSaveSyncState,
  type GameSaveRecord,
  type ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceType
} from "@fuzzy-waddle/api-interfaces";

describe("LoadComponent", () => {
  let component: LoadComponent;
  let fixture: ComponentFixture<LoadComponent>;
  const gameSaveService = new GameSaveServiceStub();

  beforeEach(async () => {
    gameSaveService.records = [];
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: GameSaveService, useValue: gameSaveService }
      ],
      imports: [LoadComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("does not show replay records in the normal save list", async () => {
    gameSaveService.records = [createReplaySave()];
    await component.ngOnInit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("No saved games found.");
  });

  it("shows the stored thumbnail for a visible save", async () => {
    gameSaveService.records = [createSkirmishSave()];
    await component.ngOnInit();
    fixture.detectChanges();

    const thumbnail = fixture.nativeElement.querySelector(".save-thumbnail") as HTMLImageElement;
    expect(thumbnail.src).toBe("data:image/jpeg;base64,thumbnail");
  });

  it("hides the scoped section heading when opened from a game", async () => {
    gameSaveService.records = [createSkirmishSave()];
    component.fromGame = true;
    await component.ngOnInit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain("Skirmish");
  });
});

function createReplaySave(): GameSaveRecord {
  return {
    id: "replay-id",
    formatVersion: GAME_SAVE_FORMAT_VERSION,
    scope: GameSaveScope.Skirmish,
    kind: GameSaveKind.Manual,
    name: "Replay record",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    revision: 1,
    syncState: GameSaveSyncState.Local,
    gameInstanceData: {
      gameInstanceMetadataData: { type: ProbableWaffleGameInstanceType.Replay }
    } as ProbableWaffleGameInstanceData
  };
}

function createSkirmishSave(): GameSaveRecord {
  return {
    ...createReplaySave(),
    id: "skirmish-id",
    name: "Saved match",
    thumbnail: "data:image/jpeg;base64,thumbnail",
    gameInstanceData: {
      gameInstanceMetadataData: { type: ProbableWaffleGameInstanceType.Skirmish }
    } as ProbableWaffleGameInstanceData
  };
}
