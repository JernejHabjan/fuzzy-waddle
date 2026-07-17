import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { GameSaveService } from "../../services/game-save/game-save.service";
import { GameSaveServiceStub } from "../../services/game-save/game-save.service.stub";
import { SaveGameDialogComponent } from "./save-game-dialog.component";
import { GAME_SAVE_FORMAT_VERSION, GameSaveKind, GameSaveScope, GameSaveSyncState, type GameSaveRecord, type ProbableWaffleGameInstanceData, ProbableWaffleGameInstanceType } from "@fuzzy-waddle/probable-waffle-protocol";

describe("SaveGameDialogComponent", () => {
  let fixture: ComponentFixture<SaveGameDialogComponent>;
  const activeModal = { close: jest.fn(), dismiss: jest.fn() };
  const gameSaveService = new GameSaveServiceStub();

  beforeEach(async () => {
    activeModal.close.mockClear();
    activeModal.dismiss.mockClear();
    gameSaveService.records = [];
    await TestBed.configureTestingModule({
      imports: [SaveGameDialogComponent],
      providers: [
        { provide: GameSaveService, useValue: gameSaveService },
        { provide: NgbActiveModal, useValue: activeModal }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(SaveGameDialogComponent);
    fixture.componentInstance.scope = "skirmish";
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it("creates a one-slot quicksave without submitting a native form", () => {
    const quickSaveButton = [...fixture.nativeElement.querySelectorAll("button")].find(
      (button: HTMLButtonElement) => button.textContent?.trim() === "Quick Save"
    ) as HTMLButtonElement;
    quickSaveButton.click();
    expect(activeModal.close).toHaveBeenCalledWith({ kind: "quicksave" });
    expect(fixture.nativeElement.querySelector("form")).toBeNull();
  });

  it("does not offer replay records as overwrite targets", async () => {
    gameSaveService.records = [createReplaySave()];
    await fixture.componentInstance.configure(GameSaveScope.Skirmish);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain("Replay record");
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
