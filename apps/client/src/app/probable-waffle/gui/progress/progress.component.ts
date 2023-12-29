import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { DEPRECATED_gameInstanceService } from "../../communicators/DEPRECATED_game-instance.service";

@Component({
  templateUrl: "./progress.component.html",
  styleUrls: ["./progress.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressComponent {
  protected readonly gameInstanceService = inject(DEPRECATED_gameInstanceService);
}
