import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ChooseLevelComponent } from "./choose-level.component";
import { RouterTestingModule } from "@angular/router/testing";

describe("ChooseLevelComponent", () => {
  let component: ChooseLevelComponent;
  let fixture: ComponentFixture<ChooseLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChooseLevelComponent],
      imports: [RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ChooseLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
