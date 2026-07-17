import type { GameSaveRecord } from "@fuzzy-waddle/api-interfaces";

/** Explicit save action selected in the save dialog. */
export type SaveGameDialogResult = ManualSaveDialogResult | QuicksaveDialogResult;

/** Named manual save result; an existing save ID means replace that record in place. */
interface ManualSaveDialogResult {
  kind: "manual";
  name: string;
  overwriteSaveId?: GameSaveRecord["id"];
}

/** One-slot quicksave result that overwrites the current mission or skirmish quicksave. */
interface QuicksaveDialogResult {
  kind: "quicksave";
}
