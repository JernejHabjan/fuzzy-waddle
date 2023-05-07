import { AuthUser } from '@supabase/supabase-js';

export interface IChatService {
  postMessage(text: string, user: AuthUser): Promise<string>;
}
