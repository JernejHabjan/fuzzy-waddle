import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ChatReportStatus } from "@fuzzy-waddle/platform-database-schema";
import { environment } from "@fuzzy-waddle/environments/environment";
import { ModerationService } from "./moderation.service";

describe("ModerationService", () => {
  let service: ModerationService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ModerationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it("loads the moderation queue", async () => {
    const queue = { groups: [], bannedUsers: [], pendingReportCount: 0 };
    const result = service.getReports();

    httpTesting.expectOne(`${environment.api}api/moderation/reports`).flush(queue);

    await expect(result).resolves.toEqual(queue);
  });

  it("updates a report status", async () => {
    const result = service.updateReportStatus(42, { status: ChatReportStatus.Reviewed });
    const request = httpTesting.expectOne(`${environment.api}api/moderation/reports/42/status`);

    expect(request.request.method).toBe("POST");
    expect(request.request.body).toEqual({ status: ChatReportStatus.Reviewed });
    request.flush(null);

    await result;
  });

  it("bans and unbans a user", async () => {
    const ban = service.banUser("user-1", { bannedUntil: null, moderationNote: "Repeated abuse" });
    const banRequest = httpTesting.expectOne(`${environment.api}api/moderation/users/user-1/ban`);
    expect(banRequest.request.body).toEqual({ bannedUntil: null, moderationNote: "Repeated abuse" });
    banRequest.flush(null);
    await ban;

    const unban = service.unbanUser("user-1");
    const unbanRequest = httpTesting.expectOne(`${environment.api}api/moderation/users/user-1/unban`);
    expect(unbanRequest.request.body).toEqual({});
    unbanRequest.flush(null);
    await unban;
  });
});
