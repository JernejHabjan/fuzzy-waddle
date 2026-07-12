export interface SaveGamePayload {
  thumbnail: string;
  kind?: "manual" | "autosave";
  name?: string;
}
