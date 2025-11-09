import { Component, type OnInit, ViewChild } from "@angular/core";

import { ConstellationEffectComponent } from "./constellation-effect/constellation-effect.component";
import { AngularHost } from "../../../shared/consts";
import { MainMenuButtonsComponent } from "./main-menu-buttons/main-menu-buttons.component";
import { TitleComponent } from "./title/title.component";
import { BannerComponent } from "./banner/banner.component";
import { ModalComponent } from "../../../shared/components/modal/modal.component";
import { type ModalConfig } from "../../../shared/components/modal/modal-config";

@Component({
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  imports: [ConstellationEffectComponent, MainMenuButtonsComponent, TitleComponent, BannerComponent, ModalComponent],
  host: AngularHost.contentFlexFullHeight
})
export class HomeComponent implements OnInit {
  @ViewChild("mobileWarningModal") private mobileWarningModal?: ModalComponent;

  private readonly MOBILE_WARNING_DISMISSED_KEY = "aota_mobile_warning_dismissed";

  get isLargeScreen(): boolean {
    return window.innerWidth >= 1200;
  }

  ngOnInit(): void {
    this.showMobileWarningIfNeeded();
  }

  protected get mobileWarningConfig(): ModalConfig {
    return {
      modalTitle: "Desktop Recommended",
      closeButtonLabel: "I Understand",
      hideDismissButton: () => true,
      onClose: () => {
        sessionStorage.setItem(this.MOBILE_WARNING_DISMISSED_KEY, "true");
        return true;
      }
    };
  }

  private showMobileWarningIfNeeded(): void {
    if (this.isMobileDevice() && !this.hasSeenMobileWarning()) {
      // Use setTimeout to ensure the view is initialized
      setTimeout(() => {
        this.mobileWarningModal?.open();
      }, 0);
    }
  }

  private isMobileDevice(): boolean {
    // Check using multiple methods for better detection
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    // Check for mobile keywords in user agent
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    const isMobileUserAgent = mobileRegex.test(userAgent.toLowerCase());

    // Check for touch capability and small screen
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;

    return isMobileUserAgent || (isTouchDevice && isSmallScreen);
  }

  private hasSeenMobileWarning(): boolean {
    return sessionStorage.getItem(this.MOBILE_WARNING_DISMISSED_KEY) === "true";
  }
}
