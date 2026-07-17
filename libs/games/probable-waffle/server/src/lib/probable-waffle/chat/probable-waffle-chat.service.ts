import { Injectable } from "@nestjs/common";
import { TextSanitizationService } from "@fuzzy-waddle/api/core/content-filters/text-sanitization.service";

@Injectable()
export class ProbableWaffleChatService {
  constructor(private readonly textSanitizationService: TextSanitizationService) {}

  cleanMessage(message: string): string {
    return this.textSanitizationService.cleanBadWords(message);
  }
}
