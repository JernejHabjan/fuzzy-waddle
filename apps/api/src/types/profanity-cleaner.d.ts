declare module "profanity-cleaner" {
  export interface ProfanityCleanerOptions {
    customBadWords?: string[];
    ignoreCase?: boolean;
    replaceWith?: string;
  }

  /** Cleans a string from bad words */
  export function clean(input: string, options?: ProfanityCleanerOptions): string;

  /** Optional: add or load additional bad words */
  export function addBadWords(words: string[]): void;
  export function loadBadWords(words: string[]): void;
}
