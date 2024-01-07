import { ComponentFixture, TestBed } from "@angular/core/testing";
import { InstantDemoComponent } from "./instant-demo.component";

describe("InstantDemoComponent", () => {
  let component: InstantDemoComponent;
  let fixture: ComponentFixture<InstantDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstantDemoComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(InstantDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
