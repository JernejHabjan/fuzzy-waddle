import {
  ChatReportReason,
  ChatReportStatus,
  type BanUserDto,
  type ReportChatMessageDto,
  type UpdateChatReportStatusDto
} from "@fuzzy-waddle/api-interfaces";
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
