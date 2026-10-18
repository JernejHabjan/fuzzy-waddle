import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CenterWrapperComponent } from "./center-wrapper.component";

describe("CenterWrapperComponent", () => {
  let fixture: ComponentFixture<CenterWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CenterWrapperComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(CenterWrapperComponent);
  });

  it("creates", () => {
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
