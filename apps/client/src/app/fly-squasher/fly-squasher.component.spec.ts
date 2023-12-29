import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FlySquasherComponent } from "./fly-squasher.component";
import { RouterTestingModule } from "@angular/router/testing";

describe("FlySquasherComponent", () => {
  let component: FlySquasherComponent;
  let fixture: ComponentFixture<FlySquasherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FlySquasherComponent],
      imports: [RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(FlySquasherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
