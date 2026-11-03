/** Authored actor input. Runtime definition lookup still validates names, ownership and capabilities. */
export interface NativeScenarioActor {
  fixtureActorId: string;
  actorName: string;
  owner: number | null;
  position: { x: number; y: number; z: number };
}
