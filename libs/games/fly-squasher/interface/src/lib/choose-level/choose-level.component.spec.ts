import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ChooseLevelComponent } from "./choose-level.component";
import { provideRouter } from "@angular/router";

describe("ChooseLevelComponent", () => {
  let component: ChooseLevelComponent;
  let fixture: ComponentFixture<ChooseLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChooseLevelComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ChooseLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
