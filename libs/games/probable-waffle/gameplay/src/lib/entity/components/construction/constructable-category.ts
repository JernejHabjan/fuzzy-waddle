import { ObjectNames } from "@fuzzy-waddle/api-interfaces";

export class ConstructableDefinition {
  constructor(
    public actorNames?: ObjectNames[],
    public constructableCategories?: ConstructableCategory[]
  ) {}
}

export class ConstructableCategory {
  constructor(
    public key: string,
    public frame: string,
    public text: string,
    public constructableDefinitions?: ConstructableDefinition[]
  ) {}
}
