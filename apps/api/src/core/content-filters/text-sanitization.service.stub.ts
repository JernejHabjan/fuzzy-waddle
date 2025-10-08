import { type ITextSanitizationService } from "./text-sanitization.service.interface";

export const textSanitizationServiceStub = {
  cleanBadWords(text: string): string {
    return text;
  }
} satisfies ITextSanitizationService;
