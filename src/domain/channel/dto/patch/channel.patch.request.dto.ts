import {
  CHANNEL_PRIVATE,
  CHANNEL_PUBLIC,
} from 'src/domain/channel/type/type.channel';

export class ChannelPatchRequestDto {
  password: string | null;
  access: typeof CHANNEL_PUBLIC | typeof CHANNEL_PRIVATE;
}
