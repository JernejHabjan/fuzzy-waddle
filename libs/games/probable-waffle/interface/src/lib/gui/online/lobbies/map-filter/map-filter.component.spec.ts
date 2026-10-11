import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MapFilterComponent } from "./map-filter.component";

describe("MapFilterComponent", () => {
  let component: MapFilterComponent;
  let fixture: ComponentFixture<MapFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapFilterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MapFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("does not offer the AI-only map as a public lobby filter", () => {
    expect(fixture.nativeElement.textContent).not.toContain("AI Open Economy (test only)");
  });
});
