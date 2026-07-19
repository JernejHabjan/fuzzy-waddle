import { Component, input, viewChild } from "@angular/core";

import { RouterLink } from "@angular/router";
import { ModalComponent } from "../modal/modal.component";
import type { ModalConfig } from "../modal/modal-config";

@Component({
  selector: "fuzzy-waddle-leave-button",
  imports: [RouterLink, ModalComponent],
  templateUrl: "./leave-button.component.html",
  styleUrl: "./leave-button.component.scss"
})
export class LeaveButtonComponent {
  public readonly routerLink = input<string>();
  public readonly text = input<string>("Leave");
  public readonly style = input<string>("left: 20px; top: 20px");
  public readonly class = input<string>("btn btn-danger m-1 position-absolute");
  public readonly modalConfig = input<ModalConfig>();

  private readonly modalComponent = viewChild.required<ModalComponent>("modal");
  protected leaveModalConfirm: ModalConfig = {
    modalTitle: this.modalConfig()?.modalTitle ?? "Leave the game?",
    dismissButtonLabel: this.modalConfig()?.dismissButtonLabel ?? "Continue",
    closeButtonLabel: this.modalConfig()?.closeButtonLabel ?? "Leave",
    onClose: async () => {
      const modalConfig = this.modalConfig();
      if (modalConfig?.onClose) {
        await modalConfig.onClose();
      }
    }
  };

  protected onclick() {
    if (!this.modalConfig()) return;
    // noinspection JSIgnoredPromiseFromCall
    this.modalComponent().open();
  }
}
