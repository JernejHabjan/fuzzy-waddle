import { Injectable } from '@nestjs/common';
import { IBadWords } from './bad-words.interface';
import BadWords from 'bad-words-plus';
import { ITextSanitizationService } from './text-sanitization.service.interface';

@Injectable()
export class TextSanitizationService implements ITextSanitizationService {
  /**
   * https://www.npmjs.com/package/bad-words?activeTab=versions
   */
  private badWordsFilter: IBadWords;

  constructor() {
    this.badWordsFilter = new BadWords({ list: ['tristo', 'kosmatih', 'medvedov'] }) as IBadWords;
  }

  /**
   * https://github.com/web-mech/badwords/issues/93
   */
  cleanBadWords(text: string): string {
    const additionalSuffix = 'ABC';
    const wholeText = text + additionalSuffix;
    const clean = this.badWordsFilter.clean(wholeText);
    return clean.substring(0, clean.length - additionalSuffix.length);
  }
}
