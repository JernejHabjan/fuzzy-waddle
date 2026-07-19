import { Injectable } from "@nestjs/common";
import { type ITextSanitizationService } from "./text-sanitization.service.interface";
import { clean } from "profanity-cleaner";
import { slovenianBadWords } from "./slovenian-bad-words";

@Injectable()
export class TextSanitizationService implements ITextSanitizationService {
  cleanBadWords(text: string): string {
    // https://github.com/devXprite/profanity-cleaner
    return clean(text, { customBadWords: slovenianBadWords });
  }
}
