import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "arraySort",
  standalone: true
})
export class ArraySortPipe implements PipeTransform {
  transform(array: Record<string, any>[], property: string): Record<string, any>[] {
    if (!array || !property) return array;
    return array.sort(() => 0.5 - Math.random()).sort((a, b) => a[property].localeCompare(b[property]));
  }
}
