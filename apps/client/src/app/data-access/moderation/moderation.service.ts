import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import {
  type BanUserDto,
  type ModerationQueueDto,
  type ModerationSummaryDto,
  type UpdateChatReportStatusDto
} from "@fuzzy-waddle/api-interfaces";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root"
})
export class ModerationService {
  private readonly httpClient = inject(HttpClient);

  async getSummary(): Promise<ModerationSummaryDto> {
    const url = `${environment.api}api/moderation/summary`;
    return await firstValueFrom(this.httpClient.get<ModerationSummaryDto>(url));
  }

  async getReports(): Promise<ModerationQueueDto> {
    const url = `${environment.api}api/moderation/reports`;
    return await firstValueFrom(this.httpClient.get<ModerationQueueDto>(url));
  }

  async updateReportStatus(reportId: number, body: UpdateChatReportStatusDto): Promise<void> {
    const url = `${environment.api}api/moderation/reports/${reportId}/status`;
    await firstValueFrom(this.httpClient.post<void>(url, body));
  }

  async banUser(userId: string, body: BanUserDto): Promise<void> {
    const url = `${environment.api}api/moderation/users/${userId}/ban`;
    await firstValueFrom(this.httpClient.post<void>(url, body));
  }

  async unbanUser(userId: string): Promise<void> {
    const url = `${environment.api}api/moderation/users/${userId}/unban`;
    await firstValueFrom(this.httpClient.post<void>(url, {}));
  }
}
