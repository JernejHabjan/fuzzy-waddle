import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ModerationService } from "../../data-access/moderation/moderation.service";
import { ModerationComponent } from "./moderation.component";

describe("ModerationComponent", () => {
  let fixture: ComponentFixture<ModerationComponent>;
  const queue = { groups: [], bannedUsers: [], pendingReportCount: 0 };
  const moderationService = {
    getReports: jest.fn().mockResolvedValue(queue),
    updateReportStatus: jest.fn().mockResolvedValue(undefined),
    banUser: jest.fn().mockResolvedValue(undefined),
    unbanUser: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [ModerationComponent],
      providers: [{ provide: ModerationService, useValue: moderationService }]
    })
      .overrideComponent(ModerationComponent, {
        set: { imports: [], template: "" }
      })
      .compileComponents();

    fixture = TestBed.createComponent(ModerationComponent);
  });

  it("creates and loads reports on initialization", async () => {
    const component = fixture.componentInstance;

    await component.ngOnInit();

    expect(component).toBeTruthy();
    expect(moderationService.getReports).toHaveBeenCalledTimes(1);
  });
});
