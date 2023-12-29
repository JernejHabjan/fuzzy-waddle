import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "wrap"
})
export class WrapPipe implements PipeTransform {
  transform(value: number, wrapBy = 200): number {
    // round to 1000
    return Math.round(value / wrapBy) * wrapBy;
  }
}
