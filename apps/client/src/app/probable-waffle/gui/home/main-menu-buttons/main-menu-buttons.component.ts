import { Component, inject, signal, type OnInit } from "@angular/core";

import { environment } from "../../../../../environments/environment";
import { RouterLink } from "@angular/router";
import { TauriService } from "../../../../shared/services/tauri.service";
import { AuthService } from "../../../../auth/auth.service";
import { AvatarProviderService } from "../../../../shared/components/chat/avatar-provider/avatar-provider.service";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

@Component({
  selector: "probable-waffle-main-menu-buttons",
  imports: [RouterLink, FaIconComponent],
  templateUrl: "./main-menu-buttons.component.html",
  styleUrl: "./main-menu-buttons.component.scss"
})
export class MainMenuButtonsComponent implements OnInit {
  protected readonly enabledInstantDemoGame = !environment.production;
  protected readonly enabledMultiplayer = true; // set to alpha in #606
  protected readonly enabledReplay = !environment.production;
  protected readonly enabledLoadGame = true;
  protected readonly enabledMatchHistory = true; // finished in #588
  protected readonly enabledCampaign = !environment.production;
  protected readonly enabledProgress = true; // finished in #414
  protected readonly enabledOptions = true;

  private readonly tauriService = inject(TauriService);
  protected readonly isTauri = this.tauriService.isTauri;
  protected readonly authService = inject(AuthService);
  protected readonly avatarProviderService = inject(AvatarProviderService);
  protected readonly faGoogle = faGoogle;
  protected readonly appVersion = signal<string>("");

  async ngOnInit(): Promise<void> {
    if (this.isTauri) {
      const version = await this.tauriService.getAppVersion();
      this.appVersion.set(version);
    }
  }

  protected quit(): void {
    // noinspection JSIgnoredPromiseFromCall
    this.tauriService.quit();
  }
}
