import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "fuzzy-waddle-save-game-dialog",
  imports: [ReactiveFormsModule],
  templateUrl: "./save-game-dialog.component.html",
  styleUrls: ["./save-game-dialog.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaveGameDialogComponent {
  private readonly activeModal = inject(NgbActiveModal);
  protected readonly saveName = new FormControl("", { nonNullable: true, validators: [Validators.required] });

  protected confirm(): void {
    const name = this.saveName.value.trim();
    if (!name) return;
    this.activeModal.close(name);
  }

  protected cancel(): void {
    this.activeModal.dismiss();
  }
}
