import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MapSelectorComponent } from "./map-selector.component";
import { FormsModule } from "@angular/forms";
import { Component } from "@angular/core";

@Component({ selector: "probable-waffle-map-selector", template: "" })
export class MapSelectorTestingComponent {}

describe("MapSelectorComponent", () => {
  let component: MapSelectorComponent;
  let fixture: ComponentFixture<MapSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapSelectorComponent],
      imports: [FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MapSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
