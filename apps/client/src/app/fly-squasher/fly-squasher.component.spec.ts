import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FlySquasherComponent } from "./fly-squasher.component";
import { provideRouter } from "@angular/router";

describe("FlySquasherComponent", () => {
  let component: FlySquasherComponent;
  let fixture: ComponentFixture<FlySquasherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlySquasherComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(FlySquasherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
