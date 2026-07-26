import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { DatePipe } from "@angular/common";
import {
  GameSaveKind,
  GameSaveScope,
  type CampaignMissionId,
  type GameSaveRecord,
  isSupportedGameSaveRecord,
  ProbableWaffleGameInstanceType
} from "@fuzzy-waddle/probable-waffle-protocol";
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

  /** Documents the configure member and its declared contract at this boundary. */
  async configure(scope: GameSaveScope, missionScopeId?: CampaignMissionId): Promise<void> {
    this.scope = scope;
    this.missionScopeId = missionScopeId;
    await this.refreshSaves();
  }

  /** Documents the refresh saves member and its declared contract at this boundary. */
  private async refreshSaves(): Promise<void> {
    this.saves.set(
      (await this.gameSaveService.list())
        .filter(isSupportedGameSaveRecord)
        .filter(
          (save) =>
            save.kind === GameSaveKind.Manual &&
            save.gameInstanceData.gameInstanceMetadataData?.type !== ProbableWaffleGameInstanceType.Replay &&
            save.scope === this.scope &&
            (save.scope === GameSaveScope.Skirmish || save.campaign?.missionId === this.missionScopeId)
        )
    );
  }

  /** Documents the select overwrite member and its declared contract at this boundary. */
  protected selectOverwrite(save: GameSaveRecord): void {
    this.overwriteSaveId.set(save.id);
    this.saveName.setValue(save.name ?? "");
  }

  /** Documents the create new save member and its declared contract at this boundary. */
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

  /** Documents the quick save member and its declared contract at this boundary. */
  protected quickSave(): void {
    this.activeModal.close({ kind: "quicksave" } satisfies SaveGameDialogResult);
  }

  protected cancel(): void {
    this.activeModal.dismiss();
  }
}
