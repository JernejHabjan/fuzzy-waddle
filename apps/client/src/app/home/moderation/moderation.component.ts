import { Component, inject, type OnInit } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  ChatReportStatus,
  UserAccountStatus,
  type ModerationQueueDto,
  type ModerationReportDto,
  type ModerationReportGroupDto
} from "@fuzzy-waddle/api-interfaces";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { ChatService } from "../../data-access/chat/chat.service";
import { HomeNavComponent } from "../../shared/components/home-nav/home-nav.component";
import { getRoleIcon, getRoleLabel } from "../../shared/utils/app-role-presentation";

@Component({
  selector: "fuzzy-waddle-moderation",
  templateUrl: "./moderation.component.html",
  styleUrls: ["./moderation.component.scss"],
  imports: [HomeNavComponent, DatePipe, FormsModule, FaIconComponent]
})
export class ModerationComponent implements OnInit {
  protected queue: ModerationQueueDto = { groups: [], bannedUsers: [], pendingReportCount: 0 };
  protected isLoading = false;
  protected errorMessage = "";
  protected banUntilByUserId: Record<string, string> = {};
  protected banNoteByUserId: Record<string, string> = {};
  protected readonly ChatReportStatus = ChatReportStatus;
  protected readonly UserAccountStatus = UserAccountStatus;
  protected readonly getRoleIcon = getRoleIcon;
  protected readonly getRoleLabel = getRoleLabel;
  private readonly chatService = inject(ChatService);

  async ngOnInit(): Promise<void> {
    await this.loadReports();
  }

  protected async loadReports(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = "";
    try {
      this.queue = await this.chatService.getModerationReports();
    } catch (error) {
      console.error("Failed to load moderation reports:", error);
      this.errorMessage = "Could not load moderation reports.";
    } finally {
      this.isLoading = false;
    }
  }

  protected async updateReport(report: ModerationReportDto, status: ChatReportStatus): Promise<void> {
    await this.chatService.updateReportStatus(report.id, {
      status: status as ChatReportStatus.Reviewed | ChatReportStatus.Actioned
    });
    await this.loadReports();
  }

  protected async banUser(group: ModerationReportGroupDto): Promise<void> {
    if (!group.reportedUserId) {
      return;
    }

    await this.chatService.banUser(group.reportedUserId, {
      bannedUntil: this.banUntilByUserId[group.reportedUserId] || null,
      moderationNote: this.banNoteByUserId[group.reportedUserId] || "Banned from chat moderation queue"
    });
    this.banUntilByUserId[group.reportedUserId] = "";
    this.banNoteByUserId[group.reportedUserId] = "";
    await this.loadReports();
  }

  protected async unbanUser(userId: string): Promise<void> {
    await this.chatService.unbanUser(userId);
    await this.loadReports();
  }

  protected isUserBanned(group: ModerationReportGroupDto): boolean {
    return group.reportedUserAccountStatus === UserAccountStatus.Disabled || group.reportedUserBannedUntil != null;
  }
}
