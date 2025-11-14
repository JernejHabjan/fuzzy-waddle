import type { Vector3Simple } from "@fuzzy-waddle/api-interfaces";

/**
 * Component to track the current movement destination of an actor.
 * Used to re-display the decal marker when the actor is re-selected while still traveling.
 */
export class MovementDestinationComponent {
  private destination?: Vector3Simple;

  setDestination(destination: Vector3Simple | undefined): void {
    this.destination = destination;
  }

  getDestination(): Vector3Simple | undefined {
    return this.destination;
  }

  clearDestination(): void {
    this.destination = undefined;
  }

  hasDestination(): boolean {
    return this.destination !== undefined;
  }
}
