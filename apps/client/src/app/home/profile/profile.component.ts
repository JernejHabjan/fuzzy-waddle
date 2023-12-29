import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { AuthService } from "../../auth/auth.service";
import { UserInstanceService } from "./user-instance.service";

@Component({
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent {
  protected readonly authService = inject(AuthService);
  protected readonly userInstanceService = inject(UserInstanceService);

  protected get identityData(): {
    avatar_url: string | null;
    full_name: string | null;
  } | null {
    return (
      (this.authService.session?.user?.identities?.find((i) => i.provider === "google")?.identity_data as any) ?? null
    );
  }
}
