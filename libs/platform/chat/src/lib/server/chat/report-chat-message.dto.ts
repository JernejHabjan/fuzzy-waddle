import { ChatReportReason, ChatReportStatus } from "@fuzzy-waddle/platform-database-schema";
import type { ReportChatMessageDto, UpdateChatReportStatusDto } from "../../chat";
import { type BanUserDto } from "@fuzzy-waddle/platform-identity";
import { IsEnum, IsIn, IsISO8601, IsOptional, IsString, MaxLength } from "class-validator";

export class ReportChatMessageBodyDto implements ReportChatMessageDto {
  @IsEnum(ChatReportReason)
  reason!: ChatReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;
}

export class UpdateChatReportStatusBodyDto implements UpdateChatReportStatusDto {
  @IsIn([ChatReportStatus.Reviewed, ChatReportStatus.Actioned])
  status!: typeof ChatReportStatus.Reviewed | typeof ChatReportStatus.Actioned;
}

export class BanUserBodyDto implements BanUserDto {
  @IsOptional()
  @IsISO8601()
  bannedUntil?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  moderationNote?: string;
}
