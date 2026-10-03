import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AOTA_CAMPAIGN_CATALOG } from "../campaign-catalog";
import { ChapterCardComponent } from "./chapter-card.component";

describe("ChapterCardComponent", () => {
  let fixture: ComponentFixture<ChapterCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChapterCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(ChapterCardComponent);
    fixture.componentRef.setInput("chapter", AOTA_CAMPAIGN_CATALOG.chapters[0]);
    fixture.componentRef.setInput("missionProgress", []);
    fixture.componentRef.setInput("state", {
      completedMissions: 0,
      totalMissions: 1,
      isRecommended: true,
      isSelected: false
    });
    fixture.detectChanges();
  });

  it("shows the chapter image and progress in HTML", () => {
    expect(fixture.nativeElement.querySelector("img").alt).toContain("volcanic");
    expect(fixture.nativeElement.textContent).toContain("0 / 1 missions complete");
  });
});
