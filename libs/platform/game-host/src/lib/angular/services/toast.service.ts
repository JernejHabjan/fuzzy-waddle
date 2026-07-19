import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

export interface Toast {
  id: number;
  header: string;
  body: string;
  type: "success" | "info" | "warning" | "danger";
  delay?: number;
}

@Injectable({
  providedIn: "root"
})
export class ToastService {
  private toasts: Toast[] = [];
  private toastSubject = new BehaviorSubject<Toast[]>([]);
  private lastId = 0;

  constructor() {}

  getToasts(): Observable<Toast[]> {
    return this.toastSubject.asObservable();
  }

  show(
    header: string,
    body: string,
    type: "success" | "info" | "warning" | "danger" = "info",
    delay: number = 5000
  ): void {
    const id = ++this.lastId;
    const toast: Toast = { id, header, body, type, delay };
    this.toasts = [...this.toasts, toast];
    this.toastSubject.next(this.toasts);

    if (delay > 0) {
      setTimeout(() => this.remove(id), delay);
    }
  }

  remove(id: number): void {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
    this.toastSubject.next(this.toasts);
  }

  showSuccess(header: string, body: string, delay: number = 5000): void {
    this.show(header, body, "success", delay);
  }

  showInfo(header: string, body: string, delay: number = 5000): void {
    this.show(header, body, "info", delay);
  }

  showWarning(header: string, body: string, delay: number = 5000): void {
    this.show(header, body, "warning", delay);
  }

  showError(header: string, body: string, delay: number = 5000): void {
    this.show(header, body, "danger", delay);
  }
}
