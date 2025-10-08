export interface InfoDefinition {
  // used in HUD to show which unit to spawn
  name: string;
  // when single unit is selected, this is shown in HUD
  description: string;
  // used in HUD to show large portrait of unit - switch between idle and action
  portraitAnimation?: {
    idle: string;
    action: string;
  };
  // used for tiles in HUD to show which unit to spawn
  smallImage?: {
    key: string;
    frame: string;
    origin: { x: number; y: number };
  };
}
export class InfoComponent {
  constructor(public infoDefinition: InfoDefinition) {}
}
