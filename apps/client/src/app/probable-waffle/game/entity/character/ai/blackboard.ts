export abstract class Blackboard {
  abstract getData(): Record<string, any>;
  abstract setData(data: Partial<Record<string, any>>): void;
}
