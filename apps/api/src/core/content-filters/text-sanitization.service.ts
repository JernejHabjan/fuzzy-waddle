import { Injectable } from '@nestjs/common';
import { IBadWords } from './bad-words.interface';
import * as BadWords from 'bad-words-plus';

@Injectable()
export class TextSanitizationService {
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
  public cleanBadWords(text: string): string {
    const additionalSuffix = 'ABC';
    const wholeText = text + additionalSuffix;
    const clean = this.badWordsFilter.clean(wholeText);
    return clean.substring(0, clean.length - additionalSuffix.length);
  }
}
