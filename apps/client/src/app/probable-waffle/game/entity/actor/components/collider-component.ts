export interface ColliderDefinition {
  enabled: boolean;
  colliderFactorReduction?: number;
}
export class ColliderComponent {
  constructor(public colliderDefinition: ColliderDefinition | null = null) {}
}
