import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TauriService } from "../../services/tauri.service";
import { TauriTitlebarComponent } from "./tauri-titlebar.component";

describe("TauriTitlebarComponent", () => {
  let fixture: ComponentFixture<TauriTitlebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TauriTitlebarComponent],
      providers: [
        {
          provide: TauriService,
          useValue: { windowIsFullscreen: { set: jest.fn() }, toggleFullscreen: jest.fn() }
        }
      ]
    })
      .overrideComponent(TauriTitlebarComponent, {
        set: { template: "" }
      })
      .compileComponents();
    fixture = TestBed.createComponent(TauriTitlebarComponent);
  });

  it("creates with the desktop bridge", () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
