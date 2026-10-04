import { Component, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "fuzzy-waddle-loader",
  template: `<div class="loader"></div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ["./loader.component.scss"]
})
export class LoaderComponent {}
