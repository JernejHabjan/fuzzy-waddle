import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RankedComponent } from "./ranked.component";
import { FormsModule } from "@angular/forms";
import { Component } from "@angular/core";

@Component({ selector: "probable-waffle-ranked", template: "" })
export class RankedTestingComponent {}

describe("RankedComponent", () => {
  let component: RankedComponent;
  let fixture: ComponentFixture<RankedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RankedComponent],
      imports: [FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(RankedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
