import { Injectable, NotFoundException } from "@nestjs/common";
import { type AuthUser } from "@supabase/supabase-js";
import {
  ChatMessageStatus,
  ChatReportStatus,
  type BanUserDto,
  type ModerationQueueDto,
  type ModerationReportDto,
  type ModerationSummaryDto,
  type UpdateChatReportStatusDto
} from "@fuzzy-waddle/api-interfaces";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";
import { UserProfilesService } from "../user-profiles/user-profiles.service";

@Injectable()
export class ChatModerationService {
  constructor(
    private readonly supabaseProviderService: SupabaseProviderService,
    private readonly userProfilesService: UserProfilesService
  ) {}

  /**
   * Moderation endpoints share the same report queue and ban state so the
   * controller can stay decoupled from chat posting concerns.
   */
  async getModerationSummary(user: AuthUser): Promise<ModerationSummaryDto> {
    const role = await this.userProfilesService.ensureModerator(user.id);
    const { count, error } = await this.supabaseProviderService.supabaseClient
      .from("chat_message_reports")
      .select("id", { count: "exact", head: true })
      .eq("report_status", ChatReportStatus.Open);

    if (error) {
      console.error(error);
      throw error;
    }

    return { role, pendingReportCount: count ?? 0 };
  }

  async getModerationReports(user: AuthUser): Promise<ModerationQueueDto> {
    await this.userProfilesService.ensureModerator(user.id);
    const supabase = this.supabaseProviderService.supabaseClient;

    const { data: reportRows, error: reportError } = await supabase
      .from("chat_message_reports")
      .select("id, message_id, reporter_user_id, reason, details, report_status, created_at")
      .eq("report_status", ChatReportStatus.Open)
      .order("created_at", { ascending: true });

    if (reportError) {
      console.error(reportError);
      throw reportError;
    }

    const reports = reportRows || [];
    const messageIds = [...new Set(reports.map((report) => report.message_id))];
    const { data: messageRows, error: messageError } = await supabase
      .from("chat_messages")
      .select("id, body, sender_user_id, created_at")
      .in("id", messageIds.length > 0 ? messageIds : [-1]);

    if (messageError) {
      console.error(messageError);
      throw messageError;
    }

    const messageById = new Map((messageRows || []).map((message) => [message.id, message]));
    const profileIds = [
      ...new Set(
        reports
          .flatMap((report) => [report.reporter_user_id, messageById.get(report.message_id)?.sender_user_id])
          .filter(Boolean)
      )
    ].filter((id): id is string => typeof id === "string");
    const { data: profileRows, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, display_name, email, app_role, account_status, banned_until")
      .in("id", profileIds.length > 0 ? profileIds : ["00000000-0000-0000-0000-000000000000"]);

    if (profileError) {
      console.error(profileError);
      throw profileError;
    }

    const profileById = new Map((profileRows || []).map((profile) => [profile.id, profile]));
    const reportDtos: ModerationReportDto[] = reports.map((report) => {
      const message = messageById.get(report.message_id);
      const reportedUserId = message?.sender_user_id ?? null;
      return {
        id: report.id,
        messageId: report.message_id,
        reason: report.reason,
        details: report.details,
        reportStatus: report.report_status,
        createdAt: new Date(report.created_at),
        reporterUserId: report.reporter_user_id,
        reporterDisplayName: profileById.get(report.reporter_user_id)?.display_name ?? "Unknown",
        reporterEmail: profileById.get(report.reporter_user_id)?.email ?? null,
        reportedUserId,
        reportedUserDisplayName: reportedUserId
          ? (profileById.get(reportedUserId)?.display_name ?? "Unknown")
          : "Unknown",
        reportedUserEmail: reportedUserId ? (profileById.get(reportedUserId)?.email ?? null) : null,
        reportedUserRole: reportedUserId ? (profileById.get(reportedUserId)?.app_role ?? null) : null,
        messageText: message?.body ?? "",
        messageCreatedAt: new Date(message?.created_at ?? report.created_at)
      };
    });

    const groupsByUser = new Map<string, ModerationReportDto[]>();
    for (const report of reportDtos) {
      const key = report.reportedUserId ?? "deleted-user";
      groupsByUser.set(key, [...(groupsByUser.get(key) ?? []), report]);
    }

    const { data: bannedUsersRows, error: bannedUsersError } = await supabase
      .from("user_profiles")
      .select("id, display_name, email, app_role, account_status, banned_until, moderation_note, updated_at")
      .or("account_status.eq.disabled,account_status.eq.limited,banned_until.not.is.null");

    if (bannedUsersError) {
      console.error(bannedUsersError);
      throw bannedUsersError;
    }

    const bannedUsers = (bannedUsersRows || [])
      .filter(
        (profile) =>
          profile.account_status === "disabled" || profile.account_status === "limited" || profile.banned_until != null
      )
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .map((profile) => ({
        userId: profile.id,
        displayName: profile.display_name ?? "Unknown",
        email: profile.email ?? null,
        role: profile.app_role ?? null,
        accountStatus: profile.account_status,
        bannedUntil: profile.banned_until ?? null,
        moderationNote: profile.moderation_note ?? null,
        updatedAt: new Date(profile.updated_at)
      }));

    return {
      pendingReportCount: reportDtos.length,
      bannedUsers,
      groups: [...groupsByUser.entries()].map(([reportedUserId, groupReports]) => ({
        reportedUserId: reportedUserId === "deleted-user" ? null : reportedUserId,
        reportedUserDisplayName: groupReports[0]?.reportedUserDisplayName ?? "Unknown",
        reportedUserEmail: groupReports[0]?.reportedUserEmail ?? null,
        reportedUserRole: groupReports[0]?.reportedUserRole ?? null,
        reportedUserAccountStatus:
          reportedUserId === "deleted-user" ? null : (profileById.get(reportedUserId)?.account_status ?? null),
        reportedUserBannedUntil:
          reportedUserId === "deleted-user" ? null : (profileById.get(reportedUserId)?.banned_until ?? null),
        reports: groupReports
      }))
    };
  }

  async updateReportStatus(reportId: number, user: AuthUser, body: UpdateChatReportStatusDto): Promise<void> {
    await this.userProfilesService.ensureModerator(user.id);
    const supabase = this.supabaseProviderService.supabaseClient;
    const { data: report, error: reportError } = await supabase
      .from("chat_message_reports")
      .select("id, message_id")
      .eq("id", reportId)
      .maybeSingle();

    if (reportError) {
      console.error(reportError);
      throw reportError;
    }
    if (!report) {
      throw new NotFoundException("Chat report not found");
    }

    const { error } = await supabase
      .from("chat_message_reports")
      .update({
        report_status: body.status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      })
      .eq("id", reportId);

    if (error) {
      console.error(error);
      throw error;
    }

    if (body.status === ChatReportStatus.Actioned) {
      const { error: messageError } = await supabase
        .from("chat_messages")
        .update({
          message_status: ChatMessageStatus.Hidden,
          moderation_reason: "Reported message actioned by moderator"
        })
        .eq("id", report.message_id);

      if (messageError) {
        console.error(messageError);
        throw messageError;
      }
    }
  }

  async banUser(userId: string, user: AuthUser, body: BanUserDto): Promise<void> {
    await this.userProfilesService.banUser(userId, user.id, body);
  }

  async unbanUser(userId: string, user: AuthUser): Promise<void> {
    await this.userProfilesService.unbanUser(userId, user.id);
  }
}
