import { ChangeDetectionStrategy, Component } from "@angular/core";
import { AuthService } from "../../auth/auth.service";
import { UserInstanceService } from "./user-instance.service";

@Component({
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent {
  constructor(
    protected authService: AuthService,
    protected userInstanceService: UserInstanceService
  ) {}
}
