import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TauriSplashComponent } from "./tauri-splash.component";

describe("TauriSplashComponent", () => {
  let fixture: ComponentFixture<TauriSplashComponent>;

  beforeEach(async () => {
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    await TestBed.configureTestingModule({
      imports: [TauriSplashComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(TauriSplashComponent);
  });

  it("creates in a browser environment", () => {
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
