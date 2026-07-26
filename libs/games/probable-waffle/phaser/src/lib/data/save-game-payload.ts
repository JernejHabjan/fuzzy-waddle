/**
 * Defines the structured save game payload contract for this module. Its declared surface makes thumbnail,
 * kind, name, checkpoint id explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface SaveGamePayload {
  /**
   * string thumbnail carried by {@link SaveGamePayload}. Treat it according to the owning contract’s validation
   * and presentation rules rather than assuming it is a stable identifier.
   */
  thumbnail: string;
  /**
   * Optional discriminator for {@link SaveGamePayload}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  kind?: "manual" | "autosave" | "quicksave";
  /**
   * Optional human-facing name for {@link SaveGamePayload}. It supports UI, narration, or diagnostics and must
   * not be used as the stable identity of the record.
   */
  name?: string;
  /**
   * Optional stable checkpoint id used by {@link SaveGamePayload} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  checkpointId?: string;
}
