export interface ColliderDefinition {
  colliderFactorReduction: number;
}
export class ColliderComponent {
  constructor(public colliderDefinition: ColliderDefinition | null = null) {}
}
