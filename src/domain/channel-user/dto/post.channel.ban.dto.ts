import { ChannelAdminCommandDto } from './channel.admin.command.dto';

export class PostChannelBanDto extends ChannelAdminCommandDto {
  getType(): string {
    return PostChannelBanDto.name;
  }
}
