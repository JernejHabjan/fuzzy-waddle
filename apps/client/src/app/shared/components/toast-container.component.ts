import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Toast, ToastService } from "../services/toast.service";

@Component({
  selector: "app-toast-container",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3">
      @for (toast of toasts; track toast) {
        <div
          class="toast show"
          [ngClass]="'bg-' + toast.type + ' text-light'"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div class="toast-header">
            <strong class="me-auto">{{ toast.header }}</strong>
            <button type="button" class="btn-close" aria-label="Close" (click)="removeToast(toast.id)"></button>
          </div>
          <div class="toast-body">{{ toast.body }}</div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-container {
        z-index: 1200;
      }
    `
  ]
})
export class ToastContainerComponent implements OnInit {
  toasts: Toast[] = [];

  private readonly toastService = inject(ToastService);

  ngOnInit(): void {
    this.toastService.getToasts().subscribe((toasts) => {
      this.toasts = toasts;
    });
  }

  removeToast(id: number): void {
    this.toastService.remove(id);
  }
}
