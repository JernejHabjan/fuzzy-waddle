import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SkirmishComponent } from "./skirmish.component";

describe("SkirmishComponent", () => {
  let component: SkirmishComponent;
  let fixture: ComponentFixture<SkirmishComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkirmishComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SkirmishComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
