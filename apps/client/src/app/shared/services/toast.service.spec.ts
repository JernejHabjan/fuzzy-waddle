import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { ToastService } from "./toast.service";
import { skip } from "rxjs/operators";

describe("ToastService", () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService]
    });
    service = TestBed.inject(ToastService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should start with no toasts", (done) => {
    service.getToasts().subscribe((toasts) => {
      expect(toasts.length).toBe(0);
      done();
    });
  });

  it("should add a toast with show method", (done) => {
    service
      .getToasts()
      .pipe(skip(1))
      .subscribe((toasts) => {
        expect(toasts.length).toBe(1);
        expect(toasts[0].header).toBe("Test Header");
        expect(toasts[0].body).toBe("Test Body");
        expect(toasts[0].type).toBe("info");
        done();
      });

    service.show("Test Header", "Test Body");
  });

  it("should remove a toast by id", (done) => {
    let firstEmit = true;

    service.getToasts().subscribe((toasts) => {
      // Skip the initial empty array
      if (firstEmit) {
        firstEmit = false;
        service.show("Test Header", "Test Body");
      }
      // Second emission should have 1 toast
      else if (toasts.length === 1) {
        const toastId = toasts[0].id;
        service.remove(toastId);
      }
      // Third emission should have 0 toasts again
      else if (toasts.length === 0) {
        expect(toasts.length).toBe(0);
        done();
      }
    });
  });

  it("should automatically remove toast after delay", fakeAsync(() => {
    let emitCount = 0;
    service.getToasts().subscribe((toasts) => {
      emitCount++;

      // First emission: empty array
      if (emitCount === 1) {
        expect(toasts.length).toBe(0);
        service.show("Test Header", "Test Body", "info", 1000);
      }
      // Second emission: toast added
      else if (emitCount === 2) {
        expect(toasts.length).toBe(1);
      }
    });

    // Advance time to trigger the auto-removal
    tick(1001);

    // Should now have 0 toasts
    expect(service["toasts"].length).toBe(0);
  }));

  it("should create a success toast", (done) => {
    service
      .getToasts()
      .pipe(skip(1))
      .subscribe((toasts) => {
        expect(toasts.length).toBe(1);
        expect(toasts[0].type).toBe("success");
        done();
      });

    service.showSuccess("Success", "Success message");
  });

  it("should create a warning toast", (done) => {
    service
      .getToasts()
      .pipe(skip(1))
      .subscribe((toasts) => {
        expect(toasts.length).toBe(1);
        expect(toasts[0].type).toBe("warning");
        done();
      });

    service.showWarning("Warning", "Warning message");
  });

  it("should create an error toast", (done) => {
    service
      .getToasts()
      .pipe(skip(1))
      .subscribe((toasts) => {
        expect(toasts.length).toBe(1);
        expect(toasts[0].type).toBe("danger");
        done();
      });

    service.showError("Error", "Error message");
  });

  it("should create an info toast", (done) => {
    service
      .getToasts()
      .pipe(skip(1))
      .subscribe((toasts) => {
        expect(toasts.length).toBe(1);
        expect(toasts[0].type).toBe("info");
        done();
      });

    service.showInfo("Info", "Info message");
  });

  it("should preserve toast when delay is 0", fakeAsync(() => {
    service.show("Test Header", "Test Body", "info", 0);

    // Advance time
    tick(10000);

    // Toast should still be there
    expect(service["toasts"].length).toBe(1);
  }));

  it("should handle multiple toasts", (done) => {
    service
      .getToasts()
      .pipe(skip(3))
      .subscribe((toasts) => {
        expect(toasts.length).toBe(3);

        // Check that toasts have unique ids
        const ids = toasts.map((toast) => toast.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(3);

        done();
      });

    service.showSuccess("Success", "Message 1");
    service.showWarning("Warning", "Message 2");
    service.showError("Error", "Message 3");
  });
});
