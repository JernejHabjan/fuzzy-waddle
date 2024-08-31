import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
  selector: "coming-soon",
  templateUrl: "./coming-soon.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: []
})
export class ComingSoonComponent {}
