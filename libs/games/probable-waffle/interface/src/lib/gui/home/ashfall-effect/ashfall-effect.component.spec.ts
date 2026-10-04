import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AshfallEffectComponent } from "./ashfall-effect.component";

describe("AshfallEffectComponent", () => {
  let fixture: ComponentFixture<AshfallEffectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AshfallEffectComponent]
    })
      .overrideComponent(AshfallEffectComponent, {
        set: { template: "" }
      })
      .compileComponents();

    fixture = TestBed.createComponent(AshfallEffectComponent);
  });

  it("creates safely when no canvas is rendered", () => {
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
