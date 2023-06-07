import { ChannelAdminCommandDto } from './channel.admin.command.dto';

export class PostChannelMuteDto extends ChannelAdminCommandDto {
  typeof(): string {
    return PostChannelMuteDto.name;
  }
}
