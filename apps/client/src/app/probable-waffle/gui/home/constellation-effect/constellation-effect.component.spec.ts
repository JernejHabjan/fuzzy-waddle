import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConstellationEffectComponent } from "./constellation-effect.component";
import { Component } from "@angular/core";

@Component({
  selector: "probable-waffle-constellation-effect",
  template: "",
  standalone: true,
  imports: []
})
export class ConstellationEffectTestComponent {}

describe("ConstellationEffectComponent", () => {
  let component: ConstellationEffectComponent;
  let fixture: ComponentFixture<ConstellationEffectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConstellationEffectComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConstellationEffectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
