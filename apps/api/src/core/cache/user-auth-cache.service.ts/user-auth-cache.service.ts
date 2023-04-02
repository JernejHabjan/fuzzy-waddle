import { Injectable } from '@nestjs/common';
import NodeCache from 'node-cache';
import { AuthUser } from '@supabase/supabase-js';

@Injectable()
export class UserAuthCacheService {
  private readonly cachedUsers = new NodeCache({
    stdTTL: 60 * 60, // cache TTL set to 1 hour
    checkperiod: 60 * 30, // cache checked every 30 minutes
    deleteOnExpire: true // delete expired items from the cache
  });

  getUser(idToken: string): AuthUser | null {
    return this.cachedUsers.get<AuthUser>(idToken);
  }

  setUser(idToken: string, user: AuthUser): void {
    this.cachedUsers.set<AuthUser>(idToken, user);
  }
}
