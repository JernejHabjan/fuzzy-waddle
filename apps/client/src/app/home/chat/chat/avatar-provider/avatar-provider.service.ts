import { Injectable } from '@angular/core';
import { createAvatar } from '@dicebear/core';
import * as pixelArt from '@dicebear/pixel-art';
import { IAvatarProviderService } from './avatar-provider.service.interface';

@Injectable({
  providedIn: 'root'
})
export class AvatarProviderService implements IAvatarProviderService {
  getAvatar(seed: string) {
    const avatar = createAvatar(pixelArt, { seed });
    return avatar.toDataUriSync();
  }
}
