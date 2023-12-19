import { ChangeDetectionStrategy, Component } from "@angular/core";
import { DEPRECATED_gameInstanceService } from "../../communicators/DEPRECATED_game-instance.service";
import { Router } from "@angular/router";

@Component({
  templateUrl: "./progress.component.html",
  styleUrls: ["./progress.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressComponent {
  constructor(
    protected gameInstanceService: DEPRECATED_gameInstanceService,
    private router: Router
  ) {}

  leaveClick() {
    this.router.navigate(["/probable-waffle"]);
  }
}
