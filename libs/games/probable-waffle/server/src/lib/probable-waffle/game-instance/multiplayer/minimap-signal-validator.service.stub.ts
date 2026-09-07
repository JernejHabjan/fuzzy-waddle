import type { MinimapSignalValidatorServiceInterface } from "./minimap-signal-validator.service.interface";

/** Default permissive stub for consumers that do not host multiplayer validation. */
export const minimapSignalValidatorServiceStub = {
  validate: () => true,
  cleanup: () => {}
} satisfies MinimapSignalValidatorServiceInterface;
