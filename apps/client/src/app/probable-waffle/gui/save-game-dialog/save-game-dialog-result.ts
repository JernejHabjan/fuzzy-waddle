import type { GameSaveRecord } from "@fuzzy-waddle/api-interfaces";

/** Result selected in the manual-save dialog; an existing save ID means replace that record in place. */
export interface SaveGameDialogResult {
  name: string;
  overwriteSaveId?: GameSaveRecord["id"];
}
