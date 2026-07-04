import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
  selector: "coming-soon",
  templateUrl: "./coming-soon.component.html",
  styleUrl: "./coming-soon.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComingSoonComponent {}
