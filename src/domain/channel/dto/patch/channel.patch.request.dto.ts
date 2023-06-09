import { ChannelType } from '../../type/type.channel';

export class ChannelPatchRequestDto {
  password: string | null;
  access: ChannelType;
}
