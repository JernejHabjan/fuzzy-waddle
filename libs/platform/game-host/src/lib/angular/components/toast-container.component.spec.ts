import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BehaviorSubject } from "rxjs";
import { type Toast, ToastService } from "../services/toast.service";
import { ToastContainerComponent } from "./toast-container.component";

describe("ToastContainerComponent", () => {
  let fixture: ComponentFixture<ToastContainerComponent>;
  const toasts = new BehaviorSubject<Toast[]>([]);
  const toastService = {
    getToasts: () => toasts.asObservable(),
    remove: jest.fn()
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    toasts.next([]);
    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
      providers: [{ provide: ToastService, useValue: toastService }]
    }).compileComponents();
    fixture = TestBed.createComponent(ToastContainerComponent);
  });

  it("renders emitted toasts and delegates removal", () => {
    fixture.detectChanges();
    toasts.next([{ id: 3, header: "Saved", body: "Complete", type: "success" }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("Saved");
    fixture.componentInstance.removeToast(3);
    expect(toastService.remove).toHaveBeenCalledWith(3);
  });
});
