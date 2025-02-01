import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../../auth/auth.service";

import { HomeNavComponent } from "../../../shared/components/home-nav/home-nav.component";

@Component({
  selector: "fuzzy-waddle-profile-nav",
  templateUrl: "./profile-nav.component.html",
  styleUrls: ["./profile-nav.component.scss"],
  imports: [HomeNavComponent]
})
export class ProfileNavComponent {
  protected readonly authService = inject(AuthService);
  protected readonly router = inject(Router);

  async toHome() {
    await this.router.navigate(["/"]);
  }

  async signOut() {
    await this.authService.signOut();
    await this.toHome();
  }
}
