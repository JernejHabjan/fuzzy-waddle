import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ScoreScreenComponent } from "./score-screen.component";
import { RouterTestingModule } from "@angular/router/testing";
import { ScoreThroughTimeComponent } from "./chart/score-through-time.component";
import { ScoreThroughTimeTestingComponent } from "./chart/score-through-time.component.spec";

describe("ScoreScreenComponent", () => {
  let component: ScoreScreenComponent;
  let fixture: ComponentFixture<ScoreScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScoreScreenComponent, RouterTestingModule]
    })
      .overrideComponent(ScoreScreenComponent, {
        remove: {
          imports: [ScoreThroughTimeComponent]
        },
        add: {
          imports: [ScoreThroughTimeTestingComponent]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(ScoreScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
