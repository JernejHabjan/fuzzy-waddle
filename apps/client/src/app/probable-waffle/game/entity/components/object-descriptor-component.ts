export interface ObjectDescriptorDefinition {
  // null means transparent
  color: number | null;
}
export class ObjectDescriptorComponent {
  constructor(public objectDescriptorDefinition: ObjectDescriptorDefinition) {}
}
