export interface SaveGamePayload {
  thumbnail: string;
  kind?: "manual" | "autosave" | "quicksave";
  name?: string;
  checkpointId?: string;
}
