import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { SupabaseProviderService } from '../../../core/supabase-provider/supabase-provider.service';

@Module({ providers: [RoomService, SupabaseProviderService] })
export class RoomModule {}
