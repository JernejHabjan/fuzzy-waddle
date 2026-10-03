/** Normalized persistence error kept independent from Supabase transport details. */
export class SocialRepositoryError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "SocialRepositoryError";
  }
}
