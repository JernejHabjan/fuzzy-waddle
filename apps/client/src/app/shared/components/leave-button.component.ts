import { Component, Input, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { ModalComponent } from "./modal/modal.component";
import { ModalConfig } from "./modal/modal-config";

@Component({
  selector: "fuzzy-waddle-leave-button",
  imports: [CommonModule, RouterLink, ModalComponent],
  templateUrl: "./leave-button.component.html",
  styleUrl: "./leave-button.component.scss"
})
export class LeaveButtonComponent {
  @Input() public routerLink?: string;
  @Input() public text: string = "Leave";
  @Input() public style: string = "left: 20px; top: 20px";
  @Input() public class: string = "btn btn-danger m-1 position-absolute";
  @Input() public modalConfig?: ModalConfig;

  @ViewChild("modal") private modalComponent!: ModalComponent;
  protected leaveModalConfirm: ModalConfig = {
    modalTitle: this.modalConfig?.modalTitle ?? "Leave the game?",
    dismissButtonLabel: this.modalConfig?.dismissButtonLabel ?? "Continue",
    closeButtonLabel: this.modalConfig?.closeButtonLabel ?? "Leave",
    onClose: async () => {
      if (this.modalConfig?.onClose) {
        await this.modalConfig.onClose();
      }
    }
  };

  protected onclick() {
    if (!this.modalConfig) return;
    // noinspection JSIgnoredPromiseFromCall
    this.modalComponent.open();
  }
}
