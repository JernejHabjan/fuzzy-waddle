import { EventEmitter } from "@angular/core";

export type SyncOptions<T> = {
  eventPrefix: string;
  propertyMap: { [K in keyof T]: string };
  eventEmitters?: { [K in keyof T]?: EventEmitter<any> };
  hooks?: { [K in keyof T]?: (value: any, previousValue: any) => void };
  onDestroy?: () => void;
};
