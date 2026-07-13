import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { DatePipe } from "@angular/common";
import { GameSaveKind, GameSaveScope, type CampaignMissionId, type GameSaveRecord } from "@fuzzy-waddle/api-interfaces";
import { GameSaveService } from "../../services/game-save/game-save.service";
import type { SaveGameDialogResult } from "./save-game-dialog-result";

@Component({
  selector: "fuzzy-waddle-save-game-dialog",
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: "./save-game-dialog.component.html",
  styleUrls: ["./save-game-dialog.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaveGameDialogComponent implements OnInit {
  private readonly activeModal = inject(NgbActiveModal);
  private readonly gameSaveService = inject(GameSaveService);
  protected readonly saveName = new FormControl("", { nonNullable: true, validators: [Validators.required] });
  protected readonly saves = signal<GameSaveRecord[]>([]);
  protected readonly overwriteSaveId = signal<string | undefined>(undefined);
  scope?: GameSaveScope;
  missionScopeId?: CampaignMissionId;

  async ngOnInit(): Promise<void> {
    await this.refreshSaves();
  }

  /** Configures the current game's save scope after NgbModal creates the component instance. */
  async configure(scope: GameSaveScope, missionScopeId?: CampaignMissionId): Promise<void> {
    this.scope = scope;
    this.missionScopeId = missionScopeId;
    await this.refreshSaves();
  }

  /** Lists only named saves eligible to replace the current campaign mission or skirmish game. */
  private async refreshSaves(): Promise<void> {
    this.saves.set(
      (await this.gameSaveService.list()).filter(
        (save) =>
          save.kind === GameSaveKind.Manual &&
          save.scope === this.scope &&
          (save.scope === GameSaveScope.Skirmish || save.campaign?.missionId === this.missionScopeId)
      )
    );
  }

  /** Selects a same-scope named save to be replaced by this snapshot. */
  protected selectOverwrite(save: GameSaveRecord): void {
    this.overwriteSaveId.set(save.id);
    this.saveName.setValue(save.name ?? "");
  }

  /** Clears the selected replacement and creates a new named save instead. */
  protected createNewSave(): void {
    this.overwriteSaveId.set(undefined);
    this.saveName.setValue("");
  }

  protected confirm(): void {
    const name = this.saveName.value.trim();
    if (!name) return;
    const result: SaveGameDialogResult = { kind: "manual", name, overwriteSaveId: this.overwriteSaveId() };
    this.activeModal.close(result);
  }

  /** Closes immediately with the one-slot quicksave action, avoiding an extra name prompt. */
  protected quickSave(): void {
    this.activeModal.close({ kind: "quicksave" } satisfies SaveGameDialogResult);
  }

  protected cancel(): void {
    this.activeModal.dismiss();
  }
}
