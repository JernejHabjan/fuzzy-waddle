import { ChatReportReason, type ReportChatMessageDto } from "@fuzzy-waddle/api-interfaces";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class ReportChatMessageBodyDto implements ReportChatMessageDto {
  @IsEnum(ChatReportReason)
  reason!: ChatReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;
}
