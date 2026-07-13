import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { GameSaveService } from "../../services/game-save/game-save.service";
import { GameSaveServiceStub } from "../../services/game-save/game-save.service.stub";
import { SaveGameDialogComponent } from "./save-game-dialog.component";

describe("SaveGameDialogComponent", () => {
  let fixture: ComponentFixture<SaveGameDialogComponent>;
  const activeModal = { close: jest.fn(), dismiss: jest.fn() };

  beforeEach(async () => {
    activeModal.close.mockClear();
    activeModal.dismiss.mockClear();
    await TestBed.configureTestingModule({
      imports: [SaveGameDialogComponent],
      providers: [
        { provide: GameSaveService, useValue: new GameSaveServiceStub() },
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
});
