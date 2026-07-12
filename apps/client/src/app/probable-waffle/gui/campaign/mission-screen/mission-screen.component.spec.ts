import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, convertToParamMap, provideRouter } from "@angular/router";
import { MissionScreenComponent } from "./mission-screen.component";

describe("MissionScreenComponent", () => {
  let fixture: ComponentFixture<MissionScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionScreenComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ chapterId: "prologue", missionId: "dreams" }) } }
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(MissionScreenComponent);
    fixture.detectChanges();
  });

  it("shows the selected mission briefing and an available start action", () => {
    expect(fixture.nativeElement.textContent).toContain("Dreams");
    expect(fixture.nativeElement.textContent).toContain("Start Mission");
  });
});
