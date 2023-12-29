import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SpectatorsGridComponent } from "./spectators-grid.component";

describe("SpectatorsGridComponent", () => {
  let component: SpectatorsGridComponent;
  let fixture: ComponentFixture<SpectatorsGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpectatorsGridComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SpectatorsGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
