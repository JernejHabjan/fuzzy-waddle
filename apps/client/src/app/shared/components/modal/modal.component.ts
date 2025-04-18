import { Component, inject, Injectable, Input, TemplateRef, ViewChild } from "@angular/core";
import { ModalConfig } from "./modal-config";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "fuzzy-waddle-modal",
  templateUrl: "./modal.component.html",
  styleUrls: ["./modal.component.scss"]
})
@Injectable()
export class ModalComponent {
  @Input({ required: true }) public modalConfig!: ModalConfig;
  @ViewChild("modal") private modalContent!: TemplateRef<ModalComponent>;
  private modalRef!: NgbModalRef;

  private readonly modalService = inject(NgbModal);

  open(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.modalRef = this.modalService.open(this.modalContent);
      this.modalRef.result.then(resolve, resolve);
    });
  }

  protected async close(): Promise<void> {
    if (this.modalConfig.shouldClose === undefined || (await this.modalConfig.shouldClose())) {
      const result = this.modalConfig.onClose === undefined || (await this.modalConfig.onClose());
      this.modalRef.close(result);
    }
  }

  protected async dismiss(): Promise<void> {
    if (this.modalConfig.shouldDismiss === undefined || (await this.modalConfig.shouldDismiss())) {
      const result = this.modalConfig.onDismiss === undefined || (await this.modalConfig.onDismiss());
      this.modalRef.dismiss(result);
    }
  }
}
