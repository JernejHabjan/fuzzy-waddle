import { Injectable } from '@nestjs/common';
import { SupabaseProviderService } from '../../../core/supabase-provider/supabase-provider.service';
import { AuthUser } from '@supabase/supabase-js';
import { RoomDto } from './room.dto';

@Injectable()
export class RoomService {
  constructor(private readonly supabaseProviderService: SupabaseProviderService) {}

  async createRoom(body: RoomDto, user: AuthUser) {
    const { data, error } = await this.supabaseProviderService.supabaseClient
      .from('rooms')
      .insert({ name: body.roomName, user_id: user.id });
    if (error) {
      console.error(error);
      return Promise.reject(error);
    }
  }
}
