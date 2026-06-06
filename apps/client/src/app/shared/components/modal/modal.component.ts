import { Component, inject, Injectable, TemplateRef, input, viewChild } from "@angular/core";
import { type ModalConfig } from "./modal-config";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "fuzzy-waddle-modal",
  templateUrl: "./modal.component.html",
  styleUrls: ["./modal.component.scss"]
})
@Injectable()
export class ModalComponent {
  public readonly modalConfig = input.required<ModalConfig>();
  private readonly modalContent = viewChild.required<TemplateRef<ModalComponent>>("modal");
  private modalRef!: NgbModalRef;

  private readonly modalService = inject(NgbModal);

  open(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.modalRef = this.modalService.open(this.modalContent(), {
        windowClass: this.modalConfig().windowClass
      });
      this.modalRef.result.then(resolve, resolve);
    });
  }

  protected async close(): Promise<void> {
    const modalConfig = this.modalConfig();
    if (modalConfig.shouldClose === undefined || (await modalConfig.shouldClose())) {
      const result = modalConfig.onClose === undefined || (await modalConfig.onClose());
      this.modalRef.close(result);
    }
  }

  protected async dismiss(): Promise<void> {
    const modalConfig = this.modalConfig();
    if (modalConfig.shouldDismiss === undefined || (await modalConfig.shouldDismiss())) {
      const result = modalConfig.onDismiss === undefined || (await modalConfig.onDismiss());
      this.modalRef.dismiss(result);
    }
  }
}
