import { Injectable } from '@nestjs/common';
import { IChatService } from './chat.service.interface';
import { IBadWords } from '../../interfaces/bad-words.interface';
import * as BadWords from 'bad-words';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ChatService implements IChatService {
  /**
   * https://www.npmjs.com/package/bad-words?activeTab=versions
   */
  private badWordsFilter: IBadWords;
  private supabaseClient: SupabaseClient;

  constructor() {
    this.badWordsFilter = new BadWords({ list: ['tristo', 'kosmatih', 'medvedov'] }) as IBadWords;
    this.supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  }

  async postMessage(message: string): Promise<void> {
    const sanitizedMessage = this.badWordsFilter.clean(message);
    // Insert sanitized message into Messages table
    const { data, error } = await this.supabaseClient.from('test').insert({ text: sanitizedMessage });
    if (error) {
      console.error(error);
      return Promise.reject(error);
    } else {
      return Promise.resolve();
    }
  }
}
