import { ChannelAdminCommandDto } from './channel.admin.command.dto';

export class PostChannelMuteDto extends ChannelAdminCommandDto {
  getType(): string {
    return PostChannelMuteDto.name;
  }
}
